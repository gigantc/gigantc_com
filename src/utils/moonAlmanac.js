/**
 * Static lunar almanac data — traditional full moon names and known
 * lunar eclipse dates. Eclipse dates are sourced from published
 * astronomical tables and only need occasional manual updates
 * (see https://en.wikipedia.org/wiki/List_of_lunar_eclipses_in_the_21st_century).
 */

// Traditional Northern Hemisphere full moon names, by month (0-indexed)
export const FULL_MOON_NAMES = [
  'Wolf Moon',
  'Snow Moon',
  'Worm Moon',
  'Pink Moon',
  'Flower Moon',
  'Strawberry Moon',
  'Buck Moon',
  'Sturgeon Moon',
  'Harvest Moon',
  "Hunter's Moon",
  'Beaver Moon',
  'Cold Moon',
];

export const getFullMoonName = (date) => FULL_MOON_NAMES[date.getMonth()];

// Known lunar eclipses (UTC date of greatest eclipse)
export const LUNAR_ECLIPSES = [
  { date: '2026-03-03', type: 'Total' },
  { date: '2026-08-28', type: 'Partial' },
  { date: '2027-02-20', type: 'Penumbral' },
  { date: '2027-07-18', type: 'Penumbral' },
  { date: '2027-08-17', type: 'Penumbral' },
  { date: '2028-01-12', type: 'Partial' },
  { date: '2028-07-06', type: 'Partial' },
  { date: '2028-12-31', type: 'Total' },
];

const isSameUTCDate = (date, isoDate) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

// Returns a description if today coincides with a known eclipse or a full moon, else null
export const getMoonEvent = (date, phaseName) => {
  const eclipse = LUNAR_ECLIPSES.find((e) => isSameUTCDate(date, e.date));
  if (eclipse) {
    const isBlood = eclipse.type === 'Total';
    return `${isBlood ? '🔴 Blood Moon — ' : ''}${eclipse.type} Lunar Eclipse today`;
  }

  if (phaseName === 'Full Moon') {
    return `${getFullMoonName(date)} 🌕`;
  }

  return null;
};
