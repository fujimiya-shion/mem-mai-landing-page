"use client";

import { useState } from "react";
import MemMaiDraw from "@/components/MemMaiDraw";
import SheepIntro from "@/components/SheepIntro";

export default function Page() {
    const [introDone, setIntroDone] = useState(false);
    const [drawDone, setDrawDone] = useState(false);

    return (
        <div className="mm-stage-root">
            {/* BG luôn tồn tại nhưng ẩn tới khi drawDone */}
            <div className={["mm-bg", drawDone ? "is-on" : ""].join(" ")}>
                <div className="mm-bgImg" />
                <div className="mm-bgOverlay" />
            </div>

            {!introDone && (
                <SheepIntro durationMs={3000} count={12} onDone={() => setIntroDone(true)} />
            )}

            <div className="mm-content">
                {introDone && (
                    <MemMaiDraw
                        animateBg={false}
                        onDrawComplete={() => setDrawDone(true)}
                    />
                )}
            </div>
        </div>
    );
}
