"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import Header from "@/components/Header";
import CategoryManager from "@/components/CategoryManager";

import RiskAreaTable, {
    type RiskArea,
} from "@/components/RiskAreaTable";

import {
    type LocationGroupedRiskArea,
    getGroupedRiskAreas,
    ALL_REPORT_PLACES,
    getPinnedLocations,
    savePinnedLocation,
    deletePinnedLocation,
    resetPinnedLocationsToDefault,
} from "@/lib/issuesData";

const RiskMap = dynamic(
    () => import("@/app/admin/RiskMap"),
    { ssr: false }
);

const LocationPickerMap = dynamic(
    () => import("@/components/LocationPickerMap"),
    { ssr: false }
);

import DeleteModal from "@/components/DeleteModal";

export default function CategoriesPage() {

    /* =========================
       GROUPED RISK AREAS (FROM STATUS TRACKING & PINNED LOCATIONS)
    ========================= */

    const [groupedAreas, setGroupedAreas] =
        useState<LocationGroupedRiskArea[]>([]);

    useEffect(() => {
        const updateAreas = () => {
            setGroupedAreas(getGroupedRiskAreas());
        };

        updateAreas();

        window.addEventListener("storage", updateAreas);
        window.addEventListener("unicare-demo-reports-updated", updateAreas);
        window.addEventListener("unicare-pinned-locations-updated", updateAreas);
        window.addEventListener("focus", updateAreas);

        return () => {
            window.removeEventListener("storage", updateAreas);
            window.removeEventListener("unicare-demo-reports-updated", updateAreas);
            window.removeEventListener("unicare-pinned-locations-updated", updateAreas);
            window.removeEventListener("focus", updateAreas);
        };
    }, []);

    const displayRiskAreas: RiskArea[] = useMemo(() => {
        return groupedAreas.map((g, idx) => ({
            id: g.id || idx + 1,
            name: g.name,
            problem: g.issueCount > 0
                ? (g.issueCount > 1 ? `ปัญหาสำคัญ: ${g.primaryProblem}` : g.primaryProblem)
                : "จุดปักหมุดพร้อมใช้งาน (ยังไม่มีปัญหา)",
            level: g.issueCount > 0 ? g.highestUrgency : "ปักหมุดแล้ว",
            lat: g.lat,
            lng: g.lng,
            issueCount: g.issueCount,
            category: g.category,
            isPinned: g.isPinned,
        }));
    }, [groupedAreas]);

    /* =========================
       PIN LOCATION MODAL
    ========================= */

    const [editingArea, setEditingArea] =
        useState<RiskArea | null>(null);

    const [showRiskModal, setShowRiskModal] =
        useState(false);

    const [selectedPlaceName, setSelectedPlaceName] =
        useState<string>("");

    const [customName, setCustomName] =
        useState("");

    const [selectedCategory, setSelectedCategory] =
        useState("");

    const [lat, setLat] =
        useState("");

    const [lng, setLng] =
        useState("");

    const [description, setDescription] =
        useState("");

    /* =========================
       PINNING MODE ON MAIN MAP
    ========================= */

    const [isPinningMode, setIsPinningMode] =
        useState(false);

    function togglePinningMode() {
        setIsPinningMode((prev) => !prev);
    }

    function handleMainMapClick(clickedLat: number, clickedLng: number) {
        setIsPinningMode(false);
        setEditingArea(null);
        const defaultPlace = ALL_REPORT_PLACES[0];
        setSelectedPlaceName(defaultPlace.name);
        setCustomName("");
        setSelectedCategory(defaultPlace.category);
        setLat(clickedLat.toFixed(4));
        setLng(clickedLng.toFixed(4));
        setDescription("");
        setShowRiskModal(true);
    }

    /* =========================
       DELETE MODAL STATE
    ========================= */

    const [deleteId, setDeleteId] =
        useState<number | string | null>(null);

    const [deleteTargetName, setDeleteTargetName] =
        useState<string>("");

    const [originalPinName, setOriginalPinName] =
        useState<string>("");

    // Group places by category for the dropdown
    const groupedPlaces = useMemo(() => {
        const result: Record<string, typeof ALL_REPORT_PLACES> = {};
        ALL_REPORT_PLACES.forEach((p) => {
            if (!result[p.category]) result[p.category] = [];
            result[p.category].push(p);
        });
        return result;
    }, []);

    const activePlaceName =
        selectedPlaceName === "__custom__"
            ? customName.trim()
            : selectedPlaceName;

    const existingIssuesInPlace = useMemo(() => {
        if (!activePlaceName) return [];
        const group = groupedAreas.find(
            (g) => g.name.toLowerCase() === activePlaceName.toLowerCase()
        );
        return group?.issues || [];
    }, [activePlaceName, groupedAreas]);

    /* =========================
       ADD PINNED LOCATION
    ========================= */

    function addRiskArea() {
        setIsPinningMode(false);
        setEditingArea(null);
        setOriginalPinName("");
        const defaultPlace = ALL_REPORT_PLACES[0];
        setSelectedPlaceName(defaultPlace.name);
        setCustomName("");
        setSelectedCategory(defaultPlace.category);

        const currentPinned = getPinnedLocations().find(
            (p) => p.name === defaultPlace.name
        );
        if (currentPinned) {
            setLat(currentPinned.lat.toFixed(4));
            setLng(currentPinned.lng.toFixed(4));
        } else {
            setLat(defaultPlace.defaultLat.toFixed(4));
            setLng(defaultPlace.defaultLng.toFixed(4));
        }

        setDescription("");
        setShowRiskModal(true);
    }

    /* =========================
       EDIT PINNED LOCATION
    ========================= */

    function editRiskArea(area: RiskArea) {
        setEditingArea(area);
        setOriginalPinName(area.name);
        const matched = ALL_REPORT_PLACES.find(
            (p) => p.name.toLowerCase() === area.name.toLowerCase()
        );
        if (matched) {
            setSelectedPlaceName(matched.name);
            setCustomName("");
            setSelectedCategory(matched.category);
        } else {
            setSelectedPlaceName("__custom__");
            setCustomName(area.name);
            setSelectedCategory(area.category || "สถานที่ทั่วไป");
        }

        setLat(String(area.lat));
        setLng(String(area.lng));

        const currentPinned = getPinnedLocations().find(
            (p) => p.id === String(area.id) || p.name.toLowerCase() === area.name.toLowerCase()
        );
        if (currentPinned && currentPinned.description) {
            setDescription(currentPinned.description);
        } else {
            setDescription(
                area.problem.includes("จุดปักหมุด") ? "" : area.problem
            );
        }
        setShowRiskModal(true);
    }

    function handleEditFromMap(locArea: LocationGroupedRiskArea) {
        editRiskArea({
            id: locArea.id,
            name: locArea.name,
            problem: locArea.issueCount > 0 ? locArea.primaryProblem : "จุดปักหมุดพร้อมใช้งาน (ยังไม่มีปัญหา)",
            level: locArea.issueCount > 0 ? locArea.highestUrgency : "ปักหมุดแล้ว",
            lat: locArea.lat,
            lng: locArea.lng,
            issueCount: locArea.issueCount,
            category: locArea.category,
            isPinned: locArea.isPinned,
        });
    }

    function handleDeleteFromMap(id: number | string, name: string) {
        deleteRiskArea(id, name);
    }

    function handlePlaceSelectChange(val: string) {
        setSelectedPlaceName(val);
        if (val === "__custom__") {
            setCustomName("");
            setSelectedCategory("สถานที่ทั่วไป");
            setLat("8.6434");
            setLng("99.8984");
        } else {
            const place = ALL_REPORT_PLACES.find((p) => p.name === val);
            if (place) {
                setCustomName("");
                setSelectedCategory(place.category);
                const currentPinned = getPinnedLocations().find(
                    (p) => p.name === place.name
                );
                if (currentPinned) {
                    setLat(currentPinned.lat.toFixed(4));
                    setLng(currentPinned.lng.toFixed(4));
                } else {
                    setLat(place.defaultLat.toFixed(4));
                    setLng(place.defaultLng.toFixed(4));
                }
            }
        }
    }

    /* =========================
       SAVE PINNED LOCATION
    ========================= */

    function saveRiskArea() {
        const finalName =
            selectedPlaceName === "__custom__"
                ? customName.trim()
                : selectedPlaceName.trim();

        if (!finalName) {
            alert("กรุณาเลือกหรือระบุชื่อสถานที่");
            return;
        }

        const latitude = Number.parseFloat(lat);
        const longitude = Number.parseFloat(lng);

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            alert("กรุณากรอกพิกัด Latitude และ Longitude ให้ถูกต้อง");
            return;
        }

        savePinnedLocation({
            id: editingArea?.id ? String(editingArea.id) : undefined,
            originalName: originalPinName || editingArea?.name,
            name: finalName,
            category: selectedCategory || "สถานที่ทั่วไป",
            lat: latitude,
            lng: longitude,
            description: description.trim(),
        });

        setGroupedAreas(getGroupedRiskAreas());
        closeRiskModal();
    }

    /* =========================
       DELETE PINNED LOCATION
    ========================= */

    function deleteRiskArea(id: number | string, name?: string) {
        setDeleteId(id);
        const target = displayRiskAreas.find((a) => a.id === id);
        setDeleteTargetName(name || target?.name || "");
    }

    /* =========================
       CONFIRM DELETE
    ========================= */

    function confirmDeleteRiskArea() {
        if (deleteId === null && !deleteTargetName) {
            return;
        }

        const target = displayRiskAreas.find((a) => a.id === deleteId);
        const nameToDelete = deleteTargetName || target?.name || "";
        const idToDelete = deleteId !== null ? String(deleteId) : (target ? String(target.id) : "");

        if (idToDelete) {
            deletePinnedLocation(idToDelete);
        }
        if (nameToDelete) {
            deletePinnedLocation(nameToDelete);
        }

        setGroupedAreas(getGroupedRiskAreas());
        setDeleteId(null);
        setDeleteTargetName("");
    }

    function cancelDelete() {
        setDeleteId(null);
        setDeleteTargetName("");
    }

    const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

    function handleResetDefaultPins() {
        setShowResetConfirmModal(true);
    }

    function confirmResetDefaultPins() {
        resetPinnedLocationsToDefault();
        setGroupedAreas(getGroupedRiskAreas());
        setShowResetConfirmModal(false);
    }

    function closeRiskModal() {
        setShowRiskModal(false);
        setEditingArea(null);
        setOriginalPinName("");
        setSelectedPlaceName("");
        setCustomName("");
        setSelectedCategory("");
        setLat("");
        setLng("");
        setDescription("");
    }

    return (
        <div className="flex-1 flex flex-col min-w-0">
            {/* HEADER */}
            <Header
                title="ระบบหมวดหมู่และจัดการพื้นที่เสี่ยงสูง"
                subtitle="จัดการประเภทของปัญหา และกำหนดพื้นที่เสี่ยงสูงภายในมหาวิทยาลัย เพื่อการจัดการที่รวดเร็วและมีประสิทธิภาพ"
                role="ADMIN"
            />

            {/* MAIN */}
            <main className="p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl w-full mx-auto">

                {/* PAGE TITLE */}
                <div className="page-title space-y-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                        ⚙️ ระบบหมวดหมู่และจัดการพื้นที่เสี่ยงสูง
                    </h1>

                    <p className="text-xs sm:text-sm font-normal text-slate-500">
                        จัดการประเภทของปัญหา และกำหนดพื้นที่เสี่ยงสูงภายในมหาวิทยาลัย
                        เพื่อการจัดการที่รวดเร็วและมีประสิทธิภาพ
                    </p>
                </div>

                    {/* =========================
                        DASHBOARD
                    ========================= */}

                    <div className="dashboard-grid">

                        {/* =========================
                            CATEGORY
                        ========================= */}

                        <CategoryManager />

                        {/* =========================
                            RISK MAP
                        ========================= */}

                        <div className="card">

                            <div className="card-header">

                                <div className="card-title">

                                    <div className="card-title-icon">
                                        🗺️
                                    </div>

                                    <div>

                                        <h2>
                                            แผนที่พื้นที่เสี่ยง
                                        </h2>

                                        <p>
                                            แสดงตำแหน่งและระดับความเสี่ยง
                                        </p>

                                    </div>

                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className={`btn ${isPinningMode ? "btn-red" : "btn-green"}`}
                                        onClick={togglePinningMode}
                                        title={
                                            isPinningMode
                                                ? "ยกเลิกโหมดคลิกปักหมุดบนแผนที่"
                                                : "คลิกเพื่อเลือกจุดบนแผนที่โดยตรง"
                                        }
                                    >
                                        {isPinningMode
                                            ? "✕ ยกเลิกโหมดปักหมุด"
                                            : "📍 ปักหมุดบนแผนที่"}
                                    </button>
                                </div>

                            </div>

                            <RiskMap
                                areas={groupedAreas}
                                isPinningMode={isPinningMode}
                                onMapClick={handleMainMapClick}
                                onCancelPinning={() => setIsPinningMode(false)}
                                onEditArea={handleEditFromMap}
                                onDeleteArea={handleDeleteFromMap}
                            />

                        </div>

                        {/* =========================
                            RISK AREA TABLE
                        ========================= */}

                        <RiskAreaTable
                            areas={displayRiskAreas}
                            onAdd={
                                addRiskArea
                            }
                            onEdit={
                                editRiskArea
                            }
                            onDelete={
                                deleteRiskArea
                            }
                            onResetDefault={
                                handleResetDefaultPins
                            }
                        />

                    </div>

            </main>

            {/* =========================
                PIN LOCATION MODAL
            ========================= */}

            {showRiskModal && (

                <div
                    className="modal"
                    style={{
                        display: "flex",
                    }}
                    onClick={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeRiskModal();
                        }

                    }}
                >

                    <div className="modal-content" style={{ maxWidth: "560px" }}>

                        {/* MODAL HEADER */}

                        <div className="modal-header">

                            <div>
                                <h3>
                                    {editingArea
                                        ? "📍 แก้ไขตำแหน่งปักหมุดสถานที่"
                                        : "📍 ปักหมุดสถานที่ใหม่"}
                                </h3>
                                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
                                    เลือกสถานที่จากแบบฟอร์มหน้าแจ้งปัญหา และระบุพิกัดตำแหน่งบนแผนที่
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={
                                    closeRiskModal
                                }
                            >
                                ×
                            </button>

                        </div>

                        {/* SELECT PLACE FROM REPORT PAGE */}

                        <div className="form-group">

                            <label>
                                สถานที่ (จากหน้าแจ้งปัญหาทั้งหมด)
                            </label>

                            <select
                                value={selectedPlaceName}
                                onChange={(event) =>
                                    handlePlaceSelectChange(
                                        event.target.value
                                    )
                                }
                            >
                                {Object.entries(groupedPlaces).map(([cat, places]) => (
                                    <optgroup key={cat} label={`📂 ${cat}`}>
                                        {places.map((place) => (
                                            <option key={place.name} value={place.name}>
                                                {place.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                                <optgroup label="⚙️ อื่นๆ">
                                    <option value="__custom__">
                                        ✏️ กำหนดชื่อสถานที่เอง...
                                    </option>
                                </optgroup>
                            </select>

                        </div>

                        {selectedPlaceName === "__custom__" && (
                            <div className="form-group">
                                <label>
                                    ระบุชื่อสถานที่
                                </label>
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={(event) =>
                                        setCustomName(event.target.value)
                                    }
                                    placeholder="เช่น อาคารกิจกรรมนักศึกษา, ประตู 1..."
                                />
                            </div>
                        )}

                        {/* STATUS PREVIEW BOX */}
                        <div style={{ marginBottom: "16px" }}>
                            {existingIssuesInPlace.length > 0 ? (
                                <div
                                    style={{
                                        padding: "10px 12px",
                                        background: "#fef3c7",
                                        border: "1px solid #fde68a",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                        color: "#92400e",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: 600,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "5px",
                                        }}
                                    >
                                        <span>⚠️</span>
                                        <span>
                                            มีปัญหาที่ได้รับแจ้งในสถานที่นี้แล้ว {existingIssuesInPlace.length} เรื่อง
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "11px", marginTop: "3px", color: "#b45309" }}>
                                        เมื่อบันทึกการปักหมุด ตำแหน่งหมุดเตือนบนแผนที่จะแสดงที่พิกัดนี้ทันที
                                    </div>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        padding: "10px 12px",
                                        background: "#e0f2fe",
                                        border: "1px solid #bae6fd",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                        color: "#0369a1",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: 600,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "5px",
                                        }}
                                    >
                                        <span>📍</span>
                                        <span>
                                            จุดปักหมุดพร้อมใช้งาน (ยังไม่มีปัญหา)
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "11px", marginTop: "3px", color: "#0284c7" }}>
                                        พิกัดนี้จะถูกบันทึกไว้ในแผนที่ และหากมีผู้แจ้งปัญหาในจุดนี้ จะปรากฏหมุดเตือนที่ตำแหน่งนี้ทันที
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* INTERACTIVE MAP PICKER */}
                        <div className="form-group">
                            <label className="flex items-center justify-between">
                                <span>📍 คลิกบนแผนที่เพื่อระบุตำแหน่งปักหมุด</span>
                                <span className="text-[11px] font-normal text-emerald-700">
                                    คลิกหรือลากหมุดบนแผนที่ได้
                                </span>
                            </label>
                            <LocationPickerMap
                                lat={Number.parseFloat(lat) || 8.6434}
                                lng={Number.parseFloat(lng) || 99.8984}
                                onChange={(newLat, newLng) => {
                                    setLat(newLat.toFixed(4));
                                    setLng(newLng.toFixed(4));
                                }}
                                placeName={activePlaceName}
                            />
                        </div>

                        {/* DESCRIPTION */}

                        <div className="form-group">

                            <label>
                                คำอธิบาย / รายละเอียดเพิ่มเติม (ไม่บังคับ)
                            </label>

                            <input
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value
                                    )
                                }
                                placeholder="เช่น ชั้น 1-3 หรือบริเวณโดยรอบ"
                            />

                        </div>

                        {/* BUTTONS */}

                        <div className="modal-actions">

                            <button
                                className="btn-cancel"
                                onClick={
                                    closeRiskModal
                                }
                            >
                                ยกเลิก
                            </button>

                            <button
                                className="btn-save"
                                onClick={
                                    saveRiskArea
                                }
                            >
                                💾 บันทึกจุดปักหมุด
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* =========================
                DELETE MODAL
            ========================= */}

            <DeleteModal
                show={
                    deleteId !== null
                }
                title="ลบจุดปักหมุดสถานที่"
                message={
                    deleteTargetName
                        ? `คุณต้องการลบจุดปักหมุด "${deleteTargetName}" หรือไม่? พิกัดที่บันทึกไว้จะถูกลบออกจากระบบอย่างถาวร`
                        : "คุณต้องการลบจุดปักหมุดสถานที่นี้หรือไม่? พิกัดที่บันทึกไว้ของสถานที่นี้จะถูกลบออกจากระบบ"
                }
                onConfirm={
                    confirmDeleteRiskArea
                }
                onCancel={
                    cancelDelete
                }
            />

            {/* =========================
                RESET DEFAULT PINS MODAL
            ========================= */}

            {showResetConfirmModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        backdropFilter: "blur(4px)",
                    }}
                >
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "16px",
                            padding: "26px",
                            maxWidth: "460px",
                            width: "90%",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                            <div
                                style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "12px",
                                    background: "#ecfdf5",
                                    color: "#059669",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "22px",
                                    flexShrink: 0,
                                }}
                            >
                                🔄
                            </div>
                            <div>
                                <h3 style={{ fontSize: "17px", fontWeight: "bold", color: "#1e293b", margin: 0 }}>
                                    ยืนยันคืนค่าหมุดสถานที่เริ่มต้น?
                                </h3>
                                <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
                                    รีเซ็ตกลับเป็น 25 ตำแหน่งมาตรฐานบนแผนที่
                                </p>
                            </div>
                        </div>

                        <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", marginBottom: "20px" }}>
                            ระบบจะกู้คืนพิกัดหมุดสถานที่ทั้งหมดกลับเป็นค่าเริ่มต้น <strong>25 ตำแหน่งมาตรฐานบน OpenStreetMap</strong> มหาวิทยาลัยวลัยลักษณ์ และยกเลิกการซ่อน/ลบหมุดที่เคยตั้งค่าไว้
                        </p>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                type="button"
                                onClick={() => setShowResetConfirmModal(false)}
                                style={{
                                    padding: "9px 18px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    background: "#ffffff",
                                    color: "#475569",
                                    fontWeight: 500,
                                    fontSize: "14px",
                                    cursor: "pointer",
                                }}
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="button"
                                onClick={confirmResetDefaultPins}
                                style={{
                                    padding: "9px 18px",
                                    borderRadius: "8px",
                                    border: "none",
                                    background: "#1b5e4a",
                                    color: "#ffffff",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 4px rgba(27,94,74,0.2)",
                                }}
                            >
                                ยืนยันคืนค่าเริ่มต้น (25 จุด)
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}