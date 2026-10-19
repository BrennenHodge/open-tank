import { ACCOUNTS, type Account } from "@/data/accounts";

export type Group = "call" | "read" | "station" | "theirs";

export type Site = {
  id: string;
  name: string;
  county: string;
  city: string;
  address: string;
  zip: string;
  group: Group;
  lane: string;
  tanks: number;
  owner: string;
  ownerPhone: string;
  formName: string;
  person: string;
  job: string;
  email: string;
  phone: string;
  note: string;
  lat: number | null;
  lng: number | null;
  brandOnly: boolean;
};

export type Truck = {
  name: string;
  city: string;
  trucks: number;
  phone: string;
  person?: string;
  job?: string;
  email?: string;
  note?: string;
};

export type PlaceCategory =
  | "town"
  | "school"
  | "county"
  | "hospital"
  | "company"
  | "dock"
  | "road"
  | "airport"
  | "prison"
  | "unknown"
  | "station"
  | "gpm";

export const PLACE_WORD: Record<PlaceCategory, string> = {
  town: "Town",
  school: "School",
  county: "County shop",
  hospital: "Hospital",
  company: "Company tanks",
  dock: "Dock",
  road: "State road shop",
  airport: "Airport",
  prison: "State prison",
  unknown: "Unknown business",
  station: "Gas station",
  gpm: "Registered to GPM",
};

export const PLACE_SENTENCE: Record<PlaceCategory, string> = {
  town: "This is a town.",
  school: "This is a school.",
  county: "This is a county shop.",
  hospital: "This is a hospital.",
  company: "This company keeps fuel here for its own trucks and equipment.",
  dock: "This is a dock.",
  road: "This is a state road shop.",
  airport: "This is an airport.",
  prison: "This is a state prison.",
  unknown: "The name does not say what this place is.",
  station: "This is a gas station.",
  gpm: "This tank is registered to GPM.",
};

/** Filters that used to be one button. Towns is only towns. */
export const SPLIT_FILTERS: PlaceCategory[] = ["town", "school", "county", "hospital", "company", "dock", "road", "airport", "prison"];

/** Retail tanks that already read as gas stations, plus Sheriff's 66 after a page for 1124 Terry Road said so. */
function namedStation(site: Site): boolean {
  if (site.group === "theirs" || site.group === "read") return false;
  if (site.id === "12580") return true;
  if (site.group === "station") return false;
  const name = site.name.toLowerCase();
  const owner = site.owner.toLowerCase();
  return /\bchevron\b|\bshell\b|sprint mart/.test(name) || owner.includes("sunoco");
}

export function placeCategory(site: Site): PlaceCategory | null {
  if (site.group === "theirs") return "gpm";
  if (site.group === "station") return "station";
  if (site.group === "read") return "unknown";
  if (namedStation(site)) return "station";
  if (site.lane === "Marina") return "dock";

  const name = site.name.toLowerCase();
  const owner = site.owner.toLowerCase();
  const blob = `${name} ${owner}`;

  if (/\bmdot\b|department of transportation/.test(blob)) return "road";
  if (/\bairport\b/.test(name)) return "airport";
  if (site.id === "11959") return "prison";
  if (site.lane === "Fleet or yard") return "company";
  if (/hospital|medical center|psychiatric|health center|va medical|rehabilitation|singing river gulfport/.test(blob)) return "hospital";
  if (/school|school district|university|college|attendance center|bus shop|bus garage/.test(blob)) return "school";
  if (/electric|power association|power company|mississippi power|co-op|co op/.test(blob)) return "company";
  if ((/\bcounty\b|board of supervisors/.test(blob)) && !/county line/.test(name)) return "county";
  if (/city of|town of|municipal|city barn|public works/.test(blob)) return "town";
  return null;
}

export function placeWord(site: Site): string {
  if (namedStation(site)) return "Gas station";
  const category = placeCategory(site);
  return category ? PLACE_WORD[category] : "—";
}

/** One sentence. A town, a school, a county, and a hospital are never the same line. */
export function placeLine(site: Site): string {
  if (namedStation(site)) return "This is a gas station.";
  const category = placeCategory(site);
  if (category) return PLACE_SENTENCE[category];
  return "The name does not say what this place is.";
}

export function registrationName(site: Site): string {
  const form = site.formName.trim();
  if (form && form.toLowerCase() !== "none listed") return form;
  return site.name;
}

export function askFor(site: Site): string {
  if (site.group === "theirs" && !site.brandOnly) {
    return "This tank is registered to a GPM company. Confirm they already supply it before anyone calls.";
  }
  if (site.brandOnly) {
    return `The sign is a GPM brand, but the tank is registered to ${site.owner}. Ask whether this is already a customer before calling.`;
  }
  if (site.person) {
    const who = site.email ? `${site.person} (${site.email})` : site.person;
    return `Ask ${who} if they will take a price on fuel for ${site.name}. The state list does not say how much they buy or when the current deal ends.`;
  }
  const registered = site.formName.trim() && site.formName.trim().toLowerCase() !== "none listed" && site.formName.trim() !== site.name
    ? ` The registration also lists ${site.formName.trim()}.`
    : "";
  return `Find out who at ${site.name} is allowed to ask for a fuel price.${registered} Do not guess an email.`;
}

function countyKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

export function bidsForCounty(county: string): Account[] {
  const key = countyKey(county);
  return ACCOUNTS.filter((account) => account.researched && countyKey(account.county) === key);
}

export function trucksForCounty(trucks: Record<string, Truck[]>, county: string): Truck[] {
  if (trucks[county]) return trucks[county];
  const key = countyKey(county);
  const found = Object.keys(trucks).find((name) => countyKey(name) === key);
  return found ? trucks[found] : [];
}
