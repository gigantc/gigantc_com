/**
 * Static lunar almanac data — traditional full moon names and known
 * lunar eclipse dates. Eclipse dates are sourced from published
 * astronomical tables and only need occasional manual updates
 * (see https://en.wikipedia.org/wiki/List_of_lunar_eclipses_in_the_21st_century).
 */

import { nearestPhase, nextPhase } from '@/utils/moon';

const DAY_MS = 24 * 60 * 60 * 1000;

// Traditional Northern Hemisphere full moon names, by calendar month (0-indexed).
// September/October slots are placeholders — the Harvest and Hunter's Moon
// are determined astronomically, not by calendar month (see getFullMoonName).
export const FULL_MOON_NAMES = [
  'Wolf Moon',
  'Snow Moon',
  'Worm Moon',
  'Pink Moon',
  'Flower Moon',
  'Strawberry Moon',
  'Buck Moon',
  'Sturgeon Moon',
  'Corn Moon',      // September default (bumped when Harvest lands here — usually)
  'Travel Moon',    // October default (bumped when Hunter's lands here — usually)
  'Beaver Moon',
  'Cold Moon',
];

// September equinox varies between Sep 21–24 UT. Sep 22 12:00 UT is within
// ~1.5 days of the true equinox any year — plenty tight for picking the
// nearest full moon (full moons are ~29.5 days apart).
const septemberEquinox = (year) => new Date(Date.UTC(year, 8, 22, 12, 0, 0));

// Harvest Moon = full moon nearest the September equinox.
// Hunter's Moon = the next full moon after that.
const getHarvestMoon = (year) => nearestPhase(septemberEquinox(year), 0.5);
const getHuntersMoon = (year) => nextPhase(new Date(getHarvestMoon(year).getTime() + DAY_MS), 0.5);

const within24h = (a, b) => Math.abs(a.getTime() - b.getTime()) < DAY_MS;

export const getFullMoonName = (date) => {
  const year = date.getUTCFullYear();
  if (within24h(date, getHarvestMoon(year))) return 'Harvest Moon';
  if (within24h(date, getHuntersMoon(year))) return "Hunter's Moon";
  return FULL_MOON_NAMES[date.getMonth()];
};

// Known lunar eclipses (ISO timestamp of greatest eclipse, in UTC)
// Source: NASA GSFC Five Millennium Catalog of Lunar Eclipses
// https://eclipse.gsfc.nasa.gov/LEcat5/LE2001-2100.html
export const LUNAR_ECLIPSES = [
  { peak: '2026-03-03T11:34:52Z', type: 'Total' },
  { peak: '2026-08-28T04:14:04Z', type: 'Partial' },
  { peak: '2027-02-20T23:14:06Z', type: 'Penumbral' },
  { peak: '2027-07-18T16:04:09Z', type: 'Penumbral' },
  { peak: '2027-08-17T07:14:59Z', type: 'Penumbral' },
  { peak: '2028-01-12T04:14:13Z', type: 'Partial' },
  { peak: '2028-07-06T18:20:57Z', type: 'Partial' },
  { peak: '2028-12-31T16:53:15Z', type: 'Total' },
  { peak: '2029-06-26T03:23:22Z', type: 'Total' },
  { peak: '2029-12-20T22:43:12Z', type: 'Total' },
  { peak: '2030-06-15T18:34:34Z', type: 'Partial' },
  { peak: '2030-12-09T22:28:51Z', type: 'Penumbral' },
  { peak: '2031-05-07T03:52:02Z', type: 'Penumbral' },
  { peak: '2031-06-05T11:45:17Z', type: 'Penumbral' },
  { peak: '2031-10-30T07:46:45Z', type: 'Penumbral' },
  { peak: '2032-04-25T15:14:51Z', type: 'Total' },
  { peak: '2032-10-18T19:03:40Z', type: 'Total' },
  { peak: '2033-04-14T19:13:51Z', type: 'Total' },
  { peak: '2033-10-08T10:56:23Z', type: 'Total' },
  { peak: '2034-04-03T19:06:59Z', type: 'Penumbral' },
  { peak: '2034-09-28T02:47:37Z', type: 'Partial' },
  { peak: '2035-02-22T09:06:12Z', type: 'Penumbral' },
  { peak: '2035-08-19T01:12:15Z', type: 'Partial' },
];

const isSameLocalDate = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Returns a description if today coincides with a known eclipse or a full moon, else null
export const getMoonEvent = (date, phaseName) => {
  const eclipse = LUNAR_ECLIPSES.find((e) => isSameLocalDate(date, new Date(e.peak)));
  if (eclipse) {
    const isBlood = eclipse.type === 'Total';
    return `${isBlood ? '🔴 Blood Moon — ' : ''}${eclipse.type} Lunar Eclipse today`;
  }

  if (phaseName === 'Full Moon') {
    return `${getFullMoonName(date)} 🌕`;
  }

  return null;
};
