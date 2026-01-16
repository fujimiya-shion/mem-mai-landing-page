"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import SheepIntroLottie from "@/components/SheepIntroLottie";

export default function ThemeCinematicToggle({
    intervalMs = 10000,
    coverMs = 1200,
    swapAtMs = 520,
    preloadImages = ["/bg-mem-mai.png", "/bg-mem-mai-dark.png"],
}) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [coverOn, setCoverOn] = useState(false);
    const [assetsReady, setAssetsReady] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const busyRef = useRef(false);
    const timerRef = useRef<number | null>(null);

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

    const cinematicSwap = () => {
        if (!mounted || busyRef.current) return;
        busyRef.current = true;

        setCoverOn(true);

        window.setTimeout(() => {
            setTheme((prev) => (prev === "light" ? "dark" : "light"));
        }, swapAtMs);

        window.setTimeout(() => {
            setCoverOn(false);
            busyRef.current = false;
        }, coverMs);
    };

    useEffect(() => {
        if (!mounted || !assetsReady) return;

        if (!theme) setTheme("light");

        timerRef.current = window.setInterval(cinematicSwap, intervalMs);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
        };
    }, [mounted, assetsReady]);

    if (!mounted) return null;

    return (
        <div className={`mm-themeCover ${coverOn ? "is-on" : ""}`}>
            <div className="mm-themeCoverShade" />
            <div className="mm-themeCoverVignette" />
            <div className="mm-themeCoverCenter">
                <SheepIntroLottie
                    maxSizeVw={isMobile ? 40 : 20}
                    maxSizeVh={isMobile ? 40 : 20}
                />
                <div className="mm-themeCoverText">Switching vibe…</div>
            </div>
        </div>
    );
}
