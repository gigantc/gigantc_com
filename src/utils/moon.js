/**
 * Local lunar-phase calculations.
 * No API/network dependency — derived from a known new-moon reference
 * epoch and the mean synodic month length.
 */

const SYNODIC_MONTH_DAYS = 29.530588853;
// Known new moon: Jan 6, 2000 18:14 UTC
const NEW_MOON_REFERENCE_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const DAY_MS = 24 * 60 * 60 * 1000;

// Fraction of the synodic month at which each "major" phase event occurs
const MAJOR_PHASES = [
  { fraction: 0, name: 'New Moon' },
  { fraction: 0.25, name: 'First Quarter' },
  { fraction: 0.5, name: 'Full Moon' },
  { fraction: 0.75, name: 'Last Quarter' },
];

// Age (in days into the synodic month) of the current moon
export const getMoonAge = (date = new Date()) => {
  const daysSinceReference = (date.getTime() - NEW_MOON_REFERENCE_MS) / DAY_MS;
  const age = daysSinceReference % SYNODIC_MONTH_DAYS;
  return age < 0 ? age + SYNODIC_MONTH_DAYS : age;
};

export const getIllumination = (age) => {
  const fraction = (1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH_DAYS)) / 2;
  return Math.round(fraction * 100);
};

export const isWaxing = (age) => age < SYNODIC_MONTH_DAYS / 2;

// Named phase, derived from illumination % so the label always matches
// what's shown next to it (rather than a fixed day-count band that can
// drift out of sync with the exact illumination figure).
export const getPhaseName = (illumination, waxing) => {
  if (illumination <= 2) return 'New Moon';
  if (illumination >= 98) return 'Full Moon';

  if (waxing) {
    if (illumination < 48) return 'Waxing Crescent';
    if (illumination <= 52) return 'First Quarter';
    return 'Waxing Gibbous';
  }

  if (illumination > 52) return 'Waning Gibbous';
  if (illumination >= 48) return 'Last Quarter';
  return 'Waning Crescent';
};

// Next date the moon reaches a given fraction of the synodic month
// (0 = New Moon, 0.25 = First Quarter, 0.5 = Full Moon, 0.75 = Last Quarter)
const getNextPhaseDate = (date, age, fraction) => {
  const targetAge = fraction * SYNODIC_MONTH_DAYS;
  const daysUntil = targetAge > age ? targetAge - age : targetAge + SYNODIC_MONTH_DAYS - age;
  return new Date(date.getTime() + daysUntil * DAY_MS);
};

// Next New/First Quarter/Full/Last Quarter event, with its date
export const getNextMajorPhase = (date = new Date()) => {
  const age = getMoonAge(date);

  const upcoming = MAJOR_PHASES
    .map(({ fraction, name }) => ({ name, date: getNextPhaseDate(date, age, fraction) }))
    .sort((a, b) => a.date - b.date)[0];

  return upcoming;
};

export const getMoonData = (date = new Date()) => {
  const age = getMoonAge(date);
  const illumination = getIllumination(age);
  const waxing = isWaxing(age);

  return {
    age,
    phaseName: getPhaseName(illumination, waxing),
    illumination,
    waxing,
    nextMajorPhase: getNextMajorPhase(date),
    nextFullMoon: getNextPhaseDate(date, age, 0.5),
    nextNewMoon: getNextPhaseDate(date, age, 0),
  };
};
