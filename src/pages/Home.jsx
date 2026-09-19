import { useCallback } from "react";
import Hero from "../components/home/Hero";
import CategoryStrip from "../components/home/CategoryStrip";
import ProductRail from "../components/home/ProductRail";
import Newsletter from "../components/home/Newsletter";
import FeaturedCollection from "../components/home/FeaturedCollection";
import StatsBar from "../components/home/StatsBar";
import { fetchFeaturedProducts, fetchNewArrivals } from "../services/productService";

export default function Home() {
  const fetchFeatured = useCallback(() => fetchFeaturedProducts(4), []);
  const fetchNew = useCallback(() => fetchNewArrivals(4), []);

  return (
    <>
      <Hero />
      <FeaturedCollection />
      <CategoryStrip />
      <StatsBar />
      <ProductRail
        eyebrow="Bestsellers"
        title="Loved by the community"
        fetcher={fetchFeatured}
        viewAllHref="/shop"
      />
      <ProductRail
        eyebrow="Just landed"
        title="New arrivals"
        fetcher={fetchNew}
        viewAllHref="/shop?sort=newest"
      />
      <Newsletter />
    </>
  );
}
