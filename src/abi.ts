export const ERC20_ABI = [
  // Read-Only Functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function allowance(address owner, address spender) view returns (uint256)",

  // Authenticated Functions
  "function transfer(address to, uint amount) returns (bool)",
  "function increaseAllowance(address spender, uint addedValue) returns (bool)",
  "function decreaseAllowance(address spender, uint addedValue) returns (bool)",
  "function approve(address spender, uint addedValue) returns (bool)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint amount)",
];

export const ERC721_ABI = [
  // Read-Only Functions
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function symbol() view returns (string)",

  // Authenticated Functions
  "function transferFrom(address from, address to, uint256 tokenId) returns (bool)",
  "function safeTransferFrom(address from, address to, uint256 tokenId) returns (bool)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint256 tokenId)",
];

export const UNISWAP_V2_ROUTER_ABI = [
  // Read-Only Functions
  "function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)",

  // Authenticated Functions
  "function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline)",
  "function swapExactTokensForETH(uint256 amountIn, uint amountOutMin, address[] path, address to, uint deadline)",
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint deadline)",
];

export const WETH_ABI = [
  "function approve(address guy, uint wad)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

export const WORMHOLE_POLY_ABI = [
  // Authenticated Functions
  "function completeTransfer(bytes encodedVm) returns (bool)",
  "function transferTokens(address token,uint256 amount,uint16 recipientChain,bytes32 recipient,uint256 arbiterFee,uint32 nonce)",
];