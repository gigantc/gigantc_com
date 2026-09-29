/**
 * Local lunar-phase calculations using Meeus' periodic corrections
 * (Astronomical Algorithms, Chapter 49).
 *
 * Phase times are accurate to ~1–2 minutes vs. NASA/USNO across the
 * 20th–21st centuries. No API/network dependency.
 */

const SYNODIC_MONTH_DAYS = 29.530588853;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEG = Math.PI / 180;
const JD_UNIX_EPOCH = 2440587.5; // JD at 1970-01-01 00:00 UTC

const normalizeDeg = (a) => ((a % 360) + 360) % 360;

// Meeus (49.1): JDE of the mean phase at lunation-fraction k
// (integer k → new moon, k+0.25 → first quarter, +0.5 → full, +0.75 → last)
const meanPhaseJDE = (k) => {
  const T = k / 1236.85;
  return (
    2451550.09766 +
    29.530588861 * k +
    0.00015437 * T * T -
    0.000000150 * T * T * T +
    0.00000000073 * T * T * T * T
  );
};

// Meeus (49.4–49.7): periodic corrections (in days) added to the mean JDE
const periodicCorrection = (k, phaseFrac) => {
  const T = k / 1236.85;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;

  const M  = normalizeDeg(  2.5534 +  29.10535670 * k -   0.0000014 * T * T -   0.00000011 * T * T * T) * DEG;
  const Mp = normalizeDeg(201.5643 + 385.81693528 * k +   0.0107582 * T * T +   0.00001238 * T * T * T -   0.000000058 * T * T * T * T) * DEG;
  const F  = normalizeDeg(160.7108 + 390.67050284 * k -   0.0016118 * T * T -   0.00000227 * T * T * T +   0.000000011 * T * T * T * T) * DEG;
  const Om = normalizeDeg(124.7746 -   1.56375588 * k +   0.0020672 * T * T +   0.00000215 * T * T * T) * DEG;

  const s = Math.sin;
  const c = Math.cos;

  let correction = 0;

  if (phaseFrac === 0 || phaseFrac === 0.5) {
    // New/Full share the same terms; only the two leading coefficients differ.
    const isNew = phaseFrac === 0;
    correction += (isNew ? -0.40720 : -0.40614) * s(Mp);
    correction += (isNew ? +0.17241 : +0.17302) * E * s(M);
    correction += (isNew ? +0.01608 : +0.01614) * s(2 * Mp);
    correction += (isNew ? +0.01039 : +0.01043) * s(2 * F);
    correction += (isNew ? +0.00739 : +0.00734) * E * s(Mp - M);
    correction += (isNew ? -0.00514 : -0.00515) * E * s(Mp + M);
    correction += (isNew ? +0.00208 : +0.00209) * E * E * s(2 * M);
    correction += -0.00111 * s(Mp - 2 * F);
    correction += -0.00057 * s(Mp + 2 * F);
    correction += +0.00056 * E * s(2 * Mp + M);
    correction += -0.00042 * s(3 * Mp);
    correction += +0.00042 * E * s(M + 2 * F);
    correction += +0.00038 * E * s(M - 2 * F);
    correction += -0.00024 * E * s(2 * Mp - M);
    correction += -0.00017 * s(Om);
    correction += -0.00007 * s(Mp + 2 * M);
    correction += +0.00004 * s(2 * Mp - 2 * F);
    correction += +0.00004 * s(3 * M);
    correction += +0.00003 * s(Mp + M - 2 * F);
    correction += +0.00003 * s(2 * Mp + 2 * F);
    correction += -0.00003 * s(Mp + M + 2 * F);
    correction += +0.00003 * s(Mp - M + 2 * F);
    correction += -0.00002 * s(Mp - M - 2 * F);
    correction += -0.00002 * s(3 * Mp + M);
    correction += +0.00002 * s(4 * Mp);
  } else {
    // First & Last Quarter: shared table + W term (+W for first, −W for last).
    correction += -0.62801 * s(Mp);
    correction += +0.17172 * E * s(M);
    correction += -0.01183 * E * s(Mp + M);
    correction += +0.00862 * s(2 * Mp);
    correction += +0.00804 * s(2 * F);
    correction += +0.00454 * E * s(Mp - M);
    correction += +0.00204 * E * E * s(2 * M);
    correction += -0.00180 * s(Mp - 2 * F);
    correction += -0.00070 * s(Mp + 2 * F);
    correction += -0.00040 * s(3 * Mp);
    correction += -0.00034 * E * s(2 * Mp - M);
    correction += +0.00032 * E * s(M + 2 * F);
    correction += +0.00032 * E * s(M - 2 * F);
    correction += -0.00028 * E * E * s(Mp + 2 * M);
    correction += +0.00027 * E * s(2 * Mp + M);
    correction += -0.00017 * s(Om);
    correction += -0.00005 * s(Mp - M - 2 * F);
    correction += +0.00004 * s(2 * Mp + 2 * F);
    correction += -0.00004 * s(Mp + M + 2 * F);
    correction += +0.00004 * s(Mp - 2 * M);
    correction += +0.00003 * s(Mp + M - 2 * F);
    correction += +0.00003 * s(3 * M);
    correction += +0.00002 * s(2 * Mp - 2 * F);
    correction += +0.00002 * s(Mp - M + 2 * F);
    correction += -0.00002 * s(3 * Mp + M);

    const W =
      0.00306 -
      0.00038 * E * c(M) +
      0.00026 * c(Mp) -
      0.00002 * c(Mp - M) +
      0.00002 * c(Mp + M) +
      0.00002 * c(2 * F);
    correction += phaseFrac === 0.25 ? W : -W;
  }

  return correction;
};

