"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

type Size = number | string;

type Props = {
    src?: string;
    className?: string;
    width?: Size;
    height?: Size;
    preserveAspectRatio?: string;

    stageSelector?: string;
    bgSelector?: string;
    hazeSelector?: string;
    bloomSelector?: string;
    lightSelector?: string;

    bgOpacity?: number;
    bgScale?: number;
    bgBlurPx?: number;
    bgDuration?: number;
    bgDelay?: number;

    glow?: boolean;
    glowDuration?: number;
    glowShadow?: string;
    glowShadowFrom?: string;

    parallax?: boolean;
    parallaxDuration?: number;
    parallaxFrom?: string;
    parallaxTo?: string;

    haze?: boolean;
    hazeDuration?: number;
    hazeXPercent?: number;
    hazeOpacity?: number;

    bloom?: boolean;
    bloomRevealDuration?: number;
    bloomBreathDuration?: number;
    bloomOpacity?: number;

    light?: boolean;
    lightRevealDuration?: number;
    lightOpacity?: number;
    lightDuration?: number;

    floatText?: boolean;
    floatDistancePx?: number;
    floatDuration?: number;

    fireworks?: boolean;
    fireworksRateMs?: number;
    fireworksParticles?: number;

    fetchTimeoutMs?: number;
    animateBg?: boolean;
    onDrawComplete?: () => void;

};

const toCssSize = (v?: Size): string | undefined =>
    v === undefined || v === null ? undefined : typeof v === "number" ? `${v}px` : v;

