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

  bgSelector?: string;
  hazeSelector?: string;
  bloomSelector?: string;

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
};

const toCssSize = (v?: Size): string | undefined =>
  v === undefined || v === null ? undefined : typeof v === "number" ? `${v}px` : v;

export default function MemMaiDraw({
  src = "/mem_mai_josefin.svg",
  className,
  width,
  height,
  preserveAspectRatio = "xMidYMid meet",

  bgSelector = ".mm-bg",
  hazeSelector = ".mm-haze",
  bloomSelector = ".mm-bloom",

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
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [svgMarkup, setSvgMarkup] = useState("");

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

    (async () => {
      const res = await fetch(src, { cache: "force-cache" });
      const text = await res.text();
      if (!cancelled) setSvgMarkup(text);
    })();

    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !svgMarkup) return;

    const ctx = gsap.context(() => {
      const svg = root.querySelector("svg");
      if (!svg) return;

      svg.classList.add("mm-svg");
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.setAttribute("preserveAspectRatio", preserveAspectRatio);

      Object.entries(svgStyle).forEach(([k, v]) => {
        // @ts-expect-error style index
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

      const bg = document.querySelector<HTMLElement>(bgSelector) ?? null;
      const hazeEl = document.querySelector<HTMLElement>(hazeSelector) ?? null;
      const bloomEl = document.querySelector<HTMLElement>(bloomSelector) ?? null;

      if (bg) {
        gsap.set(bg, { opacity: 0, scale: 1.1, filter: "blur(12px)" });
        if (parallax) gsap.set(bg, { backgroundPosition: parallaxFrom });
      }

      if (hazeEl) {
        gsap.set(hazeEl, { opacity: 0, xPercent: -hazeXPercent });
      }

      if (bloomEl) {
        gsap.set(bloomEl, { opacity: 0, scale: 1.02 });
      }

      if (glow) {
        gsap.set(svg, { filter: glowShadowFrom });
      }

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.fromTo(group, { scale: 1.25 }, { scale: 1, duration: 2.4, ease: "power3.out" }, 0);
      tl.to(paths, { strokeDashoffset: 0, duration: 2.2, stagger: 0.12, ease: "power2.out" }, 0);
      tl.to(paths, { fillOpacity: 1, duration: 1.2, stagger: 0.08, ease: "power2.out" }, 1.2);
      tl.to(paths, { strokeOpacity: 0, duration: 1.2, stagger: 0.08, ease: "power2.out" }, 1.2);

      if (bg) {
        tl.to(
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

        if (parallax) {
          tl.to(
            bg,
            {
              backgroundPosition: parallaxTo,
              duration: parallaxDuration,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            },
            "<"
          );
        }
      }

      if (haze && hazeEl) {
        tl.to(
          hazeEl,
          {
            opacity: hazeOpacity,
            duration: 1.2,
            ease: "power2.out",
          },
          "<"
        );

        tl.to(
          hazeEl,
          {
            xPercent: hazeXPercent,
            duration: hazeDuration,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          },
          "<"
        );
      }

      if (bloom && bloomEl) {
        tl.to(
          bloomEl,
          {
            opacity: 1,
            duration: bloomRevealDuration,
            ease: "power2.out",
          },
          "<"
        );

        tl.to(
          bloomEl,
          {
            opacity: bloomOpacity,
            duration: bloomBreathDuration,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          },
          ">"
        );
      }

      if (glow) {
        tl.to(
          svg,
          {
            filter: glowShadow,
            duration: glowDuration,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          },
          "<"
        );
      }
    }, root);

    return () => ctx.revert();
  }, [
    svgMarkup,
    svgStyle,
    preserveAspectRatio,

    bgSelector,
    hazeSelector,
    bloomSelector,

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
  ]);

  return (
    <div
      ref={rootRef}
      className={["mm-wrap", className].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
