export type Kind = "County" | "School" | "City" | "Hospital" | "Other";
export type Product = "Bulk tank" | "Fuel card" | "Emergency";
export type BidStatus =
  | "No bid posted"
  | "Closed"
  | "Locked"
  | "Skip"
  | "State contract"
  | "Monthly quotes"
  | "Fuel card";
export type Region = "Pine Belt" | "Coast" | "Central" | "Delta" | "North";

export type Account = {
  id: string;
  name: string;
  kind: Kind;
  county: string;
  region: Region;
  place: string;
  buyer: string;
  product: Product;
  bidStatus: BidStatus;
  how: string;
  next: string;
  ask: string;
  /** Named only when a minutes page, contract, or news story names the supplier. */
  record?: string;
  priority: 1 | 2 | 3;
  lat: number;
  lng: number;
  researched: boolean;
};

const STANDARD_HOW =
  "Over $5,000 they need two written prices. If they cannot get two, they must advertise. The usual deal is the terminal price plus a delivery fee, not a fixed price for the year.";

const STANDARD_ASK =
  "Who fills the road-department tank, when does that deal end, and did you take two written prices or advertise?";

type Row = [
  name: string,
  place: string,
  region: Region,
  lat: number,
  lng: number,
  priority: 1 | 2 | 3,
  next?: string,
];

