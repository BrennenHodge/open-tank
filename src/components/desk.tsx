import { useEffect, useMemo, useState } from "react";
import { MapPin, Phone, Search } from "lucide-react";
import { ACCOUNTS, type Account } from "@/data/accounts";
import {
  GROUP_LABEL,
  askFor,
  bidsForCounty,
  laneLabel,
  trucksForCounty,
  type Group,
  type Site,
  type Truck,
} from "@/data/sites";
import { STAGES, noteOf, oursOf, stageOf, usePipeline } from "@/lib/pipeline";
import { TankMap } from "@/components/tank-map";

type View = "map" | "list" | "bids" | "trucks";

const VIEWS: { id: View; label: string }[] = [
  { id: "map", label: "Map" },
  { id: "list", label: "Places" },
  { id: "trucks", label: "Trucking" },
  { id: "bids", label: "Bids" },
];

export function Desk() {
  const [view, setView] = useState<View>("map");
  const [sites, setSites] = useState<Site[] | null>(null);
  const [trucks, setTrucks] = useState<Record<string, Truck[]> | null>(null);
  const [query, setQuery] = useState("");
  const [showCall, setShowCall] = useState(true);
  const [showRead, setShowRead] = useState(true);
  const [showStation, setShowStation] = useState(false);
  const [showTheirs, setShowTheirs] = useState(false);
  const [showOurs, setShowOurs] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bidId, setBidId] = useState("county-lamar");
  const [copied, setCopied] = useState(false);
  const rows = usePipeline((state) => state.rows);
  const setStage = usePipeline((state) => state.setStage);
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
    const tally = { call: 0, read: 0, station: 0, theirs: 0 };
    for (const site of sites ?? []) tally[site.group] += 1;
    return tally;
  }, [sites]);

  const visible = useMemo(() => {
    if (!sites) return [];
    const text = query.trim().toLowerCase();
    const groups = new Set<Group>();
    if (showCall) groups.add("call");
    if (showRead) groups.add("read");
    if (showStation) groups.add("station");
    if (showTheirs) groups.add("theirs");
    return sites.filter((site) => {
      if (!groups.has(site.group)) return false;
      if (!showOurs && oursOf(rows, site.id)) return false;
      if (!text) return true;
      return [site.name, site.city, site.county, site.owner, site.person, site.address]
        .join(" ")
        .toLowerCase()
        .includes(text);
    });
  }, [sites, query, showCall, showRead, showStation, showTheirs, showOurs, rows]);

  const selected = sites?.find((site) => site.id === selectedId) ?? null;
  const researched = useMemo(
    () => ACCOUNTS.filter((account) => account.researched).sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name)),
    [],
  );
  const bid = ACCOUNTS.find((account) => account.id === bidId) ?? researched[0];

  const truckHits = useMemo(() => {
    if (!trucks) return [];
    const text = query.trim().toLowerCase();
    const hits: { county: string; truck: Truck }[] = [];
    for (const [county, list] of Object.entries(trucks)) {
      for (const truck of list) {
        if (text && !`${truck.name} ${truck.city} ${county}`.toLowerCase().includes(text)) continue;
        hits.push({ county, truck });
      }
    }
    hits.sort((a, b) => b.truck.trucks - a.truck.trucks);
    return hits.slice(0, 40);
  }, [trucks, query]);

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
    <main className="min-h-screen bg-bg text-fg">
      <header className="border-b border-line px-4 py-4 md:px-6">
        <p className="font-mono text-xs tracking-wide text-accent">MISSISSIPPI</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold leading-tight">Fuel buyers</h1>
            <p className="max-w-2xl text-sm text-muted">
              {sites
                ? `${counts.call + counts.read + counts.station + counts.theirs} buried tanks from the state list. The map opens on the ${counts.call + counts.read} places that are not gas stations.`
                : "Loading the state tank list."}
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`min-h-11 rounded-lg px-3 text-sm font-medium ${view === item.id ? "bg-accent text-ink" : "bg-raised text-fg"}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {view !== "bids" && (
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
              <Toggle on={showCall} label={`Call these · ${counts.call}`} swatch="bg-accent" onClick={() => setShowCall((value) => !value)} />
              <Toggle on={showRead} label={`Read the name · ${counts.read}`} swatch="bg-muted" onClick={() => setShowRead((value) => !value)} />
              <Toggle on={showStation} label={`Gas stations · ${counts.station}`} swatch="bg-fg" onClick={() => setShowStation((value) => !value)} />
              <Toggle on={showTheirs} label={`Registered to GPM · ${counts.theirs}`} swatch="bg-stop" onClick={() => setShowTheirs((value) => !value)} />
              <Toggle on={showOurs} label="Already our customer" onClick={() => setShowOurs((value) => !value)} />
            </div>
          )}
        </div>
      )}

      {!sites && view !== "bids" ? (
        <p className="px-4 py-6 text-sm text-muted md:px-6">Loading the tank list.</p>
      ) : (
        <div className="grid gap-4 px-4 py-4 lg:grid-cols-3 md:px-6">
          <section className="min-w-0 lg:col-span-2">
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

            {view === "list" && <PlaceList sites={visible} selectedId={selectedId} onSelect={setSelectedId} />}

            {view === "trucks" && (
              <div>
                <p className="mb-3 text-sm text-muted">
                  {trucks ? `${Object.values(trucks).reduce((sum, list) => sum + list.length, 0).toLocaleString()} Mississippi companies with three or more trucks. A truck is not a tank. These companies are not on the map because the federal list has no coordinates.` : "Loading trucking companies."}
                </p>
                <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
                  {truckHits.map(({ county, truck }) => (
                    <li key={`${county}-${truck.name}`} className="bg-surface px-3 py-3">
                      <p className="font-medium">{truck.name}</p>
                      <p className="text-sm text-muted">
                        {truck.city}, {county} · {truck.trucks} trucks{truck.phone ? ` · ${truck.phone}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {view === "bids" && (
              <div className="space-y-3 lg:h-full lg:overflow-y-auto">
                <p className="text-sm text-muted">
                  These notes are from public minutes, bid notices, and news. Board dates from the first week of October 2026 have passed. The contract notes are the part that still matters. Gallons are still missing for almost all of them.
                </p>
                <ul className="space-y-2">
                  {researched.map((account) => (
                    <li key={account.id}>
                      <button
                        type="button"
                        onClick={() => setBidId(account.id)}
                        className={`w-full rounded-lg border px-3 py-3 text-left ${bid?.id === account.id ? "border-accent bg-surface" : "border-line bg-surface"}`}
                      >
                        <span className="font-medium">{account.name}</span>
                        <span className="mt-1 block text-sm text-muted">{account.place}</span>
                        <span className="mt-2 block text-sm">{account.next}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {view === "bids" && bid ? (
            <BidDetail account={bid} copied={copied} onCopy={() => copyAsk(`${bid.name}\n${bid.ask}\n${bid.next}`)} />
          ) : view !== "trucks" && selected ? (
            <SiteDetail
              site={selected}
              trucks={trucks ? trucksForCounty(trucks, selected.county).slice(0, 5) : []}
              truckTotal={trucks ? trucksForCounty(trucks, selected.county).length : 0}
              bids={bidsForCounty(selected.county)}
              ours={oursOf(rows, selected.id)}
              stage={stageOf(rows, selected.id)}
              note={noteOf(rows, selected.id)}
              copied={copied}
              onOurs={(value) => setOurs(selected.id, value)}
              onStage={(stage) => setStage(selected.id, stage)}
              onNote={(value) => setNote(selected.id, value)}
              onCopy={() => copyAsk(askFor(selected))}
              onMap={() => setView("map")}
            />
          ) : view !== "trucks" && view !== "bids" ? (
            <aside className="h-fit rounded-lg border border-line bg-surface p-4 text-sm text-muted">
              Tap a place. The panel tells you who to ask, and it tells you when the state list does not know how much fuel they buy.
            </aside>
          ) : null}
        </div>
      )}
    </main>
  );
}

function PlaceList({
  sites,
  selectedId,
  onSelect,
}: {
  sites: Site[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const rows = usePipeline((state) => state.rows);
  const shown = sites.slice(0, 80);
  return (
    <div className="lg:h-full lg:overflow-y-auto">
      <p className="mb-3 font-mono text-xs text-muted">
        {sites.length.toLocaleString()} places{sites.length > shown.length ? `, first ${shown.length}` : ""}
      </p>
      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
        {shown.map((site) => (
          <li key={site.id}>
            <button
              type="button"
              onClick={() => onSelect(site.id)}
              className={`flex w-full items-start justify-between gap-3 px-3 py-3 text-left ${selectedId === site.id ? "bg-raised" : "bg-surface"}`}
            >
              <span>
                <span className="block font-medium">{site.name}</span>
                <span className="block text-sm text-muted">
                  {site.city}, {site.county} · {site.tanks} tanks in use
                  {site.person ? ` · ${site.person}` : ""}
                </span>
              </span>
              <span className="shrink-0 font-mono text-xs text-accent">{stageOf(rows, site.id)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SiteDetail({
  site,
  trucks,
  truckTotal,
  bids,
  ours,
  stage,
  note,
  copied,
  onOurs,
  onStage,
  onNote,
  onCopy,
  onMap,
}: {
  site: Site;
  trucks: Truck[];
  truckTotal: number;
  bids: Account[];
  ours: boolean;
  stage: (typeof STAGES)[number];
  note: string;
  copied: boolean;
  onOurs: (value: boolean) => void;
  onStage: (stage: (typeof STAGES)[number]) => void;
  onNote: (value: string) => void;
  onCopy: () => void;
  onMap: () => void;
}) {
  return (
    <aside className="h-fit rounded-lg border border-line bg-surface p-4 lg:sticky lg:top-4 lg:max-h-full lg:overflow-y-auto">
      <p className="font-mono text-xs text-accent">{GROUP_LABEL[site.group]}</p>
      <h2 className="mt-1 text-xl font-semibold">{site.name}</h2>
      <p className="mt-1 flex items-start gap-1 text-sm text-muted">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {site.address ? `${site.address}, ` : ""}
          {site.city}, {site.county} {site.zip}
        </span>
      </p>
      <p className="mt-3 text-sm">{laneLabel(site)}. {site.tanks} {site.tanks === 1 ? "tank" : "tanks"} still in use.</p>
      {site.lat == null && (
        <p className="mt-2 text-sm text-muted">The state record has no coordinates, so this place is not drawn on the map.</p>
      )}

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-muted">Who to ask</dt>
          <dd>
            {site.person ? (
              <>
                {site.person}
                {site.job ? `, ${site.job}` : ""}
                {site.email ? <span className="mt-1 block">{site.email}</span> : <span className="mt-1 block text-muted">No email on the public page.</span>}
                {site.phone ? <span className="block">{site.phone}</span> : null}
              </>
            ) : (
              "No current person on a public page."
            )}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Name on the state registration</dt>
          <dd>
            {site.formName || "None listed"}
            {site.owner ? <span className="mt-1 block text-muted">{site.owner}</span> : null}
          </dd>
        </div>
        {site.note && (
          <div>
            <dt className="text-muted">What the website check found</dt>
            <dd>{site.note}</dd>
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
              <p className="mt-1">{account.next}</p>
            </div>
          ))}
        </div>
      )}

      {truckTotal > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium">{truckTotal} trucking companies in {site.county} County</p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {trucks.map((truck) => (
              <li key={truck.name}>
                {truck.name} · {truck.trucks} trucks{truck.city ? `, ${truck.city}` : ""}
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
          <button type="button" onClick={onCopy} className="min-h-11 rounded-lg bg-accent px-3 text-sm font-medium text-ink">
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

      <div className="mt-4">
        <p className="text-sm text-muted">Stage</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {STAGES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onStage(item)}
              className={`min-h-11 rounded-lg px-3 text-sm ${stage === item ? "bg-accent text-ink" : "bg-raised text-fg"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

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

function BidDetail({ account, copied, onCopy }: { account: Account; copied: boolean; onCopy: () => void }) {
  return (
    <aside className="h-fit rounded-lg border border-line bg-surface p-4 lg:sticky lg:top-4">
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
          <dd>{account.how}</dd>
        </div>
        <div>
          <dt className="text-muted">Where it stands</dt>
          <dd>{account.next}</dd>
        </div>
      </dl>
      {account.record && (
        <div className="mt-4 rounded-lg bg-bg p-3 text-sm">
          <p className="font-medium">Public record</p>
          <p className="mt-1">{account.record}</p>
        </div>
      )}
      <div className="mt-4 rounded-lg bg-raised p-3">
        <p className="text-sm font-medium">Say this</p>
        <p className="mt-2 text-sm">{account.ask}</p>
        <button type="button" onClick={onCopy} className="mt-3 min-h-11 rounded-lg bg-accent px-3 text-sm font-medium text-ink">
          {copied ? "Copied" : "Copy the ask"}
        </button>
      </div>
    </aside>
  );
}

function Toggle({ on, label, swatch, onClick }: { on: boolean; label: string; swatch?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm ${on ? "bg-accent text-ink" : "bg-raised text-fg"}`}
    >
      {swatch && <span className={`h-2.5 w-2.5 rounded-full ${on ? "bg-ink" : swatch}`} />}
      {label}
    </button>
  );
}
