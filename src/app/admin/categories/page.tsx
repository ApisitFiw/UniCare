"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import CategoryManager from "@/components/admin/CategoryManager";

import RiskAreaTable, {
    type RiskArea,
} from "@/components/admin/RiskAreaTable";

const RiskMap = dynamic(
    () => import("@/app/admin/RiskMap"),
    { ssr: false }
);

import DeleteModal from "@/components/admin/DeleteModal";

export default function CategoriesPage() {

    /* =========================
       RISK AREAS
    ========================= */

    const [riskAreas, setRiskAreas] =
        useState<RiskArea[]>([
            {
                id: 1,
                name: "อาคารเรียนรวม",
                problem: "เสียงดัง / ความปลอดภัย",
                level: "สูงมาก",
                lat: 8.6448,
                lng: 99.8978,
            },
            {
                id: 2,
                name: "โรงอาหารกลาง",
                problem: "ขยะ / ความสะอาด",
                level: "สูง",
                lat: 8.6418,
                lng: 99.9000,
            },
            {
                id: 3,
                name: "ลานกิจกรรม",
                problem: "เสียงดัง / ความปลอดภัย",
                level: "สูง",
                lat: 8.6428,
                lng: 99.8968,
            },
            {
                id: 4,
                name: "หอพักนักศึกษา",
                problem: "ขยะ / น้ำเสีย",
                level: "ปานกลาง",
                lat: 8.6460,
                lng: 99.9010,
            },
            {
                id: 5,
                name: "พื้นที่ริมสระน้ำ",
                problem: "ความสะอาด / ต้นไม้",
                level: "ปานกลาง",
                lat: 8.6440,
                lng: 99.9018,
            },
        ]);

    /* =========================
       RISK AREA MODAL
    ========================= */

    const [editingArea, setEditingArea] =
        useState<RiskArea | null>(null);

    const [showRiskModal, setShowRiskModal] =
        useState(false);

    const [name, setName] =
        useState("");

    const [problem, setProblem] =
        useState("");

    const [level, setLevel] =
        useState<RiskArea["level"]>("ปานกลาง");

    const [lat, setLat] =
        useState("");

    const [lng, setLng] =
        useState("");

    /* =========================
       DELETE MODAL
    ========================= */

    const [deleteId, setDeleteId] =
        useState<number | null>(null);

    /* =========================
       ADD RISK AREA
    ========================= */

    function addRiskArea() {

        setEditingArea(null);

        setName("");
        setProblem("");
        setLevel("ปานกลาง");

        setLat("8.6434");
        setLng("99.8984");

        setShowRiskModal(true);
    }

    /* =========================
       EDIT RISK AREA
    ========================= */

    function editRiskArea(area: RiskArea) {

        setEditingArea(area);

        setName(area.name);
        setProblem(area.problem);
        setLevel(area.level);

        setLat(String(area.lat));
        setLng(String(area.lng));

        setShowRiskModal(true);
    }

    /* =========================
       SAVE RISK AREA
    ========================= */

    function saveRiskArea() {

        if (!name.trim()) {
            alert("กรุณากรอกชื่อพื้นที่");
            return;
        }

        if (!problem.trim()) {
            alert("กรุณากรอกปัญหา");
            return;
        }

        const latitude =
            Number.parseFloat(lat);

        const longitude =
            Number.parseFloat(lng);

        if (
            Number.isNaN(latitude) ||
            Number.isNaN(longitude)
        ) {
            alert("กรุณากรอกพิกัดให้ถูกต้อง");
            return;
        }

        /* EDIT */

        if (editingArea) {

            setRiskAreas((current) =>
                current.map((area) =>
                    area.id === editingArea.id
                        ? {
                            ...area,
                            name: name.trim(),
                            problem: problem.trim(),
                            level,
                            lat: latitude,
                            lng: longitude,
                        }
                        : area
                )
            );

        }

        /* ADD */

        else {

            const newArea: RiskArea = {
                id:
                    Math.max(
                        0,
                        ...riskAreas.map(
                            (area) =>
                                area.id
                        )
                    ) + 1,

                name: name.trim(),

                problem: problem.trim(),

                level,

                lat: latitude,

                lng: longitude,
            };

            setRiskAreas((current) => [
                ...current,
                newArea,
            ]);
        }

        closeRiskModal();
    }

    /* =========================
       DELETE RISK AREA
    ========================= */

    function deleteRiskArea(id: number) {

        setDeleteId(id);
    }

    /* =========================
       CONFIRM DELETE
    ========================= */

    function confirmDeleteRiskArea() {

        if (deleteId === null) {
            return;
        }

        setRiskAreas((current) =>
            current.filter(
                (area) =>
                    area.id !== deleteId
            )
        );

        setDeleteId(null);
    }

    /* =========================
       CANCEL DELETE
    ========================= */

    function cancelDelete() {

        setDeleteId(null);
    }

    /* =========================
       CLOSE RISK MODAL
    ========================= */

    function closeRiskModal() {

        setShowRiskModal(false);

        setEditingArea(null);

        setName("");
        setProblem("");
        setLevel("ปานกลาง");

        setLat("");
        setLng("");
    }

    return (
        <>
            {/* =========================
                SIDEBAR
            ========================= */}

            <Sidebar />

            {/* =========================
                MAIN
            ========================= */}

            <main className="main">

                {/* HEADER */}

                <Header />

                {/* CONTENT */}

                <section className="content">

                    {/* PAGE TITLE */}

                    <div className="page-title">

                        <h1>
                            ⚙️ ระบบหมวดหมู่และจัดการพื้นที่เสี่ยงสูง
                        </h1>

                        <p>
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

                                <button
                                    className="btn btn-green"
                                    onClick={
                                        addRiskArea
                                    }
                                >
                                    ＋ เพิ่มพื้นที่เสี่ยง
                                </button>

                            </div>

                            <RiskMap
                                areas={riskAreas}
                            />

                        </div>

                        {/* =========================
                            RISK AREA TABLE
                        ========================= */}

                        <RiskAreaTable
                            areas={riskAreas}
                            onAdd={
                                addRiskArea
                            }
                            onEdit={
                                editRiskArea
                            }
                            onDelete={
                                deleteRiskArea
                            }
                        />

                    </div>

                </section>

            </main>

            {/* =========================
                ADD / EDIT RISK AREA MODAL
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

                    <div className="modal-content">

                        {/* MODAL HEADER */}

                        <div className="modal-header">

                            <h3>
                                {editingArea
                                    ? "แก้ไขพื้นที่เสี่ยง"
                                    : "เพิ่มพื้นที่เสี่ยง"}
                            </h3>

                            <button
                                className="modal-close"
                                onClick={
                                    closeRiskModal
                                }
                            >
                                ×
                            </button>

                        </div>

                        {/* NAME */}

                        <div className="form-group">

                            <label>
                                ชื่อพื้นที่
                            </label>

                            <input
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value
                                    )
                                }
                                placeholder="เช่น อาคารเรียนรวม"
                            />

                        </div>

                        {/* PROBLEM */}

                        <div className="form-group">

                            <label>
                                ปัญหา
                            </label>

                            <input
                                value={problem}
                                onChange={(event) =>
                                    setProblem(
                                        event.target.value
                                    )
                                }
                                placeholder="เช่น เสียงดัง / ความปลอดภัย"
                            />

                        </div>

                        {/* LEVEL */}

                        <div className="form-group">

                            <label>
                                ระดับความเสี่ยง
                            </label>

                            <select
                                value={level}
                                onChange={(event) =>
                                    setLevel(
                                        event.target
                                            .value as RiskArea["level"]
                                    )
                                }
                            >

                                <option value="สูงมาก">
                                    สูงมาก
                                </option>

                                <option value="สูง">
                                    สูง
                                </option>

                                <option value="ปานกลาง">
                                    ปานกลาง
                                </option>

                            </select>

                        </div>

                        {/* COORDINATES */}

                        <div className="form-row">

                            <div className="form-group">

                                <label>
                                    Latitude
                                </label>

                                <input
                                    value={lat}
                                    onChange={(event) =>
                                        setLat(
                                            event.target.value
                                        )
                                    }
                                    placeholder="8.6434"
                                />

                            </div>

                            <div className="form-group">

                                <label>
                                    Longitude
                                </label>

                                <input
                                    value={lng}
                                    onChange={(event) =>
                                        setLng(
                                            event.target.value
                                        )
                                    }
                                    placeholder="99.8984"
                                />

                            </div>

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
                                บันทึก
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
                title="ลบพื้นที่เสี่ยง"
                message="คุณต้องการลบพื้นที่เสี่ยงนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
                onConfirm={
                    confirmDeleteRiskArea
                }
                onCancel={
                    cancelDelete
                }
            />

        </>
    );
}