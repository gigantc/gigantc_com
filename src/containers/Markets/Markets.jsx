import { useState, useEffect } from 'react';
import Loader from '@/components/Loader/Loader';
import { fetchMarketData } from '@/utils/marketData';
import './Markets.scss';

const formatPrice = (price) => price.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatChange = (changePercent) => {
  const sign = changePercent >= 0 ? '+' : '';
  return `${sign}${changePercent.toFixed(2)}%`;
};

// Yahoo Finance marketState values → user-facing label (only shown when
// not REGULAR trading hours). CRYPTO is 24/7 so it never surfaces a flag.
const MARKET_STATE_LABELS = {
  PRE: 'Pre-market',
  PREPRE: 'Closed',
  POST: 'After-hours',
  POSTPOST: 'Closed',
  CLOSED: 'Closed',
};

const MarketTile = ({ symbol, price, changePercent, prevClose, dayLow, dayHigh, marketState }) => {
  const stateLabel = MARKET_STATE_LABELS[marketState];
  const prevLabel = marketState === 'CRYPTO' ? '24h ago' : 'Prev';

  return (
    <div className="marketTile">
      <div className="tileHead">
        <span className="symbol">
          {symbol}
          {stateLabel && <span className="marketState"> · {stateLabel}</span>}
        </span>
        <span className={`change ${changePercent >= 0 ? 'up' : 'down'}`}>{formatChange(changePercent)}</span>
      </div>
      <div className="price">{formatPrice(price)}</div>
      <div className="tileFoot">
        <div>{prevLabel}: <strong>{formatPrice(prevClose)}</strong></div>
        <div>Range: <strong>{formatPrice(dayLow)} – {formatPrice(dayHigh)}</strong></div>
      </div>
    </div>
  );
};

const Markets = () => {
  const [markets, setMarkets] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMarketData()
      .then(setMarkets)
      .catch((err) => {
        console.error('Market data fetch failed:', err);
        setError('Unable to load market data.');
      });
  }, []);

  if (error) {
    return (
      <section className="markets">
        <div className="error">{error}</div>
      </section>
    );
  }

  if (!markets) {
    return (
      <section className="markets">
        <Loader />
      </section>
    );
  }

  return (
    <section className="markets">
      <div className="marketsRow">
        {markets.stocks.map((tile) => (
          <MarketTile key={tile.symbol} {...tile} />
        ))}
      </div>
      <div className="marketsRow">
        {markets.crypto.map((tile) => (
          <MarketTile key={tile.symbol} {...tile} />
        ))}
      </div>
    </section>
  );
};

export default Markets;
