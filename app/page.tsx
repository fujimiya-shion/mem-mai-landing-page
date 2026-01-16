"use client";

import { useEffect, useState } from "react";
import SheepIntroLottie from "@/components/SheepIntroLottie";
import MemMaiDraw from "@/components/MemMaiDraw";

export default function Page() {
    const [showIntro, setShowIntro] = useState(true);
    const [bgOn, setBgOn] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => {
            setShowIntro(false);
            setBgOn(true); // sau intro thì bật bg mem-mai
        }, 3000);

        return () => clearTimeout(t);
    }, []);

    return (
        <div
            className={[
                "mm-stage-root",
                showIntro ? "is-intro" : "is-main",
            ].join(" ")}
        >
            {/* background chính */}
            <div className={["mm-bg", bgOn ? "is-on" : ""].join(" ")}>
                <div className="mm-bgImg" />
                <div className="mm-bgOverlay" />
            </div>

            {showIntro && <SheepIntroLottie maxSizeVw={40} maxSizeVh={40} />}

            <div className="mm-content">
                {!showIntro && <MemMaiDraw />}
            </div>
        </div>
    );
}
