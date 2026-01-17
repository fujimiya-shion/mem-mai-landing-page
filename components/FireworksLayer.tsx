"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type Props = {
    enabled?: boolean;
    className?: string;

    zIndex?: number;
    rateMs?: number;
    particles?: number;

    maxDpr?: number; // clamp DPR để nhẹ máy
};

type Particle = {
    x0: number;
    y0: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    g: number;
    life: number;
    t: number;
    r: number;
    a: number;
    hue: number;
    sat: number;
    light: number;
    tw?: gsap.core.Tween;
};

type Rocket = {
    x: number;
    y: number;
    targetY: number;
    hue: number;
    trail: Array<{ x: number; y: number; a: number }>;
    tw?: gsap.core.Tween;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function FireworksLayer({
    enabled = true,
    className,
    zIndex = 15,
    rateMs = 900,
    particles = 60,
    maxDpr = 2,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Nếu không enabled thì clear và thôi
        if (!enabled) {
            const ctx2d = canvas.getContext("2d");
            if (ctx2d) ctx2d.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
            return;
        }

        const particlesArr: Particle[] = [];
        const rockets: Rocket[] = [];
        let fireTimer: number | null = null;

        const colorPalettes = [
            { hue: [10, 30], sat: [85, 100], light: [55, 75] },
            { hue: [40, 60], sat: [90, 100], light: [60, 80] },
            { hue: [320, 340], sat: [80, 95], light: [60, 75] },
            { hue: [270, 290], sat: [70, 90], light: [55, 70] },
            { hue: [180, 200], sat: [75, 95], light: [50, 70] },
            { hue: [0, 15], sat: [95, 100], light: [55, 70] },
        ];

        const resizeCanvas = () => {
            const rect =
                window.innerWidth && window.innerHeight
                    ? { width: window.innerWidth, height: window.innerHeight }
                    : document.documentElement.getBoundingClientRect();

            const dpr = clamp(window.devicePixelRatio || 1, 1, maxDpr);
            canvas.width = Math.round(rect.width * dpr);
            canvas.height = Math.round(rect.height * dpr);
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            const ctx2d = canvas.getContext("2d");
            if (ctx2d) ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const draw = () => {
            const ctx2d = canvas.getContext("2d");
            if (!ctx2d) return;

            const w = canvas.clientWidth;
            const h = canvas.clientHeight;

            ctx2d.clearRect(0, 0, w, h);

            // rockets
            for (let i = rockets.length - 1; i >= 0; i--) {
                const r = rockets[i];

                // trail
                for (let j = 0; j < r.trail.length; j++) {
                    const trail = r.trail[j];
                    const size = 2.5 - (j / r.trail.length) * 1.8;

                    ctx2d.save();
                    ctx2d.globalAlpha = trail.a * 0.85;

                    const trailGlow = ctx2d.createRadialGradient(trail.x, trail.y, 0, trail.x, trail.y, size * 2);
                    trailGlow.addColorStop(0, `hsla(${r.hue}, 95%, 75%, ${trail.a})`);
                    trailGlow.addColorStop(0.5, `hsla(${r.hue}, 90%, 65%, ${trail.a * 0.5})`);
                    trailGlow.addColorStop(1, `hsla(${r.hue}, 85%, 55%, 0)`);

                    ctx2d.fillStyle = trailGlow;
                    ctx2d.beginPath();
                    ctx2d.arc(trail.x, trail.y, size * 2, 0, Math.PI * 2);
                    ctx2d.fill();

                    ctx2d.fillStyle = `hsla(${r.hue}, 100%, 85%, ${trail.a})`;
                    ctx2d.beginPath();
                    ctx2d.arc(trail.x, trail.y, size, 0, Math.PI * 2);
                    ctx2d.fill();

                    ctx2d.restore();
                }

                // head
                ctx2d.save();

                const outerGlow = ctx2d.createRadialGradient(r.x, r.y, 0, r.x, r.y, 12);
                outerGlow.addColorStop(0, `hsla(${r.hue}, 100%, 95%, 0.9)`);
                outerGlow.addColorStop(0.3, `hsla(${r.hue}, 100%, 80%, 0.6)`);
                outerGlow.addColorStop(0.6, `hsla(${r.hue}, 95%, 70%, 0.3)`);
                outerGlow.addColorStop(1, `hsla(${r.hue}, 90%, 60%, 0)`);

                ctx2d.fillStyle = outerGlow;
                ctx2d.beginPath();
                ctx2d.arc(r.x, r.y, 12, 0, Math.PI * 2);
                ctx2d.fill();

                const innerGlow = ctx2d.createRadialGradient(r.x, r.y, 0, r.x, r.y, 5);
                innerGlow.addColorStop(0, `hsla(${r.hue}, 100%, 98%, 1)`);
                innerGlow.addColorStop(0.5, `hsla(${r.hue}, 100%, 85%, 0.9)`);
                innerGlow.addColorStop(1, `hsla(${r.hue}, 100%, 75%, 0.5)`);

                ctx2d.fillStyle = innerGlow;
                ctx2d.beginPath();
                ctx2d.arc(r.x, r.y, 5, 0, Math.PI * 2);
                ctx2d.fill();

                ctx2d.restore();
            }

            // particles
            for (let i = particlesArr.length - 1; i >= 0; i--) {
                const p = particlesArr[i];
                const t = p.t;

                p.x = p.x0 + p.vx * t;
                p.y = p.y0 + p.vy * t + 0.5 * p.g * t * t;
                p.a = clamp(1 - t / p.life, 0, 1);

                ctx2d.save();
                ctx2d.globalAlpha = p.a;

                const gradient = ctx2d.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
                gradient.addColorStop(0, `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${p.a})`);
                gradient.addColorStop(0.4, `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${p.a * 0.5})`);
                gradient.addColorStop(1, `hsla(${p.hue}, ${p.sat}%, ${p.light}%, 0)`);

                ctx2d.fillStyle = gradient;
                ctx2d.beginPath();
                ctx2d.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
                ctx2d.fill();

                ctx2d.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${Math.min(p.light + 20, 95)}%, ${p.a})`;
                ctx2d.beginPath();
                ctx2d.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx2d.fill();

                ctx2d.restore();

                if (t >= p.life) {
                    p.tw?.kill();
                    particlesArr.splice(i, 1);
                }
            }
        };

        const tick = () => draw();

        const spawnExplosion = (cx: number, cy: number, rocketHue: number) => {
            const palette =
                colorPalettes.find((p) => rocketHue >= p.hue[0] && rocketHue <= p.hue[1]) || colorPalettes[0];

            for (let i = 0; i < particles; i++) {
                const angle = rand(0, Math.PI * 2);
                const speed = rand(220, 700);
                const g = rand(250, 650);

                const p: Particle = {
                    x0: cx,
                    y0: cy,
                    x: cx,
                    y: cy,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - rand(100, 300),
                    g,
                    life: rand(1.4, 3.2),
                    t: 0,
                    r: rand(1.8, 3.8),
                    a: 1,
                    hue: rand(palette.hue[0], palette.hue[1]),
                    sat: rand(palette.sat[0], palette.sat[1]),
                    light: rand(palette.light[0], palette.light[1]),
                };

                p.tw = gsap.to(p, {
                    t: p.life,
                    duration: p.life,
                    ease: "power1.out",
                });

                particlesArr.push(p);
            }
        };

        const launchRocket = (startX: number, startY: number, targetY: number) => {
            const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
            const hue = rand(palette.hue[0], palette.hue[1]);

            const rocket: Rocket = {
                x: startX,
                y: startY,
                targetY,
                hue,
                trail: [],
            };

            const duration = rand(0.7, 1.1);

            rocket.tw = gsap.to(rocket, {
                y: targetY,
                duration,
                ease: "power2.out",
                onUpdate: () => {
                    rocket.trail.unshift({ x: rocket.x, y: rocket.y, a: 1 });
                    if (rocket.trail.length > 20) rocket.trail.pop();

                    rocket.trail.forEach((t, i) => (t.a = 1 - i / rocket.trail.length));
                },
                onComplete: () => {
                    spawnExplosion(rocket.x, rocket.y, rocket.hue);
                    const idx = rockets.indexOf(rocket);
                    if (idx > -1) rockets.splice(idx, 1);
                },
            });

            rockets.push(rocket);
        };

        const shoot = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const startX = rand(w * 0.25, w * 0.75);
            const startY = h;
            const targetY = rand(h * 0.15, h * 0.35);
            launchRocket(startX, startY, targetY);
        };

        const onResize = () => resizeCanvas();

        resizeCanvas();
        shoot();
        fireTimer = window.setInterval(shoot, rateMs);
        gsap.ticker.add(tick);
        window.addEventListener("resize", onResize);

        return () => {
            if (fireTimer) window.clearInterval(fireTimer);
            fireTimer = null;

            particlesArr.forEach((p) => p.tw?.kill());
            rockets.forEach((r) => r.tw?.kill());

            particlesArr.length = 0;
            rockets.length = 0;

            gsap.ticker.remove(tick);
            window.removeEventListener("resize", onResize);

            const ctx2d = canvas.getContext("2d");
            if (ctx2d) ctx2d.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        };
    }, [enabled, rateMs, particles, maxDpr]);

    return (
        <canvas
            ref={canvasRef}
            className={["mm-fireworksLayer", className].filter(Boolean).join(" ")}
            style={{
                position: "fixed",
                inset: 0,
                pointerEvents: "none",
                zIndex,
                background: "transparent",
            }}
        />
    );
}
