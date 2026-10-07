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
};

export const GROUP_LABEL: Record<Group, string> = {
  call: "Call this",
  read: "Read the name first",
  station: "Gas station",
  theirs: "Registered to GPM",
};

const LANE_LABEL: Record<string, string> = {
  "Government, school, or hospital": "Town, county, school, or hospital",
  "Fleet or yard": "Private yard",
  Marina: "Dock",
  "Check the name": "The name does not say what this place is",
  "Retail station": "Gas station",
};

export function laneLabel(site: Site): string {
  return LANE_LABEL[site.lane] ?? site.lane;
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
  const old = site.formName ? ` The name on the registration, ${site.formName}, is often someone who has left.` : "";
  return `Find out who at ${site.name} is allowed to ask for a fuel price.${old} Do not guess an email.`;
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
