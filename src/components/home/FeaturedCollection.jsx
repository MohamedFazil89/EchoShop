import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { fetchFeaturedProducts } from "../../services/productService";
import { formatCurrency } from "../../utils/formatCurrency";
import { useReducedMotion, useScrollAnimation } from "../../hooks/useScrollAnimation";
import SplitText from "../ui/SplitText";

gsap.registerPlugin(ScrollTrigger);

export default function FeaturedCollection() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const progressRef = useRef(null);
  const triggersRef = useRef([]);
  const reducedMotion = useReducedMotion();
  const { isVisible } = useScrollAnimation(sectionRef, {
    resetKey: products.map((product) => product.id).join(","),
  });

  useEffect(() => {
    let cancelled = false;
    fetchFeaturedProducts(6).then((results) => {
      if (!cancelled) setProducts(results);
    }).catch((requestError) => {
      if (!cancelled) setError(requestError.message);
    });
    return () => { cancelled = true; };
  }, []);

  // ScrollTrigger's `pin` wraps and moves the section in the DOM. A layout
  // cleanup restores that wrapper before React removes this route's elements.
  // Using a passive-effect cleanup here leaves React trying to remove a node
  // from its original parent after ScrollTrigger has reparented it.
  useLayoutEffect(() => {
    if (reducedMotion || products.length === 0) return undefined;
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const section = sectionRef.current;
    const track = trackRef.current;
    const createTrigger = () => {
      triggersRef.current.forEach((trigger) => trigger.kill());
      triggersRef.current = [];
      gsap.set(track, { clearProps: "transform" });
      if (!desktopQuery.matches || !section || !track) return;
      const distance = Math.max(track.scrollWidth - section.clientWidth, 0);
      if (!distance) return;
      const animation = gsap.to(track, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=150%",
          pin: true,
          scrub: 1,
          horizontal: true,
          onUpdate: (self) => { if (progressRef.current) progressRef.current.style.transform = `scaleX(${self.progress})`; },
        },
      });
      triggersRef.current = [animation.scrollTrigger];
    };
    createTrigger();
    desktopQuery.addEventListener("change", createTrigger);
    return () => {
      desktopQuery.removeEventListener("change", createTrigger);
      triggersRef.current.forEach((trigger) => trigger.kill());
      triggersRef.current = [];
      gsap.set(track, { clearProps: "transform" });
    };
  }, [products.length, reducedMotion]);

  if (!products.length) {
    return error
      ? <p role="alert" className="container-shop mt-8 text-sm text-clay-600">{error}</p>
      : null;
  }

  return (
    <section ref={sectionRef} className="featured-collection container-shop mt-20 overflow-hidden py-2">
      <div className="flex items-end justify-between"><div><span className="eyebrow">Featured collection</span><h2 className="mt-2 font-display text-2xl text-ink-900 sm:text-3xl"><SplitText text="Everyday essentials, thoughtfully made" /></h2></div><Link to="/shop" className="link-underline hidden text-sm font-semibold text-moss-700 sm:inline">Shop all</Link></div>
      <div ref={trackRef} className="featured-track mt-7 flex gap-5 overflow-x-auto pb-3 md:overflow-visible">
        {products.map((product, index) => <Link key={product.id} to={`/product/${product.slug}`} className="featured-card group shrink-0" style={{ transitionDelay: `${index * 80}ms` }}><div className="featured-card-image relative aspect-[4/5] overflow-hidden rounded-2xl bg-moss-100"><img src={product.images?.[0]} alt={product.title} className={`clip-reveal h-full w-full object-cover ${isVisible ? "clip-reveal--visible" : ""}`} /></div><div className="mt-3 flex items-end justify-between gap-3"><div><p className="font-display text-lg text-ink-900">{product.title}</p><p className="mt-1 text-sm font-semibold text-ink-600">{formatCurrency(product.price)}</p></div><span className="text-sm font-semibold text-moss-700 group-hover:underline">View</span></div></Link>)}
      </div>
      <div className="mt-5 h-px w-full bg-ink-800/10"><span ref={progressRef} className="block h-full origin-left scale-x-0 bg-moss-700" /></div>
    </section>
  );
}
