"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";

type Props = {
    durationMs?: number; // total intro time
    onDone?: () => void;
    count?: number;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

type SheepCfg = {
    id: string;
    topPct: number;
    scale: number;
    blur: number;
    opacity: number;
    dir: 1 | -1;
    flySec: number;
    delaySec: number;
    bobPx: number;
};

const SHEEP_SVG = `
<svg viewBox="0 0 260 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g id="root">
    <ellipse id="shadow" cx="120" cy="152" rx="64" ry="14" fill="rgba(0,0,0,0.18)"/>

    <g id="legs" stroke="#2b2a3a" stroke-width="10" stroke-linecap="round">
      <line id="legBL" x1="85"  y1="126" x2="85"  y2="154"/>
      <line id="legBR" x1="120" y1="128" x2="120" y2="156"/>
      <line id="legFL" x1="150" y1="128" x2="150" y2="156"/>
      <line id="legFR" x1="185" y1="126" x2="185" y2="154"/>
    </g>

    <g id="body">
      <ellipse cx="120" cy="92" rx="78" ry="50" fill="#ffffff"/>
      <ellipse cx="65"  cy="96" rx="30" ry="32" fill="#ffffff"/>
      <ellipse cx="175" cy="96" rx="30" ry="32" fill="#ffffff"/>
      <ellipse cx="120" cy="122" rx="56" ry="26" fill="#ffffff"/>
      <circle cx="85"  cy="72" r="16" fill="#ffffff"/>
      <circle cx="115" cy="64" r="18" fill="#ffffff"/>
      <circle cx="145" cy="72" r="16" fill="#ffffff"/>
    </g>

    <g id="head">
        <!-- head base (đỡ đen) -->
        <ellipse cx="208" cy="92" rx="26" ry="22" fill="#3a3850"/>
        <!-- ears -->
        <ellipse cx="187" cy="92" rx="10" ry="14" fill="#3a3850"/>
        <ellipse cx="229" cy="92" rx="10" ry="14" fill="#3a3850"/>

        <!-- eyes (to hơn, có highlight) -->
        <circle cx="200" cy="88" r="4.2" fill="#ffffff"/>
        <circle cx="214" cy="88" r="4.2" fill="#ffffff"/>

        <circle cx="200" cy="88" r="2.2" fill="#171722"/>
        <circle cx="214" cy="88" r="2.2" fill="#171722"/>

        <circle cx="199" cy="87" r="0.9" fill="#ffffff"/>
        <circle cx="213" cy="87" r="0.9" fill="#ffffff"/>

        <!-- nose (nhỏ thôi) -->
        <circle cx="207" cy="98" r="1.4" fill="rgba(255,255,255,0.65)"/>

        <!-- smile -->
        <path d="M201 102 Q207 108 213 102" stroke="#ffffff" stroke-width="2.6"
                fill="none" stroke-linecap="round"/>

        <!-- blush (dịu + thấp hơn chút) -->
        <circle cx="196" cy="98" r="5.4" fill="rgba(243,182,196,0.55)"/>
        <circle cx="218" cy="98" r="5.4" fill="rgba(243,182,196,0.55)"/>
        </g>

  </g>
</svg>
`;

function makeRunCycle(container: HTMLElement) {
    const legFL = container.querySelector<SVGLineElement>("#legFL");
    const legFR = container.querySelector<SVGLineElement>("#legFR");
    const legBL = container.querySelector<SVGLineElement>("#legBL");
    const legBR = container.querySelector<SVGLineElement>("#legBR");
    const body = container.querySelector<SVGGElement>("#body");
    const head = container.querySelector<SVGGElement>("#head");
    const shadow = container.querySelector<SVGEllipseElement>("#shadow");

    if (!legFL || !legFR || !legBL || !legBR || !body || !head) return null;

    gsap.set([legFL, legFR, legBL, legBR], { transformOrigin: "50% 0%" });
    gsap.set(body, { transformOrigin: "50% 50%" });
    gsap.set(head, { transformOrigin: "35% 55%" });
    if (shadow) gsap.set(shadow, { transformOrigin: "50% 50%" });

    const step = rand(0.26, 0.42);
    const a = rand(16, 26);

    const t = gsap.timeline({ repeat: -1, defaults: { ease: "sine.inOut" } });

    t.to(legFL, { rotate: a, duration: step }, 0)
        .to(legBR, { rotate: a, duration: step }, 0)
        .to(legFR, { rotate: -a, duration: step }, 0)
        .to(legBL, { rotate: -a, duration: step }, 0)
        .to(legFL, { rotate: -a, duration: step }, step)
        .to(legBR, { rotate: -a, duration: step }, step)
        .to(legFR, { rotate: a, duration: step }, step)
        .to(legBL, { rotate: a, duration: step }, step);

    t.to(body, { y: -6, duration: step, yoyo: true, repeat: 1 }, 0);
    t.to(head, { y: -4, rotate: rand(-5, 5), duration: step, yoyo: true, repeat: 1 }, 0);

    if (shadow) t.to(shadow, { scaleX: 0.92, scaleY: 0.84, duration: step, yoyo: true, repeat: 1 }, 0);

    return t;
}

export default function SheepIntro({ durationMs = 5000, onDone, count = 12 }: Props) {
    const rootRef = useRef<HTMLDivElement | null>(null);

    const sheepList = useMemo<SheepCfg[]>(() => {
        return Array.from({ length: count }).map((_, i) => {
            const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
            const scale = rand(0.75, 1.25);
            const blur = rand(0, 1.0);
            const opacity = rand(0.75, 1);

            const flySec = rand(1.8, 3.1);
            const delaySec = rand(0, 1.2);
            const bobPx = rand(10, 26);
            const topPct = rand(18, 74);

            return {
                id: `sheep-${i}`,
                topPct,
                scale,
                blur,
                opacity,
                dir,
                flySec,
                delaySec,
                bobPx,
            };
        });
    }, [count]);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const ctx = gsap.context(() => {
            const sheepEls = Array.from(root.querySelectorAll<HTMLElement>("[data-sheep]"));
            const runLoops: gsap.core.Timeline[] = [];

            gsap.set(root, { autoAlpha: 1 });
            sheepEls.forEach((el) => {
                const dir = el.dataset.dir === "1" ? 1 : -1;
                gsap.set(el, { xPercent: dir === 1 ? -150 : 150, y: 0, rotate: 0, autoAlpha: 0 });
            });

            const tl = gsap.timeline({
                defaults: { ease: "sine.inOut" },
                onComplete: () => onDone?.(),
            });

            sheepEls.forEach((el) => {
                const dir = Number(el.dataset.dir || "1") as 1 | -1;
                const flySec = Number(el.dataset.fly || "2.4");
                const delaySec = Number(el.dataset.delay || "0");
                const bobPx = Number(el.dataset.bob || "18");

                const run = makeRunCycle(el);
                if (run) runLoops.push(run);

                const fly = gsap.timeline();
                fly.to(el, { autoAlpha: 1, duration: 0.18 }, 0)
                    .to(
                        el,
                        {
                            xPercent: dir === 1 ? 150 : -150,
                            duration: flySec,
                            ease: "power1.inOut",
                        },
                        0
                    )
                    .to(
                        el,
                        {
                            y: `-=${bobPx}`,
                            rotate: rand(-6, 6),
                            duration: flySec / 2,
                            yoyo: true,
                            repeat: 1,
                            ease: "sine.inOut",
                        },
                        0
                    )
                    .to(el, { autoAlpha: 0, duration: 0.22, ease: "power2.out" }, Math.max(0, flySec - 0.2));

                tl.add(fly, delaySec);
            });

            const targetSec = clamp(durationMs / 1000, 0.5, 60);
            const cur = Math.max(0.001, tl.duration());
            tl.timeScale(cur / targetSec);

            tl.to(root, { autoAlpha: 0, duration: 0.45, ease: "power2.out" }, `>-${0.18}`);

            return () => {
                runLoops.forEach((t) => t.kill());
                tl.kill();
            };
        }, root);

        return () => ctx.revert();
    }, [durationMs, onDone]);

    return (
        <div ref={rootRef} className="mm-sheepIntro" aria-hidden="true">
            {sheepList.map((s) => (
                <div
                    key={s.id}
                    data-sheep
                    data-dir={s.dir}
                    data-fly={s.flySec}
                    data-delay={s.delaySec}
                    data-bob={s.bobPx}
                    className="mm-sheep"
                    style={{
                        top: `${s.topPct}%`,
                        transform: `translateY(-50%) scale(${s.scale})`,
                        opacity: s.opacity,
                        filter: `blur(${s.blur}px)`,
                    }}
                    dangerouslySetInnerHTML={{ __html: SHEEP_SVG }}
                />
            ))}
        </div>
    );
}
