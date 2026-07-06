import { useState, useEffect } from 'react';
import Loader from '@/components/Loader/Loader';
import MoonIcon from '@/components/MoonIcon/MoonIcon';
import { getMoonData } from '@/utils/moon';
import { getMoonEvent } from '@/utils/moonAlmanac';
import { INTERVALS } from '@/config';
import Illumination from '@/assets/wi-day-sunny.svg?react';
import MoonAge from '@/assets/wi-moon-crescent.svg?react';
import FullMoon from '@/assets/wi-moon-full.svg?react';
import NewMoon from '@/assets/wi-moon-new.svg?react';
import './Moon.scss';

const formatNextPhaseDate = (date) => date.toLocaleString([], {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const formatShortDate = (date) => date.toLocaleDateString([], {
  month: 'short',
  day: 'numeric',
});

const Moon = () => {
  const [moonData, setMoonData] = useState(null);
  const [event, setEvent] = useState(null);

  //////////////////////////////////////
  // COMPUTE MOON DATA (local, no network dependency)
  useEffect(() => {
    const updateMoonData = () => {
      const now = new Date();
      const data = getMoonData(now);
      setMoonData(data);
      setEvent(getMoonEvent(now, data.phaseName));
    };

    updateMoonData();
    const interval = setInterval(updateMoonData, INTERVALS.MOON_REFRESH);
    return () => clearInterval(interval);
  }, []);

  //////////////////////////////////////
  // RENDER
  return (
    <section className="moon">
      {!moonData ? (
        <Loader />
      ) : (
        <div className="box">
          <div className="moonDisc">
            <MoonIcon illumination={moonData.illumination} waxing={moonData.waxing} />
          </div>
          <div className="text">
            <div className="phaseName">{moonData.phaseName}</div>
            <div className="description">about {moonData.illumination}% illuminated</div>
            <div className="nextPhase">
              Next major phase: <strong>{moonData.nextMajorPhase.name}</strong> on{' '}
              {formatNextPhaseDate(moonData.nextMajorPhase.date)}
            </div>
            {event && <div className="event">{event}</div>}
          </div>
          <div className="dataRow">
            <span>
              <Illumination className="icon" />
              <h6>illumination</h6>
              <p>{moonData.illumination}%</p>
            </span>
            <span>
              <MoonAge className="icon" />
              <h6>moon age</h6>
              <p>{moonData.age.toFixed(1)}d</p>
            </span>
            <span>
              <FullMoon className="icon" />
              <h6>next full moon</h6>
              <p>{formatShortDate(moonData.nextFullMoon)}</p>
            </span>
            <span>
              <NewMoon className="icon" />
              <h6>next new moon</h6>
              <p>{formatShortDate(moonData.nextNewMoon)}</p>
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

export default Moon;
