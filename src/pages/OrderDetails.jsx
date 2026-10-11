import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import OrderDetail from "../components/account/OrderDetail";
import { Spinner } from "../components/ui/Spinner";
import { useAuth } from "../hooks/useAuth";
import { fetchOrderById } from "../services/orderService";

export default function OrderDetails() {
  const { orderId } = useParams();
  const { isLoading, isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoading || !isAuthenticated) return undefined;
    let cancelled = false;
    setStatus("loading");
    fetchOrderById(orderId)
      .then((result) => {
        if (!cancelled) {
          setOrder(result);
          setStatus("success");
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message);
          setStatus(requestError.status === 404 ? "not-found" : "error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, orderId]);

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size={28} /></div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (status === "loading") {
    return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size={28} /></div>;
  }
  if (status === "not-found") {
    return (
      <div className="container-shop py-16">
        <h1 className="font-display text-3xl text-ink-900">Order not found</h1>
        <Link to="/account" className="btn-primary mt-6">View order history</Link>
      </div>
    );
  }
  if (status === "error") {
    return <div role="alert" className="container-shop py-16 text-clay-600">{error}</div>;
  }
  return <OrderDetail order={order} />;
}
