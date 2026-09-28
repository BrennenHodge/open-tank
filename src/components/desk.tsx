import { useMemo, useState } from "react";
import { MapPin, Phone, Search } from "lucide-react";
import { ACCOUNTS, KINDS, NAMED, REGIONS, STATUSES, type Account, type BidStatus, type Kind, type Region } from "@/data/accounts";
import { STAGES, noteOf, stageOf, usePipeline } from "@/lib/pipeline";

type View = "week" | "map" | "book";

const WEEK_IDS = [
  "county-lamar",
  "county-pearl-river",
  "county-harrison",
  "county-hancock",
  "county-jackson",
  "county-hinds",
  "county-rankin",
  "county-madison",
  "county-jones",
  "county-lee",
  "county-desoto",
  "county-forrest",
  "port-hancock",
  "school-lamar",
  "school-hattiesburg",
  "school-forrest",
  "school-petal",
];

function statusClass(status: BidStatus) {
  if (status === "No bid posted" || status === "Monthly quotes" || status === "Fuel card") return "text-accent";
  if (status === "Skip" || status === "Locked") return "text-stop";
  return "text-muted";
}

function project(account: Account) {
  const minLng = -91.7;
  const maxLng = -88.05;
  const minLat = 30.15;
  const maxLat = 35.05;
  const x = ((account.lng - minLng) / (maxLng - minLng)) * 100;
  const y = ((maxLat - account.lat) / (maxLat - minLat)) * 100;
  return { x, y };
}

