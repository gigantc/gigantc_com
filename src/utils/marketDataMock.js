/**
 * Mock market data for the Markets block. Replace with a live API
 * (e.g. Alpha Vantage / Financial Modeling Prep for indices,
 * CoinGecko for crypto) once wired up.
 */

export const MOCK_MARKETS = {
  stocks: [
    {
      symbol: 'S&P 500',
      price: 7561.84,
      changePercent: 0.10,
      sources: [
        { label: 'AP', href: 'https://apnews.com/hub/financial-markets' },
        { label: 'MarketWatch', href: 'https://www.marketwatch.com/investing/index/spx' },
      ],
    },
    {
      symbol: 'DOW',
      price: 52341.03,
      changePercent: 0.42,
      sources: [
        { label: 'AP', href: 'https://apnews.com/hub/financial-markets' },
        { label: 'MarketWatch', href: 'https://www.marketwatch.com/investing/index/djia' },
      ],
    },
    {
      symbol: 'NASDAQ',
      price: 26630.57,
      changePercent: -0.20,
      sources: [
        { label: 'AP', href: 'https://apnews.com/hub/financial-markets' },
        { label: 'Nasdaq', href: 'https://www.nasdaq.com/market-activity/index/comp' },
      ],
    },
  ],
  crypto: [
    {
      symbol: 'BTC',
      price: 65144.00,
      changePercent: 1.82,
      sources: [
        { label: 'CoinGecko', href: 'https://www.coingecko.com/en/coins/bitcoin' },
      ],
    },
    {
      symbol: 'ETH',
      price: 1762.43,
      changePercent: 2.42,
      sources: [
        { label: 'CoinGecko', href: 'https://www.coingecko.com/en/coins/ethereum' },
      ],
    },
  ],
};
