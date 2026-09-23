"use client";

import { useState } from "react";

type Category = {
    id: number;
    name: string;
    description: string;
    count: number;
    status: string;
};

const initialCategories: Category[] = [
    {
        id: 1,
        name: "ขยะ / ของเสีย",
        description: "ขยะทั่วไป ขยะอันตราย ขยะรีไซเคิล",
        count: 48,
        status: "เปิดใช้งาน",
    },
    {
        id: 2,
        name: "น้ำ / น้ำเสีย",
        description: "น้ำรั่ว น้ำท่วม น้ำเสีย ระบบระบายน้ำ",
        count: 32,
        status: "เปิดใช้งาน",
    },
    {
        id: 3,
        name: "อาคาร / บำรุงรักษา",
        description: "อาคารชำรุด ห้องน้ำ ไฟฟ้า แสงสว่าง",
        count: 27,
        status: "เปิดใช้งาน",
    },
    {
        id: 4,
        name: "ต้นไม้ / พื้นที่เขียว",
        description: "ต้นไม้ชำรุด ภูมิทัศน์ พื้นที่สีเขียว",
        count: 18,
        status: "เปิดใช้งาน",
    },
    {
        id: 5,
        name: "เสียงรบกวน",
        description: "เสียงดัง กิจกรรมรบกวน พื้นที่เรียน",
        count: 16,
        status: "เปิดใช้งาน",
    },
    {
        id: 6,
        name: "ความปลอดภัย",
        description: "อุบัติเหตุ ความเสี่ยง อาชญากรรม",
        count: 11,
        status: "เปิดใช้งาน",
    },
    {
        id: 7,
        name: "อื่น ๆ",
        description: "อื่น ๆ ที่ไม่เข้าหมวดหมู่",
        count: 6,
        status: "เปิดใช้งาน",
    },
];

/* =========================
   CATEGORY ICON
========================= */

function getCategoryIcon(name: string) {
    if (name.includes("ขยะ")) return "🗑️";
    if (name.includes("น้ำ")) return "💧";
    if (name.includes("อาคาร")) return "🏢";
    if (name.includes("ต้นไม้")) return "🌳";
    if (name.includes("เสียง")) return "🔊";
    if (name.includes("ความปลอดภัย")) return "🛡️";

    return "📋";
}

