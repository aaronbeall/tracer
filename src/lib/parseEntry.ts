import type { DataSeries } from '@/services/db';

export interface EntrySeriesInfo {
  name: string;
  type?: DataSeries['type'];
  unit?: string;
  /** Known categories (categorized series) or known text values (text series). */
  values?: string[];
}

export interface ParsedEntry {
  series: string;
  seriesIsNew: boolean;
  value: number | string | undefined;
  category?: string;
  timestamp: number;
  /** True when the input contained a date/time phrase. */
  hasTime: boolean;
  /** Unit as typed (e.g. "min", "lbs"), after any conversion to the series' unit. */
  unit?: string;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const FILLER = new Set(['i', 'had', 'did', 'do', 'for', 'of', 'a', 'an', 'the', 'at', 'on', 'my', 'was', 'were', 'is', 'and', 'with', 'about', 'around', 'got', 'some', '-', '–', ':', ',', '=']);

const DURATION_UNITS: Record<string, number> = {
  s: 1 / 60, sec: 1 / 60, secs: 1 / 60, second: 1 / 60, seconds: 1 / 60,
  m: 1, min: 1, mins: 1, minute: 1, minutes: 1,
  h: 60, hr: 60, hrs: 60, hour: 60, hours: 60,
};

const KNOWN_UNITS = new Set([
  ...Object.keys(DURATION_UNITS),
  'lb', 'lbs', 'pound', 'pounds', 'kg', 'kgs', 'g', 'oz', 'mg',
  'mi', 'mile', 'miles', 'km', 'k', 'm', 'meters', 'ft', 'feet',
  'cal', 'cals', 'kcal', 'calories', 'step', 'steps', 'rep', 'reps', 'set', 'sets',
  'cup', 'cups', 'glass', 'glasses', 'ml', 'l', 'liters', 'bpm', '%', 'x', 'times',
  'page', 'pages', 'usd', 'dollars',
]);

const norm = (word: string) => {
  const w = word.toLowerCase().replace(/[^\p{L}\p{N}%$]/gu, '');
  return w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w;
};

const durationFactor = (unit?: string) => (unit ? DURATION_UNITS[unit.toLowerCase()] : undefined);

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

interface Masker {
  text: string;
  mask: (start: number, end: number) => void;
}

const createMasker = (input: string): Masker => {
  const m = {
    text: input,
    mask(start: number, end: number) {
      m.text = m.text.slice(0, start) + ' '.repeat(end - start) + m.text.slice(end);
    },
  };
  return m;
};

/** Finds and removes the first match of `re`, returning it. */
const take = (m: Masker, re: RegExp): RegExpExecArray | null => {
  const match = re.exec(m.text);
  if (match) m.mask(match.index, match.index + match[0].length);
  return match;
};

const parseTime = (m: Masker, now: Date): { timestamp: number; hasTime: boolean } => {
  let day: Date | null = null;
  let offset: number | null = null;
  let hours: number | null = null;
  let minutes = 0;

  const ago = take(m, /\b(\d+(?:\.\d+)?)\s*(m|mins?|minutes?|h|hrs?|hours?|d|days?|w|wks?|weeks?)\s+ago\b/i);
  if (ago) {
    const n = parseFloat(ago[1]);
    const u = ago[2].toLowerCase()[0];
    offset = n * (u === 'm' ? MINUTE : u === 'h' ? HOUR : u === 'd' ? DAY : 7 * DAY);
  }

  const relDay = take(m, /\b(today|tonight|yesterday|last night|this morning|this afternoon|this evening)\b/i);
  if (relDay) {
    const word = relDay[1].toLowerCase();
    day = startOfDay(now);
    if (word === 'yesterday' || word === 'last night') day = new Date(day.getTime() - DAY);
    if (word === 'last night' || word === 'tonight') hours = 21;
    if (word === 'this morning') hours = 8;
    if (word === 'this afternoon') hours = 14;
    if (word === 'this evening') hours = 19;
  }

  // Abbreviations ("sat", "sun") only count after "on"/"last" since they're also ordinary words.
  const weekday =
    take(m, /\b(?:(last|on)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i) ??
    take(m, /\b(last|on)\s+(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/i);
  if (weekday && !day) {
    const target = WEEKDAYS.findIndex((d) => d.startsWith(weekday[2].toLowerCase().slice(0, 3)));
    let diff = (now.getDay() - target + 7) % 7;
    if (diff === 0 && weekday[1]?.toLowerCase() === 'last') diff = 7;
    day = new Date(startOfDay(now).getTime() - diff * DAY);
  }

  const iso = take(m, /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (iso && !day) day = new Date(+iso[1], +iso[2] - 1, +iso[3]);

  const slash = take(m, /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (slash && !day) {
    const year = slash[3] ? (slash[3].length === 2 ? 2000 + +slash[3] : +slash[3]) : now.getFullYear();
    day = new Date(year, +slash[1] - 1, +slash[2]);
    // No year given and it lands in the future: assume last year.
    if (!slash[3] && day.getTime() > now.getTime()) day.setFullYear(year - 1);
  }

  const clock =
    take(m, /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)\b/i) ??
    take(m, /\bat\s+(\d{1,2}):(\d{2})\b/i);
  if (clock) {
    let h = +clock[1] % 24;
    const meridiem = clock[3]?.toLowerCase()[0];
    if (meridiem === 'p' && h < 12) h += 12;
    if (meridiem === 'a' && h === 12) h = 0;
    hours = h;
    minutes = clock[2] ? +clock[2] : 0;
  } else {
    const named = take(m, /\b(?:at\s+)?(noon|midnight)\b/i);
    if (named) hours = named[1].toLowerCase() === 'noon' ? 12 : 0;
  }

  if (offset !== null && !day && hours === null) {
    return { timestamp: now.getTime() - offset, hasTime: true };
  }
  if (!day && hours === null) return { timestamp: now.getTime(), hasTime: false };

  const base = day ?? startOfDay(now);
  const result = new Date(base);
  if (hours !== null) result.setHours(hours, minutes, 0, 0);
  else result.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
  return { timestamp: result.getTime(), hasTime: true };
};

interface Quantity {
  value: number;
  unit?: string;
}

const parseQuantity = (m: Masker, seriesUnits: Set<string>): Quantity | null => {
  // Compound duration, e.g. "1h30m", "1 hr 15 min"
  const compound = take(m, /\b(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)\s*(\d+)\s*(?:m|mins?|minutes?)\b/i);
  if (compound) return { value: +compound[1] * 60 + +compound[2], unit: 'min' };

  const re = /(^|[\s(])([-+]?)(\$)?(\d+(?:[.,]\d+)?|\.\d+)(?:\s*(%|[\p{L}]+))?(?=$|[\s),.;!?])/giu;
  const match = re.exec(m.text);
  if (!match) return null;
  const value = parseFloat(match[2] + match[4].replace(',', '.'));
  let unit: string | undefined = match[3] ? '$' : undefined;
  let end = match.index + match[1].length + match[2].length + (match[3] ?? '').length + match[4].length;
  const word = match[5];
  if (word && !unit && (KNOWN_UNITS.has(word.toLowerCase()) || seriesUnits.has(norm(word)))) {
    unit = word;
    end = match.index + match[0].length;
  }
  m.mask(match.index + match[1].length, end);
  return { value, unit };
};

interface Token {
  text: string;
  norm: string;
  start: number;
  end: number;
}

const tokenize = (text: string): Token[] =>
  Array.from(text.matchAll(/\S+/g), (t) => ({
    text: t[0],
    norm: norm(t[0]),
    start: t.index!,
    end: t.index! + t[0].length,
  })).filter((t) => t.norm !== '');

/** Finds a contiguous run of tokens matching `phrase`; returns [startIndex, length]. */
const findPhrase = (tokens: Token[], phrase: string): [number, number] | null => {
  const words = phrase.split(/\s+/).map(norm).filter(Boolean);
  if (!words.length) return null;
  for (let i = 0; i + words.length <= tokens.length; i++) {
    if (words.every((w, j) => tokens[i + j].norm === w)) return [i, words.length];
  }
  return null;
};

interface SeriesMatch {
  series: EntrySeriesInfo;
  score: number;
  used: Set<number>;
  matchedValue?: string;
}

const matchSeries = (tokens: Token[], seriesList: EntrySeriesInfo[]): SeriesMatch | null => {
  let best: SeriesMatch | null = null;
  const consider = (candidate: SeriesMatch) => {
    if (!best || candidate.score > best.score) best = candidate;
  };

  for (const s of seriesList) {
    const used = new Set<number>();
    let score = 0;

    const full = findPhrase(tokens, s.name);
    if (full) {
      score = 100 + s.name.length;
      for (let i = 0; i < full[1]; i++) used.add(full[0] + i);
    } else {
      // Partial name match, e.g. "sleep" -> "Sleep Hours"
      const nameWords = s.name.split(/\s+/).map(norm).filter((w) => w.length >= 3 && !FILLER.has(w));
      tokens.forEach((t, i) => {
        if (nameWords.includes(t.norm)) {
          used.add(i);
          score += 20 + t.norm.length;
        }
      });
    }

    let matchedValue: string | undefined;
    if (s.type !== 'numeric') {
      const values = [...(s.values ?? [])].sort((a, b) => b.length - a.length);
      for (const v of values) {
        const hit = findPhrase(tokens, v);
        if (hit && ![...Array(hit[1]).keys()].some((k) => used.has(hit[0] + k))) {
          matchedValue = v;
          for (let i = 0; i < hit[1]; i++) used.add(hit[0] + i);
          score += 50 + v.length;
          break;
        }
      }
    }

    if (score > 0) consider({ series: s, score, used, matchedValue });
  }
  return best;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const joinTokens = (tokens: Token[]) =>
  tokens.filter((t) => !FILLER.has(t.text.toLowerCase())).map((t) => t.text).join(' ').replace(/^[\s:,\-–]+|[\s:,\-–]+$/g, '');

/** Parses free text like "ran 3.2 miles yesterday" or "mood: great" into a data entry. */
export function parseEntry(input: string, seriesList: EntrySeriesInfo[], now: Date = new Date()): ParsedEntry {
  const m = createMasker(input);

  // "Series: rest" is an explicit series name
  let explicitSeries: string | undefined;
  const colon = /^\s*([^:\d][^:]*?)\s*:\s+/.exec(input);
  if (colon) {
    explicitSeries = colon[1];
    m.mask(0, colon[0].length);
  }

  const { timestamp, hasTime } = parseTime(m, now);
  const seriesUnits = new Set(seriesList.map((s) => s.unit).filter((u): u is string => !!u).map(norm));
  const quantity = parseQuantity(m, seriesUnits);

  let tokens = tokenize(m.text);
  let match: SeriesMatch | null = null;
  if (explicitSeries) {
    const known = seriesList.find((s) => s.name.toLowerCase() === explicitSeries!.toLowerCase());
    const series = known ?? { name: explicitSeries };
    const valueMatch = known ? matchSeries(tokens, [{ ...known, name: '' }]) : null;
    match = { series, score: 1, used: valueMatch?.used ?? new Set(), matchedValue: valueMatch?.matchedValue };
  } else {
    match = matchSeries(tokens, seriesList);
  }

  const rest = match ? tokens.filter((_, i) => !match!.used.has(i)) : tokens;
  const restText = joinTokens(rest);

  let value: number | string | undefined;
  let unit = quantity?.unit;
  if (quantity) {
    value = quantity.value;
    const from = durationFactor(quantity.unit);
    const to = durationFactor(match?.series.unit);
    if (from && to && from !== to) {
      value = Math.round((quantity.value * from) / to * 100) / 100;
      unit = match!.series.unit;
    }
  }

  if (match && seriesList.includes(match.series)) {
    const s = match.series;
    const result: ParsedEntry = { series: s.name, seriesIsNew: false, value, timestamp, hasTime, unit };
    if (s.type === 'categorized') {
      result.category = match.matchedValue ?? (restText || undefined);
    } else if (s.type === 'text') {
      result.value = match.matchedValue ?? (restText || (quantity ? String(quantity.value) + (quantity.unit ? ` ${quantity.unit}` : '') : undefined));
      result.unit = undefined;
    } else if (s.type !== 'numeric' && value === undefined) {
      result.value = match.matchedValue ?? (restText || undefined);
    }
    return result;
  }

  if (explicitSeries) {
    const result: ParsedEntry = { series: explicitSeries, seriesIsNew: true, value, timestamp, hasTime, unit };
    if (value === undefined) result.value = restText || undefined;
    else if (restText) result.category = restText;
    return result;
  }

  // Unknown series: with a number the words name the series; without, the first word does.
  if (quantity) {
    return { series: capitalize(restText), seriesIsNew: true, value, timestamp, hasTime, unit };
  }
  tokens = rest;
  const [first, ...others] = tokens;
  return {
    series: first ? capitalize(first.text.replace(/[:,]$/, '')) : '',
    seriesIsNew: true,
    value: joinTokens(others) || undefined,
    timestamp,
    hasTime,
  };
}

const KEYWORDS = ['yesterday', 'today', 'tonight', 'this morning', 'this afternoon', 'this evening', 'last night', 'minutes', 'hours', 'ago', ...WEEKDAYS];

/** Returns the text to append to `input` to complete its trailing word(s), or '' if none. */
export function suggestCompletion(input: string, seriesList: EntrySeriesInfo[]): string {
  if (!input || /\s$/.test(input)) return '';
  const words = input.split(/\s+/);
  const candidates = [
    ...seriesList.map((s) => s.name),
    ...seriesList.flatMap((s) => s.values ?? []),
    ...KEYWORDS,
  ];

  // Try the longest trailing fragment first so multi-word names complete as a unit.
  for (let n = Math.min(3, words.length); n >= 1; n--) {
    const fragment = words.slice(-n).join(' ');
    if (!fragment || /^[\d.$]/.test(fragment)) continue;
    const lower = fragment.toLowerCase();
    const hit = candidates.find((c) => c.length > fragment.length && c.toLowerCase().startsWith(lower));
    if (hit) return hit.slice(fragment.length);
  }
  return '';
}
