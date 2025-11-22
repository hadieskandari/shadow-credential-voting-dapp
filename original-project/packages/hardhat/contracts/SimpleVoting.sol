// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint32, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SimpleVoting
/// @notice Minimal two-option poll contract that keeps tallies encrypted until the deadline passes.
contract SimpleVoting is ZamaEthereumConfig {
    struct Question {
        string prompt;
        string[2] answers;
        string image;
        address createdBy;
        uint64 deadline;
        euint32[2] encryptedTally;
        bool resultsOpened;
        bool resultsFinalized;
        uint32[2] decryptedTally;
    }

    error QuestionDoesNotExist();
    error InvalidQuestionInput();
    error DeadlineTooSoon();
    error PollClosed();
    error AlreadyVoted();
    error DeadlineNotReached();
    error ResultsAlreadyOpened();
    error ResultsAlreadyFinalized();
    error ResultsNotOpened();
    error InvalidDecryptionPayload();

    event QuestionCreated(uint256 indexed questionId, address indexed creator, string prompt, uint64 deadline);
    event VoteCast(uint256 indexed questionId, address indexed voter);
    event ResultsOpened(uint256 indexed questionId);
    event ResultsPublished(uint256 indexed questionId, uint32[2] decryptedTally);

    uint64 public constant MIN_DURATION = 15 minutes;

    mapping(uint256 => Question) private _questions;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public questionsCount;

    function getQuestionsCount() external view returns (uint256) {
        return questionsCount;
    }

    /// @notice Create a new encrypted poll.
    function createQuestion(
        string calldata prompt,
        string calldata answerA,
        string calldata answerB,
        string calldata image,
        uint64 deadline
    ) external returns (uint256 questionId) {
        if (bytes(prompt).length == 0 || bytes(answerA).length == 0 || bytes(answerB).length == 0) {
            revert InvalidQuestionInput();
        }
        if (deadline < block.timestamp + MIN_DURATION) {
            revert DeadlineTooSoon();
        }

        questionId = questionsCount;
        questionsCount = questionId + 1;

        Question storage question = _questions[questionId];
        question.prompt = prompt;
        question.answers[0] = answerA;
        question.answers[1] = answerB;
        question.image = image;
        question.createdBy = msg.sender;
        question.deadline = deadline;
        question.encryptedTally[0] = FHE.asEuint32(0);
        question.encryptedTally[1] = FHE.asEuint32(0);
        question.resultsOpened = false;
        question.resultsFinalized = false;
        question.decryptedTally[0] = 0;
        question.decryptedTally[1] = 0;
        FHE.allowThis(question.encryptedTally[0]);
        FHE.allowThis(question.encryptedTally[1]);

        emit QuestionCreated(questionId, msg.sender, prompt, deadline);
    }

    /// @notice Cast an encrypted vote for one of the two answers (0 or 1).
    function vote(uint256 questionId, externalEuint8 encryptedChoice, bytes calldata inputProof) external {
        Question storage question = _questions[questionId];
        if (question.createdBy == address(0)) revert QuestionDoesNotExist();
        if (block.timestamp >= question.deadline) revert PollClosed();
        if (hasVoted[questionId][msg.sender]) revert AlreadyVoted();

        euint8 choice = FHE.fromExternal(encryptedChoice, inputProof);

        ebool voteForSecond = FHE.eq(choice, FHE.asEuint8(1));
        ebool voteForFirst = FHE.eq(choice, FHE.asEuint8(0));

        question.encryptedTally[0] = FHE.add(question.encryptedTally[0], FHE.asEuint32(voteForFirst));
        question.encryptedTally[1] = FHE.add(question.encryptedTally[1], FHE.asEuint32(voteForSecond));

        FHE.allowThis(question.encryptedTally[0]);
        FHE.allowThis(question.encryptedTally[1]);

        hasVoted[questionId][msg.sender] = true;

        emit VoteCast(questionId, msg.sender);
    }

    /// @notice Mark the encrypted tallies as publicly decryptable once the deadline has passed.
    function openResults(uint256 questionId) external {
        Question storage question = _questions[questionId];
        if (question.createdBy == address(0)) revert QuestionDoesNotExist();
        if (block.timestamp < question.deadline) revert DeadlineNotReached();
        if (question.resultsOpened) revert ResultsAlreadyOpened();
        if (question.resultsFinalized) revert ResultsAlreadyFinalized();

        question.encryptedTally[0] = FHE.makePubliclyDecryptable(question.encryptedTally[0]);
        question.encryptedTally[1] = FHE.makePubliclyDecryptable(question.encryptedTally[1]);
        question.resultsOpened = true;

        emit ResultsOpened(questionId);
    }

    function publishResults(
        uint256 questionId,
        bytes calldata abiEncodedClearValues,
        bytes calldata decryptionProof
    ) external {
        Question storage question = _questions[questionId];
        if (question.createdBy == address(0)) revert QuestionDoesNotExist();
        if (!question.resultsOpened) revert ResultsNotOpened();
        if (question.resultsFinalized) revert ResultsAlreadyFinalized();
        if (abiEncodedClearValues.length == 0 || decryptionProof.length == 0) revert InvalidDecryptionPayload();

        bytes32[] memory handles = new bytes32[](2);
        handles[0] = FHE.toBytes32(question.encryptedTally[0]);
        handles[1] = FHE.toBytes32(question.encryptedTally[1]);
        FHE.checkSignatures(handles, abiEncodedClearValues, decryptionProof);

        (uint256 optionA, uint256 optionB) = abi.decode(abiEncodedClearValues, (uint256, uint256));
        if (optionA > type(uint32).max || optionB > type(uint32).max) {
            revert InvalidDecryptionPayload();
        }

        question.decryptedTally[0] = uint32(optionA);
        question.decryptedTally[1] = uint32(optionB);
        question.resultsFinalized = true;

        emit ResultsPublished(questionId, question.decryptedTally);
    }

    function getQuestion(
        uint256 questionId
    )
        external
        view
        returns (
            string memory prompt,
            address createdBy,
            string[2] memory answers,
            string memory image,
            uint64 deadline,
            bool resultsOpened,
            bool resultsFinalized,
            euint32[2] memory encryptedTally,
            uint32[2] memory decryptedTally
        )
    {
        Question storage question = _questions[questionId];
        if (question.createdBy == address(0)) revert QuestionDoesNotExist();
        return (
            question.prompt,
            question.createdBy,
            question.answers,
            question.image,
            question.deadline,
            question.resultsOpened,
            question.resultsFinalized,
            question.encryptedTally,
            question.decryptedTally
        );
    }
}
