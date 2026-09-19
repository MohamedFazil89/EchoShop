import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Recycle } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion, useScrollAnimation } from "../../hooks/useScrollAnimation";
import SplitText from "../ui/SplitText";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const heroRef = useRef(null);
  const imageRef = useRef(null);
  const headingRef = useRef(null);
  const triggersRef = useRef([]);
  const reducedMotion = useReducedMotion();
  const { isVisible } = useScrollAnimation(heroRef);

  useLayoutEffect(() => {
    if (reducedMotion || !heroRef.current || !imageRef.current || !headingRef.current) return undefined;
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const image = imageRef.current;
    const heading = headingRef.current;

    const clearTriggers = () => {
      triggersRef.current.forEach((trigger) => trigger.kill());
      triggersRef.current = [];
      gsap.set([image, heading], { clearProps: "transform" });
    };

    const createTriggers = () => {
      clearTriggers();
      if (!desktopQuery.matches) return;
      const backgroundTrigger = gsap.to(image, {
        yPercent: 16,
        ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top bottom", end: "bottom top", scrub: 1 },
      }).scrollTrigger;
      const headingTrigger = gsap.to(heading, {
        yPercent: 6,
        ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top bottom", end: "bottom top", scrub: 1 },
      }).scrollTrigger;
      triggersRef.current = [backgroundTrigger, headingTrigger];
    };

    createTriggers();
    desktopQuery.addEventListener("change", createTriggers);
    return () => {
      desktopQuery.removeEventListener("change", createTriggers);
      clearTriggers();
    };
  }, [reducedMotion]);

  return (
    <section className="container-shop pt-8 sm:pt-12">
      <div ref={heroRef} className="relative overflow-hidden rounded-3xl bg-moss-800">
        <img
          ref={imageRef}
          src="https://picsum.photos/seed/eco-hero-kitchen/1600/900"
          alt="A sage-green kitchen styled with sustainable cookware and greenery"
          className={`clip-reveal absolute inset-0 h-full w-full object-cover opacity-80 ${isVisible ? "clip-reveal--visible" : ""}`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900/70 via-ink-900/30 to-transparent" />

        <div className="relative flex min-h-[420px] flex-col justify-center px-6 py-16 sm:min-h-[520px] sm:px-12 lg:w-3/5 lg:px-16">
          <span className="eyebrow w-fit rounded-full bg-cream-50/10 px-3 py-1.5 text-cream-100 backdrop-blur">
            New Season Edit
          </span>
          <h1 ref={headingRef} className="mt-5 max-w-lg font-display text-4xl leading-[1.08] text-cream-50 sm:text-5xl lg:text-6xl">
            <SplitText text="Eco-friendly kitchenware for a greener home" />
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-cream-100/80">
            Every piece is sustainably sourced, ethically produced, and built to
            outlast the trend cycle — so your kitchen can look good and do good.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/shop" className="btn-primary bg-cream-50 text-ink-900 hover:bg-cream-100">
              Shop now
              <ArrowUpRight size={16} />
            </Link>
            <Link
              to="/shop?category=cookware"
              className="btn text-sm font-semibold text-cream-50 underline underline-offset-4 decoration-cream-50/40 hover:decoration-cream-50"
            >
              Explore cookware
            </Link>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 hidden items-center gap-3 rounded-2xl bg-cream-50/95 px-5 py-4 shadow-lift backdrop-blur sm:flex">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-moss-100 text-moss-700">
            <Recycle size={20} />
          </span>
          <div>
            <p className="font-display text-2xl leading-none text-ink-900">96%</p>
            <p className="mt-1 text-xs text-ink-400">recycled or renewable materials</p>
          </div>
        </div>
      </div>
    </section>
  );
}
