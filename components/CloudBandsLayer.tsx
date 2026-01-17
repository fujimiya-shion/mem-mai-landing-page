"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type Props = {
    enabled?: boolean;
    zIndex?: number;
};

export default function CloudBandsLayer({ enabled = true, zIndex = 14 }: Props) {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const root = ref.current;
        if (!root || !enabled) return;

        const bands = Array.from(root.querySelectorAll<HTMLElement>(".mm-cloudBand"));

        const loops = bands.map((b, i) =>
            gsap.to(b, {
                xPercent: i % 2 === 0 ? 8 : -8,
                duration: 22 + i * 6,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
            })
        );

        return () => loops.forEach((l) => l.kill());
    }, [enabled]);

    if (!enabled) return null;

    return (
        <div ref={ref} style={{ position: "fixed", inset: 0, zIndex, pointerEvents: "none" }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
                <defs>
                    <linearGradient id="cloudGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                        <stop offset="50%" stopColor="rgba(255,255,255,0.25)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                </defs>

                {[22, 38, 56, 72].map((y, i) => (
                    <rect
                        key={i}
                        className="mm-cloudBand"
                        x="-10"
                        y={y}
                        width="120"
                        height="6"
                        fill="url(#cloudGrad)"
                        opacity={0.22 - i * 0.03}
                        rx="3"
                    />
                ))}
            </svg>
        </div>
    );
}
