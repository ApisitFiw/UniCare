"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MousePointerClick } from "lucide-react";

type Props = {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  placeName?: string;
};

export default function LocationPickerMap({
  lat,
  lng,
  onChange,
  placeName,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);

  // Keep latest onChange in ref
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialLat = Number.isFinite(lat) && lat !== 0 ? lat : 8.6434;
    const initialLng = Number.isFinite(lng) && lng !== 0 ? lng : 99.8984;

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 17,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const customPinIcon = L.divIcon({
      className: "modal-picker-pin",
      html: `
        <div style="position: relative; width: 36px; height: 36px; transform: translate(-50%, -50%);">
          <div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(16, 185, 129, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 36px; height: 36px; border-radius: 9999px; background: #10b981; color: white; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.35); cursor: grab;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: customPinIcon,
      draggable: true,
    }).addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onChangeRef.current(pos.lat, pos.lng);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChangeRef.current(e.latlng.lat, e.latlng.lng);
      map.panTo(e.latlng, { animate: true });
    });

    mapRef.current = map;
    markerRef.current = marker;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker & pan when lat/lng changes from outside (e.g. dropdown change)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const currentPos = markerRef.current.getLatLng();
    const distance = Math.hypot(currentPos.lat - lat, currentPos.lng - lng);

    if (distance > 0.00005) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng], 17, { animate: true });
    }
  }, [lat, lng]);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "230px",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1.5px solid #cbd5e1",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)",
          position: "relative",
          zIndex: 1,
        }}
      />
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span className="flex items-center gap-1.5 font-medium text-slate-700">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          พิกัด: {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
        </span>
        <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
          <MousePointerClick className="w-3.5 h-3.5 shrink-0" />
          <span>คลิกบนแผนที่หรือลากหมุดเพื่อเปลี่ยนจุด</span>
        </span>
      </div>
    </div>
  );
}
