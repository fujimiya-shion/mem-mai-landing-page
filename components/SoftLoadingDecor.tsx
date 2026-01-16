"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function SoftLoadingDecor() {
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const ctx = gsap.context(() => {
            gsap.to(".mm-ring", { rotate: 360, duration: 2.4, ease: "none", repeat: -1 });
            gsap.to(".mm-loadingText", { y: -10, duration: 1.2, yoyo: true, repeat: -1, ease: "sine.inOut" });

            gsap.utils.toArray<HTMLElement>(".mm-spark").forEach((el, i) => {
                gsap.to(el, {
                    y: `-=${gsap.utils.random(18, 46)}`,
                    x: `+=${gsap.utils.random(-14, 14)}`,
                    opacity: gsap.utils.random(0.25, 0.7),
                    duration: gsap.utils.random(2.2, 4.2),
                    yoyo: true,
                    repeat: -1,
                    ease: "sine.inOut",
                    delay: i * 0.08,
                });
            });
        }, root);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={rootRef} className="mm-decor" aria-hidden="true">
            <div className="mm-ringWrap">
                <svg className="mm-ring" width="84" height="84" viewBox="0 0 84 84">
                    <circle cx="42" cy="42" r="30" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="6" />
                    <path
                        d="M42 12 A30 30 0 0 1 72 42"
                        fill="none"
                        stroke="rgba(255,220,160,0.75)"
                        strokeWidth="6"
                        strokeLinecap="round"
                    />
                </svg>
            </div>

            {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} className="mm-spark" style={{ left: `${10 + i * 6}%`, top: `${20 + (i % 6) * 10}%` }} />
            ))}
        </div>
    );
}