export default function CategoryManager() {
    const [categories, setCategories] =
        useState<Category[]>(initialCategories);

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] =
        useState(false);

    const [editingCategory, setEditingCategory] =
        useState<Category | null>(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] =
        useState("เปิดใช้งาน");

    /* =========================
       SEARCH
    ========================= */

    const filteredCategories =
        categories.filter((category) =>
            category.name
                .toLowerCase()
                .includes(search.toLowerCase())
        );

    /* =========================
       ADD
    ========================= */

    function addCategory() {
        setEditingCategory(null);

        setName("");
        setDescription("");
        setStatus("เปิดใช้งาน");

        setShowModal(true);
    }

    /* =========================
       EDIT
    ========================= */

    function editCategory(category: Category) {
        setEditingCategory(category);

        setName(category.name);
        setDescription(category.description);
        setStatus(category.status);

        setShowModal(true);
    }

    /* =========================
       SAVE
    ========================= */

    function saveCategory() {
        if (!name.trim()) {
            alert("กรุณากรอกชื่อหมวดหมู่");
            return;
        }

        /* EDIT */

        if (editingCategory) {
            setCategories((current) =>
                current.map((category) =>
                    category.id === editingCategory.id
                        ? {
                            ...category,
                            name: name.trim(),
                            description: description.trim(),
                            status,
                        }
                        : category
                )
            );

            alert("แก้ไขหมวดหมู่สำเร็จ");
        }

        /* ADD */

        else {
            const newCategory: Category = {
                id:
                    Math.max(
                        0,
                        ...categories.map(
                            (category) => category.id
                        )
                    ) + 1,

                name: name.trim(),

                description:
                    description.trim(),

                count: 0,

                status,
            };

            setCategories((current) => [
                ...current,
                newCategory,
            ]);

            alert("เพิ่มหมวดหมู่สำเร็จ");
        }

        closeModal();
    }

    /* =========================
       DELETE
    ========================= */

    function deleteCategory(id: number) {
        const confirmed =
            window.confirm(
                "คุณต้องการลบหมวดหมู่นี้หรือไม่?"
            );

        if (!confirmed) {
            return;
        }

        setCategories((current) =>
            current.filter(
                (category) =>
                    category.id !== id
            )
        );

        alert("ลบหมวดหมู่สำเร็จ");
    }

    /* =========================
       CLOSE MODAL
    ========================= */

    function closeModal() {
        setShowModal(false);

        setEditingCategory(null);

        setName("");
        setDescription("");
        setStatus("เปิดใช้งาน");
    }

    return (
        <>
            <div className="card">

                <div className="card-header">

                    <div className="card-title">

                        <div className="card-title-icon">
                            📋
                        </div>

                        <div>

                            <h2>
                                จัดการหมวดหมู่ปัญหา
                            </h2>

                            <p>
                                เพิ่ม แก้ไข หรือลบหมวดหมู่ของปัญหา
                            </p>

                        </div>

                    </div>

                    <button
                        className="btn btn-green"
                        onClick={addCategory}
                    >
                        ＋ เพิ่มหมวดหมู่
                    </button>

                </div>

                {/* SEARCH */}

                <div className="search">

                    <span className="search-icon">
                        🔍
                    </span>

                    <input
                        type="text"
                        placeholder="ค้นหาหมวดหมู่..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />

                </div>

                {/* TABLE */}

                <div className="table-wrap">

                    <table>

                        <thead>

                            <tr>
                                <th>ลำดับ</th>
                                <th>หมวดหมู่</th>
                                <th>จำนวนปัญหา</th>
                                <th>สถานะ</th>
                                <th>จัดการ</th>
                            </tr>

                        </thead>

                        <tbody>

                            {filteredCategories.map(
                                (category, index) => (

                                    <tr
                                        key={category.id}
                                    >

                                        <td>
                                            {index + 1}
                                        </td>

                                        <td>

                                            <div className="category">

                                                <div className="category-icon green">
                                                    {getCategoryIcon(
                                                        category.name
                                                    )}
                                                </div>

                                                <div>

                                                    <div className="category-name">
                                                        {category.name}
                                                    </div>

                                                    <div className="category-desc">
                                                        {category.description}
                                                    </div>

                                                </div>

                                            </div>

                                        </td>

                                        <td>
                                            <b>
                                                {category.count}
                                            </b>
                                        </td>

                                        <td>

                                            <span className="status">
                                                {category.status}
                                            </span>

                                        </td>

                                        <td>

                                            <div className="actions">

                                                <button
                                                    className="action-btn edit"
                                                    onClick={() =>
                                                        editCategory(
                                                            category
                                                        )
                                                    }
                                                >
                                                    ✏️
                                                </button>

                                                <button
                                                    className="action-btn delete"
                                                    onClick={() =>
                                                        deleteCategory(
                                                            category.id
                                                        )
                                                    }
                                                >
                                                    🗑️
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* =========================
                MODAL
            ========================= */}

            {showModal && (

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
                            closeModal();
                        }

                    }}
                >

                    <div className="modal-content">

                        <div className="modal-header">

                            <h3>
                                {editingCategory
                                    ? "แก้ไขหมวดหมู่"
                                    : "เพิ่มหมวดหมู่"}
                            </h3>

                            <button
                                className="modal-close"
                                onClick={closeModal}
                            >
                                ×
                            </button>

                        </div>

                        <div className="form-group">

                            <label>
                                ชื่อหมวดหมู่
                            </label>

                            <input
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value
                                    )
                                }
                                placeholder="กรอกชื่อหมวดหมู่"
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                คำอธิบาย
                            </label>

                            <textarea
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value
                                    )
                                }
                                placeholder="กรอกคำอธิบาย"
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                สถานะ
                            </label>

                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(
                                        event.target.value
                                    )
                                }
                            >

                                <option value="เปิดใช้งาน">
                                    เปิดใช้งาน
                                </option>

                                <option value="ปิดใช้งาน">
                                    ปิดใช้งาน
                                </option>

                            </select>

                        </div>

                        <div className="modal-actions">

                            <button
                                className="btn-cancel"
                                onClick={closeModal}
                            >
                                ยกเลิก
                            </button>

                            <button
                                className="btn-save"
                                onClick={saveCategory}
                            >
                                บันทึก
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </>
    );
}