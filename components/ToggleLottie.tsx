"use client";

import Lottie from "lottie-react";
import toggleAnim from "@/public/toggle_lottie.json";

type Props = {
    maxSizeVw?: number;
    maxSizeVh?: number;

    nudgeX?: number; // px
    nudgeY?: number; // px
    zoom?: number;
};

export default function ToggleLottie({
    maxSizeVw = 40,
    maxSizeVh = 40,
    nudgeX = 0,
    nudgeY = 0,
    zoom = 1.08,
}: Props) {
    return (
        <div className="mm-toggleLottie">
            <div
                className="mm-toggleLottieInner"
                style={{ width: `${maxSizeVw}vw`, height: `${maxSizeVh}vh` }}
            >
                <div
                    className="mm-toggleLottieViewport"
                    style={{
                        transform: `translate(${nudgeX}px, ${nudgeY}px) scale(${zoom})`,
                    }}
                >
                    <Lottie
                        animationData={toggleAnim}
                        loop
                        autoplay
                        style={{ width: "100%", height: "100%" }}
                    />
                </div>
            </div>
        </div>
    );
}
