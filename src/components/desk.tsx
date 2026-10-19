import { useEffect, useMemo, useState } from "react";
import { MapPin, Phone, Search } from "lucide-react";
import { ACCOUNTS, type Account } from "@/data/accounts";
import {
  SPLIT_FILTERS,
  askFor,
  bidsForCounty,
  placeCategory,
  placeLine,
  placeWord,
  registrationName,
  trucksForCounty,
  type PlaceCategory,
  type Site,
  type Truck,
} from "@/data/sites";
import { noteOf, oursOf, quoteMail, usePipeline } from "@/lib/pipeline";
import { TankMap } from "@/components/tank-map";

type View = "overview" | "map" | "places" | "trucks" | "bids";
type Dir = "asc" | "desc";
type ColumnSort = { key: string; dir: Dir };

const NAV: { id: View; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "map", label: "Map" },
  { id: "places", label: "Places" },
  { id: "trucks", label: "Trucking" },
  { id: "bids", label: "Bids" },
];

const FLEET_TRUST = 2000;
const PAGE_LIMIT = 80;

export function Desk() {
  const [view, setView] = useState<View>("overview");
  const [sites, setSites] = useState<Site[] | null>(null);
  const [trucks, setTrucks] = useState<Record<string, Truck[]> | null>(null);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState<Record<PlaceCategory, boolean>>({
    town: true,
    school: true,
    county: true,
    hospital: true,
    company: true,
    dock: true,
    road: true,
    airport: true,
    prison: true,
    unknown: true,
    station: false,
    gpm: false,
  });
  const [showOurs, setShowOurs] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [truckKey, setTruckKey] = useState<string | null>(null);
  const [bidId, setBidId] = useState("county-lamar");
  const [placeSort, setPlaceSort] = useState<ColumnSort>({ key: "name", dir: "asc" });
  const [truckSort, setTruckSort] = useState<ColumnSort>({ key: "trucks", dir: "desc" });
  const [bidSort, setBidSort] = useState<ColumnSort>({ key: "name", dir: "asc" });
  const [copied, setCopied] = useState(false);
  const rows = usePipeline((state) => state.rows);
  const setNote = usePipeline((state) => state.setNote);
  const setOurs = usePipeline((state) => state.setOurs);

  useEffect(() => {
    let live = true;
    void Promise.all([import("@/data/tanks.json"), import("@/data/trucks.json")]).then(([tankFile, truckFile]) => {
      if (!live) return;
      setSites(tankFile.default as Site[]);
      setTrucks(truckFile.default as Record<string, Truck[]>);
    });
    return () => {
      live = false;
    };
  }, []);

  const counts = useMemo(() => {
    const tally: Record<PlaceCategory, number> = {
      town: 0,
      school: 0,
      county: 0,
      hospital: 0,
      company: 0,
      dock: 0,
      road: 0,
      airport: 0,
      prison: 0,
      unknown: 0,
      station: 0,
      gpm: 0,
    };
    for (const site of sites ?? []) {
      const category = placeCategory(site);
      if (category) tally[category] += 1;
    }
    return tally;
  }, [sites]);

  const splitOpen = SPLIT_FILTERS.every((id) => shown[id]);

  const visible = useMemo(() => {
    if (!sites) return [];
    const text = query.trim().toLowerCase();
    return sites.filter((site) => {
      const category = placeCategory(site);
      if (category == null) {
        if (!splitOpen) return false;
      } else if (!shown[category]) return false;
      if (!showOurs && oursOf(rows, site.id)) return false;
      if (!text) return true;
      return [site.name, site.city, site.county, site.owner, site.person, site.address].join(" ").toLowerCase().includes(text);
    });
  }, [sites, query, shown, splitOpen, showOurs, rows]);

  const sortedPlaces = useMemo(() => {
    const copy = visible.slice();
    copy.sort((a, b) => comparePlaces(a, b, placeSort));
    return copy;
  }, [visible, placeSort]);

  const truckRows = useMemo(() => {
    if (!trucks) return [];
    const text = query.trim().toLowerCase();
    const hits: { county: string; truck: Truck; key: string }[] = [];
    for (const [county, list] of Object.entries(trucks)) {
      for (const truck of list) {
        if (text && !`${truck.name} ${truck.city} ${county} ${truck.person ?? ""}`.toLowerCase().includes(text)) continue;
        hits.push({ county, truck, key: `${county}-${truck.name}-${truck.city}` });
      }
    }
    hits.sort((a, b) => compareTrucks(a, b, truckSort));
    return hits;
  }, [trucks, query, truckSort]);

  const researched = useMemo(
    () => ACCOUNTS.filter((account) => account.researched),
    [],
  );
  const sortedBids = useMemo(() => {
    const copy = researched.slice();
    copy.sort((a, b) => compareBids(a, b, bidSort));
    return copy;
  }, [researched, bidSort]);

  const selected = sites?.find((site) => site.id === selectedId) ?? null;
  const selectedTruck = truckRows.find((row) => row.key === truckKey) ?? null;
  const bid = ACCOUNTS.find((account) => account.id === bidId) ?? sortedBids[0];
  const truckTotal = trucks ? Object.values(trucks).reduce((sum, list) => sum + list.length, 0) : 0;

  function openPlaces(next: Record<PlaceCategory, boolean>) {
    setShown(next);
    setView("places");
  }

  function toggleCategory(id: PlaceCategory) {
    setShown((current) => ({ ...current, [id]: !current[id] }));
  }

  async function copyAsk(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      <aside className="sticky top-0 flex h-screen w-52 shrink-0 flex-col border-r border-line bg-surface px-3 py-4">
        <p className="px-2 font-mono text-xs tracking-wide text-accent">MISSISSIPPI</p>
        <p className="px-2 text-lg font-semibold leading-tight">Fuel buyers</p>
        <p className="px-2 text-xs text-muted">GPM Empire · Purvis</p>
        <nav className="mt-4 flex flex-col gap-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`min-h-11 rounded-lg px-3 text-left text-sm font-medium ${view === item.id ? "bg-accent text-ink" : "text-fg hover:bg-raised"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        {view === "overview" && (
          <Overview
            tanks={sites?.length ?? 0}
            notStations={(sites?.length ?? 0) - counts.station - counts.gpm}
            stations={counts.station}
            gpm={counts.gpm}
            trucks={truckTotal}
            bids={researched.length}
            ready={sites != null}
            onTanks={() => openPlaces(everyCategory(true))}
            onNotStations={() => openPlaces({ ...everyCategory(false), town: true, school: true, county: true, hospital: true, company: true, dock: true, road: true, airport: true, prison: true, unknown: true })}
            onStations={() => openPlaces({ ...everyCategory(false), station: true })}
            onGpm={() => openPlaces({ ...everyCategory(false), gpm: true })}
            onTrucks={() => setView("trucks")}
            onBids={() => setView("bids")}
            onMap={() => setView("map")}
          />
        )}

        {view !== "overview" && view !== "bids" && (
          <div className="flex flex-col gap-3 px-4 pt-4 md:px-6">
            <label className="relative block">
              <Search className="pointer-events-none absolute top-3.5 left-3 h-4 w-4 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a town, a county, a person, or a company"
                className="min-h-11 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-sm outline-none"
              />
            </label>
            {view !== "trucks" && (
              <div className="flex flex-wrap gap-2">
                <Toggle on={shown.town} label={`Towns · ${counts.town}`} onClick={() => toggleCategory("town")} />
                <Toggle on={shown.school} label={`Schools · ${counts.school}`} onClick={() => toggleCategory("school")} />
                <Toggle on={shown.county} label={`County shops · ${counts.county}`} onClick={() => toggleCategory("county")} />
                <Toggle on={shown.hospital} label={`Hospitals · ${counts.hospital}`} onClick={() => toggleCategory("hospital")} />
                <Toggle on={shown.company} label={`Company tanks · ${counts.company}`} onClick={() => toggleCategory("company")} />
                <Toggle on={shown.dock} label={`Docks · ${counts.dock}`} onClick={() => toggleCategory("dock")} />
                <Toggle on={shown.road} label={`State road shops · ${counts.road}`} onClick={() => toggleCategory("road")} />
                <Toggle on={shown.airport} label={`Airports · ${counts.airport}`} onClick={() => toggleCategory("airport")} />
                <Toggle on={shown.prison} label={`State prisons · ${counts.prison}`} onClick={() => toggleCategory("prison")} />
                {counts.unknown > 0 && (
                  <Toggle on={shown.unknown} label={`Unknown businesses · ${counts.unknown}`} onClick={() => toggleCategory("unknown")} />
                )}
                <Toggle on={shown.station} label={`Gas stations · ${counts.station}`} onClick={() => toggleCategory("station")} />
                <Toggle on={shown.gpm} label={`Registered to GPM · ${counts.gpm}`} onClick={() => toggleCategory("gpm")} />
                <Toggle on={showOurs} label="Already our customer" onClick={() => setShowOurs((value) => !value)} />
              </div>
            )}
          </div>
        )}

        {view !== "overview" && !sites && view !== "bids" ? (
          <p className="px-4 py-6 text-sm text-muted md:px-6">Loading the tank list.</p>
        ) : view !== "overview" ? (
          <div className="grid gap-4 px-4 py-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
            <section className="min-w-0">
              {view === "map" && sites && (
                <div className="flex h-full min-h-96 flex-col gap-3">
                  <div className="min-h-96 flex-1">
                    <TankMap sites={visible} selectedId={selectedId} onSelect={setSelectedId} />
                  </div>
                  <p className="text-sm text-muted">
                    {visible.length.toLocaleString()} showing. A number is several tanks in the same spot. Tap it to split them. Gas stations stay off until you turn them on. Tanks that sit above the ground are not on this map.
                  </p>
                </div>
              )}

              {view === "places" && (
                <PlaceTable
                  sites={sortedPlaces}
                  sort={placeSort}
                  selectedId={selectedId}
                  onSort={(key, numeric) => setPlaceSort((current) => nextSort(current, key, numeric))}
                  onSelect={setSelectedId}
                />
              )}

              {view === "trucks" && (
                <TruckTable
                  rows={truckRows}
                  total={truckTotal}
                  sort={truckSort}
                  selectedKey={truckKey}
                  onSort={(key, numeric) => setTruckSort((current) => nextSort(current, key, numeric))}
                  onSelect={setTruckKey}
                />
              )}

              {view === "bids" && (
                <BidTable
                  accounts={sortedBids}
                  sort={bidSort}
                  selectedId={bid?.id ?? null}
                  onSort={(key, numeric) => setBidSort((current) => nextSort(current, key, numeric))}
                  onSelect={setBidId}
                />
              )}
            </section>

            {view === "bids" && bid ? (
              <BidDetail account={bid} copied={copied} onCopy={() => copyAsk(`${bid.name}\n${bid.ask}\n${bid.next}`)} />
            ) : view === "trucks" && selectedTruck ? (
              <TruckDetail county={selectedTruck.county} truck={selectedTruck.truck} />
            ) : (view === "map" || view === "places") && selected ? (
              <SiteDetail
                site={selected}
                trucks={trucks ? trucksForCounty(trucks, selected.county).slice(0, 5) : []}
                truckTotal={trucks ? trucksForCounty(trucks, selected.county).length : 0}
                bids={bidsForCounty(selected.county)}
                ours={oursOf(rows, selected.id)}
                note={noteOf(rows, selected.id)}
                copied={copied}
                onOurs={(value) => setOurs(selected.id, value)}
                onNote={(value) => setNote(selected.id, value)}
                onCopy={() => copyAsk(askFor(selected))}
                onMap={() => setView("map")}
              />
            ) : view === "trucks" ? (
              <aside className="h-fit rounded-lg border border-line bg-surface p-4 text-sm text-muted">
                Tap a company. The truck count is the federal list’s claim, not a fleet someone confirmed.
              </aside>
            ) : view !== "bids" ? (
              <aside className="h-fit rounded-lg border border-line bg-surface p-4 text-sm text-muted">
                Tap a place. The panel tells you who to ask, and it tells you when the state list does not know how much fuel they buy.
              </aside>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}

function Overview({
  tanks,
  notStations,
  stations,
  gpm,
  trucks,
  bids,
  ready,
  onTanks,
  onNotStations,
  onStations,
  onGpm,
  onTrucks,
  onBids,
  onMap,
}: {
  tanks: number;
  notStations: number;
  stations: number;
  gpm: number;
  trucks: number;
  bids: number;
  ready: boolean;
  onTanks: () => void;
  onNotStations: () => void;
  onStations: () => void;
  onGpm: () => void;
  onTrucks: () => void;
  onBids: () => void;
  onMap: () => void;
}) {
  return (
    <div className="px-4 py-6 md:px-6">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        {ready ? "Counts from the state tank list and the federal truck list. Each count opens that section." : "Loading the state tank list."}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <CountButton label="Buried tanks" value={tanks} ready={ready} onClick={onTanks} />
        <CountButton label="Places that are not gas stations" value={notStations} ready={ready} onClick={onNotStations} />
        <CountButton label="Gas stations" value={stations} ready={ready} onClick={onStations} />
        <CountButton label="Registered to GPM" value={gpm} ready={ready} onClick={onGpm} />
        <CountButton label="Trucking companies" value={trucks} ready={ready} onClick={onTrucks} />
        <CountButton label="Bids" value={bids} ready={ready} onClick={onBids} />
      </div>
      <button type="button" onClick={onMap} className="mt-4 min-h-11 rounded-lg bg-raised px-3 text-sm">
        Open the map
      </button>
    </div>
  );
}

function CountButton({ label, value, ready, onClick }: { label: string; value: number; ready: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-lg border border-line bg-surface px-4 py-4 text-left">
      <span className="block font-mono text-2xl font-semibold">{ready ? value.toLocaleString() : "…"}</span>
      <span className="mt-1 block text-sm text-muted">{label}</span>
    </button>
  );
}

function PlaceTable({
  sites,
  sort,
  selectedId,
  onSort,
  onSelect,
}: {
  sites: Site[];
  sort: ColumnSort;
  selectedId: string | null;
  onSort: (key: string, numeric: boolean) => void;
  onSelect: (id: string) => void;
}) {
  const shown = sites.slice(0, PAGE_LIMIT);
  const page = sites.filter((site) => /https?:\/\//.test(site.note)).length;
  const nameOnly = sites.filter((site) => /^from the name/i.test(site.note.trim())).length;
  const older = sites.filter((site) => {
    const note = site.note.trim();
    return note.length > 0 && !/^from the name/i.test(note) && !/https?:\/\//.test(note);
  }).length;
  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        {sites.length.toLocaleString()} places{sites.length > shown.length ? `. First ${shown.length}.` : "."} {page.toLocaleString()} have a page source, {nameOnly.toLocaleString()} are still only a name reading, and {older.toLocaleString()} have an older note with no link.
      </p>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <SortableTh label="Name" column="name" sort={sort} numeric={false} onSort={onSort} />
              <SortableTh label="Place" column="place" sort={sort} numeric={false} onSort={onSort} />
              <SortableTh label="City" column="city" sort={sort} numeric={false} onSort={onSort} />
              <SortableTh label="County" column="county" sort={sort} numeric={false} onSort={onSort} />
              <SortableTh label="Tanks" column="tanks" sort={sort} numeric onSort={onSort} />
              <SortableTh label="Person" column="person" sort={sort} numeric={false} onSort={onSort} />
            </tr>
          </thead>
          <tbody>
            {shown.map((site) => (
              <tr
                key={site.id}
                onClick={() => onSelect(site.id)}
                className={`cursor-pointer border-t border-line ${selectedId === site.id ? "bg-raised" : "bg-surface"}`}
              >
                <td className="px-3 py-3 font-medium">{site.name}</td>
                <td className="px-3 py-3">{kindWord(site)}</td>
                <td className="px-3 py-3">{site.city}</td>
                <td className="px-3 py-3">{site.county}</td>
                <td className="px-3 py-3 font-mono">{site.tanks}</td>
                <td className="px-3 py-3">{site.person || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TruckTable({
  rows,
  total,
  sort,
  selectedKey,
  onSort,
  onSelect,
}: {
  rows: { county: string; truck: Truck; key: string }[];
  total: number;
  sort: ColumnSort;
  selectedKey: string | null;
  onSort: (key: string, numeric: boolean) => void;
  onSelect: (key: string) => void;
}) {
  const shown = rows.slice(0, PAGE_LIMIT);
  const shaky = rows.filter((row) => row.truck.trucks > FLEET_TRUST).length;
  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        {total.toLocaleString()} Mississippi companies with three or more trucks. Showing {shown.length.toLocaleString()} of {rows.length.toLocaleString()} matches. The truck count is the federal list’s claim, not a confirmed fleet. {shaky.toLocaleString()} counts are over {FLEET_TRUST.toLocaleString()} and sort last.
      </p>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <SortableTh label="Name" column="name" sort={sort} numeric={false} onSort={onSort} />
              <SortableTh label="City" column="city" sort={sort} numeric={false} onSort={onSort} />
              <SortableTh label="County" column="county" sort={sort} numeric={false} onSort={onSort} />
              <SortableTh label="Trucks" column="trucks" sort={sort} numeric onSort={onSort} />
              <SortableTh label="Phone" column="phone" sort={sort} numeric={false} onSort={onSort} />
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr
                key={row.key}
                onClick={() => onSelect(row.key)}
                className={`cursor-pointer border-t border-line ${selectedKey === row.key ? "bg-raised" : "bg-surface"}`}
              >
                <td className="px-3 py-3 font-medium">{row.truck.name}</td>
                <td className="px-3 py-3">{row.truck.city}</td>
                <td className="px-3 py-3">{row.county}</td>
                <td className="px-3 py-3 font-mono">
                  {row.truck.trucks.toLocaleString()}
                  {row.truck.trucks > FLEET_TRUST ? <span className="ml-2 font-sans text-muted">too high to trust</span> : null}
                </td>
                <td className="px-3 py-3">{row.truck.phone || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BidTable({
  accounts,
  sort,
  selectedId,
  onSort,
  onSelect,
}: {
  accounts: Account[];
  sort: ColumnSort;
  selectedId: string | null;
  onSort: (key: string, numeric: boolean) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        These notes are from public minutes, bid notices, and news. Board dates from the first week of October 2026 have passed. The contract notes are the part that still matters. Gallons are still missing for almost all of them.
      </p>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <SortableTh label="Name" column="name" sort={sort} numeric={false} onSort={onSort} />
              <SortableTh label="Place" column="place" sort={sort} numeric={false} onSort={onSort} />
              <SortableTh label="County" column="county" sort={sort} numeric={false} onSort={onSort} />
              <SortableTh label="Kind" column="kind" sort={sort} numeric={false} onSort={onSort} />
              <SortableTh label="Status" column="bidStatus" sort={sort} numeric={false} onSort={onSort} />
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr
                key={account.id}
                onClick={() => onSelect(account.id)}
                className={`cursor-pointer border-t border-line ${selectedId === account.id ? "bg-raised" : "bg-surface"}`}
              >
                <td className="px-3 py-3 font-medium">{account.name}</td>
                <td className="px-3 py-3">{account.place}</td>
                <td className="px-3 py-3">{account.county}</td>
                <td className="px-3 py-3">{account.kind}</td>
                <td className="px-3 py-3">{account.bidStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortableTh({
  label,
  column,
  sort,
  numeric,
  onSort,
}: {
  label: string;
  column: string;
  sort: ColumnSort;
  numeric: boolean;
  onSort: (key: string, numeric: boolean) => void;
}) {
  const active = sort.key === column;
  return (
    <th className="px-3 py-2 font-medium">
      <button type="button" onClick={() => onSort(column, numeric)} className="inline-flex items-center gap-1">
        {label}
        <span className="font-mono text-xs text-accent" aria-hidden="true">
          {active ? (sort.dir === "asc" ? "↑" : "↓") : ""}
        </span>
      </button>
    </th>
  );
}

function SiteDetail({
  site,
  trucks,
  truckTotal,
  bids,
  ours,
  note,
  copied,
  onOurs,
  onNote,
  onCopy,
  onMap,
}: {
  site: Site;
  trucks: Truck[];
  truckTotal: number;
  bids: Account[];
  ours: boolean;
  note: string;
  copied: boolean;
  onOurs: (value: boolean) => void;
  onNote: (value: string) => void;
  onCopy: () => void;
  onMap: () => void;
}) {
  const registered = registrationName(site);
  const mail = quoteMail({ name: site.name, person: site.person, email: site.email });
  return (
    <aside className="h-fit rounded-lg border border-line bg-surface p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <p className="font-mono text-xs text-accent">{placeWord(site)}</p>
      <h2 className="mt-1 text-xl font-semibold">{site.name}</h2>
      <p className="mt-1 flex items-start gap-1 text-sm text-muted">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {site.address ? `${site.address}, ` : ""}
          {site.city}, {site.county} {site.zip}
        </span>
      </p>
      <p className="mt-3 text-sm">
        {placeLine(site)} {site.tanks} {site.tanks === 1 ? "tank" : "tanks"} still in use.
      </p>
      {site.lat == null && <p className="mt-2 text-sm text-muted">The state record has no coordinates, so this place is not drawn on the map.</p>}

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-muted">Who to ask</dt>
          <dd>
            {site.person ? (
              <>
                {site.person}
                {site.job ? `, ${site.job}` : ""}
                {site.email ? (
                  <a className="mt-1 block text-accent underline" href={`mailto:${site.email}`}>
                    {site.email}
                  </a>
                ) : (
                  <span className="mt-1 block text-muted">No email on the public page.</span>
                )}
                {site.phone ? <PhoneLine phone={site.phone} /> : null}
              </>
            ) : (
              "No current person on a public page."
            )}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Name on the state registration</dt>
          <dd>
            {registered}
            {site.owner ? <span className="mt-1 block text-muted">{site.owner}</span> : null}
            {site.ownerPhone ? (
              <span className="mt-1 block text-muted">
                Owner phone <PhoneLine phone={site.ownerPhone} />
              </span>
            ) : null}
          </dd>
        </div>
        {site.note && (
          <div>
            <dt className="text-muted">What the website check found</dt>
            <dd>
              <LinkedText text={site.note} />
            </dd>
          </div>
        )}
        <div>
          <dt className="text-muted">Gallons and contract end</dt>
          <dd>Not on the state list. Not requested yet. The registration also does not say how big the tank is.</dd>
        </div>
      </dl>

      {site.brandOnly && (
        <p className="mt-4 rounded-lg bg-bg p-3 text-sm">
          Marked because the store name is a GPM brand. The company that registered the tank is {site.owner}. That is not proof GPM supplies the fuel.
        </p>
      )}

      {bids.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">Already found for {site.county} County</p>
          {bids.slice(0, 3).map((account) => (
            <div key={account.id} className="rounded-lg bg-bg p-3 text-sm">
              <p className="font-medium">{account.name}</p>
              <p className="mt-1">
                <LinkedText text={account.next} />
              </p>
            </div>
          ))}
        </div>
      )}

      {truckTotal > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium">
            {truckTotal} trucking companies in {site.county} County
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {trucks.map((truck) => (
              <li key={truck.name}>
                {truck.name} · {fleetClaim(truck.trucks)}
                {truck.city ? `, ${truck.city}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 rounded-lg bg-raised p-3">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Phone className="h-4 w-4 text-accent" />
          Say this
        </p>
        <p className="mt-2 text-sm">{askFor(site)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={mail} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-3 text-sm font-medium text-ink">
            Send email
          </a>
          <button type="button" onClick={onCopy} className="min-h-11 rounded-lg bg-bg px-3 text-sm">
            {copied ? "Copied" : "Copy the ask"}
          </button>
          {site.lat != null && (
            <button type="button" onClick={onMap} className="min-h-11 rounded-lg bg-bg px-3 text-sm">
              Show on the map
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOurs(!ours)}
        className={`mt-4 min-h-11 w-full rounded-lg px-3 text-sm font-medium ${ours ? "bg-stop text-fg" : "bg-raised text-fg"}`}
      >
        {ours ? "Marked as already our customer" : "Mark as already our customer"}
      </button>
      <p className="mt-2 text-xs text-muted">That mark stays in this browser. It hides the place until you turn “Already our customer” back on.</p>

      <label className="mt-4 block text-sm text-muted">
        Note
        <textarea
          value={note}
          onChange={(event) => onNote(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-line bg-bg p-3 text-sm text-fg outline-none"
          placeholder="Who you talked to, and when the deal ends"
        />
      </label>
    </aside>
  );
}

function TruckDetail({ county, truck }: { county: string; truck: Truck }) {
  const checked = Boolean(truck.note);
  return (
    <aside className="h-fit rounded-lg border border-line bg-surface p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <p className="font-mono text-xs text-accent">Trucking</p>
      <h2 className="mt-1 text-xl font-semibold">{truck.name}</h2>
      <p className="mt-1 text-sm text-muted">
        {truck.city}, {county} County
      </p>
      <dl className="mt-4 space-y-3 text-sm">
        {checked && (
          <div>
            <dt className="text-muted">Who to ask</dt>
            <dd>
              {truck.person ? (
                <>
                  {truck.person}
                  {truck.job ? `, ${truck.job}` : ""}
                  {truck.email ? (
                    <a className="mt-1 block text-accent underline" href={`mailto:${truck.email}`}>
                      {truck.email}
                    </a>
                  ) : (
                    <span className="mt-1 block text-muted">No email on the public page.</span>
                  )}
                </>
              ) : (
                <>
                  No current person on a public page.
                  {truck.email ? (
                    <a className="mt-1 block text-accent underline" href={`mailto:${truck.email}`}>
                      {truck.email}
                    </a>
                  ) : null}
                </>
              )}
              {truck.phone ? (
                <span className="mt-1 block">
                  <PhoneLine phone={truck.phone} />
                </span>
              ) : (
                <span className="mt-1 block text-muted">No phone on the public page.</span>
              )}
            </dd>
          </div>
        )}
        {truck.note && (
          <div>
            <dt className="text-muted">What the page check found</dt>
            <dd>
              <LinkedText text={truck.note} />
            </dd>
          </div>
        )}
      </dl>
      <p className="mt-4 text-sm">{fleetClaim(truck.trucks)}.</p>
      {truck.trucks > FLEET_TRUST && (
        <p className="mt-2 text-sm">This count is over {FLEET_TRUST.toLocaleString()}. It is too high to trust as a fleet size.</p>
      )}
      {!checked &&
        (truck.phone ? (
          <p className="mt-3 text-sm">
            Phone <PhoneLine phone={truck.phone} />
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted">No phone on the federal list.</p>
        ))}
    </aside>
  );
}

function BidDetail({ account, copied, onCopy }: { account: Account; copied: boolean; onCopy: () => void }) {
  const mail = quoteMail({ name: account.name });
  return (
    <aside className="h-fit rounded-lg border border-line bg-surface p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <p className="font-mono text-xs text-muted">
        {account.kind} · {account.county} County
      </p>
      <h2 className="mt-1 text-xl font-semibold">{account.name}</h2>
      <p className="mt-1 text-sm text-muted">{account.place}</p>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-muted">Who buys</dt>
          <dd>{account.buyer}</dd>
        </div>
        <div>
          <dt className="text-muted">How they buy</dt>
          <dd>
            <LinkedText text={account.how} />
          </dd>
        </div>
        <div>
          <dt className="text-muted">Where it stands</dt>
          <dd>
            <LinkedText text={account.next} />
          </dd>
        </div>
      </dl>
      {account.record && (
        <div className="mt-4 rounded-lg bg-bg p-3 text-sm">
          <p className="font-medium">Public record</p>
          <p className="mt-1">
            <LinkedText text={account.record} />
          </p>
        </div>
      )}
      <div className="mt-4 rounded-lg bg-raised p-3">
        <p className="text-sm font-medium">Say this</p>
        <p className="mt-2 text-sm">{account.ask}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={mail} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-3 text-sm font-medium text-ink">
            Send email
          </a>
          <button type="button" onClick={onCopy} className="min-h-11 rounded-lg bg-bg px-3 text-sm">
            {copied ? "Copied" : "Copy the ask"}
          </button>
        </div>
      </div>
    </aside>
  );
}

function PhoneLine({ phone }: { phone: string }) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return <span>{phone}</span>;
  return (
    <a className="text-accent underline" href={`tel:${digits}`}>
      {phone}
    </a>
  );
}

function LinkedText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return (
    <>
      {parts.map((part, index) =>
        /^https?:\/\//.test(part) ? (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-accent underline">
            {part}
          </a>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm ${on ? "bg-accent text-ink" : "bg-raised text-fg"}`}
    >
      {label}
    </button>
  );
}

function kindWord(site: Site): string {
  return placeWord(site);
}

function everyCategory(on: boolean): Record<PlaceCategory, boolean> {
  return {
    town: on,
    school: on,
    county: on,
    hospital: on,
    company: on,
    dock: on,
    road: on,
    airport: on,
    prison: on,
    unknown: on,
    station: on,
    gpm: on,
  };
}

function fleetClaim(trucks: number): string {
  return `Federal list claims ${trucks.toLocaleString()} trucks`;
}

function nextSort(current: ColumnSort, key: string, numeric: boolean): ColumnSort {
  if (current.key !== key) return { key, dir: numeric ? "desc" : "asc" };
  return { key, dir: current.dir === "asc" ? "desc" : "asc" };
}

function comparePlaces(a: Site, b: Site, sort: ColumnSort): number {
  if (sort.key === "tanks") return compareNumber(a.tanks, b.tanks, sort.dir);
  const left = placeText(a, sort.key);
  const right = placeText(b, sort.key);
  return compareText(left, right, sort.dir);
}

function placeText(site: Site, key: string): string {
  if (key === "city") return site.city;
  if (key === "county") return site.county;
  if (key === "person") return site.person;
  if (key === "place") return kindWord(site);
  return site.name;
}

function compareTrucks(
  a: { county: string; truck: Truck },
  b: { county: string; truck: Truck },
  sort: ColumnSort,
): number {
  if (sort.key === "trucks") return compareFleet(a.truck.trucks, b.truck.trucks, sort.dir);
  const left = sort.key === "city" ? a.truck.city : sort.key === "county" ? a.county : sort.key === "phone" ? a.truck.phone : a.truck.name;
  const right = sort.key === "city" ? b.truck.city : sort.key === "county" ? b.county : sort.key === "phone" ? b.truck.phone : b.truck.name;
  return compareText(left, right, sort.dir);
}

function compareBids(a: Account, b: Account, sort: ColumnSort): number {
  const left = bidText(a, sort.key);
  const right = bidText(b, sort.key);
  return compareText(left, right, sort.dir);
}

function bidText(account: Account, key: string): string {
  if (key === "place") return account.place;
  if (key === "county") return account.county;
  if (key === "kind") return account.kind;
  if (key === "bidStatus") return account.bidStatus;
  return account.name;
}

function compareText(a: string, b: string, dir: Dir): number {
  const value = a.localeCompare(b, undefined, { sensitivity: "base" });
  return dir === "asc" ? value : -value;
}

function compareNumber(a: number, b: number, dir: Dir): number {
  return dir === "desc" ? b - a : a - b;
}

function compareFleet(a: number, b: number, dir: Dir): number {
  return compareNumber(fleetRank(a, dir), fleetRank(b, dir), dir);
}

function fleetRank(trucks: number, dir: Dir): number {
  if (trucks > FLEET_TRUST) return dir === "desc" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  return trucks;
}
