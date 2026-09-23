"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { RiskArea } from "@/components/admin/RiskAreaTable";

/* =========================
   Leaflet Marker Icon
   ========================= */

const universityIcon = L.icon({
    iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize: [25, 41],

    iconAnchor: [12, 41],

    popupAnchor: [1, -34],

    shadowSize: [41, 41],
});

type Props = {
    areas: RiskArea[];
};

export default function RiskMap({ areas }: Props) {

    const mapRef = useRef<L.Map | null>(null);

    const containerRef =
        useRef<HTMLDivElement | null>(null);

    /* =========================
       Create Map
       ========================= */

    useEffect(() => {

        if (!containerRef.current) {
            return;
        }

        if (mapRef.current) {
            return;
        }

        const map = L.map(
            containerRef.current
        ).setView(
            [8.6434, 99.8984],
            16
        );

        /* =========================
           OpenStreetMap
           ========================= */

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    '&copy; OpenStreetMap contributors',
            }
        ).addTo(map);

        /* =========================
           Walailak University
           ========================= */

        L.marker(
            [8.6434, 99.8984],
            {
                icon: universityIcon,
            }
        )
            .addTo(map)
            .bindPopup(
                "<b>มหาวิทยาลัยวลัยลักษณ์</b>"
            );

        mapRef.current = map;

        /* =========================
           Fix Map Size
           ========================= */

        setTimeout(() => {

            map.invalidateSize();

        }, 100);

        /* =========================
           Cleanup
           ========================= */

        return () => {

            map.remove();

            mapRef.current = null;

        };

    }, []);

    /* =========================
       Risk Area Markers
       ========================= */

    useEffect(() => {

        const map = mapRef.current;

        if (!map) {
            return;
        }

        /*
         * ลบ marker พื้นที่เสี่ยงเดิม
         */

        map.eachLayer((layer) => {

            const marker =
                layer as L.Marker;

            if (
                marker instanceof L.Marker &&
                (marker.options as any)
                    .riskAreaMarker
            ) {

                map.removeLayer(marker);

            }

        });

        /* =========================
           Add Risk Areas
           ========================= */

        areas.forEach((area) => {

            const color =
                area.level === "สูงมาก"
                    ? "#ef476f"
                    : area.level === "สูง"
                        ? "#ee9b28"
                        : "#e6b52f";

            const marker =
                L.circleMarker(
                    [
                        area.lat,
                        area.lng,
                    ],
                    {
                        radius: 10,

                        fillColor: color,

                        color: "#ffffff",

                        weight: 2,

                        opacity: 1,

                        fillOpacity: 0.9,

                        riskAreaMarker: true,
                    } as any
                );

            marker
                .addTo(map)
                .bindPopup(`
                    <div style="min-width:180px">

                        <b>
                            ${area.name}
                        </b>

                        <br />

                        ปัญหา:
                        ${area.problem}

                        <br />

                        ระดับ:
                        ${area.level}

                    </div>
                `);

        });

    }, [areas]);

    /* =========================
       Render
       ========================= */

    return (

        <div className="map-container">

            <div
                ref={containerRef}
                className="risk-map"
            />

            {/* =========================
                Map Legend
                ========================= */}

            <div className="map-legend">

                <div className="legend-item">

                    <span
                        className="legend-dot very-high"
                    />

                    สูงมาก

                </div>

                <div className="legend-item">

                    <span
                        className="legend-dot high"
                    />

                    สูง

                </div>

                <div className="legend-item">

                    <span
                        className="legend-dot medium"
                    />

                    ปานกลาง

                </div>

            </div>

        </div>

    );
}