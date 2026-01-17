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
    floatDuration = 1.6,

    fetchTimeoutMs = 12000,
    animateBg = true,
    onDrawComplete,
}: Props) {
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const svgHostRef = useRef<HTMLDivElement | null>(null);

    const [svgMarkup, setSvgMarkup] = useState("");
    const [error, setError] = useState<string | null>(null);
    const hasDrawnRef = useRef(false);

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

            const stage =
                wrap.closest<HTMLElement>(stageSelector) ?? document.querySelector<HTMLElement>(stageSelector);

            const bg = animateBg ? stage?.querySelector<HTMLElement>(bgSelector) ?? null : null;
            const hazeEl = stage?.querySelector<HTMLElement>(hazeSelector) ?? null;
            const bloomEl = stage?.querySelector<HTMLElement>(bloomSelector) ?? null;
            const lightEl = stage?.querySelector<HTMLElement>(lightSelector) ?? null;

            // loops + float
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

            // ===== CHỈ DRAW 1 LẦN DUY NHẤT =====
            if (!hasDrawnRef.current) {
                hasDrawnRef.current = true;

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

                if (bg) {
                    gsap.set(bg, { opacity: 0, scale: 1.12, filter: "blur(12px)" });
                    if (parallax) gsap.set(bg, { backgroundPosition: parallaxFrom });
                }
                if (hazeEl) gsap.set(hazeEl, { opacity: 0, xPercent: -hazeXPercent });
                if (bloomEl) gsap.set(bloomEl, { opacity: 0, scale: 1.03 });
                if (lightEl) gsap.set(lightEl, { opacity: 0, xPercent: -18, yPercent: 6, rotate: -8, scale: 1.05 });
                if (glow) gsap.set(svg, { filter: glowShadowFrom });

                const revealTl = gsap.timeline({ defaults: { ease: "power2.out" } });

                revealTl.fromTo(group, { scale: 1.25 }, { scale: 1, duration: 2.4, ease: "power3.out" }, 0);
                revealTl.to(paths, { strokeDashoffset: 0, duration: 2.2, stagger: 0.12 }, 0);
                revealTl.to(paths, { fillOpacity: 1, duration: 1.2, stagger: 0.08 }, 1.2);
                revealTl.to(paths, { strokeOpacity: 0, duration: 1.2, stagger: 0.08 }, 1.2);

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
                }

                if (haze && hazeEl) revealTl.to(hazeEl, { opacity: hazeOpacity, duration: 1.2 }, "<");
                if (bloom && bloomEl) revealTl.to(bloomEl, { opacity: 1, duration: bloomRevealDuration }, "<");
                if (light && lightEl) revealTl.to(lightEl, { opacity: lightOpacity, duration: lightRevealDuration }, "<");

                revealTl.eventCallback("onComplete", () => {
                    startFloat();
                    startLoops();
                    onDrawComplete?.();
                });
            } else {
                // ĐÃ DRAW RỒI - set final state
                paths.forEach((p) => {
                    p.style.stroke = "rgba(245,245,245,0.95)";
                    p.style.fill = "rgba(245,245,245,0.95)";
                    p.style.strokeDasharray = "none";
                    p.style.strokeDashoffset = "0";
                    (p.style as any).fillOpacity = "1";
                    (p.style as any).strokeOpacity = "0";
                    p.style.vectorEffect = "non-scaling-stroke";
                });

                gsap.set(group, { scale: 1 });

                if (bg) {
                    gsap.set(bg, { opacity: bgOpacity, scale: bgScale, filter: `blur(${bgBlurPx}px)` });
                    if (parallax) gsap.set(bg, { backgroundPosition: parallaxFrom });
                }
                if (hazeEl) gsap.set(hazeEl, { opacity: hazeOpacity, xPercent: -hazeXPercent });
                if (bloomEl) gsap.set(bloomEl, { opacity: 1, scale: 1.03 });
                if (lightEl) gsap.set(lightEl, { opacity: lightOpacity, xPercent: -18, yPercent: 6, rotate: -8, scale: 1.05 });
                if (glow) gsap.set(svg, { filter: glowShadow });

                startFloat();
                startLoops();
                onDrawComplete?.();
            }

            return () => {
                floatLoop?.kill();
                loops.forEach((a) => a.kill());
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
        animateBg,
        onDrawComplete,
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
            <div ref={svgHostRef} className="mm-svgHost" />
        </div>
    );
}
