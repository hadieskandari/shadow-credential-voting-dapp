export const simpleVotingAbi = [
  {
    inputs: [],
    name: "AlreadyVoted",
    type: "error",
  },
  {
    inputs: [],
    name: "DeadlineNotReached",
    type: "error",
  },
  {
    inputs: [],
    name: "DeadlineTooSoon",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidDecryptionPayload",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidKMSSignatures",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidQuestionInput",
    type: "error",
  },
  {
    inputs: [],
    name: "PollClosed",
    type: "error",
  },
  {
    inputs: [],
    name: "QuestionDoesNotExist",
    type: "error",
  },
  {
    inputs: [],
    name: "ResultsAlreadyFinalized",
    type: "error",
  },
  {
    inputs: [],
    name: "ResultsAlreadyOpened",
    type: "error",
  },
  {
    inputs: [],
    name: "ResultsNotOpened",
    type: "error",
  },
  {
    inputs: [],
    name: "ZamaProtocolUnsupported",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bytes32[]",
        name: "handlesList",
        type: "bytes32[]",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "abiEncodedCleartexts",
        type: "bytes",
      },
    ],
    name: "PublicDecryptionVerified",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "questionId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "prompt",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint64",
        name: "deadline",
        type: "uint64",
      },
    ],
    name: "QuestionCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "questionId",
        type: "uint256",
      },
    ],
    name: "ResultsOpened",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "questionId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint32[2]",
        name: "decryptedTally",
        type: "uint32[2]",
      },
    ],
    name: "ResultsPublished",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "questionId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "voter",
        type: "address",
      },
    ],
    name: "VoteCast",
    type: "event",
  },
  {
    inputs: [],
    name: "MIN_DURATION",
    outputs: [
      {
        internalType: "uint64",
        name: "",
        type: "uint64",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "confidentialProtocolId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "prompt",
        type: "string",
      },
      {
        internalType: "string",
        name: "answerA",
        type: "string",
      },
      {
        internalType: "string",
        name: "answerB",
        type: "string",
      },
      {
        internalType: "string",
        name: "image",
        type: "string",
      },
      {
        internalType: "uint64",
        name: "deadline",
        type: "uint64",
      },
    ],
    name: "createQuestion",
    outputs: [
      {
        internalType: "uint256",
        name: "questionId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "questionId",
        type: "uint256",
      },
    ],
    name: "getQuestion",
    outputs: [
      {
        internalType: "string",
        name: "prompt",
        type: "string",
      },
      {
        internalType: "address",
        name: "createdBy",
        type: "address",
      },
      {
        internalType: "string[2]",
        name: "answers",
        type: "string[2]",
      },
      {
        internalType: "string",
        name: "image",
        type: "string",
      },
      {
        internalType: "uint64",
        name: "deadline",
        type: "uint64",
      },
      {
        internalType: "bool",
        name: "resultsOpened",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "resultsFinalized",
        type: "bool",
      },
      {
        internalType: "euint32[2]",
        name: "encryptedTally",
        type: "bytes32[2]",
      },
      {
        internalType: "uint32[2]",
        name: "decryptedTally",
        type: "uint32[2]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getQuestionsCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "hasVoted",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "questionId",
        type: "uint256",
      },
    ],
    name: "openResults",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "questionId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "abiEncodedClearValues",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "decryptionProof",
        type: "bytes",
      },
    ],
    name: "publishResults",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "questionsCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "questionId",
        type: "uint256",
      },
      {
        internalType: "externalEuint8",
        name: "encryptedChoice",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "inputProof",
        type: "bytes",
      },
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export type SimpleVotingAbi = typeof simpleVotingAbi;
