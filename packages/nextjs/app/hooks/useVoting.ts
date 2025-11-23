"use client";

import { useCallback, useMemo } from "react";
import { useAccount, useConfig, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { simpleVotingAbi } from "~~/contracts/abis/simpleVotingAbi";
import { useWagmiEthers } from "~~/hooks/wagmi/useWagmiEthers";
import { toHex, useFHEEncryption, useFhevm } from "~~/lib/fhevm/react";
import { getParsedError } from "~~/utils/helper";

export interface Question {
  question: string;
  createdBy: string;
  possibleAnswers: [string, string];
  image: string;
  deadline: number;
  resultsOpened: boolean;
  resultsFinalized: boolean;
  encryptedTally: [string, string];
  decryptedTally: [number, number];
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;
const FALLBACK_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "11155111");
const MOCK_CHAINS = { 31337: "http://localhost:8545" } as const;

export const useVoting = () => {
  const publicClient = usePublicClient();
  const config = useConfig();
  const { address: userAddress, chain } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const { ethersSigner, eip1193Provider } = useWagmiEthers(MOCK_CHAINS);

  const provider = useMemo(() => {
    if (eip1193Provider) return eip1193Provider;
    if (typeof window === "undefined") return undefined;
    return (window as any).ethereum;
  }, [eip1193Provider]);

  const chainId = chain?.id ?? FALLBACK_CHAIN_ID;

  const { instance, status: fheStatus } = useFhevm({
    provider,
    chainId,
    initialMockChains: MOCK_CHAINS,
    enabled: Boolean(provider),
  });

  const { canEncrypt } = useFHEEncryption({
    instance,
    ethersSigner,
    contractAddress: CONTRACT_ADDRESS,
  });

  const {
    data: questionsCountRaw,
    refetch: refetchQuestionsCount,
    isLoading: isQuestionsCountLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: simpleVotingAbi,
    functionName: "getQuestionsCount",
    query: {
      enabled: Boolean(CONTRACT_ADDRESS),
    },
  });

  const questionsCount = useMemo(() => {
    if (!questionsCountRaw) return 0;
    if (typeof questionsCountRaw === "bigint") return Number(questionsCountRaw);
    if (typeof questionsCountRaw === "number") return questionsCountRaw;
    return Number(questionsCountRaw);
  }, [questionsCountRaw]);

  const ensureContractAddress = () => {
    if (!CONTRACT_ADDRESS) {
      throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not configured.");
    }
    return CONTRACT_ADDRESS;
  };

  const handleContractError = useCallback((error: unknown, context: string): never => {
    const parsedError = getParsedError(error);
    console.error(`${context}:`, error);
    throw new Error(`${context}: ${parsedError}`);
  }, []);

  const createQuestion = useCallback(
    async (question: string, answer1: string, answer2: string, image: string, deadlineSeconds: number) => {
      const address = ensureContractAddress();
      if (!writeContractAsync) {
        throw new Error("Wallet client is not ready.");
      }
      try {
        const hash = await writeContractAsync({
          address,
          abi: simpleVotingAbi,
          functionName: "createQuestion",
          args: [question, answer1, answer2, image, BigInt(deadlineSeconds)],
        });
        const receipt = await waitForTransactionReceipt(config, { hash });
        if (receipt.status !== "success") {
          throw new Error("Create question transaction failed.");
        }
        await refetchQuestionsCount();
        return hash;
      } catch (error) {
        handleContractError(error, "Failed to create question");
      }
    },
    [config, handleContractError, refetchQuestionsCount, writeContractAsync],
  );

  const encryptVote = useCallback(
    async (value: number, contractAddress: string) => {
      if (!canEncrypt || !instance) {
        throw new Error("Encryption not ready. Connect your wallet first.");
      }
      if (value !== 0 && value !== 1) {
        throw new Error("Vote must be 0 or 1.");
      }

      console.log("Encrypting vote with FHEVM instance:", instance);
      console.log("User address:", userAddress);

      if (!userAddress) {
        throw new Error("User address is not available.");
      }
      // Create a fresh encrypted input bound to your contract
      const input = await instance.createEncryptedInput(contractAddress, userAddress);

      input.add8(value); // encrypt the vote choice (0 or 1)
      const { handles, inputProof } = await input.encrypt();

      if (!handles?.length || !inputProof) throw new Error("Encryption failed.");

      return {
        handle: toHex(handles[0]),
        inputProof: toHex(inputProof),
      };
    },
    [canEncrypt, instance, userAddress],
  );

  const vote = useCallback(
    async (questionId: number | bigint, answerIndex: number) => {
      const normalizedQuestionId = typeof questionId === "bigint" ? questionId : BigInt(questionId);
      const address = ensureContractAddress();
      if (!publicClient) {
        throw new Error("Public client is not available.");
      }
      if (!writeContractAsync) {
        throw new Error("Wallet client is not ready.");
      }
      try {
        const encryptedAnswer = await encryptVote(answerIndex, address);
        const hash = await writeContractAsync({
          address,
          abi: simpleVotingAbi,
          functionName: "vote",
          args: [normalizedQuestionId, encryptedAnswer.handle, encryptedAnswer.inputProof],
        });

        const receipt = await waitForTransactionReceipt(config, { hash });
        if (receipt.status !== "success") {
          throw new Error("Vote transaction failed.");
        }
        return hash;
      } catch (error) {
        handleContractError(error, "Failed to cast vote");
      }
    },
    [config, encryptVote, handleContractError, publicClient, writeContractAsync],
  );

  const openResults = useCallback(
    async (questionId: number) => {
      const address = ensureContractAddress();
      if (!writeContractAsync) {
        throw new Error("Wallet client is not ready.");
      }
      try {
        const hash = await writeContractAsync({
          address,
          abi: simpleVotingAbi,
          functionName: "openResults",
          args: [BigInt(questionId)],
        });
        const receipt = await waitForTransactionReceipt(config, { hash });
        if (receipt.status !== "success") {
          throw new Error("Open results transaction failed.");
        }
        return hash;
      } catch (error) {
        handleContractError(error, "Failed to open results");
      }
    },
    [config, handleContractError, writeContractAsync],
  );

  const getQuestion = useCallback(
    async (questionId: number): Promise<Question | null> => {
      const address = ensureContractAddress();
      if (!publicClient) return null;
      try {
        const result = await publicClient.readContract({
          address,
          abi: simpleVotingAbi,
          functionName: "getQuestion",
          args: [BigInt(questionId)],
        });
        if (!result) return null;
        const [
          prompt,
          createdBy,
          possibleAnswers,
          image,
          deadline,
          resultsOpened,
          resultsFinalized,
          encryptedTally,
          decryptedTally,
        ] = result as unknown as [
          string,
          string,
          [string, string],
          string,
          bigint,
          boolean,
          boolean,
          [string | bigint, string | bigint],
          [bigint, bigint],
        ];

        const toHandleHex = (value: string | bigint) => {
          if (typeof value === "string") return value as `0x${string}`;
          const hex = value.toString(16).padStart(64, "0");
          return `0x${hex}` as `0x${string}`;
        };

        const encryptedHandles: [string, string] = [toHandleHex(encryptedTally[0]), toHandleHex(encryptedTally[1])];

        return {
          question: prompt,
          createdBy,
          possibleAnswers,
          image,
          deadline: Number(deadline),
          resultsOpened,
          resultsFinalized,
          encryptedTally: encryptedHandles,
          decryptedTally: [Number(decryptedTally[0]), Number(decryptedTally[1])],
        } as Question;
      } catch (err) {
        console.error("Error reading question", err);
        return null;
      }
    },
    [publicClient],
  );

  const hasVoted = useCallback(
    async (questionId: number, voter: string): Promise<boolean> => {
      const address = ensureContractAddress();
      if (!publicClient || !voter) return false;
      try {
        const result = await publicClient.readContract({
          address,
          abi: simpleVotingAbi,
          functionName: "hasVoted",
          args: [BigInt(questionId), voter as `0x${string}`],
        });
        return Boolean(result);
      } catch (err) {
        console.error("Error checking vote", err);
        return false;
      }
    },
    [publicClient],
  );

  const publishResults = useCallback(
    async (questionId: number) => {
      const address = ensureContractAddress();
      if (!instance) {
        throw new Error("FHEVM instance is not ready.");
      }
      if (!writeContractAsync) {
        throw new Error("Wallet client is not ready.");
      }
      const question = await getQuestion(questionId);
      if (!question) {
        throw new Error("Question not found.");
      }
      if (!question.resultsOpened) {
        throw new Error("Results are still encrypted on-chain.");
      }
      if (question.resultsFinalized) {
        throw new Error("Results already published.");
      }
      try {
        const decryption = await instance.publicDecrypt(question.encryptedTally);
        const hash = await writeContractAsync({
          address,
          abi: simpleVotingAbi,
          functionName: "publishResults",
          args: [BigInt(questionId), decryption.abiEncodedClearValues, decryption.decryptionProof],
        });
        const receipt = await waitForTransactionReceipt(config, { hash });
        if (receipt.status !== "success") {
          throw new Error("Publish results transaction failed.");
        }
        return hash;
      } catch (error) {
        handleContractError(error, "Failed to publish decrypted tally");
      }
    },
    [config, getQuestion, handleContractError, instance, writeContractAsync],
  );

  return {
    questionsCount,
    isQuestionsCountLoading,
    refetchQuestionsCount,
    createQuestion,
    vote,
    getQuestion,
    hasVoted,
    encryptVote,
    canEncrypt,
    fheStatus,
    isWritePending: isPending,
    openResults,
    publishResults,
  } as const;
};
