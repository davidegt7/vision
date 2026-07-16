/**
 * USA birth places for Human Design.
 * State → cities → IANA time zone (offset derived for birth date via Intl).
 */

export interface BirthCity {
  /** City name only, e.g. "Austin" */
  city: string;
  /** Full display: "Austin, TX" */
  label: string;
  /** Two-letter state code */
  state: string;
  aliases: string;
  timeZone: string;
}

export interface UsState {
  code: string;
  name: string;
}

export const US_STATES: UsState[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "Washington DC" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

const ET = "America/New_York";
const CT = "America/Chicago";
const MT = "America/Denver";
const PT = "America/Los_Angeles";
const AZ = "America/Phoenix";
const HI = "Pacific/Honolulu";
const AK = "America/Anchorage";
const IN = "America/Indiana/Indianapolis";
const DET = "America/Detroit";
const BOI = "America/Boise";

function c(
  city: string,
  state: string,
  timeZone: string,
  aliases = "",
): BirthCity {
  return {
    city,
    state,
    timeZone,
    aliases,
    label: `${city}, ${state}`,
  };
}

/** Major USA cities by state (timezone-aware). */
export const BIRTH_CITIES: BirthCity[] = [
  // Alabama
  c("Birmingham", "AL", CT),
  c("Montgomery", "AL", CT),
  c("Mobile", "AL", CT),
  c("Huntsville", "AL", CT),
  // Alaska
  c("Anchorage", "AK", AK),
  c("Fairbanks", "AK", AK),
  c("Juneau", "AK", "America/Juneau"),
  // Arizona (no DST)
  c("Phoenix", "AZ", AZ),
  c("Tucson", "AZ", AZ),
  c("Mesa", "AZ", AZ),
  c("Scottsdale", "AZ", AZ),
  c("Flagstaff", "AZ", AZ),
  // Arkansas
  c("Little Rock", "AR", CT),
  c("Fayetteville", "AR", CT),
  c("Fort Smith", "AR", CT),
  // California
  c("Los Angeles", "CA", PT, "la hollywood"),
  c("San Francisco", "CA", PT, "sf bay"),
  c("San Diego", "CA", PT),
  c("San Jose", "CA", PT),
  c("Sacramento", "CA", PT),
  c("Oakland", "CA", PT),
  c("Fresno", "CA", PT),
  c("Long Beach", "CA", PT),
  c("Bakersfield", "CA", PT),
  c("Anaheim", "CA", PT),
  c("Santa Monica", "CA", PT),
  c("Palo Alto", "CA", PT),
  // Colorado
  c("Denver", "CO", MT),
  c("Colorado Springs", "CO", MT),
  c("Boulder", "CO", MT),
  c("Aurora", "CO", MT),
  c("Fort Collins", "CO", MT),
  // Connecticut
  c("Hartford", "CT", ET),
  c("New Haven", "CT", ET),
  c("Stamford", "CT", ET),
  c("Bridgeport", "CT", ET),
  // Delaware
  c("Wilmington", "DE", ET),
  c("Dover", "DE", ET),
  // DC
  c("Washington", "DC", ET, "dc"),
  // Florida
  c("Miami", "FL", ET),
  c("Orlando", "FL", ET),
  c("Tampa", "FL", ET),
  c("Jacksonville", "FL", ET),
  c("Fort Lauderdale", "FL", ET),
  c("Tallahassee", "FL", ET),
  c("St. Petersburg", "FL", ET),
  c("West Palm Beach", "FL", ET),
  // Georgia
  c("Atlanta", "GA", ET),
  c("Savannah", "GA", ET),
  c("Augusta", "GA", ET),
  c("Athens", "GA", ET),
  // Hawaii
  c("Honolulu", "HI", HI),
  c("Hilo", "HI", HI),
  c("Kailua", "HI", HI),
  // Idaho
  c("Boise", "ID", BOI),
  c("Idaho Falls", "ID", BOI),
  c("Coeur d'Alene", "ID", PT),
  // Illinois
  c("Chicago", "IL", CT),
  c("Springfield", "IL", CT),
  c("Naperville", "IL", CT),
  c("Peoria", "IL", CT),
  c("Rockford", "IL", CT),
  // Indiana
  c("Indianapolis", "IN", IN),
  c("Fort Wayne", "IN", IN),
  c("Evansville", "IN", CT),
  c("South Bend", "IN", IN),
  // Iowa
  c("Des Moines", "IA", CT),
  c("Cedar Rapids", "IA", CT),
  c("Iowa City", "IA", CT),
  // Kansas
  c("Wichita", "KS", CT),
  c("Kansas City", "KS", CT),
  c("Topeka", "KS", CT),
  c("Overland Park", "KS", CT),
  // Kentucky
  c("Louisville", "KY", "America/Kentucky/Louisville"),
  c("Lexington", "KY", "America/New_York"),
  c("Bowling Green", "KY", CT),
  // Louisiana
  c("New Orleans", "LA", CT),
  c("Baton Rouge", "LA", CT),
  c("Shreveport", "LA", CT),
  c("Lafayette", "LA", CT),
  // Maine
  c("Portland", "ME", ET),
  c("Augusta", "ME", ET),
  c("Bangor", "ME", ET),
  // Maryland
  c("Baltimore", "MD", ET),
  c("Annapolis", "MD", ET),
  c("Rockville", "MD", ET),
  c("Bethesda", "MD", ET),
  // Massachusetts
  c("Boston", "MA", ET),
  c("Cambridge", "MA", ET),
  c("Worcester", "MA", ET),
  c("Springfield", "MA", ET),
  c("Salem", "MA", ET),
  // Michigan
  c("Detroit", "MI", DET),
  c("Grand Rapids", "MI", DET),
  c("Ann Arbor", "MI", DET),
  c("Lansing", "MI", DET),
  // Minnesota
  c("Minneapolis", "MN", CT),
  c("Saint Paul", "MN", CT, "st paul"),
  c("Rochester", "MN", CT),
  c("Duluth", "MN", CT),
  // Mississippi
  c("Jackson", "MS", CT),
  c("Gulfport", "MS", CT),
  c("Biloxi", "MS", CT),
  // Missouri
  c("Kansas City", "MO", CT),
  c("St. Louis", "MO", CT, "saint louis"),
  c("Springfield", "MO", CT),
  c("Columbia", "MO", CT),
  // Montana
  c("Billings", "MT", MT),
  c("Missoula", "MT", MT),
  c("Bozeman", "MT", MT),
  c("Helena", "MT", MT),
  // Nebraska
  c("Omaha", "NE", CT),
  c("Lincoln", "NE", CT),
  // Nevada
  c("Las Vegas", "NV", PT),
  c("Reno", "NV", PT),
  c("Henderson", "NV", PT),
  c("Carson City", "NV", PT),
  // New Hampshire
  c("Manchester", "NH", ET),
  c("Nashua", "NH", ET),
  c("Concord", "NH", ET),
  // New Jersey
  c("Newark", "NJ", ET),
  c("Jersey City", "NJ", ET),
  c("Trenton", "NJ", ET),
  c("Princeton", "NJ", ET),
  c("Atlantic City", "NJ", ET),
  // New Mexico
  c("Albuquerque", "NM", MT),
  c("Santa Fe", "NM", MT),
  c("Las Cruces", "NM", MT),
  // New York
  c("New York", "NY", ET, "nyc manhattan brooklyn queens"),
  c("Buffalo", "NY", ET),
  c("Rochester", "NY", ET),
  c("Albany", "NY", ET),
  c("Syracuse", "NY", ET),
  c("Yonkers", "NY", ET),
  // North Carolina
  c("Charlotte", "NC", ET),
  c("Raleigh", "NC", ET),
  c("Durham", "NC", ET),
  c("Asheville", "NC", ET),
  c("Wilmington", "NC", ET),
  c("Greensboro", "NC", ET),
  // North Dakota
  c("Fargo", "ND", CT),
  c("Bismarck", "ND", CT),
  c("Grand Forks", "ND", CT),
  // Ohio
  c("Columbus", "OH", ET),
  c("Cleveland", "OH", ET),
  c("Cincinnati", "OH", ET),
  c("Toledo", "OH", ET),
  c("Akron", "OH", ET),
  // Oklahoma
  c("Oklahoma City", "OK", CT),
  c("Tulsa", "OK", CT),
  c("Norman", "OK", CT),
  // Oregon
  c("Portland", "OR", PT),
  c("Salem", "OR", PT),
  c("Eugene", "OR", PT),
  c("Bend", "OR", PT),
  // Pennsylvania
  c("Philadelphia", "PA", ET, "philly"),
  c("Pittsburgh", "PA", ET),
  c("Harrisburg", "PA", ET),
  c("Allentown", "PA", ET),
  c("Erie", "PA", ET),
  // Rhode Island
  c("Providence", "RI", ET),
  c("Newport", "RI", ET),
  // South Carolina
  c("Charleston", "SC", ET),
  c("Columbia", "SC", ET),
  c("Greenville", "SC", ET),
  c("Myrtle Beach", "SC", ET),
  // South Dakota
  c("Sioux Falls", "SD", CT),
  c("Rapid City", "SD", MT),
  c("Pierre", "SD", CT),
  // Tennessee
  c("Nashville", "TN", CT),
  c("Memphis", "TN", CT),
  c("Knoxville", "TN", ET),
  c("Chattanooga", "TN", ET),
  // Texas
  c("Houston", "TX", CT),
  c("Dallas", "TX", CT),
  c("Austin", "TX", CT),
  c("San Antonio", "TX", CT),
  c("Fort Worth", "TX", CT),
  c("El Paso", "TX", MT),
  c("Plano", "TX", CT),
  c("Arlington", "TX", CT),
  // Utah
  c("Salt Lake City", "UT", MT),
  c("Provo", "UT", MT),
  c("Park City", "UT", MT),
  c("Ogden", "UT", MT),
  // Vermont
  c("Burlington", "VT", ET),
  c("Montpelier", "VT", ET),
  // Virginia
  c("Richmond", "VA", ET),
  c("Virginia Beach", "VA", ET),
  c("Norfolk", "VA", ET),
  c("Arlington", "VA", ET),
  c("Charlottesville", "VA", ET),
  c("Alexandria", "VA", ET),
  // Washington
  c("Seattle", "WA", PT),
  c("Spokane", "WA", PT),
  c("Tacoma", "WA", PT),
  c("Bellevue", "WA", PT),
  c("Olympia", "WA", PT),
  // West Virginia
  c("Charleston", "WV", ET),
  c("Morgantown", "WV", ET),
  c("Huntington", "WV", ET),
  // Wisconsin
  c("Milwaukee", "WI", CT),
  c("Madison", "WI", CT),
  c("Green Bay", "WI", CT),
  // Wyoming
  c("Cheyenne", "WY", MT),
  c("Jackson", "WY", MT),
  c("Casper", "WY", MT),
];

export function citiesInState(stateCode: string): BirthCity[] {
  const code = stateCode.toUpperCase();
  return BIRTH_CITIES.filter((c) => c.state === code).sort((a, b) =>
    a.city.localeCompare(b.city),
  );
}

export function stateName(code: string): string {
  return US_STATES.find((s) => s.code === code)?.name || code;
}

export function searchBirthCities(
  query: string,
  limit = 12,
  stateCode?: string,
): BirthCity[] {
  const pool = stateCode ? citiesInState(stateCode) : BIRTH_CITIES;
  const q = query.trim().toLowerCase();
  if (!q) return pool.slice(0, limit);
  const scored = pool.map((city) => {
    const hay =
      `${city.city} ${city.label} ${city.state} ${city.aliases} ${city.timeZone}`.toLowerCase();
    let score = 0;
    if (city.city.toLowerCase().startsWith(q)) score += 100;
    else if (city.label.toLowerCase().startsWith(q)) score += 80;
    else if (city.city.toLowerCase().includes(q)) score += 50;
    else if (hay.includes(q)) score += 20;
    return { city, score };
  })
    .filter((x) => x.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.city.city.localeCompare(b.city.city),
    );
  return scored.slice(0, limit).map((x) => x.city);
}

export function findCityByLabel(label: string): BirthCity | undefined {
  const n = label.trim().toLowerCase();
  return (
    BIRTH_CITIES.find((c) => c.label.toLowerCase() === n) ||
    BIRTH_CITIES.find(
      (c) =>
        c.label.toLowerCase() === n ||
        `${c.city}, ${c.state}`.toLowerCase() === n ||
        // legacy "New York, USA" style
        `${c.city}, usa`.toLowerCase() === n,
    )
  );
}

export function findCity(state: string, cityName: string): BirthCity | undefined {
  const s = state.toUpperCase();
  const n = cityName.trim().toLowerCase();
  return citiesInState(s).find(
    (c) => c.city.toLowerCase() === n || c.label.toLowerCase() === n,
  );
}

/**
 * Minutes east of UTC for `timeZone` at the given UTC instant.
 */
export function offsetMinutesAt(timeZone: string, utcDate: Date): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const parts = dtf.formatToParts(utcDate);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === type)?.value ?? "0");
    const asIfUtc = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    );
    return Math.round((asIfUtc - utcDate.getTime()) / 60_000);
  } catch {
    return -new Date().getTimezoneOffset();
  }
}

export function birthOffsetMinutes(
  timeZone: string,
  birthDate: string,
  birthTime = "12:00",
): number {
  const [y, m, d] = birthDate.split("-").map(Number);
  const [hh, mm] = (birthTime || "12:00").split(":").map(Number);
  if (!y || !m || !d) return -new Date().getTimezoneOffset();

  const localAsUtc = Date.UTC(y, m - 1, d, hh || 0, mm || 0, 0);
  let guess = localAsUtc;
  for (let i = 0; i < 4; i++) {
    const off = offsetMinutesAt(timeZone, new Date(guess));
    guess = localAsUtc - off * 60_000;
  }
  return offsetMinutesAt(timeZone, new Date(guess));
}

export function formatUtcOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "−";
  const abs = Math.abs(offsetMinutes);
  const h = Math.floor(abs / 60);
  const min = abs % 60;
  return min === 0
    ? `UTC${sign}${h}`
    : `UTC${sign}${h}:${String(min).padStart(2, "0")}`;
}