const COUNTIES: Row[] = [
  ["Adams", "Natchez", "Central", 31.56, -91.4, 3],
  ["Alcorn", "Corinth", "North", 34.93, -88.52, 3],
  ["Amite", "Liberty", "Central", 31.16, -90.8, 3],
  ["Attala", "Kosciusko", "Central", 33.06, -89.59, 3],
  ["Benton", "Ashland", "North", 34.83, -89.18, 3],
  ["Bolivar", "Cleveland", "Delta", 33.74, -90.73, 3],
  ["Calhoun", "Pittsboro", "North", 33.94, -89.34, 3],
  ["Carroll", "Carrollton", "Delta", 33.51, -89.92, 3],
  ["Chickasaw", "Houston", "North", 33.9, -89.0, 3],
  ["Choctaw", "Ackerman", "North", 33.31, -89.17, 3],
  ["Claiborne", "Port Gibson", "Central", 31.96, -90.98, 3],
  ["Clarke", "Quitman", "Central", 32.04, -88.73, 3],
  ["Clay", "West Point", "North", 33.61, -88.65, 3],
  ["Coahoma", "Clarksdale", "Delta", 34.2, -90.57, 3],
  ["Copiah", "Hazlehurst", "Central", 31.86, -90.39, 3],
  ["Covington", "Collins", "Pine Belt", 31.64, -89.56, 2, "First Monday at 10:00 a.m. in Collins. October 5 is the next first Monday."],
  ["DeSoto", "Hernando", "North", 34.82, -89.99, 2],
  ["Forrest", "Hattiesburg", "Pine Belt", 31.33, -89.29, 1, "No fuel bid and no October meeting posted. Call the road office. Budget year started October 1."],
  ["Franklin", "Meadville", "Central", 31.47, -90.89, 3],
  ["George", "Lucedale", "Coast", 30.92, -88.59, 2],
  ["Greene", "Leakesville", "Pine Belt", 31.15, -88.55, 2],
  ["Grenada", "Grenada", "North", 33.77, -89.81, 3],
  ["Hancock", "Bay St. Louis", "Coast", 30.31, -89.33, 1, "October 5 there is a 10:00 a.m. hearing at 854 Highway 90. The port fuel deal is separate and already running for 2026."],
  ["Harrison", "Gulfport", "Coast", 30.37, -89.09, 1, "Board meets October 5 in Gulfport and October 12 in Biloxi. They have bid fuel as a yearly contract before. Nothing is open now."],
  ["Hinds", "Jackson", "Central", 32.3, -90.18, 2, "Regular meeting October 5 at the Chancery Court building. No fuel item posted."],
  ["Holmes", "Lexington", "Delta", 33.12, -90.05, 3],
  ["Humphreys", "Belzoni", "Delta", 33.18, -90.49, 3],
  ["Issaquena", "Mayersville", "Delta", 32.9, -91.05, 3],
  ["Itawamba", "Fulton", "North", 34.27, -88.4, 3],
  ["Jackson", "Pascagoula", "Coast", 30.37, -88.56, 1, "Board meets October 5, 9:00 a.m., 2915 Canty Street. Agenda is posted the Thursday or Friday before."],
  ["Jasper", "Bay Springs", "Pine Belt", 31.98, -89.28, 2],
  ["Jefferson", "Fayette", "Central", 31.71, -91.07, 3],
  ["Jefferson Davis", "Prentiss", "Pine Belt", 31.6, -89.87, 2],
  ["Jones", "Laurel", "Pine Belt", 31.69, -89.13, 2, "Listed for October 5. Even months meet at the Laurel courthouse, usually 9:30 a.m."],
  ["Kemper", "De Kalb", "Central", 32.77, -88.65, 3],
  ["Lafayette", "Oxford", "North", 34.37, -89.52, 3],
  ["Lamar", "Purvis", "Pine Belt", 31.14, -89.41, 1, "Met September 24. Next meeting October 5, then October 22, 9:00 a.m. pattern. No fuel bid on the last posted agenda."],
  ["Lauderdale", "Meridian", "Central", 32.36, -88.7, 2, "Road department said one week of fuel ran about $6,000 over last year while diesel was high. Budget year started October 1."],
  ["Lawrence", "Monticello", "Central", 31.55, -90.11, 3],
  ["Leake", "Carthage", "Central", 32.74, -89.53, 3],
  ["Lee", "Tupelo", "North", 34.26, -88.7, 2, "Board listed for October 5 at 9:00 a.m. No agenda posted."],
  ["Leflore", "Greenwood", "Delta", 33.52, -90.18, 3],
  ["Lincoln", "Brookhaven", "Central", 31.58, -90.44, 3, "Standing rule is first and third Monday, 9:00 a.m. October 5 is not confirmed on a 2026 calendar."],
  ["Lowndes", "Columbus", "North", 33.5, -88.43, 2, "Often the first Monday at 9:00 a.m. October 5 is not on a posted calendar yet."],
  ["Madison", "Canton", "Central", 32.61, -90.02, 2, "Meets September 30 at 9:00 a.m. The September 21 agenda had no fuel item."],
  ["Marion", "Columbia", "Pine Belt", 31.25, -89.83, 2],
  ["Marshall", "Holly Springs", "North", 34.77, -89.45, 3],
  ["Monroe", "Aberdeen", "North", 33.83, -88.54, 3],
  ["Montgomery", "Winona", "North", 33.49, -89.73, 3],
  ["Neshoba", "Philadelphia", "Central", 32.77, -89.11, 3],
  ["Newton", "Decatur", "Central", 32.44, -89.11, 3],
  ["Noxubee", "Macon", "Central", 33.1, -88.56, 3],
  ["Oktibbeha", "Starkville", "North", 33.45, -88.82, 3],
  ["Panola", "Batesville", "North", 34.31, -89.94, 3],
  ["Pearl River", "Poplarville", "Pine Belt", 30.84, -89.52, 1, "October 5, 9:00 a.m., 109 W Pearl Street. They already met September 21. Next after that is October 21."],
  ["Perry", "New Augusta", "Pine Belt", 31.2, -89.05, 2],
  ["Pike", "McComb", "Central", 31.24, -90.45, 2],
  ["Pontotoc", "Pontotoc", "North", 34.25, -89.01, 3],
  ["Prentiss", "Booneville", "North", 34.66, -88.56, 3],
  ["Quitman", "Marks", "Delta", 34.25, -90.27, 3],
  ["Rankin", "Brandon", "Central", 32.27, -89.99, 2, "Meets September 30 and October 5, 9:00 a.m., Courthouse Annex, 211 E Government Street. No agenda attached."],
  ["Scott", "Forest", "Central", 32.36, -89.47, 3],
  ["Sharkey", "Rolling Fork", "Delta", 32.91, -90.88, 3],
  ["Simpson", "Mendenhall", "Central", 31.96, -89.87, 3],
  ["Smith", "Raleigh", "Pine Belt", 32.03, -89.52, 2],
  ["Stone", "Wiggins", "Coast", 30.86, -89.14, 2, "They bid bulk unleaded, on-road diesel, and off-road diesel as a yearly package. The last public one found was for 2024."],
  ["Sunflower", "Indianola", "Delta", 33.45, -90.65, 3],
  ["Tallahatchie", "Charleston", "Delta", 34.0, -90.05, 3],
  ["Tate", "Senatobia", "North", 34.62, -89.97, 3],
  ["Tippah", "Ripley", "North", 34.73, -88.95, 3],
  ["Tishomingo", "Iuka", "North", 34.81, -88.19, 3],
  ["Tunica", "Tunica", "Delta", 34.68, -90.38, 3],
  ["Union", "New Albany", "North", 34.49, -89.01, 3],
  ["Walthall", "Tylertown", "Pine Belt", 31.12, -90.14, 2],
  ["Warren", "Vicksburg", "Central", 32.35, -90.88, 2, "Met September 21. Agenda had road payroll and claims, no fuel bid. Next date was not posted."],
  ["Washington", "Greenville", "Delta", 33.41, -91.05, 3],
  ["Wayne", "Waynesboro", "Pine Belt", 31.67, -88.64, 2],
  ["Webster", "Walthall", "North", 33.34, -89.29, 3],
  ["Wilkinson", "Woodville", "Central", 31.1, -91.3, 3],
  ["Winston", "Louisville", "Central", 33.12, -89.05, 3],
  ["Yalobusha", "Water Valley", "North", 34.15, -89.63, 3],
  ["Yazoo", "Yazoo City", "Delta", 32.86, -90.41, 3],
];