// JDE of the phase at integer lunation `k` plus fraction (0, .25, .5, .75).
// JDE (dynamical time) differs from UTC by <1 min through 2100 — ignored.
const phaseJDE = (k, phaseFrac) => {
  const fk = k + phaseFrac;
  return meanPhaseJDE(fk) + periodicCorrection(fk, phaseFrac);
};

const jdeToDate = (jde) => new Date((jde - JD_UNIX_EPOCH) * DAY_MS);

// Rough lunation index at a date (k=0 near 2000-01-06 18:14 UTC).
const approxK = (date) => {
  const yearFrac = date.getUTCFullYear() + (date.getUTCMonth() + 0.5) / 12;
  return (yearFrac - 2000) * 12.3685;
};

// Nearest phase event to `date` in the given direction ('next' | 'prev').
const findPhase = (date, phaseFrac, direction) => {
  const kSeed = Math.round(approxK(date) - phaseFrac);
  const candidates = [];
  for (let dk = -2; dk <= 2; dk += 1) {
    candidates.push(jdeToDate(phaseJDE(kSeed + dk, phaseFrac)));
  }
  const filtered = candidates.filter((d) =>
    direction === 'next' ? d > date : d < date,
  );
  filtered.sort((a, b) => Math.abs(a - date) - Math.abs(b - date));
  return filtered[0];
};

export const nextPhase = (date, phaseFrac) => findPhase(date, phaseFrac, 'next');
const prevNewMoon = (date) => findPhase(date, 0, 'prev');

// Phase event closest to `date` (before or after).
export const nearestPhase = (date, phaseFrac) => {
  const kSeed = Math.round(approxK(date) - phaseFrac);
  const candidates = [];
  for (let dk = -2; dk <= 2; dk += 1) {
    candidates.push(jdeToDate(phaseJDE(kSeed + dk, phaseFrac)));
  }
  candidates.sort((a, b) => Math.abs(a - date) - Math.abs(b - date));
  return candidates[0];
};

// Days since the most recent astronomical new moon.
export const getMoonAge = (date = new Date()) => {
  const last = prevNewMoon(date);
  return (date.getTime() - last.getTime()) / DAY_MS;
};

// Cosine approximation of illuminated fraction. Accurate to a few percent —
// fine for a dashboard readout.
export const getIllumination = (age) => {
  const fraction = (1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH_DAYS)) / 2;
  return Math.round(fraction * 100);
};

export const isWaxing = (age) => age < SYNODIC_MONTH_DAYS / 2;

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

const MAJOR_PHASES = [
  { fraction: 0, name: 'New Moon' },
  { fraction: 0.25, name: 'First Quarter' },
  { fraction: 0.5, name: 'Full Moon' },
  { fraction: 0.75, name: 'Last Quarter' },
];

export const getNextMajorPhase = (date = new Date()) =>
  MAJOR_PHASES
    .map(({ fraction, name }) => ({ name, date: nextPhase(date, fraction) }))
    .sort((a, b) => a.date - b.date)[0];

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
    nextFullMoon: nextPhase(date, 0.5),
    nextNewMoon: nextPhase(date, 0),
  };
};
