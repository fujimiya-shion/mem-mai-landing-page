"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";

type Props = {
    enabled?: boolean;
    className?: string;
    zIndex?: number;

    count?: number;
    twinkleDuration?: [number, number];
    driftDuration?: [number, number];
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function SparkleDustLayer({
    enabled = true,
    className,
    zIndex = 13,

    count = 42,
    twinkleDuration = [1.6, 3.2],
    driftDuration = [6, 14],
}: Props) {
    const rootRef = useRef<HTMLDivElement | null>(null);

    const dots = useMemo(() => {
        return Array.from({ length: count }).map(() => ({
            cx: rand(8, 92),
            cy: rand(10, 90),
            r: rand(0.5, 1.8),
            a: rand(0.12, 0.42),
        }));
    }, [count]);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        if (!enabled) {
            gsap.killTweensOf(root.querySelectorAll("*"));
            return;
        }

        const ctx = gsap.context(() => {
            const nodes = Array.from(root.querySelectorAll<SVGCircleElement>(".mm-dustDot"));
            if (nodes.length === 0) return;

            gsap.set(nodes, { transformOrigin: "50% 50%", scale: 0.6, opacity: 0 });

            const loops: gsap.core.Animation[] = [];

            nodes.forEach((n) => {
                const tw = gsap.to(n, {
                    opacity: rand(0.12, 0.55),
                    scale: rand(0.9, 1.35),
                    duration: rand(twinkleDuration[0], twinkleDuration[1]),
                    ease: "sine.inOut",
                    repeat: -1,
                    yoyo: true,
                    delay: rand(0, 1.2),
                });

                const drift = gsap.to(n, {
                    x: rand(-8, 10),
                    y: rand(-10, 8),
                    duration: rand(driftDuration[0], driftDuration[1]),
                    ease: "sine.inOut",
                    repeat: -1,
                    yoyo: true,
                    delay: rand(0, 1.5),
                });

                loops.push(tw, drift);
            });

            // reveal nhanh cho đỡ “bật cứng”
            loops.push(
                gsap.to(nodes, {
                    opacity: (i) => {
                        const a = parseFloat((nodes[i].getAttribute("data-a") || "0.22") as string);
                        return a;
                    },
                    duration: 0.8,
                    ease: "sine.out",
                    stagger: 0.02,
                })
            );

            return () => loops.forEach((a) => a.kill());
        }, root);

        return () => ctx.revert();
    }, [enabled, twinkleDuration, driftDuration]);

    if (!enabled) return null;

    return (
        <div
            ref={rootRef}
            className={["mm-dustLayer", className].filter(Boolean).join(" ")}
            style={{
                position: "fixed",
                inset: 0,
                pointerEvents: "none",
                zIndex,
                background: "transparent",
            }}
        >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                <defs>
                    <radialGradient id="mmDustGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(255, 250, 235, 0.95)" />
                        <stop offset="70%" stopColor="rgba(255, 250, 235, 0.25)" />
                        <stop offset="100%" stopColor="rgba(255, 250, 235, 0)" />
                    </radialGradient>
                </defs>

                {dots.map((d, i) => (
                    <circle
                        key={i}
                        className="mm-dustDot"
                        cx={d.cx}
                        cy={d.cy}
                        r={d.r}
                        fill="url(#mmDustGrad)"
                        data-a={d.a}
                    />
                ))}
            </svg>
        </div>
    );
}
