"use client";

import { useState } from "react";

export type RiskArea = {
    id: number;
    name: string;
    problem: string;
    level: "สูงมาก" | "สูง" | "ปานกลาง";
    lat: number;
    lng: number;
};

type Props = {
    areas: RiskArea[];
    onAdd: () => void;
    onEdit: (area: RiskArea) => void;
    onDelete: (id: number) => void;
};

export default function RiskAreaTable({
    areas,
    onAdd,
    onEdit,
    onDelete,
}: Props) {

    const [search, setSearch] = useState("");

    const filteredAreas = areas.filter((area) =>
        `${area.name} ${area.problem}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    function getLevelClass(
        level: RiskArea["level"]
    ) {
        switch (level) {
            case "สูงมาก":
                return "risk-badge very-high";

            case "สูง":
                return "risk-badge high";

            default:
                return "risk-badge medium";
        }
    }

    return (
        <div className="card">

            <div className="card-header">

                <div className="card-title">

                    <div className="card-title-icon">
                        ⚠️
                    </div>

                    <div>
                        <h2>
                            พื้นที่เสี่ยงสูง
                        </h2>

                        <p>
                            จัดการพื้นที่ที่มีปัญหาหรือความเสี่ยงสูง
                        </p>
                    </div>

                </div>

                <button
                    className="btn btn-green"
                    onClick={onAdd}
                >
                    ＋ เพิ่มพื้นที่เสี่ยง
                </button>

            </div>

            <div className="search">

                <span className="search-icon">
                    🔍
                </span>

                <input
                    type="text"
                    placeholder="ค้นหาพื้นที่เสี่ยง..."
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
                            <th>พื้นที่</th>
                            <th>ปัญหา</th>
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
                                    ไม่พบพื้นที่ที่ค้นหา
                                </td>
                            </tr>

                        ) : (

                            filteredAreas.map(
                                (area, index) => (

                                    <tr key={area.id}>

                                        <td>
                                            {index + 1}
                                        </td>

                                        <td>
                                            <div className="category">

                                                <div className="category-icon red">
                                                    📍
                                                </div>

                                                <div>

                                                    <div className="category-name">
                                                        {area.name}
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
                                            {area.problem}
                                        </td>

                                        <td>
                                            <span
                                                className={getLevelClass(
                                                    area.level
                                                )}
                                            >
                                                {area.level}
                                            </span>
                                        </td>

                                        <td>

                                            <div className="actions">

                                                <button
                                                    className="action-btn edit"
                                                    onClick={() =>
                                                        onEdit(area)
                                                    }
                                                >
                                                    ✏️
                                                </button>

                                                <button
                                                    className="action-btn delete"
                                                    onClick={() =>
                                                        onDelete(
                                                            area.id
                                                        )
                                                    }
                                                >
                                                    🗑️
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

        </div>
    );
}