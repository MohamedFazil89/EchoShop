import { useEffect, useState } from "react";
import { fetchProducts } from "../services/productService";

/**
 * Fetches the product list for the given filter/sort params.
 * Re-fetches whenever `params` changes (pass a memoized object).
 */
export function useProducts(params) {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading"); // 'loading' | 'success' | 'error'
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError(null);

    fetchProducts(params, controller.signal)
      .then((results) => {
        setProducts(results);
        setStatus("success");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Something went wrong");
        setStatus("error");
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return { products, status, error, isLoading: status === "loading" };
}
