import { MOCK_MARKETS } from '@/utils/marketDataMock';
import './Markets.scss';

const formatPrice = (price) => price.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatChange = (changePercent) => {
  const sign = changePercent >= 0 ? '+' : '';
  return `${sign}${changePercent.toFixed(2)}%`;
};

const MarketTile = ({ symbol, price, changePercent }) => (
  <div className="marketTile">
    <div className="tileHead">
      <span className="symbol">{symbol}</span>
      <span className="change">{formatChange(changePercent)}</span>
    </div>
    <div className="price">{formatPrice(price)}</div>
  </div>
);

const Markets = () => (
  <section className="markets">
    <div className="marketsRow">
      {MOCK_MARKETS.stocks.map((tile) => (
        <MarketTile key={tile.symbol} {...tile} />
      ))}
    </div>
    <div className="marketsRow">
      {MOCK_MARKETS.crypto.map((tile) => (
        <MarketTile key={tile.symbol} {...tile} />
      ))}
    </div>
  </section>
);

export default Markets;