function countyAccount(row: Row): Account {
  const [name, place, region, lat, lng, priority, next] = row;
  const id = `county-${name.toLowerCase().replace(/\s+/g, "-")}`;
  let bidStatus: BidStatus = "No bid posted";
  let how = STANDARD_HOW;
  let nextLine = next ?? "No fuel bid on the state purchasing site. Call the road manager before you drive.";
  let researched = Boolean(next);
  let product: Account["product"] = "Bulk tank";

  if (name === "DeSoto") {
    bidStatus = "Closed";
    nextLine =
      "They bid again. File 26-300-013 closed April 8, 2026, and the April 20 agenda had an award recommendation. The minutes do not name the 2026 winner in a form I could read. Use the 2025 award as the last named deal and ask who won the new one.";
    researched = true;
    how =
      "The road department takes a term bid for regular gasoline and diesel. They also give drivers a Fuelman card. In 2025 the board was told the shop tank was cheaper than the card.";
  }
  if (name === "Harrison") {
    bidStatus = "Monthly quotes";
    nextLine =
      "October 5 board meeting is in Gulfport. Do not wait for one big annual fuel ad. Ask purchasing for last month's low-quote sheet.";
    researched = true;
    how =
      "They spread a monthly list of low quotes for fuel on the board minutes. The December 9, 2024 minutes include the November 2024 fuel low quotes. The vendor names sit in that attachment, not in the motion.";
  }
  if (name === "Madison") {
    bidStatus = "Fuel card";
    product = "Fuel card";
    nextLine =
      "They meet September 30. The fight is about the card bill, not a tank bid. Ask whether the bill is being paid and which stations county vehicles may use.";
    researched = true;
    how =
      "County vehicles fuel with a Fuelman card. The card company on the claims docket is Fleetcor. The January 2, 2026 docket showed $82,366.73 owed. Supervisors stopped payment until they got a list of stations tied to the board president's employer, Victory Marketing and Morris Petroleum.";
  }
  if (name === "Franklin") {
    nextLine =
      "They advertised petroleum products for calendar 2026. The notice is motor oil, grease, and asphalt, not a clear gasoline and diesel delivery award. No winner was posted.";
    researched = true;
  }

  return {
    id,
    name: `${name} County`,
    kind: "County",
    county: name,
    region,
    place,
    buyer: "Road manager, then the Board of Supervisors",
    product,
    bidStatus,
    how,
    next: nextLine,
    ask: STANDARD_ASK,
    record:
      name === "DeSoto"
        ? "April 7, 2025 minutes, bid 25-300-007. Shop tank: Tartan Oil (the minutes also spell it Tarton), lowest bid, and it was under the rack price so they called to confirm. Alternates at the shop: FastStop Petroleum and CR Fuel. Satellite sites: CR Fuel, with FastStop as the alternate."
        : name === "Madison"
          ? "January 2026 claims and news. Fuelman card through Fleetcor. $82,366.73 on the January 2 docket. Not a bulk-delivery award. Board president Gerald Steen works for Victory Marketing and Morris Petroleum, which own stations where the card can be used."
          : undefined,
    priority,
    lat,
    lng,
    researched,
  };
}

