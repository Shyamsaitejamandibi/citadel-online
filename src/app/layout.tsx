import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import { Shell } from "@/components/shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import "./globals.css";
const sans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const serif = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});
export const metadata: Metadata = {
  title: {
    default: "Citadels — Your next great rivalry",
    template: "%s · Citadels",
  },
  description:
    "Gather your friends, choose your secret character, and build your legacy. Play classic Citadels online with private tables and computer rivals.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <TooltipProvider>
          <Shell>{children}</Shell>
          <Toaster position="bottom-right" richColors />
        </TooltipProvider>
      </body>
    </html>
  );
}
