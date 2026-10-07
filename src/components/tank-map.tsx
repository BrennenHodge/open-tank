import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { Site } from "@/data/sites";
import "leaflet/dist/leaflet.css";

type Props = {
  sites: Site[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

type Hit = { x: number; y: number; ids: string[]; single: boolean };

export function TankMap({ sites, selectedId, onSelect }: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const sitesRef = useRef(sites);
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const redrawRef = useRef<() => void>(() => {});
  sitesRef.current = sites;
  selectedRef.current = selectedId;
  onSelectRef.current = onSelect;

  useEffect(() => {
    redrawRef.current();
  }, [sites, selectedId]);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    let map: LeafletMap | null = null;
    let cancelled = false;
    const canvas = document.createElement("canvas");
    canvas.className = "pointer-events-none";

    void (async () => {
      const leaflet = await import("leaflet");
      if (cancelled || !holder.current) return;
      const L = leaflet.default;
      map = L.map(holder.current, {
        zoomControl: true,
        attributionControl: true,
        minZoom: 6,
        maxZoom: 16,
      }).setView([32.7, -89.65], 7);
      map.setMaxBounds(L.latLngBounds([29.2, -93.2], [36.2, -86.6]));
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      map.getPane("overlayPane")?.appendChild(canvas);

      const colorOf = () => {
        const css = getComputedStyle(document.documentElement);
        const pick = (name: string) => css.getPropertyValue(name).trim();
        return {
          call: pick("--color-accent"),
          read: pick("--color-muted"),
          station: pick("--color-fg"),
          theirs: pick("--color-stop"),
          ink: pick("--color-ink"),
        };
      };

      const redraw = () => {
        if (!map) return;
        const size = map.getSize();
        const dpr = window.devicePixelRatio || 1;
        L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
        canvas.width = Math.max(1, size.x) * dpr;
        canvas.height = Math.max(1, size.y) * dpr;
        canvas.style.width = `${size.x}px`;
        canvas.style.height = `${size.y}px`;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size.x, size.y);
        const palette = colorOf();
        const cell = map.getZoom() >= 12 ? 16 : 32;
        const buckets = new Map<string, { x: number; y: number; sites: Site[] }>();
        for (const site of sitesRef.current) {
          if (site.lat == null || site.lng == null) continue;
          const point = map.latLngToContainerPoint([site.lat, site.lng]);
          if (point.x < -40 || point.y < -40 || point.x > size.x + 40 || point.y > size.y + 40) continue;
          const key = `${Math.round(point.x / cell)}:${Math.round(point.y / cell)}`;
          const bucket = buckets.get(key);
          if (bucket) bucket.sites.push(site);
          else buckets.set(key, { x: point.x, y: point.y, sites: [site] });
        }
        const hits: Hit[] = [];
        const selected = selectedRef.current;
        for (const bucket of buckets.values()) {
          const count = bucket.sites.length;
          const focused = bucket.sites.some((site) => site.id === selected);
          if (count === 1) {
            const site = bucket.sites[0];
            const radius = site.group === "call" ? 7 : 5;
            ctx.beginPath();
            ctx.fillStyle = palette[site.group];
            ctx.globalAlpha = site.group === "station" ? 0.45 : 0.95;
            ctx.arc(bucket.x, bucket.y, focused ? radius + 3 : radius, 0, Math.PI * 2);
            ctx.fill();
            if (focused) {
              ctx.globalAlpha = 1;
              ctx.lineWidth = 2;
              ctx.strokeStyle = palette.ink;
              ctx.stroke();
            }
            hits.push({ x: bucket.x, y: bucket.y, ids: [site.id], single: true });
          } else {
            const radius = Math.min(22, 11 + Math.log2(count) * 2);
            ctx.globalAlpha = 0.95;
            ctx.beginPath();
            ctx.fillStyle = palette.call;
            ctx.arc(bucket.x, bucket.y, focused ? radius + 2 : radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = palette.ink;
            ctx.font = "600 12px IBM Plex Mono, ui-monospace, monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(String(count), bucket.x, bucket.y + 1);
            hits.push({
              x: bucket.x,
              y: bucket.y,
              ids: bucket.sites.map((site) => site.id),
              single: false,
            });
          }
        }
        ctx.globalAlpha = 1;
        (canvas as HTMLCanvasElement & { hits?: Hit[] }).hits = hits;
      };

      redrawRef.current = redraw;
      map.on("move", redraw);
      map.on("zoom", redraw);
      map.on("resize", redraw);
      map.on("click", (event) => {
        if (!map) return;
        const hits = (canvas as HTMLCanvasElement & { hits?: Hit[] }).hits ?? [];
        const point = event.containerPoint;
        let best: Hit | null = null;
        let bestDistance = 24;
        for (const hit of hits) {
          const distance = Math.hypot(hit.x - point.x, hit.y - point.y);
          const reach = hit.single ? 14 : 24;
          if (distance <= reach && distance < bestDistance) {
            best = hit;
            bestDistance = distance;
          }
        }
        if (!best) return;
        if (best.single || map.getZoom() >= 14) {
          const picked =
            best.ids.find((id) => id === selectedRef.current) ??
            sitesRef.current.find((site) => best?.ids.includes(site.id) && site.group === "call")?.id ??
            best.ids[0];
          onSelectRef.current(picked);
          return;
        }
        const chosen = sitesRef.current.filter(
          (site) => best?.ids.includes(site.id) && site.lat != null && site.lng != null,
        );
        if (chosen.length === 0) return;
        const bounds = L.latLngBounds(
          chosen.map((site) => [site.lat as number, site.lng as number] as [number, number]),
        );
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        map.fitBounds(bounds.pad(0.35), {
          maxZoom: Math.min(map.getZoom() + 3, 15),
          animate: !reduce,
        });
      });

      const observer = new ResizeObserver(() => map?.invalidateSize());
      observer.observe(holder.current);
      const selected = sitesRef.current.find((site) => site.id === selectedRef.current);
      if (selected?.lat != null && selected.lng != null) {
        map.setView([selected.lat, selected.lng], 11);
      }
      redraw();
      (map as LeafletMap & { observer?: ResizeObserver }).observer = observer;
    })();

    return () => {
      cancelled = true;
      redrawRef.current = () => {};
      const extra = map as (LeafletMap & { observer?: ResizeObserver }) | null;
      extra?.observer?.disconnect();
      map?.remove();
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={holder}
      className="tank-map w-full overflow-hidden rounded-lg border border-line"
      role="img"
      aria-label="Map of buried fuel tanks in Mississippi"
    />
  );
}
