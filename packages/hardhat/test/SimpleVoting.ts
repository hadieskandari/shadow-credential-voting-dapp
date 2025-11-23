import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers, fhevm } from "hardhat";
import { SimpleVoting, SimpleVoting__factory } from "../types";

describe("SimpleVoting", function () {
  let deployer: HardhatEthersSigner;
  let voter: HardhatEthersSigner;
  let simpleVoting: SimpleVoting;
  let simpleVotingAddress: string;

  before(async function () {
    [deployer, voter] = await ethers.getSigners();
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    const factory = (await ethers.getContractFactory("SimpleVoting")) as SimpleVoting__factory;
    simpleVoting = (await factory.deploy()) as SimpleVoting;
    simpleVotingAddress = await simpleVoting.getAddress();
  });

  it("accepts an encrypted vote, opens results, and exposes status flags", async function () {
    const currentTime = await time.latest();
    const deadline = currentTime + 60 * 60; // 1 hour in the future

    await expect(simpleVoting.createQuestion("Will FHE win?", "Yes", "No", "", deadline))
      .to.emit(simpleVoting, "QuestionCreated")
      .withArgs(0, deployer.address, "Will FHE win?", deadline);

    const encryptedChoice = await fhevm
      .createEncryptedInput(simpleVotingAddress, voter.address)
      .add8(0)
      .encrypt();

    await expect(simpleVoting.connect(voter).vote(0, encryptedChoice.handles[0], encryptedChoice.inputProof)).to.emit(
      simpleVoting,
      "VoteCast",
    );

    expect(await simpleVoting.hasVoted(0, voter.address)).to.equal(true);

    await time.increaseTo(deadline + 1);
    await expect(simpleVoting.openResults(0)).to.emit(simpleVoting, "ResultsOpened");
    const question = await simpleVoting.getQuestion(0);
    expect(question.resultsOpened).to.equal(true);
    expect(question.resultsFinalized).to.equal(false);
  });

  it("rejects publishing results without valid decryption payloads", async function () {
    const currentTime = await time.latest();
    const deadline = currentTime + 60 * 60;

    await simpleVoting.createQuestion("Question?", "A", "B", "", deadline);

    const encryptedChoice = await fhevm
      .createEncryptedInput(simpleVotingAddress, voter.address)
      .add8(1)
      .encrypt();

    await simpleVoting.connect(voter).vote(0, encryptedChoice.handles[0], encryptedChoice.inputProof);

    await time.increaseTo(deadline + 1);
    await simpleVoting.openResults(0);

    await expect(simpleVoting.publishResults(0, "0x", "0x")).to.be.revertedWithCustomError(
      simpleVoting,
      "InvalidDecryptionPayload",
    );
  });
});
