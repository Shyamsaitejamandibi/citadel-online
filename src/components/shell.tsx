"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Castle,
  Swords,
  Layers3,
  BookOpen,
  Volume2,
  VolumeX,
  Crown,
  Settings2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { usePreference, savePreference } from "@/lib/preferences";
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [soundValue, setSoundValue] = usePreference("citadel-sound", "false");
  const sound = soundValue === "true";
  const [profileName] = usePreference("citadel-name");
  const [settings, setSettings] = useState(false);
  const [name, setName] = useState("");
  const nav = [
    { href: "/", label: "Play", icon: Swords },
    { href: "/collection", label: "Card collection", icon: Layers3 },
    { href: "/how-to-play", label: "How to play", icon: BookOpen },
  ];
  return (
    <div
      className={`app-shell ${path.startsWith("/play/") ? "playing-shell" : ""}`}
    >
      <header className="hub-header">
        <Link href="/" className="brand" aria-label="Citadels home">
          <div className="brand-mark">
            <Castle strokeWidth={1.3} />
          </div>
          <div>
            <span>CITADELS</span>
            <small>THE ONLINE TABLE</small>
          </div>
        </Link>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`nav-item ${(n.href === "/" ? path === "/" || path.startsWith("/play") : path.startsWith(n.href)) ? "active" : ""}`}
            >
              <n.icon size={18} strokeWidth={1.65} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hub-utilities">
          <button
            className="utility-link"
            onClick={() => {
              const next = !sound;
              setSoundValue(String(next));
              window.dispatchEvent(new Event("citadel-sound"));
              toast(next ? "Turn sounds on" : "Turn sounds off");
            }}
          >
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}Sound{" "}
            {sound ? "on" : "off"}
            <span className={`tiny-toggle ${sound ? "on" : ""}`} />
          </button>
          <button
            className="profile-link"
            onClick={() => {
              setName(profileName);
              setSettings(true);
            }}
          >
            <span className="avatar">
              <Crown size={18} />
            </span>
            <span>
              <strong>{profileName || "Aspiring ruler"}</strong>
              <small>Your local profile</small>
            </span>
            <Settings2 size={16} />
          </button>
        </div>
      </header>
      <div className="main-shell">
        {children}
        <footer className="site-footer">
          <span>
            <Castle size={14} /> Built for good company & great rivalries.
          </span>
          <span>
            Unofficial fan-made adaptation · Citadels by Bruno Faidutti
          </span>
        </footer>
      </div>
      <Dialog open={settings} onOpenChange={setSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make yourself at home</DialogTitle>
            <DialogDescription>
              Your name is used when you join a new table. Your games are saved
              in this browser.
            </DialogDescription>
          </DialogHeader>
          <label className="field-label" htmlFor="profile-name">
            Display name
          </label>
          <Input
            id="profile-name"
            value={name}
            maxLength={24}
            placeholder="Aspiring ruler"
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            onClick={() => {
              savePreference("citadel-name", name.trim());
              setSettings(false);
              toast.success("Profile saved");
            }}
          >
            Save profile
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
