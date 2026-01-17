"use client";

import Lottie from "lottie-react";
import dayNightAnim from "@/public/day_night_lottie.json";

type Props = {
    maxSizeVw?: number;
    maxSizeVh?: number;

    nudgeX?: number; // px
    nudgeY?: number; // px
    zoom?: number;

    loop?: boolean;
    autoplay?: boolean;
};

export default function DayNightIntroLottie({
    maxSizeVw = 100,
    maxSizeVh = 100,
    nudgeX = 0,
    nudgeY = -100,
    zoom = 1.5,
    loop = true,
    autoplay = true,
}: Props) {
    return (
        <div className="mm-dayNightLottie">
            <div
                className="mm-dayNightLottieInner"
                style={{
                    width: `${maxSizeVw}vw`,
                    height: `${maxSizeVh}vh`,
                }}
            >
                <div
                    className="mm-dayNightLottieViewport"
                    style={{
                        transform: `translate(${nudgeX}px, ${nudgeY}px) scale(${zoom})`,
                        transformOrigin: "center",
                    }}
                >
                    <Lottie
                        animationData={dayNightAnim}
                        loop={loop}
                        autoplay={autoplay}
                        style={{ width: "100%", height: "100%" }}
                    />
                </div>
            </div>
        </div>
    );
}
