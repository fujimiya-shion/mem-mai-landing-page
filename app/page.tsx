"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import SheepIntroLottie from "@/components/SheepIntroLottie";
import MemMaiDraw from "@/components/MemMaiDraw";
import ThemeCinematicToggle from "@/components/ThemeCinematicToggle";

export default function Page() {
    const { theme } = useTheme();

    const [mounted, setMounted] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [bgOn, setBgOn] = useState(false);

    const [drawDone, setDrawDone] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        const t = setTimeout(() => {
            setShowIntro(false);
            setBgOn(true);
        }, 3000);
        return () => clearTimeout(t);
    }, []);

    if (!mounted) return null;

    return (
        <div className={["mm-stage-root", showIntro ? "is-intro" : "is-main"].join(" ")}>
            {/* chỉ bắt đầu đếm 10s sau khi MemMaiDraw vẽ xong */}
            {drawDone && (
                <ThemeCinematicToggle
                    intervalMs={15000}
                    coverMs={1200}
                    swapAtMs={520}
                    preloadImages={["/bg-mem-mai.png", "/bg-mem-mai-dark.png"]}
                />
            )}

            <div
                className={[
                    "mm-bg",
                    bgOn ? "is-on" : "",
                    theme === "dark" ? "is-dark" : "is-light",
                ].join(" ")}
            >
                <div className="mm-bgImg" />
                <div className="mm-bgOverlay" />
            </div>

            {showIntro && <SheepIntroLottie maxSizeVw={20} maxSizeVh={20} />}

            <div className="mm-content">
                {!showIntro && (
                    <MemMaiDraw
                        isFireworksEnable={theme === 'dark'}
                        animateBg
                        onDrawComplete={() => setDrawDone(true)}
                    />
                )}
            </div>
        </div>
    );
}
