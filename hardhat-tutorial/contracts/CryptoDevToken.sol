pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable {
  // price of one crypto dev token
  uint256 public constant tokenPrice = 0.001 ether;

  // Each NFT would give the user 10 tokens
  // It needs to be represented as 10* (10**18) as ERC20 tokens are rep by the smallest denomination possible for the token.
  // By default, ERC20 tokens have the smallest denomination of 10^(-18). This means, having a balance of (1) tokem
  // is actually equal to (10^-18) tokens.
  // Owning 1 full token is equivalent to owning (10^18) tokens when you account for the decimal places.
  // More info on this can be found in the freshman track crypto tutorial.
  uint256 public constant tokensPerNFT = 10 * 10**18;

  // the max supply of token is 10000
  uint256 public constant maxTotalSupply = 10000 * 10**18;

  // CryptoDevsNFT contract instance
  ICryptoDevs CryptoDevsNFT;

  // Mapping to keep track of which tokenIds have been clained
  mapping(uint256 => bool) public tokenIdsClaimed;

  constructor(address _cryptoDevsContract) ERC20("Crypto Dev Token", "CD"){
    CryptoDevsNFT = ICryptoDevs(_cryptoDevsContract);
  }

  /*
  * @dev Mints 'amount' number of CryptoDevTokens
  */

  function mint(uint256 amount) public payable {
    // the value of ether should be greater or equal than tokenPrice *amount;
    uint256 _requiredAmount = tokenPrice * amount;
    require(msg.value >= _requiredAmount, "Ether sent is incorrect");
    //total tokens + amount <= 10000, otherwise revert transaction
    uint256 amountWithDecimals = amount * 10**18;
    require(
      (totalSupply() + amountWithDecimals) <= maxTotalSupply,
      "Exceeds the max total supply available")
      );

      // call the internal function from openzeppelin's ERC20 contract
      _mint(msg.sender, amountWithDecimals);
  }

  function claim() public {
    address sender = msg.sender;
    // Get the number of CryptoDevsNFT held by a given sender address
    uint256 balance = CryptoDevsNFT.balanceOf(sender);
    // if the balance is zero, revert transaction
    require(balance>0, "You dont own any Crypto Dev NFTs");
    // amount keeps track of number of unclaimed tokenIds
    uint256 amount = 0;
    // loop over the balance and get the token ID owned by 'sender' at a given index
    for(uint256 i =0; i< balance; i++) {
      uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i);
      // if the tokenId has not been claimed, ncrease  the amount
      if(!tokenIdsClaimed[tokenId]) {
        amount += 1;
        tokenIdsClaimed[tokenId] = true;
      }
    }
    //if all the token Ids have been claimed, revert the transaction
    require(amount>0, "You have already claimed all the tokens");
    // call the internal function from openzeppelin ERC20 contract
    // mint (amount*10) tokens for each NFT
    _mint(msg.sender, amount * tokensPerNFT);
  }

  /*
  * @dev withdraws all the ETH and tokens sent to the contract
  */

  function withdraw() public onlyOwner {
    address _owner = owner();
    uint256 amount = address(this).balance;
    (bool sent, ) = _owner.call(value:amount)("");
    require(sent, "Failed to send Ether");
  }

  //function to receive ether. msg.data must be empty
  receive() external payable {}

    // fallback function is called when msg.data is not empty
    fallback() external payable {}



}