async function fetchTextWithTimeout(url: string, timeoutMs: number) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { cache: "no-store", signal: controller.signal });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        return await res.text();
    } finally {
        clearTimeout(t);
    }
}

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
    tw?: gsap.core.Tween;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function MemMaiDraw({
    src = "/mem_mai_josefin.svg",
    className,
    width,
    height,
    preserveAspectRatio = "xMidYMid meet",

    stageSelector = ".mm-stage-root",
    bgSelector = ".mm-bgImg",
    hazeSelector = ".mm-haze",
    bloomSelector = ".mm-bloom",
    lightSelector = ".mm-light",

    bgOpacity = 1,
    bgScale = 1,
    bgBlurPx = 0,
    bgDuration = 1.6,
    bgDelay = 0.2,

    glow = true,
    glowDuration = 3.6,
    glowShadowFrom = "drop-shadow(0 0 10px rgba(255,220,160,0.22))",
    glowShadow = "drop-shadow(0 0 26px rgba(255,220,160,0.45))",

    parallax = true,
    parallaxDuration = 18,
    parallaxFrom = "50% 50%",
    parallaxTo = "50% 52%",

    haze = true,
    hazeDuration = 14,
    hazeXPercent = 2,
    hazeOpacity = 0.65,

    bloom = true,
    bloomRevealDuration = 2.2,
    bloomBreathDuration = 3.8,
    bloomOpacity = 0.55,

    light = true,
    lightRevealDuration = 1.8,
    lightOpacity = 0.55,
    lightDuration = 10.5,

    floatText = true,
    floatDistancePx = 32,
    floatDuration = 1.6, // nhanh hơn, giữ biên độ

    fireworks = true,
    fireworksRateMs = 900,
    fireworksParticles = 60,

    fetchTimeoutMs = 12000,
    animateBg = true,
    onDrawComplete,

}: Props) {
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const svgHostRef = useRef<HTMLDivElement | null>(null);
    const fwCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const [svgMarkup, setSvgMarkup] = useState("");
    const [error, setError] = useState<string | null>(null);

    const svgStyle = useMemo(() => {
        const w = toCssSize(width);
        const h = toCssSize(height);
        const style: React.CSSProperties = {};
        if (w) style.width = w;
        if (h) style.height = h;
        if (w && !h) style.height = "auto";
        if (h && !w) style.width = "auto";
        return style;
    }, [width, height]);

    useEffect(() => {
        let cancelled = false;
        setError(null);
        setSvgMarkup("");

        (async () => {
            try {
                const text = await fetchTextWithTimeout(src, fetchTimeoutMs);
                if (!cancelled) setSvgMarkup(text);
            } catch (e: any) {
                if (!cancelled) setError(e?.message ?? "Failed to load SVG");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [src, fetchTimeoutMs]);

    useEffect(() => {
        const wrap = wrapRef.current;
        const svgHost = svgHostRef.current;
        if (!wrap || !svgHost || !svgMarkup) return;

        const ctx = gsap.context(() => {
            // inject svg
            svgHost.innerHTML = svgMarkup;

            const svg = svgHost.querySelector("svg");
            if (!svg) return;

            svg.classList.add("mm-svg");
            svg.removeAttribute("width");
            svg.removeAttribute("height");
            svg.setAttribute("preserveAspectRatio", preserveAspectRatio);

            Object.entries(svgStyle).forEach(([k, v]) => {
                // @ts-expect-error
                svg.style[k] = v as any;
            });

            const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path"));
            if (!paths.length) return;

            let group = svg.querySelector<SVGGElement>('g[data-mm-group="1"]');
            if (!group) {
                const existingG = svg.querySelector("g");
                if (existingG) {
                    group = existingG as SVGGElement;
                    group.setAttribute("data-mm-group", "1");
                } else {
                    group = document.createElementNS("http://www.w3.org/2000/svg", "g");
                    group.setAttribute("data-mm-group", "1");
                    while (svg.firstChild) group.appendChild(svg.firstChild);
                    svg.appendChild(group);
                }
            }

            gsap.set(wrap, {
                x: 0,
                y: 0,
                rotate: 0,
                scale: 1,
                transformOrigin: "50% 50%",
                force3D: true,
                willChange: "transform",
            });

            gsap.set(group, { transformOrigin: "50% 50%" });

            paths.forEach((p) => {
                const len = p.getTotalLength();
                p.style.strokeDasharray = `${len}`;
                p.style.strokeDashoffset = `${len}`;
                p.style.stroke = "rgba(245,245,245,0.95)";
                p.style.fill = "rgba(245,245,245,0.95)";
                (p.style as any).fillOpacity = "0";
                (p.style as any).strokeOpacity = "1";
                p.style.vectorEffect = "non-scaling-stroke";
            });

            const stage =
                wrap.closest<HTMLElement>(stageSelector) ?? document.querySelector<HTMLElement>(stageSelector);

            const bg = animateBg ? stage?.querySelector<HTMLElement>(bgSelector) ?? null : null;
            const hazeEl = stage?.querySelector<HTMLElement>(hazeSelector) ?? null;
            const bloomEl = stage?.querySelector<HTMLElement>(bloomSelector) ?? null;
            const lightEl = stage?.querySelector<HTMLElement>(lightSelector) ?? null;

            if (bg) {
                gsap.set(bg, { opacity: 0, scale: 1.12, filter: "blur(12px)" });
                if (parallax) gsap.set(bg, { backgroundPosition: parallaxFrom });
            }
            if (hazeEl) gsap.set(hazeEl, { opacity: 0, xPercent: -hazeXPercent });
            if (bloomEl) gsap.set(bloomEl, { opacity: 0, scale: 1.03 });
            if (lightEl) gsap.set(lightEl, { opacity: 0, xPercent: -18, yPercent: 6, rotate: -8, scale: 1.05 });
            if (glow) gsap.set(svg, { filter: glowShadowFrom });

            // ===== Fireworks system =====
            const canvas = fwCanvasRef.current;
            const particles: Particle[] = [];
            let rafing = false;
            let fireTimer: number | null = null;

            const resizeCanvas = () => {
                if (!canvas) return;
                const host = stage ?? wrap;
                const rect = host.getBoundingClientRect();
                const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
                canvas.width = Math.round(rect.width * dpr);
                canvas.height = Math.round(rect.height * dpr);
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;
                const ctx2d = canvas.getContext("2d");
                if (ctx2d) ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
            };

            const draw = () => {
                if (!canvas) return;
                const ctx2d = canvas.getContext("2d");
                if (!ctx2d) return;

                const w = canvas.clientWidth;
                const h = canvas.clientHeight;

                ctx2d.clearRect(0, 0, w, h);

                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];

                    // advance "physics" from tween time p.t
                    const t = p.t;
                    p.x = p.x0 + p.vx * t;
                    p.y = p.y0 + p.vy * t + 0.5 * p.g * t * t;

                    p.a = clamp(1 - t / p.life, 0, 1);

                    ctx2d.beginPath();
                    ctx2d.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.a})`;
                    ctx2d.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx2d.fill();

                    if (t >= p.life) {
                        p.tw?.kill();
                        particles.splice(i, 1);
                    }
                }

                if (particles.length === 0 && rafing) {
                    rafing = false;
                }
            };

            const tick = () => {
                draw();
            };

            const ensureTicker = () => {
                if (!rafing) {
                    rafing = true;
                }
            };

            const spawnExplosion = (cx: number, cy: number) => {
                const count = fireworksParticles;
                const hueBase = rand(10, 55); // hơi vàng ấm giống vibe của bạn

                for (let i = 0; i < count; i++) {
                    const angle = rand(0, Math.PI * 2);
                    const speed = rand(140, 520);
                    const g = rand(380, 920); // gravity

                    const p: Particle = {
                        x0: cx,
                        y0: cy,
                        x: cx,
                        y: cy,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - rand(60, 220), // nhấc lên chút
                        g,
                        life: rand(0.9, 2.1),
                        t: 0,
                        r: rand(1.2, 2.6),
                        a: 1,
                        hue: hueBase + rand(-20, 20),
                    };

                    // giống “createExplosion()”: mỗi particle có tween life riêng, fade-out theo time :contentReference[oaicite:1]{index=1}
                    p.tw = gsap.to(p, {
                        t: p.life,
                        duration: p.life,
                        ease: "power1.out",
                        onUpdate: ensureTicker,
                    });

                    particles.push(p);
                }
            };

            const startFireworks = () => {
                if (!fireworks || !canvas) return;

                resizeCanvas();
                const host = stage ?? wrap;

                const shoot = () => {
                    const rect = host.getBoundingClientRect();
                    const x = rand(rect.width * 0.15, rect.width * 0.85);
                    const y = rand(rect.height * 0.15, rect.height * 0.45);
                    spawnExplosion(x, y);
                };

                shoot();
                fireTimer = window.setInterval(shoot, fireworksRateMs);
                gsap.ticker.add(tick);
            };

            const stopFireworks = () => {
                if (fireTimer) window.clearInterval(fireTimer);
                fireTimer = null;

                particles.forEach((p) => p.tw?.kill());
                particles.length = 0;

                gsap.ticker.remove(tick);

                if (canvas) {
                    const ctx2d = canvas.getContext("2d");
                    if (ctx2d) ctx2d.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
                }
            };

            const onResize = () => resizeCanvas();

            // ===== loops + float =====
            const loops: gsap.core.Animation[] = [];
            let floatLoop: gsap.core.Timeline | null = null;

            const startFloat = () => {
                if (!floatText) return;
                floatLoop?.kill();
                floatLoop = gsap.timeline({ repeat: -1, yoyo: true });
                floatLoop.to(wrap, {
                    y: -floatDistancePx,
                    duration: floatDuration,
                    ease: "sine.inOut",
                    force3D: true,
                    overwrite: "auto",
                });
            };

            const startLoops = () => {
                if (bg && parallax) {
                    loops.push(
                        gsap.to(bg, {
                            backgroundPosition: parallaxTo,
                            duration: parallaxDuration,
                            ease: "sine.inOut",
                            repeat: -1,
                            yoyo: true,
                        })
                    );
                }

                if (haze && hazeEl) {
                    loops.push(
                        gsap.to(hazeEl, {
                            xPercent: hazeXPercent,
                            duration: hazeDuration,
                            ease: "sine.inOut",
                            repeat: -1,
                            yoyo: true,
                        })
                    );
                }

                if (bloom && bloomEl) {
                    loops.push(
                        gsap.to(bloomEl, {
                            opacity: bloomOpacity,
                            duration: bloomBreathDuration,
                            ease: "sine.inOut",
                            repeat: -1,
                            yoyo: true,
                        })
                    );
                }

                if (light && lightEl) {
                    loops.push(
                        gsap.to(lightEl, {
                            xPercent: 18,
                            yPercent: -6,
                            rotate: 6,
                            duration: lightDuration,
                            ease: "sine.inOut",
                            repeat: -1,
                            yoyo: true,
                        })
                    );
                    loops.push(
                        gsap.to(lightEl, {
                            scale: 1.12,
                            duration: lightDuration * 0.72,
                            ease: "sine.inOut",
                            repeat: -1,
                            yoyo: true,
                        })
                    );
                }

                if (glow) {
                    loops.push(
                        gsap.to(svg, {
                            filter: glowShadow,
                            duration: glowDuration,
                            ease: "sine.inOut",
                            repeat: -1,
                            yoyo: true,
                        })
                    );
                }
            };

            // ===== REVEAL timeline (finite) =====
            const revealTl = gsap.timeline({ defaults: { ease: "power2.out" } });

            revealTl.fromTo(group, { scale: 1.25 }, { scale: 1, duration: 2.4, ease: "power3.out" }, 0);
            revealTl.to(paths, { strokeDashoffset: 0, duration: 2.2, stagger: 0.12 }, 0);
            revealTl.to(paths, { fillOpacity: 1, duration: 1.2, stagger: 0.08 }, 1.2);
            revealTl.to(paths, { strokeOpacity: 0, duration: 1.2, stagger: 0.08 }, 1.2);

            // bg tween: start float + fireworks right after bg done
            if (bg) {
                revealTl.to(
                    bg,
                    {
                        opacity: bgOpacity,
                        scale: bgScale,
                        filter: `blur(${bgBlurPx}px)`,
                        duration: bgDuration,
                        ease: "power3.out",
                    },
                    `+=${bgDelay}`
                );

                revealTl.add(() => {
                    startFloat();
                    startFireworks();
                    window.addEventListener("resize", onResize);
                }, ">");
            } else {
                revealTl.add(() => {
                    startFloat();
                    startFireworks();
                    window.addEventListener("resize", onResize);
                }, ">");
            }

            if (haze && hazeEl) revealTl.to(hazeEl, { opacity: hazeOpacity, duration: 1.2 }, "<");
            if (bloom && bloomEl) revealTl.to(bloomEl, { opacity: 1, duration: bloomRevealDuration }, "<");
            if (light && lightEl) revealTl.to(lightEl, { opacity: lightOpacity, duration: lightRevealDuration }, "<");

            revealTl.eventCallback("onComplete", () => {
                startLoops();
                onDrawComplete?.();
            });


            return () => {
                window.removeEventListener("resize", onResize);

                stopFireworks();

                floatLoop?.kill();
                loops.forEach((a) => a.kill());
                revealTl.kill();
            };
        }, wrap);

        return () => ctx.revert();
    }, [
        svgMarkup,
        svgStyle,
        preserveAspectRatio,

        stageSelector,
        bgSelector,
        hazeSelector,
        bloomSelector,
        lightSelector,

        bgOpacity,
        bgScale,
        bgBlurPx,
        bgDuration,
        bgDelay,

        glow,
        glowDuration,
        glowShadow,
        glowShadowFrom,

        parallax,
        parallaxDuration,
        parallaxFrom,
        parallaxTo,

        haze,
        hazeDuration,
        hazeXPercent,
        hazeOpacity,

        bloom,
        bloomRevealDuration,
        bloomBreathDuration,
        bloomOpacity,

        light,
        lightRevealDuration,
        lightOpacity,
        lightDuration,

        floatText,
        floatDistancePx,
        floatDuration,

        fireworks,
        fireworksRateMs,
        fireworksParticles,
    ]);

    if (error) {
        return (
            <div className={["mm-wrap", className].filter(Boolean).join(" ")}>
                <div style={{ opacity: 0.9 }}>
                    Failed to load SVG: <span style={{ opacity: 0.8 }}>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div ref={wrapRef} className={["mm-wrap", className].filter(Boolean).join(" ")}>
            <canvas ref={fwCanvasRef} className="mm-fireworks" />
            <div ref={svgHostRef} className="mm-svgHost" />
        </div>
    );
}
