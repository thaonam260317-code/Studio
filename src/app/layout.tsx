import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio",
  description: "Phân tích thương hiệu và dựng video marketing bằng code.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <div className="bars" aria-hidden="true">
          <i /><i /><i /><i /><i /><i /><i />
        </div>
        <header className="top">
          <Link href="/" className="brand">Studio</Link>
          <nav>
            <Link href="/">Dựng video</Link>
            <Link href="/matrix">Ma trận use case</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
