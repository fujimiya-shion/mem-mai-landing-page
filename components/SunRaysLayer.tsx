"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";

type Props = {
    enabled?: boolean;
    className?: string;
    zIndex?: number;

    origin?: "top-left" | "top-center";
    rays?: number;

    drawDuration?: number;
    drawStagger?: number;

    breatheOpacityFrom?: number;
    breatheOpacityTo?: number;
    breatheDuration?: number;

    driftRotateDeg?: number;
    driftDuration?: number;
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function SunRaysLayer({
    enabled = true,
    className,
    zIndex = 12,

    origin = "top-left",
    rays = 14,

    drawDuration = 1.6,
    drawStagger = 0.06,

    breatheOpacityFrom = 0.08,
    breatheOpacityTo = 0.22,
    breatheDuration = 3.6,

    driftRotateDeg = 1.2,
    driftDuration = 10,
}: Props) {
    const rootRef = useRef<HTMLDivElement | null>(null);

    const rayDefs = useMemo(() => {
        // SVG viewBox 0..100 (dễ scale full màn)
        const ox = origin === "top-left" ? 10 : 50;
        const oy = origin === "top-left" ? 12 : 8;

        const outR = 120; // vươn ra ngoài viewBox để tia dài
        const startR = 18;

        const baseAngle = origin === "top-left" ? 18 : 90;
        const spread = origin === "top-left" ? 65 : 70;

        const list = Array.from({ length: rays }).map((_, i) => {
            const t = rays <= 1 ? 0.5 : i / (rays - 1);
            const a = (baseAngle - spread / 2 + spread * t) * (Math.PI / 180);

            const x1 = ox + Math.cos(a) * startR;
            const y1 = oy + Math.sin(a) * startR;
            const x2 = ox + Math.cos(a) * outR;
            const y2 = oy + Math.sin(a) * outR;

            const w = rand(0.8, 2.2); // stroke width
            const o = rand(0.18, 0.55); // individual opacity
            return { x1, y1, x2, y2, w, o };
        });

        return { ox, oy, list };
    }, [origin, rays]);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        if (!enabled) {
            // clear style nhanh
            gsap.killTweensOf(root.querySelectorAll("*"));
            return;
        }

        const ctx = gsap.context(() => {
            const svg = root.querySelector("svg");
            const group = root.querySelector<SVGGElement>(".mm-sunRaysGroup");
            const lines = Array.from(root.querySelectorAll<SVGLineElement>(".mm-sunRay"));

            if (!svg || !group || lines.length === 0) return;

            // init
            gsap.set(root, { opacity: 1 });
            gsap.set(group, {
                transformOrigin: origin === "top-left" ? "10% 12%" : "50% 8%",
                rotate: 0,
            });

            // prepare draw
            lines.forEach((l) => {
                // line.getTotalLength() vẫn ok với <line>
                const len = clamp(l.getTotalLength(), 1, 10000);
                l.style.strokeDasharray = `${len}`;
                l.style.strokeDashoffset = `${len}`;
            });

            const reveal = gsap.timeline({ defaults: { ease: "power2.out" } });

            reveal.to(lines, {
                strokeDashoffset: 0,
                duration: drawDuration,
                stagger: drawStagger,
            });

            // opacity breathe cho group (nhẹ nhàng)
            reveal.to(
                group,
                {
                    opacity: breatheOpacityTo,
                    duration: 0.8,
                    ease: "sine.out",
                },
                "<"
            );

            // loop
            const loops: gsap.core.Animation[] = [];

            loops.push(
                gsap.fromTo(
                    group,
                    { opacity: breatheOpacityFrom },
                    {
                        opacity: breatheOpacityTo,
                        duration: breatheDuration,
                        ease: "sine.inOut",
                        repeat: -1,
                        yoyo: true,
                    }
                )
            );

            loops.push(
                gsap.to(group, {
                    rotate: driftRotateDeg,
                    duration: driftDuration,
                    ease: "sine.inOut",
                    repeat: -1,
                    yoyo: true,
                })
            );

            // nhẹ nhẹ scale như “nắng rung”
            loops.push(
                gsap.to(group, {
                    scale: 1.02,
                    duration: driftDuration * 0.8,
                    ease: "sine.inOut",
                    repeat: -1,
                    yoyo: true,
                })
            );

            return () => {
                loops.forEach((a) => a.kill());
            };
        }, root);

        return () => ctx.revert();
    }, [
        enabled,
        origin,
        drawDuration,
        drawStagger,
        breatheOpacityFrom,
        breatheOpacityTo,
        breatheDuration,
        driftRotateDeg,
        driftDuration,
    ]);

    if (!enabled) return null;

    return (
        <div
            ref={rootRef}
            className={["mm-sunRaysLayer", className].filter(Boolean).join(" ")}
            style={{
                position: "fixed",
                inset: 0,
                pointerEvents: "none",
                zIndex,
                background: "transparent",
                opacity: 1,
            }}
        >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                {/* Tạo cảm giác nắng sáng bằng gradient stroke */}
                <defs>
                    <linearGradient id="mmSunRayGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(255, 244, 214, 0.85)" />
                        <stop offset="50%" stopColor="rgba(255, 236, 190, 0.35)" />
                        <stop offset="100%" stopColor="rgba(255, 236, 190, 0)" />
                    </linearGradient>

                    {/* vignette nhẹ để tia “ăn” vào nền */}
                    <radialGradient id="mmSunVignette" cx={rayDefs.ox} cy={rayDefs.oy} r="70">
                        <stop offset="0%" stopColor="rgba(255, 250, 235, 0.10)" />
                        <stop offset="60%" stopColor="rgba(255, 250, 235, 0.02)" />
                        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                    </radialGradient>
                </defs>

                {/* wash */}
                <rect x="0" y="0" width="100" height="100" fill="url(#mmSunVignette)" />

                <g className="mm-sunRaysGroup" opacity={0.14}>
                    {rayDefs.list.map((r, idx) => (
                        <line
                            key={idx}
                            className="mm-sunRay"
                            x1={r.x1}
                            y1={r.y1}
                            x2={r.x2}
                            y2={r.y2}
                            stroke="url(#mmSunRayGrad)"
                            strokeWidth={r.w}
                            strokeLinecap="round"
                            opacity={r.o}
                        />
                    ))}
                </g>
            </svg>
        </div>
    );
}
