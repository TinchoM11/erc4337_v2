// If fromToken and ToToken have different decimals, we need to convert the amount
export async function equalDecimalsAmount(
    fromChain: SupportedChains,
    toChain: SupportedChains,
    fromTokenAddress: string,
    fromAmount: BigNumber,
    tokenSymbol: string
  ) {
  
    let fixedAmount = fromAmount;
    let fromTokenDecimals = (
      await axios.get(
        `https://li.quest/v1/token?chain=${parseSupportedChainToId(
          fromChain,
          "lifi"
        )}&token=${fromTokenAddress}`
      )
    ).data.decimals;
  
    let toTokenDecimals = (
      await axios.get(
        `https://li.quest/v1/token?chain=${parseSupportedChainToId(
          toChain,
          "lifi"
        )}&token=${tokenSymbol}`
      )
    ).data.decimals;
  
    if (fromTokenDecimals > toTokenDecimals) {
      fixedAmount = fromAmount.mul(10 ** (fromTokenDecimals - toTokenDecimals));
    } else if (fromTokenDecimals < toTokenDecimals) {
      fixedAmount = fromAmount.div(10 ** (toTokenDecimals - fromTokenDecimals));
    }
    return fixedAmount;
  }