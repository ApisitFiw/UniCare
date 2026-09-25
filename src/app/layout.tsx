import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

const promptFont = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UniCare · ระบบบริหารจัดการสิ่งแวดล้อม มหาวิทยาลัยวลัยลักษณ์",
  description: "ระบบรับแจ้งปัญหาและติดตามสถานะสิ่งแวดล้อม มหาวิทยาลัยวลัยลักษณ์",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${promptFont.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