export function Desk() {
  const [view, setView] = useState<View>("week");
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<Region | "All">("All");
  const [kind, setKind] = useState<Kind | "All">("All");
  const [status, setStatus] = useState<BidStatus | "All">("All");
  const [selectedId, setSelectedId] = useState<string>("county-lamar");
  const [copied, setCopied] = useState(false);
  const rows = usePipeline((s) => s.rows);
  const setStage = usePipeline((s) => s.setStage);
  const setNote = usePipeline((s) => s.setNote);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ACCOUNTS.filter((account) => {
      if (region !== "All" && account.region !== region) return false;
      if (kind !== "All" && account.kind !== kind) return false;
      if (status !== "All" && account.bidStatus !== status) return false;
      if (!q) return true;
      return (
        account.name.toLowerCase().includes(q) ||
        account.place.toLowerCase().includes(q) ||
        account.county.toLowerCase().includes(q) ||
        account.buyer.toLowerCase().includes(q)
      );
    }).sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  }, [query, region, kind, status]);

  const selected = ACCOUNTS.find((account) => account.id === selectedId) ?? filtered[0];
  const week = WEEK_IDS.map((id) => ACCOUNTS.find((account) => account.id === id)).filter((a): a is Account => Boolean(a));
  const openCount = ACCOUNTS.filter((account) => account.bidStatus === "No bid posted").length;
  const called = Object.values(rows).filter((row) => row.stage !== "New").length;

  async function copyAsk() {
    if (!selected) return;
    const text = `${selected.name}\n${selected.ask}\n${selected.next}`;
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-wide text-accent">OPEN TANK</p>
            <h1 className="text-2xl font-semibold leading-tight">Mississippi fuel buyers</h1>
            <p className="max-w-xl text-sm text-muted">
              {ACCOUNTS.length} accounts. {openCount} have no public bid. {called} moved off New on this device.
            </p>
          </div>
          <nav className="flex gap-2">
            {(
              [
                ["week", "This week"],
                ["map", "Map"],
                ["book", "Full book"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={`min-h-11 rounded-lg px-3 text-sm font-medium ${view === id ? "bg-accent text-ink" : "bg-raised text-fg"}`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_22rem] md:px-6">
        <section>
          {view === "week" && (
            <div className="space-y-3">
              <div className="rounded-lg border border-line bg-surface p-3">
                <p className="font-medium">Named in a public record</p>
                <p className="mt-1 text-sm text-muted">
                  {NAMED.length} accounts. The state bid site leaves the winner blank. These names come from minutes, a contract page, or a news story. If a county is not here, the supplier was not published.
                </p>
                <ul className="mt-3 space-y-2">
                  {NAMED.map((account) => (
                    <li key={account.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(account.id)}
                        className="w-full rounded-lg bg-raised px-3 py-3 text-left"
                      >
                        <span className="font-medium">{account.name}</span>
                        <span className="mt-1 block text-sm">{account.record}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-muted">
                October 5 is the first Monday, so a lot of boards meet that day. Nothing on the state site is an open fuel bid.
              </p>
              <ul className="space-y-2">
                {week.map((account) => (
                  <li key={account.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(account.id)}
                      className={`w-full rounded-lg border px-3 py-3 text-left ${selected?.id === account.id ? "border-accent bg-surface" : "border-line bg-surface"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-muted">{account.place}</p>
                        </div>
                        <span className={`shrink-0 font-mono text-xs ${statusClass(account.bidStatus)}`}>{account.bidStatus}</span>
                      </div>
                      <p className="mt-2 text-sm">{account.next}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {view === "map" && (
            <div className="rounded-lg border border-line bg-surface p-3">
              <p className="mb-3 text-sm text-muted">Amber means a public record names the supplier. Muted means no supplier was published. Rust means skip it or it is locked.</p>
              <div className="relative h-[28rem] overflow-hidden rounded-lg bg-bg md:h-[36rem]">
                {filtered.map((account) => {
                  const point = project(account);
                  const on = selected?.id === account.id;
                  return (
                    <button
                      key={account.id}
                      type="button"
                      title={account.name}
                      onClick={() => setSelectedId(account.id)}
                      className="absolute min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    >
                      <span
                        className={`mx-auto block rounded-full ${on ? "h-4 w-4 bg-fg" : account.record ? "h-3 w-3 bg-accent" : account.bidStatus === "Skip" || account.bidStatus === "Locked" ? "h-3 w-3 bg-stop" : "h-3 w-3 bg-muted"}`}
                      />
                    </button>
                  );
                })}
                <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-xs text-muted">
                  <p>North</p>
                  <p className="mt-16">Coast</p>
                </div>
              </div>
            </div>
          )}

          {view === "book" && (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 md:flex-row">
                <label className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-muted" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search a county, city, or school"
                    className="min-h-11 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-sm outline-none"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Filter label="Area" value={region} options={["All", ...REGIONS]} onChange={(value) => setRegion(value as Region | "All")} />
                <Filter label="Type" value={kind} options={["All", ...KINDS]} onChange={(value) => setKind(value as Kind | "All")} />
                <Filter label="Bid" value={status} options={["All", ...STATUSES]} onChange={(value) => setStatus(value as BidStatus | "All")} />
              </div>
              <p className="font-mono text-xs text-muted">{filtered.length} showing</p>
              <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
                {filtered.map((account) => (
                  <li key={account.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(account.id)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left ${selected?.id === account.id ? "bg-raised" : "bg-surface"}`}
                    >
                      <span>
                        <span className="block font-medium">{account.name}</span>
                        <span className="block text-sm text-muted">
                          {account.kind} · {account.product} · {stageOf(rows, account.id)}
                        </span>
                      </span>
                      <span className={`font-mono text-xs ${statusClass(account.bidStatus)}`}>{account.bidStatus}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {selected && (
          <aside className="h-fit rounded-lg border border-line bg-surface p-4 md:sticky md:top-4">
            <p className="font-mono text-xs text-muted">
              {selected.kind} · {selected.region}
            </p>
            <h2 className="mt-1 text-xl font-semibold">{selected.name}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted">
              <MapPin className="h-4 w-4" />
              {selected.place}
            </p>
            <p className={`mt-3 font-mono text-xs ${statusClass(selected.bidStatus)}`}>{selected.bidStatus}</p>
            {selected.record && (
              <div className="mt-4 rounded-lg bg-bg p-3">
                <p className="text-sm font-medium">Public record</p>
                <p className="mt-1 text-sm">{selected.record}</p>
              </div>
            )}

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-muted">Buyer</dt>
                <dd>{selected.buyer}</dd>
              </div>
              <div>
                <dt className="text-muted">What to sell</dt>
                <dd>{selected.product}</dd>
              </div>
              <div>
                <dt className="text-muted">How they buy</dt>
                <dd>{selected.how}</dd>
              </div>
              <div>
                <dt className="text-muted">Where it stands</dt>
                <dd>{selected.next}</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-lg bg-raised p-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-accent" />
                Say this
              </p>
              <p className="mt-2 text-sm">{selected.ask}</p>
              <button type="button" onClick={copyAsk} className="mt-3 min-h-11 rounded-lg bg-accent px-3 text-sm font-medium text-ink">
                {copied ? "Copied" : "Copy the ask"}
              </button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-muted">Stage</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {STAGES.map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setStage(selected.id, stage)}
                    className={`min-h-11 rounded-lg px-3 text-sm ${stageOf(rows, selected.id) === stage ? "bg-accent text-ink" : "bg-raised text-fg"}`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-4 block text-sm text-muted">
              Note
              <textarea
                value={noteOf(rows, selected.id)}
                onChange={(event) => setNote(selected.id, event.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-line bg-bg p-3 text-sm text-fg outline-none"
                placeholder="Who you talked to, and when the deal ends"
              />
            </label>
            {!selected.researched && (
              <p className="mt-3 text-xs text-muted">No public fuel notice for this one. The buying rule is statewide. The name of the current supplier is not.</p>
            )}
          </aside>
        )}
      </div>
    </main>
  );
}

function Filter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs text-muted">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block min-h-11 rounded-lg border border-line bg-surface px-2 text-sm text-fg"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
