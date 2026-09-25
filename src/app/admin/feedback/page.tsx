"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";

type Evaluation = {
    id: string;
    issue: string;
    category: string;
    location: string;
    score: number | null;
    date: string;
    status: "ประเมินแล้ว" | "รอประเมิน";
};

export default function EvaluationPage() {
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [filter, setFilter] = useState<
        "ทั้งหมด" | "ประเมินแล้ว" | "รอประเมิน"
    >("ทั้งหมด");

    const [selectedEvaluation, setSelectedEvaluation] =
        useState<Evaluation | null>(null);

    const [selectedScore, setSelectedScore] =
        useState<number>(5);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function loadEvaluations() {
            setIsLoading(true);
            setErrorMessage(null);

            const { data, error } = await supabase
                .from("issues")
                .select(
                    "id, title, location_detail, categories(name), feedbacks(id, overall_rating, created_at)"
                )
                .order("created_at", { ascending: false });

            if (error) {
                setErrorMessage("ไม่สามารถโหลดข้อมูลผลการประเมินได้");
                setIsLoading(false);
                return;
            }

            const mappedEvaluations: Evaluation[] = (data ?? []).map(
                (item) => {
                    const feedback = Array.isArray(item.feedbacks)
                        ? item.feedbacks[0]
                        : item.feedbacks;
                    const category = Array.isArray(item.categories)
                        ? item.categories[0]
                        : item.categories;

                    return {
                        id: item.id,
                        issue: item.title,
                        category: category?.name ?? "ไม่ระบุหมวดหมู่",
                        location: item.location_detail ?? "ไม่ระบุสถานที่",
                        score: feedback?.overall_rating ?? null,
                        date: feedback?.created_at
                            ? new Date(feedback.created_at).toLocaleDateString(
                                  "th-TH"
                              )
                            : "-",
                        status: feedback ? "ประเมินแล้ว" : "รอประเมิน",
                    };
                }
            );

            setEvaluations(mappedEvaluations);
            setIsLoading(false);
        }

        void loadEvaluations();
    }, []);

    const filteredEvaluations = useMemo(() => {
        if (filter === "ทั้งหมด") {
            return evaluations;
        }

        return evaluations.filter(
            (item) => item.status === filter
        );
    }, [evaluations, filter]);

    const evaluatedCount = evaluations.filter(
        (item) => item.status === "ประเมินแล้ว"
    ).length;

    const waitingCount = evaluations.filter(
        (item) => item.status === "รอประเมิน"
    ).length;

    const averageScore = useMemo(() => {
        const evaluated = evaluations.filter(
            (item) =>
                item.status === "ประเมินแล้ว" &&
                item.score !== null
        );

        if (evaluated.length === 0) {
            return "0.0";
        }

        const total = evaluated.reduce(
            (sum, item) => sum + (item.score ?? 0),
            0
        );

        return (total / evaluated.length).toFixed(1);
    }, [evaluations]);

    function openEvaluation(item: Evaluation) {
        setSelectedEvaluation(item);
        setSelectedScore(item.score ?? 5);
    }

    function closeEvaluation() {
        setSelectedEvaluation(null);
        setSelectedScore(5);
    }

    async function saveEvaluation() {
        if (!selectedEvaluation) return;

        setIsSaving(true);
        setErrorMessage(null);

        const { data, error } = await supabase
            .from("feedbacks")
            .upsert(
                {
                    issue_id: selectedEvaluation.id,
                    overall_rating: selectedScore,
                    is_resolved_confirmed: true,
                },
                { onConflict: "issue_id" }
            )
            .select("created_at")
            .single();

        if (error) {
            setErrorMessage("ไม่สามารถบันทึกผลการประเมินได้");
            setIsSaving(false);
            return;
        }

        setEvaluations((current) =>
            current.map((item) =>
                item.id === selectedEvaluation.id
                    ? {
                          ...item,
                          score: selectedScore,
                          date: new Date(
                              data.created_at
                          ).toLocaleDateString("th-TH"),
                          status: "ประเมินแล้ว",
                      }
                    : item
            )
        );

        setIsSaving(false);
        closeEvaluation();
    }

    return (
        <div className="flex-1 flex flex-col min-w-0">

            {/* HEADER */}
            <Header
                title="ผลการประเมิน"
                subtitle="ตรวจสอบและติดตามผลการประเมินเรื่องร้องเรียนภายในมหาวิทยาลัย"
                role="ADMIN"
            />

            {/* MAIN */}
            <main className="p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl w-full">

                {errorMessage && (
                    <div
                        role="alert"
                        style={{
                            padding: "12px 16px",
                            borderRadius: "8px",
                            background: "#fef2f2",
                            color: "#b91c1c",
                            border: "1px solid #fecaca",
                        }}
                    >
                        {errorMessage}
                    </div>
                )}

                {/* PAGE TITLE */}
                <div className="page-title">
                    <h1>
                        ★ ผลการประเมิน
                    </h1>

                    <p>
                        ตรวจสอบคะแนนและสถานะการประเมินเรื่องร้องเรียน
                        เพื่อใช้ติดตามคุณภาพการแก้ไขปัญหา
                    </p>
                </div>

                {/* SUMMARY */}
                <div className="dashboard-grid">

                    {/* ALL */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <div className="card-title-icon">
                                    #
                                </div>

                                <div>
                                    <h2>เรื่องทั้งหมด</h2>
                                    <p>จำนวนเรื่องร้องเรียน</p>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: "10px 20px 20px",
                                fontSize: "32px",
                                fontWeight: 700,
                                color: "#1e293b",
                            }}
                        >
                            {evaluations.length}
                        </div>
                    </div>

                    {/* EVALUATED */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <div className="card-title-icon">
                                    ✓
                                </div>

                                <div>
                                    <h2>ประเมินแล้ว</h2>
                                    <p>มีผลคะแนนแล้ว</p>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: "10px 20px 20px",
                                fontSize: "32px",
                                fontWeight: 700,
                                color: "#1b5e4a",
                            }}
                        >
                            {evaluatedCount}
                        </div>
                    </div>

                    {/* WAITING */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <div className="card-title-icon">
                                    !
                                </div>

                                <div>
                                    <h2>รอประเมิน</h2>
                                    <p>ยังไม่มีผลคะแนน</p>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: "10px 20px 20px",
                                fontSize: "32px",
                                fontWeight: 700,
                                color: "#64748b",
                            }}
                        >
                            {waitingCount}
                        </div>
                    </div>

                    {/* AVERAGE */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <div className="card-title-icon">
                                    ★
                                </div>

                                <div>
                                    <h2>คะแนนเฉลี่ย</h2>
                                    <p>จากรายการที่ประเมินแล้ว</p>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: "10px 20px 20px",
                                fontSize: "32px",
                                fontWeight: 700,
                                color: "#1b5e4a",
                            }}
                        >
                            {averageScore}
                            <span
                                style={{
                                    fontSize: "15px",
                                    color: "#94a3b8",
                                    marginLeft: "4px",
                                }}
                            >
                                / 5
                            </span>
                        </div>
                    </div>

                </div>

                {/* EVALUATION TABLE */}
                <div className="card">

                    <div className="card-header">

                        <div className="card-title">

                            <div className="card-title-icon">
                                ★
                            </div>

                            <div>
                                <h2>
                                    รายการผลการประเมิน
                                </h2>

                                <p>
                                    รายละเอียดคะแนนของแต่ละเรื่องร้องเรียน
                                </p>
                            </div>

                        </div>

                        {/* FILTER */}
                        <div
                            className="flex items-center gap-2"
                            style={{
                                flexWrap: "wrap",
                            }}
                        >
                            <button
                                type="button"
                                className={
                                    filter === "ทั้งหมด"
                                        ? "btn btn-green"
                                        : "btn"
                                }
                                onClick={() =>
                                    setFilter("ทั้งหมด")
                                }
                            >
                                ทั้งหมด
                            </button>

                            <button
                                type="button"
                                className={
                                    filter === "ประเมินแล้ว"
                                        ? "btn btn-green"
                                        : "btn"
                                }
                                onClick={() =>
                                    setFilter("ประเมินแล้ว")
                                }
                            >
                                ประเมินแล้ว
                            </button>

                            <button
                                type="button"
                                className={
                                    filter === "รอประเมิน"
                                        ? "btn btn-green"
                                        : "btn"
                                }
                                onClick={() =>
                                    setFilter("รอประเมิน")
                                }
                            >
                                รอประเมิน
                            </button>
                        </div>

                    </div>

                    {/* TABLE */}
                    <div
                        style={{
                            overflowX: "auto",
                            width: "100%",
                        }}
                    >
                        <table
                            style={{
                                width: "100%",
                                minWidth: "950px",
                                borderCollapse: "collapse",
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        background: "#f8fafc",
                                        borderBottom:
                                            "1px solid #e2e8f0",
                                    }}
                                >
                                    <th className="evaluation-th">
                                        เรื่องร้องเรียน
                                    </th>

                                    <th className="evaluation-th">
                                        หมวดหมู่
                                    </th>

                                    <th className="evaluation-th">
                                        สถานที่
                                    </th>

                                    <th className="evaluation-th">
                                        คะแนน
                                    </th>

                                    <th className="evaluation-th">
                                        วันที่ประเมิน
                                    </th>

                                    <th className="evaluation-th">
                                        สถานะ
                                    </th>

                                    <th className="evaluation-th">
                                        จัดการ
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            style={{
                                                padding: "40px",
                                                textAlign: "center",
                                                color: "#94a3b8",
                                            }}
                                        >
                                            กำลังโหลดข้อมูล...
                                        </td>
                                    </tr>
                                ) : filteredEvaluations.map(
                                    (item) => (
                                        <tr
                                            key={item.id}
                                            style={{
                                                borderBottom:
                                                    "1px solid #f1f5f9",
                                            }}
                                        >
                                            <td className="evaluation-td">
                                                <div
                                                    style={{
                                                        fontWeight: 600,
                                                        color: "#1e293b",
                                                    }}
                                                >
                                                    {item.issue}
                                                </div>
                                            </td>

                                            <td className="evaluation-td">
                                                {item.category}
                                            </td>

                                            <td className="evaluation-td">
                                                {item.location}
                                            </td>

                                            <td className="evaluation-td">
                                                {item.score !== null ? (
                                                    <span
                                                        style={{
                                                            fontWeight: 700,
                                                            color: "#1b5e4a",
                                                        }}
                                                    >
                                                        {item.score}
                                                        <span
                                                            style={{
                                                                color: "#94a3b8",
                                                                fontWeight: 400,
                                                            }}
                                                        >
                                                            {" "}
                                                            / 5
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span
                                                        style={{
                                                            color: "#94a3b8",
                                                        }}
                                                    >
                                                        -
                                                    </span>
                                                )}
                                            </td>

                                            <td className="evaluation-td">
                                                {item.date}
                                            </td>

                                            <td className="evaluation-td">

                                                {item.status ===
                                                "ประเมินแล้ว" ? (
                                                    <span
                                                        className="evaluation-status evaluated"
                                                    >
                                                        ประเมินแล้ว
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="evaluation-status waiting"
                                                    >
                                                        รอประเมิน
                                                    </span>
                                                )}

                                            </td>

                                            <td className="evaluation-td">

                                                <button
                                                    type="button"
                                                    className={
                                                        item.status ===
                                                        "รอประเมิน"
                                                            ? "btn btn-green"
                                                            : "btn"
                                                    }
                                                    onClick={() =>
                                                        openEvaluation(
                                                            item
                                                        )
                                                    }
                                                >
                                                    {item.status ===
                                                    "รอประเมิน"
                                                        ? "ประเมิน"
                                                        : "ดูรายละเอียด"}
                                                </button>

                                            </td>
                                        </tr>
                                    )
                                )}

                                {filteredEvaluations.length ===
                                    0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            style={{
                                                padding: "40px",
                                                textAlign: "center",
                                                color: "#94a3b8",
                                            }}
                                        >
                                            ไม่พบรายการ
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>

            </main>

            {/* EVALUATION MODAL */}
            {selectedEvaluation && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(15, 23, 42, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "20px",
                    }}
                    onClick={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeEvaluation();
                        }
                    }}
                >
                    <div
                        style={{
                            background: "#ffffff",
                            width: "100%",
                            maxWidth: "500px",
                            borderRadius: "14px",
                            padding: "24px",
                            boxShadow:
                                "0 20px 40px rgba(0,0,0,0.15)",
                        }}
                    >

                        {/* MODAL HEADER */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                alignItems: "flex-start",
                                marginBottom: "20px",
                            }}
                        >
                            <div>
                                <h3
                                    style={{
                                        margin: 0,
                                        fontSize: "20px",
                                        fontWeight: 700,
                                        color: "#1e293b",
                                    }}
                                >
                                    ผลการประเมิน
                                </h3>

                                <p
                                    style={{
                                        margin:
                                            "5px 0 0",
                                        fontSize: "13px",
                                        color: "#64748b",
                                    }}
                                >
                                    {selectedEvaluation.issue}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeEvaluation}
                                style={{
                                    border: "none",
                                    background:
                                        "transparent",
                                    fontSize: "24px",
                                    color: "#64748b",
                                    cursor: "pointer",
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* INFO */}
                        <div
                            style={{
                                background: "#f8fafc",
                                borderRadius: "10px",
                                padding: "14px",
                                marginBottom: "20px",
                                fontSize: "13px",
                                color: "#475569",
                                lineHeight: 1.8,
                            }}
                        >
                            <div>
                                <strong>หมวดหมู่:</strong>{" "}
                                {selectedEvaluation.category}
                            </div>

                            <div>
                                <strong>สถานที่:</strong>{" "}
                                {selectedEvaluation.location}
                            </div>
                        </div>

                        {/* SCORE */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontWeight: 600,
                                    marginBottom: "10px",
                                    color: "#334155",
                                }}
                            >
                                ให้คะแนนการดำเนินการ
                            </label>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                }}
                            >
                                {[1, 2, 3, 4, 5].map(
                                    (score) => (
                                        <button
                                            key={score}
                                            type="button"
                                            onClick={() =>
                                                setSelectedScore(
                                                    score
                                                )
                                            }
                                            style={{
                                                width: "52px",
                                                height: "48px",
                                                borderRadius:
                                                    "8px",
                                                border:
                                                    selectedScore ===
                                                    score
                                                        ? "2px solid #1b5e4a"
                                                        : "1px solid #cbd5e1",
                                                background:
                                                    selectedScore ===
                                                    score
                                                        ? "#ecfdf5"
                                                        : "#ffffff",
                                                color:
                                                    selectedScore ===
                                                    score
                                                        ? "#1b5e4a"
                                                        : "#475569",
                                                fontWeight: 700,
                                                fontSize:
                                                    "16px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {score}
                                        </button>
                                    )
                                )}
                            </div>

                            <p
                                style={{
                                    fontSize: "12px",
                                    color: "#94a3b8",
                                    marginTop: "8px",
                                }}
                            >
                                1 = ต้องปรับปรุงมาก และ 5 = ดีมาก
                            </p>
                        </div>

                        {/* ACTION */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "flex-end",
                                gap: "10px",
                                marginTop: "25px",
                            }}
                        >
                            <button
                                type="button"
                                className="btn"
                                onClick={closeEvaluation}
                            >
                                ยกเลิก
                            </button>

                            <button
                                type="button"
                                className="btn btn-green"
                                onClick={saveEvaluation}
                                disabled={isSaving}
                            >
                                {isSaving
                                    ? "กำลังบันทึก..."
                                    : "บันทึกผลการประเมิน"}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* PAGE STYLE */}
            <style jsx>{`
                .evaluation-th {
                    padding: 14px 16px;
                    text-align: left;
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    white-space: nowrap;
                }

                .evaluation-td {
                    padding: 15px 16px;
                    font-size: 13px;
                    color: #475569;
                    vertical-align: middle;
                }

                .evaluation-status {
                    display: inline-flex;
                    align-items: center;
                    padding: 5px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                    white-space: nowrap;
                }

                .evaluation-status.evaluated {
                    background: #ecfdf5;
                    color: #166534;
                }

                .evaluation-status.waiting {
                    background: #f8fafc;
                    color: #64748b;
                    border: 1px solid #e2e8f0;
                }

                @media (max-width: 900px) {
                    .dashboard-grid {
                        grid-template-columns: repeat(
                            2,
                            minmax(0, 1fr)
                        );
                    }
                }

                @media (max-width: 640px) {
                    .dashboard-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

        </div>
    );
}