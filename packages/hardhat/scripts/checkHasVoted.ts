import { ethers } from "hardhat";

async function main() {
  const addr = "0x819be2630fc6aE7229B40fC5320dA95A996cc130";
  const voter = ethers.getAddress("0x817f494fa244ae7a34af2f1fbc468474a11b383697");
  const voting = await ethers.getContractAt("SimpleVoting", addr);
  const flag = await voting.hasVoted(0, voter);
  console.log("has voted?", flag);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
