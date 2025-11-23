import { ethers } from "hardhat";

async function main() {
  const address = "0x819be2630fc6aE7229B40fC5320dA95A996cc130";
  const voting = await ethers.getContractAt("SimpleVoting", address);
  const questionId = 1;
  const encryptedChoice = "0x817f494fa244ae7a34af2f1fbc468474a11b383697000000000000aa36a70200";
  const inputProof = "0x0101817f494fa244ae7a34af2f1fbc468474a11b383697000000000000aa36a70200c2eb3bf13e7b1570973e1654b8ccaa29c3354f9253e920accc1c0f78d91f799a2488ee2e45d8e0a7bd1dc24fbb8a5077b627d1cece7226eb9f193c34a723743e1b00";
  try {
    const tx = await voting.vote(questionId, encryptedChoice, inputProof);
    console.log("tx sent", tx.hash);
  } catch (err) {
    console.error("reverted", err);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