const SPECIALS: Account[] = [
  {
    id: "school-lamar",
    name: "Lamar County Schools",
    kind: "School",
    county: "Lamar",
    region: "Pine Belt",
    place: "Purvis",
    buyer: "Transportation director",
    product: "Bulk tank",
    bidStatus: "No bid posted",
    how: "School buses are a separate bid from the county road department. Most districts lock a year that starts July 1.",
    next: "No 2026 fuel bid found. That usually means two quiet quotes, or a deal that rolled. Call before the March 2027 wave.",
    ask: "Who delivers diesel to the bus shop, and what date does that year end?",
    priority: 1,
    lat: 31.16,
    lng: -89.45,
    researched: true,
  },
  {
    id: "school-hattiesburg",
    name: "Hattiesburg Public Schools",
    kind: "School",
    county: "Forrest",
    region: "Pine Belt",
    place: "Hattiesburg",
    buyer: "Transportation director",
    product: "Bulk tank",
    bidStatus: "No bid posted",
    how: "City school buses, not the county road tank and not the city transit buses.",
    next: "No 2026 fuel bid found. Call the transportation office.",
    ask: "Who fills the bus tanks, and is that deal up before July 2027?",
    priority: 1,
    lat: 31.3,
    lng: -89.32,
    researched: true,
  },
  {
    id: "school-forrest",
    name: "Forrest County Schools",
    kind: "School",
    county: "Forrest",
    region: "Pine Belt",
    place: "Hattiesburg",
    buyer: "Transportation director",
    product: "Bulk tank",
    bidStatus: "No bid posted",
    how: "Separate from Hattiesburg city schools and from the county road department.",
    next: "No 2026 fuel bid found.",
    ask: "Who delivers to the bus shop, and when does the year end?",
    priority: 1,
    lat: 31.28,
    lng: -89.36,
    researched: true,
  },
  {
    id: "school-petal",
    name: "Petal Schools",
    kind: "School",
    county: "Forrest",
    region: "Pine Belt",
    place: "Petal",
    buyer: "Transportation director",
    product: "Bulk tank",
    bidStatus: "No bid posted",
    how: "Smaller bus fleet. Still a July-to-June contract if they bid it.",
    next: "No 2026 fuel bid found.",
    ask: "Do you take delivery at a shop tank, or do drivers fuel at a station?",
    priority: 1,
    lat: 31.35,
    lng: -89.26,
    researched: true,
  },
  {
    id: "school-picayune",
    name: "Picayune Schools",
    kind: "School",
    county: "Pearl River",
    region: "Pine Belt",
    place: "Picayune",
    buyer: "Transportation director",
    product: "Bulk tank",
    bidStatus: "No bid posted",
    how: "School bid, not the Pearl River County road contract.",
    next: "No 2026 fuel bid found. Pair the call with the October 5 county meeting in Poplarville.",
    ask: "Who has the bus-fuel contract, and when does it end?",
    priority: 1,
    lat: 30.53,
    lng: -89.68,
    researched: true,
  },
  {
    id: "school-poplarville",
    name: "Poplarville Schools",
    kind: "School",
    county: "Pearl River",
    region: "Pine Belt",
    place: "Poplarville",
    buyer: "Transportation director",
    product: "Bulk tank",
    bidStatus: "No bid posted",
    how: "Separate from the county supervisors.",
    next: "No 2026 fuel bid found.",
    ask: "Who delivers diesel for the buses, and what month do you bid?",
    priority: 2,
    lat: 30.84,
    lng: -89.53,
    researched: true,
  },
  {
    id: "school-marion",
    name: "Marion County Schools",
    kind: "School",
    county: "Marion",
    region: "Pine Belt",
    place: "Columbia",
    buyer: "Superintendent's office",
    product: "Bulk tank",
    bidStatus: "Closed",
    how: "They bid non-ethanol gasoline and diesel. Posted May 4, 2026, due May 6. Awarded for the school year.",
    next: "Park it until spring 2027. The notice was only open two days.",
    ask: "Are you the current supplier? If not, ask when they bid again. Do not rebid a closed year.",
    priority: 2,
    lat: 31.25,
    lng: -89.83,
    researched: true,
  },
  {
    id: "school-mccomb",
    name: "McComb Schools",
    kind: "School",
    county: "Pike",
    region: "Central",
    place: "McComb",
    buyer: "Transportation department",
    product: "Bulk tank",
    bidStatus: "Locked",
    how: "Supply, delivery, and tanks on site. Gasoline and diesel. They did not want E10.",
    next: "Contract runs August 1, 2026 through July 31, 2029. Do not chase it.",
    ask: "Only ask if they can cancel. Otherwise park it.",
    priority: 3,
    lat: 31.24,
    lng: -90.45,
    researched: true,
  },
  {
    id: "school-pascagoula",
    name: "Pascagoula-Gautier Schools",
    kind: "School",
    county: "Jackson",
    region: "Coast",
    place: "Pascagoula",
    buyer: "Purchasing",
    product: "Bulk tank",
    bidStatus: "Closed",
    how: "They bid the delivery fee on diesel, not a fixed fuel price.",
    next: "Bid closed May 13, 2026. Next shot is spring 2027 unless the year is shorter.",
    ask: "Who won the diesel fee, and does it renew without a new bid?",
    priority: 2,
    lat: 30.36,
    lng: -88.56,
    researched: true,
  },
  {
    id: "school-union",
    name: "Union County Schools",
    kind: "School",
    county: "Union",
    region: "North",
    place: "New Albany",
    buyer: "County superintendent",
    product: "Bulk tank",
    bidStatus: "Closed",
    how: "Gasoline and diesel for the 2026–27 school year.",
    next: "Due April 24, 2026. Closed. Revisit March 2027.",
    ask: "Park unless you already hold it.",
    priority: 3,
    lat: 34.49,
    lng: -89.0,
    researched: true,
  },
  {
    id: "school-spanola",
    name: "South Panola Schools",
    kind: "School",
    county: "Panola",
    region: "North",
    place: "Batesville",
    buyer: "Central office",
    product: "Bulk tank",
    bidStatus: "Closed",
    how: "Diesel only on the notices found. They ran bids due June 15 and July 20, 2026.",
    next: "Closed. Next wave is summer 2027.",
    ask: "Park it.",
    priority: 3,
    lat: 34.31,
    lng: -89.94,
    researched: true,
  },
  {
    id: "school-tishomingo",
    name: "Tishomingo County Schools",
    kind: "School",
    county: "Tishomingo",
    region: "North",
    place: "Iuka",
    buyer: "Board of trustees",
    product: "Bulk tank",
    bidStatus: "Closed",
    how: "Yearly gasoline and diesel for the school year.",
    next: "The 2025–26 bid is closed. Watch spring for the next school year.",
    ask: "When do you advertise next year's fuel?",
    priority: 3,
    lat: 34.81,
    lng: -88.19,
    researched: true,
  },
  {
    id: "school-jps",
    name: "Jackson Public Schools",
    kind: "School",
    county: "Hinds",
    region: "Central",
    place: "Jackson",
    buyer: "Transportation department",
    product: "Bulk tank",
    bidStatus: "No bid posted",
    how: "About 246 buses. Part of the fleet is moving to electric. Diesel gallons shrink. They do not go away this year.",
    next: "No open fuel bid. Worth one call, not a weekly drive.",
    ask: "How much diesel is still going through the shop tank this year?",
    priority: 2,
    lat: 32.3,
    lng: -90.19,
    researched: true,
  },
  {
    id: "city-ocean-springs",
    name: "Ocean Springs",
    kind: "City",
    county: "Jackson",
    region: "Coast",
    place: "Ocean Springs",
    buyer: "City Hall purchasing",
    product: "Bulk tank",
    bidStatus: "Closed",
    how: "They bid fuel supply services every year around September.",
    next: "Due September 11, 2026. Closed. If it is a one-year deal, the next notice is about August 2027.",
    ask: "Who won, and is it one year or does it renew?",
    priority: 2,
    lat: 30.41,
    lng: -88.83,
    researched: true,
  },
  {
    id: "city-gulfport",
    name: "Gulfport",
    kind: "City",
    county: "Harrison",
    region: "Coast",
    place: "Gulfport",
    buyer: "Office of Procurement",
    product: "Bulk tank",
    bidStatus: "Closed",
    how: "Fuel supply services. They have bid this before on a city contract.",
    next: "Spring 2026 bid is closed. Ask the end date before you write a quote.",
    ask: "When does the current fuel-supply contract end?",
    priority: 2,
    lat: 30.37,
    lng: -89.09,
    researched: true,
  },
  {
    id: "city-hattiesburg-transit",
    name: "Hattiesburg city buses",
    kind: "City",
    county: "Forrest",
    region: "Pine Belt",
    place: "Hattiesburg",
    buyer: "Hub City Transit",
    product: "Bulk tank",
    bidStatus: "Skip",
    how: "The city took $6.45 million to replace these buses with propane buses.",
    next: "Do not sell diesel for the transit buses. Police, fire, and public works still burn gasoline and diesel. That is a different buyer.",
    ask: "Skip transit. Ask public works who fuels the trucks.",
    priority: 3,
    lat: 31.33,
    lng: -89.29,
    researched: true,
  },
  {
    id: "hospital-forrest",
    name: "Forrest Health",
    kind: "Hospital",
    county: "Forrest",
    region: "Pine Belt",
    place: "Hattiesburg",
    buyer: "Purchasing",
    product: "Bulk tank",
    bidStatus: "Closed",
    how: "They scored vendors on the markup over the terminal price. Estimated about 8,000 gallons dyed diesel, 600 highway diesel, and 2,000 unleaded.",
    next: "Base year was July 2025 through June 2026, with two optional years. Small. Call once.",
    ask: "Did you extend, or are you bidding again?",
    priority: 3,
    lat: 31.32,
    lng: -89.33,
    researched: true,
  },
  {
    id: "port-hancock",
    name: "Hancock County Port",
    kind: "Other",
    county: "Hancock",
    region: "Coast",
    place: "Kiln",
    buyer: "Port and Harbor Commission",
    product: "Bulk tank",
    bidStatus: "Closed",
    how: "Unleaded, off-road diesel, and on-road diesel. Tanks of 1,000, 12,000, and 560 gallons at the fuel farm in Bay St. Louis. Price is the OPIS five-day average plus the bid fee, adjusted every week.",
    next: "Runs calendar 2026, with two optional extra years. Renewal talk is late this year.",
    ask: "Are you renewing for 2027, or bidding again?",
    priority: 1,
    lat: 30.4,
    lng: -89.45,
    researched: true,
  },
  {
    id: "state-cards",
    name: "State agency fuel cards",
    kind: "Other",
    county: "Hinds",
    region: "Central",
    place: "Jackson",
    buyer: "Department of Finance and Administration",
    product: "Fuel card",
    bidStatus: "State contract",
    how: "State agencies use a fuel-card contract, not a local delivery quote. Public page shows Corpay, contract 8200070285, dated through August 31, 2026.",
    next: "That end date has passed and no replacement was posted. Madison County is already buying on a Fuelman card billed to Fleetcor, which is the same card business. Counties are not required to use the state contract.",
    ask: "Are your vehicles on the state card, or do you have your own tank?",
    record:
      "State contract 8200070285, Corpay, posted dates September 1, 2023 through August 31, 2026. A July 2023 site list for the state Fuelman card includes stations such as Clark Oil and Waring Oil on the coast. That list is where a card works. It is not a county award.",
    priority: 3,
    lat: 32.3,
    lng: -90.18,
    researched: true,
  },
  {
    id: "state-emergency",
    name: "State emergency fuel",
    kind: "Other",
    county: "Hinds",
    region: "Central",
    place: "Jackson",
    buyer: "State purchasing",
    product: "Emergency",
    bidStatus: "State contract",
    how: "Emergency and outage fuel. Not the weekly tank fill.",
    next: "Contract 8200060900 is active from February 1, 2022 through January 31, 2027. Specialty Fuel Services, Kosciusko, with Gresham Petroleum in Indianola as the distributor.",
    ask: "Only raise this if they ask who covers a storm. Otherwise stay on the tank.",
    record:
      "Statewide emergency-fuel contract is Gresham's Specialty Fuel Services through January 31, 2027. Separate from that, Gresham also holds a federal Defense Logistics Agency fuel contract dated January 1, 2026 through November 30, 2028, covering Mississippi among other states.",
    priority: 3,
    lat: 32.32,
    lng: -90.16,
    researched: true,
  },
];

export const ACCOUNTS: Account[] = [...COUNTIES.map(countyAccount), ...SPECIALS];

export const REGIONS: Region[] = ["Pine Belt", "Coast", "Central", "Delta", "North"];
export const KINDS: Kind[] = ["County", "School", "City", "Hospital", "Other"];
export const STATUSES: BidStatus[] = [
  "No bid posted",
  "Closed",
  "Locked",
  "Skip",
  "State contract",
  "Monthly quotes",
  "Fuel card",
];

export const NAMED = ACCOUNTS.filter((account) => account.record);
