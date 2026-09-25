"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, RotateCcw, Search, Edit3, Trash2 } from "lucide-react";

export type RiskArea = {
    id: number | string;
    name: string;
    problem: string;
    level: "สูงมาก" | "สูง" | "ปานกลาง" | "เร่งด่วนมาก" | "เร่งด่วน" | "ปกติ" | "ปักหมุดแล้ว";
    lat: number;
    lng: number;
    issueCount?: number;
    category?: string;
    isPinned?: boolean;
};

type Props = {
    areas: RiskArea[];
    onAdd: () => void;
    onEdit: (area: RiskArea) => void;
    onDelete: (id: number | string, name?: string) => void;
    onResetDefault?: () => void;
};

export default function RiskAreaTable({
    areas,
    onAdd,
    onEdit,
    onDelete,
    onResetDefault,
}: Props) {

    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageInput, setPageInput] = useState<string>("");
    const ITEMS_PER_PAGE = 5;

    const filteredAreas = useMemo(() => {
        return areas.filter((area) =>
            `${area.name} ${area.problem} ${area.category || ""}`
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [areas, search]);

    // Reset to page 1 when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const totalPages = Math.max(1, Math.ceil(filteredAreas.length / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

    const paginatedAreas = useMemo(() => {
        const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
        return filteredAreas.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredAreas, safeCurrentPage]);

    const startIndex = filteredAreas.length === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredAreas.length);

    function handlePageInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        setPageInput(e.target.value);
    }

    function handlePageInputSubmit(e: React.FormEvent) {
        e.preventDefault();
        const parsed = parseInt(pageInput, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
            setCurrentPage(parsed);
            setPageInput("");
        }
    }

    function getLevelClass(
        level: RiskArea["level"]
    ) {
        switch (level) {
            case "สูงมาก":
            case "เร่งด่วนมาก":
                return "risk-badge very-high";

            case "สูง":
            case "เร่งด่วน":
                return "risk-badge high";

            case "ปักหมุดแล้ว":
                return "risk-badge normal";

            case "ปกติ":
            default:
                return "risk-badge normal";
        }
    }

    return (
        <div className="card">

            <div className="card-header">

                <div className="card-title">

                    <div className="card-title-icon">
                        <MapPin className="w-5 h-5 text-emerald-700" />
                    </div>

                    <div>
                        <h2>
                            ตำแหน่งสถานที่ปักหมุดและพื้นที่เสี่ยง
                        </h2>

                        <p>
                            จัดการพิกัดสถานที่ในมหาวิทยาลัย และติดตามสถานะความเสี่ยงตามจุดที่ปักหมุด
                        </p>
                    </div>

                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {onResetDefault && (
                        <button
                            type="button"
                            onClick={onResetDefault}
                            title="คืนค่าหมุดสถานที่ทั้งหมดเป็นค่าเริ่มต้น (25 จุดมาตรฐานบนแผนที่)"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "13px",
                                padding: "8px 14px",
                                border: "1px solid #cbd5e1",
                                borderRadius: "8px",
                                background: "#ffffff",
                                color: "#475569",
                                cursor: "pointer",
                                fontWeight: 500,
                                transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f1f5f9";
                                e.currentTarget.style.borderColor = "#94a3b8";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#ffffff";
                                e.currentTarget.style.borderColor = "#cbd5e1";
                            }}
                        >
                            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                            <span>คืนค่าเริ่มต้น (25 จุด)</span>
                        </button>
                    )}

                    <button
                        className="btn btn-green"
                        onClick={onAdd}
                        title="ปักหมุดสถานที่ใหม่จากหน้าแจ้งปัญหา"
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                        <MapPin className="w-4 h-4" />
                        <span>ปักหมุดสถานที่</span>
                    </button>
                </div>

            </div>

            <div className="search">

                <span className="search-icon">
                    <Search className="w-4 h-4 text-slate-400" />
                </span>

                <input
                    type="text"
                    placeholder="ค้นหาสถานที่, ปัญหา หรือหมวดหมู่..."
                    value={search}
                    onChange={(event) =>
                        setSearch(event.target.value)
                    }
                />

            </div>

            <div className="table-wrap">

                <table>

                    <thead>
                        <tr>
                            <th>ลำดับ</th>
                            <th>สถานที่ / พิกัด</th>
                            <th>ปัญหา / สถานะ</th>
                            <th>ระดับความเสี่ยง</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>

                    <tbody>

                        {filteredAreas.length === 0 ? (

                            <tr>
                                <td
                                    colSpan={5}
                                    style={{
                                        textAlign: "center",
                                        padding: "30px",
                                        color: "#888",
                                    }}
                                >
                                    ไม่พบสถานที่ที่ค้นหา
                                </td>
                            </tr>

                        ) : (

                            paginatedAreas.map(
                                (area, index) => (

                                    <tr key={area.id}>

                                        <td>
                                            {startIndex + index}
                                        </td>

                                        <td>
                                            <div className="category">

                                                <div
                                                    className="category-icon"
                                                    style={{
                                                        background: (area.issueCount && area.issueCount > 0) ? "#fee2e2" : "#e0f2fe",
                                                        color: (area.issueCount && area.issueCount > 0) ? "#ef4444" : "#0284c7",
                                                    }}
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                </div>

                                                <div>

                                                    <div className="category-name flex items-center gap-1.5">
                                                        <span>{area.name}</span>
                                                        {area.category && (
                                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                                                                {area.category}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="category-desc">
                                                        {area.lat.toFixed(4)},
                                                        {" "}
                                                        {area.lng.toFixed(4)}
                                                    </div>

                                                </div>

                                            </div>
                                        </td>

                                        <td>
                                            {area.issueCount && area.issueCount > 0 ? (
                                                <>
                                                    {area.issueCount > 1 && (
                                                        <span
                                                            style={{
                                                                background: "#e0f2fe",
                                                                color: "#0369a1",
                                                                fontSize: "11px",
                                                                padding: "2px 7px",
                                                                borderRadius: "9999px",
                                                                fontWeight: 600,
                                                                display: "inline-block",
                                                                marginRight: "6px",
                                                            }}
                                                        >
                                                            {area.issueCount} เรื่อง
                                                        </span>
                                                    )}
                                                    {area.problem}
                                                </>
                                            ) : (
                                                <span style={{ color: "#64748b", fontSize: "12px" }}>
                                                    จุดปักหมุดพร้อมใช้งาน (ยังไม่มีปัญหา)
                                                </span>
                                            )}
                                        </td>

                                        <td>
                                            {(!area.issueCount || area.issueCount === 0) ? (
                                                <span
                                                    className="risk-badge normal"
                                                    style={{ background: "#e0f2fe", color: "#0369a1", borderColor: "#bae6fd" }}
                                                >
                                                    ปักหมุดแล้ว
                                                </span>
                                            ) : (
                                                <span
                                                    className={getLevelClass(
                                                        area.level
                                                    )}
                                                >
                                                    {area.level}
                                                </span>
                                            )}
                                        </td>

                                        <td>

                                            <div className="actions">

                                                <button
                                                    className="action-btn edit"
                                                    title="แก้ไขพิกัดสถานที่"
                                                    onClick={() =>
                                                        onEdit(area)
                                                    }
                                                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                    className="action-btn delete"
                                                    title="ลบจุดปักหมุด"
                                                    onClick={() =>
                                                        onDelete(
                                                            area.id,
                                                            area.name
                                                        )
                                                    }
                                                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                )
                            )

                        )}

                    </tbody>

                </table>

            </div>

            {/* Pagination Controls */}
            {filteredAreas.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500 mt-2 px-1">
                <div className="text-[11px] text-slate-500">
                  แสดง <span className="font-semibold text-slate-800">{startIndex} - {endIndex}</span> จากทั้งหมด{" "}
                  <span className="font-semibold text-slate-800">{filteredAreas.length}</span> รายการ
                  {totalPages > 1 && (
                    <span className="ml-1 text-slate-400">
                      (หน้า <span className="font-semibold text-[#1b5e4a]">{safeCurrentPage}</span> / {totalPages})
                    </span>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center flex-wrap gap-2">
                    {/* Previous Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={safeCurrentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                      title="หน้าก่อนหน้า"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page Number Buttons */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-8 h-8 px-2 rounded-lg font-semibold text-xs transition cursor-pointer ${
                            safeCurrentPage === pageNum
                              ? "bg-[#1b5e4a] text-white shadow-xs"
                              : "bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={safeCurrentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                      title="หน้าถัดไป"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Page Jump Input */}
                    <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200">
                      <span className="text-[11px] text-slate-500">ไปที่หน้า:</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={pageInput}
                        onChange={handlePageInputChange}
                        placeholder={String(safeCurrentPage)}
                        className="w-12 text-center py-1 px-1.5 border border-slate-200 bg-[#f8faf9] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 font-medium"
                      />
                      <span className="text-[11px] text-slate-400">/ {totalPages}</span>
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-slate-100 hover:bg-[#1b5e4a] hover:text-white text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                      >
                        ไป
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

        </div>
    );
}