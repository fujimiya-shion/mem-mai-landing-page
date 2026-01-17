"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import SheepIntroLottie from "@/components/SheepIntroLottie";

export default function ThemeCinematicToggle({
    intervalMs = 10000,
    coverMs = 1200,
    swapAtMs = 520,
    preloadImages = ["/bg-mem-mai.png", "/bg-mem-mai-dark.png"],
}: {
    intervalMs?: number;
    coverMs?: number;
    swapAtMs?: number;
    preloadImages?: string[];
}) {
    const { theme, setTheme } = useTheme();

    const [mounted, setMounted] = useState(false);
    const [coverOn, setCoverOn] = useState(false);
    const [assetsReady, setAssetsReady] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const busyRef = useRef(false);
    const timerRef = useRef<number | null>(null);

    // ✅ giữ theme mới nhất để interval không bị stale
    const themeRef = useRef<string | undefined>(theme);
    useEffect(() => {
        themeRef.current = theme;
    }, [theme]);

    useEffect(() => {
        setMounted(true);

        const mq = window.matchMedia("(max-width: 768px)");
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        let cancelled = false;

        (async () => {
            await Promise.all(
                preloadImages.map(
                    (url) =>
                        new Promise<void>((resolve) => {
                            const img = new Image();
                            img.onload = img.onerror = () => resolve();
                            img.src = url;
                        })
                )
            );
            if (!cancelled) setAssetsReady(true);
        })();

        return () => {
            cancelled = true;
        };
    }, [mounted, preloadImages]);

    const cinematicSwap = useCallback(() => {
        if (!mounted || busyRef.current) return;
        busyRef.current = true;

        setCoverOn(true);

        window.setTimeout(() => {
            const current = themeRef.current ?? "light";
            const next = current === "light" ? "dark" : "light";
            setTheme(next); // ✅ string
        }, swapAtMs);

        window.setTimeout(() => {
            setCoverOn(false);
            busyRef.current = false;
        }, coverMs);
    }, [mounted, setTheme, swapAtMs, coverMs]);

    useEffect(() => {
        if (!mounted || !assetsReady) return;

        // ✅ nếu theme chưa có (trong lúc hydrate), ép về light
        if (!themeRef.current) {
            setTheme("light");
        }

        timerRef.current = window.setInterval(cinematicSwap, intervalMs);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
        };
    }, [mounted, assetsReady, intervalMs, cinematicSwap, setTheme]);

    if (!mounted) return null;

    return (
        <div className={`mm-themeCover ${coverOn ? "is-on" : ""}`}>
            <div className="mm-themeCoverShade" />
            <div className="mm-themeCoverVignette" />
            <div className="mm-themeCoverCenter">
                <SheepIntroLottie maxSizeVw={isMobile ? 40 : 20} maxSizeVh={isMobile ? 40 : 20} />
                <div className="mm-themeCoverText">Switching vibe…</div>
            </div>
        </div>
    );
}
