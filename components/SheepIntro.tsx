"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";

type Props = {
    /** thời lượng intro (ms) */
    durationMs?: number;
    /** callback khi intro kết thúc */
    onDone?: () => void;
    /** số lượng cừu */
    count?: number;
};

const SHEEP_SVG = `
    <svg viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <filter id="soft">
        <feGaussianBlur stdDeviation="1.4"/>
        </filter>
    </defs>

    <!-- BODY (mập) -->
    <g filter="url(#soft)">
        <ellipse cx="120" cy="92" rx="68" ry="44" fill="#ffffff"/>
        <ellipse cx="70" cy="92" rx="30" ry="32" fill="#ffffff"/>
        <ellipse cx="170" cy="92" rx="30" ry="32" fill="#ffffff"/>
        <ellipse cx="120" cy="120" rx="48" ry="22" fill="#ffffff"/>
    </g>

    <!-- HEAD -->
    <g>
        <ellipse cx="185" cy="88" rx="26" ry="22" fill="#2b2a3a"/>
        <circle cx="178" cy="84" r="3.2" fill="#fff"/>
        <circle cx="192" cy="84" r="3.2" fill="#fff"/>
        <circle cx="178" cy="84" r="1.4" fill="#111"/>
        <circle cx="192" cy="84" r="1.4" fill="#111"/>
        <path d="M178 96 Q185 102 192 96" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </g>

    <!-- EARS -->
    <ellipse cx="162" cy="86" rx="10" ry="14" fill="#2b2a3a"/>
    <ellipse cx="208" cy="86" rx="10" ry="14" fill="#2b2a3a"/>

    <!-- LEGS (ngắn cho cute) -->
    <g stroke="#2b2a3a" stroke-width="7" stroke-linecap="round">
        <line x1="90" y1="130" x2="90" y2="148"/>
        <line x1="115" y1="132" x2="115" y2="150"/>
        <line x1="140" y1="132" x2="140" y2="150"/>
        <line x1="165" y1="130" x2="165" y2="148"/>
    </g>
    </svg>
    `;


const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function SheepIntro({ durationMs = 3000, onDone, count = 5 }: Props) {
    const rootRef = useRef<HTMLDivElement | null>(null);

    const sheepList = useMemo(() => {
        // tạo cấu hình random nhẹ cho mỗi con
        return Array.from({ length: count }).map((_, i) => ({
            id: `sheep-${i}`,
            topPct: rand(18, 72),
            scale: rand(0.55, 1.05),
            blur: rand(0, 0.8),
            opacity: rand(0.75, 1),
            dir: Math.random() > 0.5 ? 1 : -1, // 1: L->R, -1: R->L
            speed: rand(1.6, 2.6), // thời gian bay qua
            bob: rand(10, 28),
            delay: rand(0, 0.7),
        }));
    }, [count]);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const ctx = gsap.context(() => {
            const sheepEls = Array.from(root.querySelectorAll<HTMLElement>("[data-sheep]"));

            // reset
            gsap.set(root, { autoAlpha: 1 });
            sheepEls.forEach((el) => {
                gsap.set(el, { xPercent: el.dataset.dir === "1" ? -140 : 140, autoAlpha: 0 });
            });

            const tl = gsap.timeline({
                defaults: { ease: "sine.inOut" },
                onComplete: () => onDone?.(),
            });

            // mỗi con 1 track riêng, chạy chồng lên nhau
            sheepEls.forEach((el) => {
                const dir = Number(el.dataset.dir || "1");
                const speed = Number(el.dataset.speed || "2.2");
                const delay = Number(el.dataset.delay || "0");
                const bob = Number(el.dataset.bob || "18");

                const fly = gsap.timeline();

                fly
                    .to(el, { autoAlpha: 1, duration: 0.2 }, 0)
                    .to(
                        el,
                        {
                            xPercent: dir === 1 ? 140 : -140,
                            duration: speed,
                            ease: "power1.inOut",
                        },
                        0
                    )
                    .to(el, {
                        y: `-=${bob}`,
                        rotate: gsap.utils.random(-6, 6),
                        duration: speed / 2,
                        yoyo: true,
                        repeat: 1,
                        ease: "sine.inOut",
                    }, 0)

                    .to(el, { autoAlpha: 0, duration: 0.25 }, speed - 0.2);

                tl.add(fly, delay);
            });

            // đảm bảo tổng = durationMs: nếu tl dài hơn thì cắt, nếu ngắn hơn thì giữ thêm
            const target = durationMs / 1000;
            tl.duration() < target ? tl.to({}, { duration: target - tl.duration() }) : tl.totalDuration(target);

            // fade out layer cuối cùng
            tl.to(root, { autoAlpha: 0, duration: 0.35, ease: "power2.out" }, ">-0.15");
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
                    data-speed={s.speed}
                    data-delay={s.delay}
                    data-bob={s.bob}
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
