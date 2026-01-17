"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type Props = {
    enabled?: boolean;
    zIndex?: number;
};

export default function SunHaloLayer({ enabled = true, zIndex = 11 }: Props) {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || !enabled) return;

        const tl = gsap.timeline({ repeat: -1, yoyo: true });

        tl.fromTo(
            el,
            { scale: 0.96, opacity: 0.18 },
            { scale: 1.04, opacity: 0.32, duration: 4.5, ease: "sine.inOut" }
        );

        return () => {
            tl.kill();
        };
    }, [enabled]);


    if (!enabled) return null;

    return (
        <div
            ref={ref}
            style={{
                position: "fixed",
                inset: 0,
                zIndex,
                pointerEvents: "none",
                background:
                    "radial-gradient(600px 360px at 50% 22%, rgba(255,240,200,0.35), rgba(255,240,200,0.12), rgba(255,240,200,0) 70%)",
            }}
        />
    );
}
