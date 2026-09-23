
import Link from "next/link";

export default function Sidebar() {
    return (
        <aside className="sidebar">

            {/* Logo */}
            <div className="logo">
                <div className="logo-icon">
                    🌱
                </div>

                <div>
                    <h2>UniCare</h2>

                    <span>
                        มหาวิทยาลัยวลัยลักษณ์
                    </span>
                </div>
            </div>

            {/* Menu */}
            <ul className="menu">

                <li>
                    <Link href="/admin/dashboard">
                        <span className="menu-icon">🏠</span>
                        หน้าหลัก
                    </Link>
                </li>

                <li>
                    <Link href="/admin/tickets">
                        <span className="menu-icon">📢</span>
                        แจ้งปัญหา
                    </Link>
                </li>

                <li>
                    <Link href="/my-issues">
                        <span className="menu-icon">📋</span>
                        รายการของฉัน
                    </Link>
                </li>

                <li>
                    <Link href="/campus-map">
                        <span className="menu-icon">🗺️</span>
                        แผนที่ปัญหา
                    </Link>
                </li>

                <li>
                    <Link href="#">
                        <span className="menu-icon">📰</span>
                        ข่าวสาร / ประกาศ
                    </Link>
                </li>

                <li>
                    <Link href="#">
                        <span className="menu-icon">📊</span>
                        สถิติและรายงาน
                    </Link>
                </li>

                <li>
                    <Link href="#">
                        <span className="menu-icon">❓</span>
                        คำถามที่พบบ่อย
                    </Link>
                </li>

                <li>
                    <Link
                        href="/admin/categories"
                        className="active"
                    >
                        <span className="menu-icon">⚙️</span>
                        หมวดหมู่และจัดการพื้นที่เสี่ยงสูง
                    </Link>
                </li>

            </ul>

            {/* Bottom */}
            <div className="sidebar-bottom">
                🌱
                <br />
                ร่วมสร้างมหาวิทยาลัยน่าอยู่
                <br />
                ไปด้วยกัน
            </div>

        </aside>
    );
}

