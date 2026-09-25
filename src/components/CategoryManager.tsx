"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  DEFAULT_CATEGORY_METADATA,
  getDefaultCategoryCounts,
  getCategoryCounts,
  getCategoryIcon,
  type CategoryMetadata,
} from "@/lib/issuesData";

type CategoryWithCount = CategoryMetadata & {
  count: number;
};

export default function CategoryManager() {
  const [categoryMeta, setCategoryMeta] = useState<CategoryMetadata[]>(DEFAULT_CATEGORY_METADATA);
  const [counts, setCounts] = useState<Record<string, number>>(getDefaultCategoryCounts);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);

  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("เปิดใช้งาน");

  // Sync category metadata & counts from localStorage after hydration
  useEffect(() => {
    const syncMeta = () => {
      try {
        const saved = window.localStorage.getItem("unicare_category_metadata");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCategoryMeta(parsed);
          }
        }
      } catch {
        // ignore
      }
    };

    syncMeta();

    const updateCounts = () => {
      setCounts(getCategoryCounts());
    };

    updateCounts();

    window.addEventListener("storage", syncMeta);
    window.addEventListener("unicare-category-metadata-updated", syncMeta);
    window.addEventListener("storage", updateCounts);
    window.addEventListener("unicare-demo-reports-updated", updateCounts);
    window.addEventListener("focus", updateCounts);

    return () => {
      window.removeEventListener("storage", syncMeta);
      window.removeEventListener("unicare-category-metadata-updated", syncMeta);
      window.removeEventListener("storage", updateCounts);
      window.removeEventListener("unicare-demo-reports-updated", updateCounts);
      window.removeEventListener("focus", updateCounts);
    };
  }, []);

  // Merge metadata with dynamic counts
  const categoriesWithCounts: CategoryWithCount[] = useMemo(() => {
    return categoryMeta.map((cat) => ({
      ...cat,
      count: counts[cat.name] ?? 0,
    }));
  }, [categoryMeta, counts]);

  // Sort descending by problem count (highest count at top, lowest/0 at bottom)
  const sortedCategories = useMemo(() => {
    return [...categoriesWithCounts].sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.id - b.id;
    });
  }, [categoriesWithCounts]);

  // Filter based on search query
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return sortedCategories;
    const query = search.toLowerCase();
    return sortedCategories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.description.toLowerCase().includes(query)
    );
  }, [sortedCategories, search]);

  /* =========================
     EDIT
  ========================= */
  function editCategory(category: CategoryWithCount) {
    setEditingCategory(category);
    setDescription(category.description);
    setStatus(category.status);
    setShowModal(true);
  }

  /* =========================
     SAVE
  ========================= */
  function saveCategory() {
    if (!editingCategory) return;

    const updated = categoryMeta.map((category) =>
      category.id === editingCategory.id
        ? {
            ...category,
            description: description.trim(),
            status,
          }
        : category
    );

    setCategoryMeta(updated);

    try {
      window.localStorage.setItem(
        "unicare_category_metadata",
        JSON.stringify(updated)
      );
      window.dispatchEvent(new Event("unicare-category-metadata-updated"));
    } catch {
      // ignore
    }

    closeModal();
  }

  /* =========================
     CLOSE MODAL
  ========================= */
  function closeModal() {
    setShowModal(false);
    setEditingCategory(null);
    setDescription("");
    setStatus("เปิดใช้งาน");
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <div className="card-title-icon">📋</div>
            <div>
              <h2>จัดการหมวดหมู่ปัญหา</h2>
              <p>
                หมวดหมู่อ้างอิงจากแบบฟอร์มแจ้งปัญหา (จัดเรียงตามจำนวนปัญหาที่ได้รับแจ้งมากที่สุดไปน้อยที่สุด)
              </p>
            </div>
          </div>
          {/* Note: Add button removed per user request */}
        </div>

        {/* SEARCH */}
        <div className="search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="ค้นหาหมวดหมู่..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                    ไม่พบข้อมูลหมวดหมู่ที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category, index) => (
                  <tr key={category.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="category">
                        <div className="category-icon green">
                          {getCategoryIcon(category.name)}
                        </div>
                        <div>
                          <div className="category-name">{category.name}</div>
                          <div suppressHydrationWarning className="category-desc">{category.description}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Link
                        href={`/admin/issues?category=${encodeURIComponent(category.name)}`}
                        className="inline-flex items-center gap-1 hover:underline"
                        style={{
                          fontSize: "14px",
                          color: category.count > 0 ? "#1b5e4a" : "#64748b",
                          textDecoration: "none",
                        }}
                        title={`คลิกเพื่อดูเคสปัญหาหมวดหมู่ "${category.name}" ในระบบติดตามสถานะ`}
                      >
                        <b suppressHydrationWarning>{category.count}</b>
                        <span style={{ fontSize: "11px", fontWeight: "normal", color: "#64748b" }}>เรื่อง ↗</span>
                      </Link>
                    </td>
                    <td>
                      <span
                        suppressHydrationWarning
                        className="status"
                        style={
                          category.status === "ปิดใช้งาน"
                            ? { background: "#f1f5f9", color: "#64748b" }
                            : undefined
                        }
                      >
                        {category.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <Link
                          href={`/admin/issues?category=${encodeURIComponent(category.name)}`}
                          className="action-btn"
                          title={`เปิดดูเรื่องร้องเรียนหมวดหมู่ "${category.name}" ในระบบติดตามสถานะ`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textDecoration: "none",
                            fontSize: "13px",
                          }}
                        >
                          📋
                        </Link>
                        <button
                          type="button"
                          className="action-btn edit"
                          title="แก้ไขคำอธิบายและสถานะ"
                          onClick={() => editCategory(category)}
                        >
                          ✏️
                        </button>
                        {/* Note: Delete button removed per user request */}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary (แสดงครบทั้งหมด ไม่มีปุ่มเปลี่ยนหน้า 1 2) */}
        {filteredCategories.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-[#f8faf9] text-xs text-slate-500">
            <div>
              แสดงทั้งหมด <span className="font-semibold text-slate-800">{filteredCategories.length}</span> หมวดหมู่
            </div>
            <div className="text-[11px] text-slate-400">
              เรียงตามจำนวนปัญหา (มาก &rarr; น้อย)
            </div>
          </div>
        )}
      </div>

      {/* =========================
          MODAL
      ========================= */}
      {showModal && editingCategory && (
        <div
          className="modal"
          style={{ display: "flex" }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h3>แก้ไขหมวดหมู่ปัญหา</h3>
              <button type="button" className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="form-group">
              <label>ชื่อหมวดหมู่</label>
              <input
                value={editingCategory.name}
                disabled
                style={{
                  backgroundColor: "#f8fafc",
                  color: "#475569",
                  cursor: "not-allowed",
                  borderColor: "#e2e8f0",
                }}
              />
              <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                * ชื่อหมวดหมู่อ้างอิงจากระบบแจ้งปัญหามาตรฐาน
              </span>
            </div>

            <div className="form-group">
              <label>คำอธิบายหมวดหมู่</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="กรอกคำอธิบายหมวดหมู่"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>สถานะการใช้งาน</label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="เปิดใช้งาน">เปิดใช้งาน</option>
                <option value="ปิดใช้งาน">ปิดใช้งาน</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={closeModal}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={saveCategory}
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}