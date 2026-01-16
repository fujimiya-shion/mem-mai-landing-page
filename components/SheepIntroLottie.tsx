"use client";

import Lottie from "lottie-react";
import sheepAnim from "@/public/sheep_lottie.json";

type Props = {
    maxSizeVw?: number;
    maxSizeVh?: number;

    // nắn center vì JSON lệch
    nudgeX?: number; // px
    nudgeY?: number; // px
    zoom?: number;
};

export default function SheepIntroLottie({
    maxSizeVw = 70,
    maxSizeVh = 70,
    nudgeX = 0,
    nudgeY = -90, // ✅ kéo lên cho vào giữa
    zoom = 1.08,
}: Props) {
    return (
        <div className="mm-sheepLottie">
            <div
                className="mm-sheepLottieInner"
                style={{ width: `${maxSizeVw}vw`, height: `${maxSizeVh}vh` }}
            >
                <div
                    className="mm-sheepLottieViewport"
                    style={{
                        transform: `translate(${nudgeX}px, ${nudgeY}px) scale(${zoom})`,
                    }}
                >
                    <Lottie animationData={sheepAnim} loop autoplay style={{ width: "100%", height: "100%" }} />
                </div>
            </div>
        </div>
    );
}
