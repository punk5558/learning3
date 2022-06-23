import {BigNumber, Contract, providers, utils} from "ethers";
import Head from "next/head";
import React, {useEffect, useRef, useState} from "react";
import Web3Modal from "web3modal";
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {

  /*
  * This section is where all the functions reside for the front end
  */
// create a bignumber 0
const zero = BigNumber.from(0);
// walletConnected keeps track of whether the user wallet is connected
const [walletConnected, setWalletConnected] = useState(false);
// loading is set to true when we are waiting for tx to get mined
const [loading, setLoading] = useState(false);
// tokensToBeClaimed keeps track of the number of tokens that can be claimed
// based on the Crypto Dev NFTs held by the user for which they havent claim the token
const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
// balanceOfCryptoDevTokens keep track of number of CD tokens owned by an Address
const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero);
// amount of the tokens that the user wants to mint
const [tokenAmount, setTokenAmount] = useState(zero);
// tokensMinted is the total number of tokens that have been minted out of 10000
const [tokensMinted, setTokensMinted] = useState(zero);
// isOwner gets the owner of the contract through the signed address
const [isOwner, setIsOwner] = useState(false);
// Create a reference to the web3 modal
const web3ModalRef = useRef();

const getTokensToBeClaimed = async () => {
  try {
    const provider = await getProviderOrSigner();

    const nftContract  = new Contract (
      NFT_CONTRACT_ADDRESS,
      NFT_CONTRACT_ABI,
      provider,
    );

    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      provider,
    );

    const signer = await getProviderOrSigner(true);
    const address = await signer.getAddress();
    const balance = await nftContract.balanceOf(address);
    //console.log(nftContract.address);
    //console.log(address);
    if(balance === zero){
      setTokensToBeClaimed(zero);
    } else {
      var amount = 0;
      for(var i=0; i<balance; i++) {
        const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
        //console.log(parseInt(tokenId));
        const claimed = await tokenContract.tokenIdsClaimed(tokenId);
        if(!claimed){
          amount++;
        }
      }

      setTokensToBeClaimed(BigNumber.from(amount));
    }
  } catch (err) {
    console.error(err);
    setTokensToBeClaimed(zero);
  }
};

const getBalanceOfCryptoDevTokens = async () => {
  try{
    const provider = await getProviderOrSigner();
    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      provider,
    );

    const signer = await getProviderOrSigner(true);
    const address = await signer.getAddress();
    const balance = await tokenContract.balanceOf(address);
    setBalanceOfCryptoDevTokens(balance);

  } catch (err) {
    console.error(err);
    setBalanceOfCryptoDevTokens(zero);
  }
};

const mintCryptoDevToken = async (amount) => {
  try{
    //get the tokencontract
    const signer = await getProviderOrSigner(true);
    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      signer,
    );


    // run the mint function with amount
    const value = 0.001 * amount;
    const tx = await tokenContract.mint(amount, {value: utils.parseEther(value.toString())});
    setLoading(true);
    await tx.wait();
    setLoading(false);
    window.alert("Successfully minted Crypto Dev Tokens");
    await getBalanceOfCryptoDevTokens();
    await getTotalTokensMinted();
    await getTokensToBeClaimed();
  } catch(err) {
    console.error(err);
  }
};

const claimCryptoDevTokens = async () => {
  try {
    const signer = await getProviderOrSigner(true);
    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      signer
    );

    const tx = await tokenContract.claim();
    setLoading(true);
    await tx.wait();
    setLoading(false);
    window.alert("Successfully claimed Crypto Dev Tokens");
    await getBalanceOfCryptoDevTokens();
    await getTotalTokensMinted();
    await getTokensToBeClaimed();

  } catch(err) {
    console.error(err);
  }
};

const getTotalTokensMinted = async () => {
  try {
    const provider = await getProviderOrSigner();

    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      provider
    );

    const _tokensMinted = await tokenContract.totalSupply();

    setTokensMinted(_tokensMinted);
  } catch(err) {
    console.log("error message");
    console.error(err.message);
  }
};

const getOwner = async () => {
  try {
    const provider = await getProviderOrSigner();
    const tokenContract = new Contract (
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      provider,
    );

    const _owner = await tokenContract.owner();
    // check if connected wallet is owner
    const signer = await getProviderOrSigner(true);
    if(_owner.toLowerCase() === signer.toLowerCase()){
      setIsOwner(true);
    }

  } catch(err) {
    console.error(err.message);
  }
};

const withdrawCoins = async () => {
  try {
    const signer = getProviderOrSigner(true);
    const tokenContract = new Contract (
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      signer,
    );

    const tx = await tokenContract.withdraw();
    setLoading(true);
    await tx.wait();
    setLoading(false);
    await getOwner();

  } catch(err) {
    console.error(err);
  }
};

const getProviderOrSigner = async (needSigner = false) => {
  // connect to mm
  const provider = await web3ModalRef.current.connect();
  const web3Provider = new providers.Web3Provider(provider);

  // if user is not connected to Rinkeby, let them know and throw an console.error
  const { chainId } = await web3Provider.getNetwork();
  if(chainId !== 4) {
    window.alert("Change the network to Rinkeby");
    throw new Error("Change network to Rinkeby");
  }

  if(needSigner) {
    const signer = web3Provider.getSigner();
    return signer;
  }
  return web3Provider;
};

const connectWallet = async () => {
  try {
    // Get the provider from web3Modal, which in our case is MetaMask
    // When used for the first time, it prompts the user to connect their wallet
    await getProviderOrSigner();
    setWalletConnected(true);
  } catch (err) {
    console.error(err);
  }
};

useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfCryptoDevTokens();
      getTokensToBeClaimed();
      withdrawCoins();
    }
  }, [walletConnected]);

  /*
        renderButton: Returns a button based on the state of the dapp
      */
  const renderButton = () => {
    // If we are currently waiting for something, return a loading button
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    // if owner is connected, withdrawCoins() is called
    if (walletConnected && isOwner) {
      return (
        <div>
          <button className={styles.button1} onClick={withdrawCoins}>
            Withdraw Coins
          </button>
        </div>
      );
    }
    // If tokens to be claimed are greater than 0, Return a claim button
    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    // If user doesn't have any tokens to claim, show the mint button
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintCryptoDevToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    );
  };






  // return the front end
  return (
    <div>
     <Head>
       <title>Crypto Devs</title>
       <meta name="description" content="ICO-Dapp" />
       <link rel="icon" href="/favicon.ico" />
     </Head>
     <div className={styles.main}>
       <div>
         <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
         <div className={styles.description}>
           You can claim or mint Crypto Dev tokens here
         </div>
         {walletConnected ? (
           <div>
             <div className={styles.description}>
               {/* Format Ether helps us in converting a BigNumber to string */}
               You have minted {utils.formatEther(balanceOfCryptoDevTokens)} Crypto
               Dev Tokens
             </div>
             <div className={styles.description}>
               {/* Format Ether helps us in converting a BigNumber to string */}
               Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
             </div>
             {renderButton()}
           </div>
         ) : (
           <button onClick={connectWallet} className={styles.button}>
             Connect your wallet
           </button>
         )}
       </div>
       <div>
         <img className={styles.image} src="./0.svg" />
       </div>
     </div>

     <footer className={styles.footer}>
       Made with &#10084; by Crypto Devs
     </footer>
   </div>
  );
}
