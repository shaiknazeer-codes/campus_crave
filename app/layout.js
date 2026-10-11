import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Campus Crave · College Canteen Ordering",
  description: "Your campus cravings, just a click away. Good food, fast breaks, zero waiting.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ef6b32",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full w-full overflow-x-hidden flex flex-col bg-[#fffaf3] text-gray-900 selection:bg-orange-200 selection:text-orange-950">
        {children}
      </body>
    </html>
  );
}
