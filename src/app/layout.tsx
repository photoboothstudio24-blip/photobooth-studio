import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getUser } from "@/lib/supabase/server";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "PHOTOBOOTH STUDIO — Online photobooth",
  description: "An online photobooth experience to capture, customize, and create beautiful memories — anytime, anywhere.",
};
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F3F8" },
    { media: "(prefers-color-scheme: dark)", color: "#121016" },
  ],
};

const themeScript = `try{var t=localStorage.getItem("pbs-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const signedIn = !!(await getUser());
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-body antialiased">
        <Navbar signedIn={signedIn} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
