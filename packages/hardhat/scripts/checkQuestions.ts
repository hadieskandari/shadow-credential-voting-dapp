import { ethers } from "hardhat";

async function main() {
  const address = "0x819be2630fc6aE7229B40fC5320dA95A996cc130";
  const voting = await ethers.getContractAt("SimpleVoting", address);
  const count = await voting.getQuestionsCount();
  console.log("count", count.toString());
  for (let i = 0n; i < count; i++) {
    const q = await voting.getQuestion(i);
    console.log(i.toString(), q);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
