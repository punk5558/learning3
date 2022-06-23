const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env"});
const {CRYPTO_DEVS_NFT_CONTRACT_ADDRESS} = require("../constants");

async function main() {

  const CryptoDevsNFTContract  = CRYPTO_DEVS_NFT_CONTRACT_ADDRESS;

  const cryptoDevsTokenContract = await ethers.getContractFactory("CryptoDevToken");

  //deploy the contract
  const deployedCryptoDevsTokenContract = await cryptoDevsTokenContract.deploy(CryptoDevsNFTContract)

  // print the address of the deployed contract
  console.log(
    "Crypto Devs Token Contract Address",
    deployedCryptoDevsTokenContract.address
  );
}

// call the main function and catch if there is any console.error
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
