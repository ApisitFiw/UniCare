"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  AlertCircle,
  CheckCircle2,
  Palette,
  AlertTriangle,
  Clock,
  Check,
  X,
} from "lucide-react";

import {
  type LocationGroupedRiskArea,
  getGroupedRiskAreas,
} from "@/lib/issuesData";

const universityIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createPopupContent(area: LocationGroupedRiskArea): string {
  if (area.issueCount === 0) {
    return `
      <div style="min-width: 250px; max-width: 300px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="border-bottom: 1.5px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 10px;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
            <div>
              <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 4px;">
                ${escapeHtml(area.name)}
              </h4>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                พิกัด: ${area.lat.toFixed(4)}, ${area.lng.toFixed(4)}
              </div>
            </div>
            <span style="font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; white-space: nowrap;">
              จุดปักหมุด
            </span>
          </div>
        </div>
        <div style="padding: 10px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 11px; color: #475569; line-height: 1.5;">
          ${area.category ? `<div style="font-weight:600; color:#1e293b; margin-bottom:3px;">หมวดหมู่: ${escapeHtml(area.category)}</div>` : ""}
          ปักหมุดสถานที่เรียบร้อยแล้ว<br/>
          เมื่อมีผู้ใช้งานแจ้งปัญหาในสถานที่นี้ ตำแหน่งหมุดเตือนความเสี่ยงจะแสดงที่พิกัดนี้บนแผนที่โดยอัตโนมัติ
        </div>
        <div style="display: flex; gap: 8px; margin-top: 10px; padding-top: 8px; border-top: 1px solid #f1f5f9;">
          <button
            type="button"
            class="btn-popup-edit"
            style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 11px; font-weight: 600; color: #1e293b; cursor: pointer;"
          >
            แก้ไขหมุด
          </button>
          <button
            type="button"
            class="btn-popup-delete"
            style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 10px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; font-size: 11px; font-weight: 600; color: #e11d48; cursor: pointer;"
          >
            ลบหมุดนี้
          </button>
        </div>
        <div style="margin-top: 8px; text-align: center;">
          <a
            href="/admin/issues?area=${encodeURIComponent(area.name)}&mode=create"
            class="btn-goto-issues"
            style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; width: 100%; padding: 7px 10px; background: #0284c7; color: #ffffff; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none; cursor: pointer; box-shadow: 0 1px 2px rgba(2, 132, 199, 0.2);"
          >
            ไปที่ระบบติดตามและจัดการสถานะ &rarr;
          </a>
        </div>
      </div>
    `;
  }

  const urgencyColor = area.highestUrgencyColor;
  const urgencyBg =
    area.highestUrgency === "เร่งด่วนมาก"
      ? "#fee2e2"
      : area.highestUrgency === "เร่งด่วน"
        ? "#fef3c7"
        : "#d1fae5";
  const urgencyText =
    area.highestUrgency === "เร่งด่วนมาก"
      ? "#b91c1c"
      : area.highestUrgency === "เร่งด่วน"
        ? "#b45309"
        : "#047857";

  const issuesListHtml = area.issues
    .map((issue) => {
      const uBg =
        issue.urgency === "เร่งด่วนมาก"
          ? "#fee2e2"
          : issue.urgency === "เร่งด่วน"
            ? "#fef3c7"
            : "#d1fae5";
      const uColor =
        issue.urgency === "เร่งด่วนมาก"
          ? "#b91c1c"
          : issue.urgency === "เร่งด่วน"
            ? "#b45309"
            : "#047857";

      const sBg =
        issue.status === "resolved"
          ? "#dcfce7"
          : issue.status === "in_progress"
            ? "#dbeafe"
            : "#ffedd5";
      const sColor =
        issue.status === "resolved"
          ? "#15803d"
          : issue.status === "in_progress"
            ? "#1d4ed8"
            : "#c2410c";

      return `
        <div style="padding: 10px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
            <span style="font-weight: 700; color: #0f172a; font-size: 11px;">#${escapeHtml(issue.id)}</span>
            <div style="display: flex; gap: 4px; align-items: center;">
              <span style="font-size: 10px; padding: 2px 7px; border-radius: 9999px; font-weight: 600; background: ${uBg}; color: ${uColor};">
                ${issue.urgency || "ปกติ"}
              </span>
              <span style="font-size: 10px; padding: 2px 7px; border-radius: 9999px; font-weight: 600; background: ${sBg}; color: ${sColor};">
                ${escapeHtml(issue.statusLabel)}
              </span>
            </div>
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #1e293b; margin-bottom: 3px;">
            ${escapeHtml(issue.category)}
          </div>
          <div style="font-size: 11px; color: #475569; line-height: 1.45; margin-bottom: 6px;">
            ${escapeHtml(issue.description)}
          </div>
          <div style="font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #f1f5f9; padding-top: 5px;">
            <span>${escapeHtml(issue.date)}</span>
            <a
              href="/admin/issues?issueId=${encodeURIComponent(issue.id)}"
              class="btn-goto-issues"
              style="display: inline-flex; align-items: center; gap: 3px; font-size: 10.5px; color: #1b5e4a; font-weight: 600; text-decoration: none; padding: 2px 7px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 5px; cursor: pointer;"
            >
              <span>จัดการปัญหานี้</span> &rarr;
            </a>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div style="min-width: 270px; max-width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Header -->
      <div style="border-bottom: 1.5px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 10px;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
          <div>
            <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 4px;">
              ${escapeHtml(area.name)}
            </h4>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              พิกัด: ${area.lat.toFixed(4)}, ${area.lng.toFixed(4)}
            </div>
          </div>
          <span style="font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; background: ${urgencyBg}; color: ${urgencyText}; border: 1px solid ${urgencyColor}40; white-space: nowrap;">
            ${area.highestUrgency}
          </span>
        </div>
        <div style="margin-top: 6px; font-size: 11px; color: #475569; display: flex; align-items: center; justify-content: space-between;">
          <span>จำนวนปัญหาที่พบ: <b>${area.issueCount} เรื่อง</b></span>
          ${area.issueCount > 1 ? `<span style="font-size: 10px; color: #0284c7; font-weight: 500;">(แสดงตามความสำคัญ)</span>` : ""}
        </div>
      </div>

      <!-- Issues List -->
      <div style="max-height: 220px; overflow-y: auto; padding-right: 2px;">
        ${issuesListHtml}
      </div>

      <!-- Footer Link & Actions -->
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #f1f5f9;">
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <button
            type="button"
            class="btn-popup-edit"
            style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 5px 8px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 11px; font-weight: 600; color: #1e293b; cursor: pointer;"
          >
            แก้ไขตำแหน่งหมุด
          </button>
          <button
            type="button"
            class="btn-popup-delete"
            style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 5px 8px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; font-size: 11px; font-weight: 600; color: #e11d48; cursor: pointer;"
          >
            ลบหมุด
          </button>
        </div>
        <div style="text-align: center;">
          <a
            href="/admin/issues?issueId=${encodeURIComponent(area.issues[0]?.id || '')}"
            class="btn-goto-issues"
            style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; width: 100%; padding: 7px 10px; background: #1b5e4a; color: #ffffff; border-radius: 6px; font-size: 11.5px; font-weight: 600; text-decoration: none; cursor: pointer; box-shadow: 0 1px 2px rgba(27, 94, 74, 0.2);"
          >
            ไปที่ระบบติดตามและจัดการสถานะ &rarr;
          </a>
        </div>
      </div>
    </div>
  `;
}

type Props = {
  areas?: LocationGroupedRiskArea[];
  isPinningMode?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onCancelPinning?: () => void;
  onEditArea?: (area: LocationGroupedRiskArea) => void;
  onDeleteArea?: (id: number | string, name: string) => void;
};

export default function RiskMap({
  areas,
  isPinningMode,
  onMapClick,
  onCancelPinning,
  onEditArea,
  onDeleteArea,
}: Props) {
  const router = useRouter();
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onEditAreaRef = useRef(onEditArea);
  const onDeleteAreaRef = useRef(onDeleteArea);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    onEditAreaRef.current = onEditArea;
  }, [onEditArea]);

  useEffect(() => {
    onDeleteAreaRef.current = onDeleteArea;
  }, [onDeleteArea]);

  /* =========================
     Create Map
     ========================= */
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(containerRef.current).setView([8.6434, 99.8984], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.marker([8.6434, 99.8984], {
      icon: universityIcon,
    })
      .addTo(map)
      .bindPopup("<b>มหาวิทยาลัยวลัยลักษณ์</b><br/><span style='font-size:11px;color:#64748b;'>ศูนย์กลางมหาวิทยาลัย</span>");

    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* =========================
     Handle Map Click in Pinning Mode
     ========================= */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const clickHandler = (e: L.LeafletMouseEvent) => {
      if (isPinningMode && onMapClickRef.current) {
        onMapClickRef.current(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on("click", clickHandler);
    return () => {
      map.off("click", clickHandler);
    };
  }, [isPinningMode]);

  /* =========================
     Risk Area Markers
     ========================= */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // ลบ marker เดิมออก
    map.eachLayer((layer: L.Layer) => {
      const marker = layer as any;
      if (marker && marker.options && marker.options.riskAreaMarker) {
        map.removeLayer(marker);
      }
    });

    // กำหนดรายการพื้นที่ที่เกิดปัญหา (ถ้าไม่ได้ส่งมาให้คำนวณจาก getAllCurrentIssues)
    const effectiveAreas =
      areas && areas.length > 0 ? areas : getGroupedRiskAreas();

    effectiveAreas.forEach((area) => {
      const pulseHtml =
        area.issueCount > 0 && area.highestUrgency === "เร่งด่วนมาก"
          ? `<div class="marker-pulse"></div>`
          : "";

      const iconContent =
        area.issueCount > 0
          ? `<span style="font-weight: 700; font-size: 13px;">${area.issueCount}</span>`
          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
      const pinBgColor = area.issueCount > 0 ? area.highestUrgencyColor : "#0284c7";
      const pinTitle =
        area.issueCount > 0
          ? `${escapeHtml(area.name)} (${area.highestUrgency}: ${area.issueCount} เรื่อง)`
          : `${escapeHtml(area.name)} (จุดปักหมุดสถานที่)`;

      const customIcon = L.divIcon({
        className: "custom-risk-pin",
        html: `
          <div class="risk-pin-wrapper">
            ${pulseHtml}
            <div class="risk-pin" style="background-color: ${pinBgColor};" title="${pinTitle}">
              ${iconContent}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([area.lat, area.lng], {
        icon: customIcon,
        riskAreaMarker: true,
      } as any);

      marker.addTo(map).bindPopup(createPopupContent(area), {
        maxWidth: 340,
        minWidth: 270,
        className: "risk-custom-popup",
        autoPan: true,
      });

      marker.on("popupopen", (e: any) => {
        const popupNode = e.popup?.getElement();
        if (!popupNode) return;

        const editBtn = popupNode.querySelector(".btn-popup-edit");
        if (editBtn) {
          editBtn.addEventListener("click", () => {
            marker.closePopup();
            if (onEditAreaRef.current) {
              onEditAreaRef.current(area);
            }
          });
        }

        const deleteBtn = popupNode.querySelector(".btn-popup-delete");
        if (deleteBtn) {
          deleteBtn.addEventListener("click", () => {
            marker.closePopup();
            if (onDeleteAreaRef.current) {
              onDeleteAreaRef.current(area.id, area.name);
            }
          });
        }

        const gotoButtons = popupNode.querySelectorAll(".btn-goto-issues");
        gotoButtons.forEach((btn: Element) => {
          btn.addEventListener("click", (evt: Event) => {
            evt.preventDefault();
            const href = btn.getAttribute("href");
            if (href) {
              marker.closePopup();
              router.push(href);
            }
          });
        });
      });
    });
  }, [areas]);

  return (
    <div className="flex flex-col">
      <div
        className="map-container relative"
        style={{
          overflow: "hidden",
          height: "360px",
          marginBottom: "14px",
        }}
      >
        {isPinningMode && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              background: "#1b5e4a",
              color: "#ffffff",
              padding: "8px 18px",
              borderRadius: "9999px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              border: "2px solid rgba(255,255,255,0.4)",
            }}
          >
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
              <MapPin className="w-4 h-4 text-emerald-100" /> คลิกบนแผนที่ตรงจุดที่ต้องการปักหมุด
            </span>
            {onCancelPinning && (
              <button
                type="button"
                onClick={onCancelPinning}
                className="inline-flex items-center gap-1"
                style={{
                  background: "rgba(255,255,255,0.25)",
                  border: "none",
                  borderRadius: "9999px",
                  padding: "3px 10px",
                  color: "#ffffff",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <X className="w-3 h-3" /> ยกเลิก
              </button>
            )}
          </div>
        )}

        <div
          ref={containerRef}
          className="risk-map"
          style={{
            cursor: isPinningMode ? "crosshair" : "grab",
          }}
        />
      </div>

      {/* =========================
          Map Legend Section (ระดับความสำคัญของพื้นที่: จัดแสดงให้อ่านง่าย ชัดเจน ไม่บังแผนที่)
          ========================= */}
      <div className="border-t border-slate-200/90 bg-[#f8faf9] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
              <Palette className="w-3.5 h-3.5" />
            </span>
            <h4 className="text-[13px] font-bold text-slate-800 tracking-tight">
              ระดับความสำคัญของพื้นที่ (ความหมายของสีหมุดบนแผนที่)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            * สีหมุดจะแสดงตามปัญหาที่มีระดับความเร่งด่วนสูงสุดในสถานที่นั้น
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* เร่งด่วนมาก */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-red-50/90 border border-red-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0 border-2 border-white ring-2 ring-red-400/40">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-red-950">เร่งด่วนมาก</div>
              <div className="text-[10px] text-red-700 font-medium">หมุดสีแดง</div>
            </div>
          </div>

          {/* เร่งด่วน */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-[#f59e0b] text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0 border-2 border-white ring-2 ring-amber-400/40">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-amber-950">เร่งด่วน</div>
              <div className="text-[10px] text-amber-700 font-medium">หมุดสีเหลือง</div>
            </div>
          </div>

          {/* ปกติ */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-[#10b981] text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0 border-2 border-white ring-2 ring-emerald-400/40">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-emerald-950">ปกติ</div>
              <div className="text-[10px] text-emerald-700 font-medium">หมุดสีเขียว</div>
            </div>
          </div>

          {/* จุดปักหมุด */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-sky-50/90 border border-sky-200/90 shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0 border-2 border-white ring-2 ring-sky-400/40">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-sky-950">จุดปักหมุด</div>
              <div className="text-[10px] text-sky-700 font-medium">หมุดสีฟ้า (ไม่มีปัญหา)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}