import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { LogOut, Package } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import UserProfile from "../components/account/UserProfile";
import OrderHistory from "../components/account/OrderHistory";
import { fetchOrders } from "../services/orderService";
import { Spinner } from "../components/ui/Spinner";

export default function Account() {
  const { user, isLoading, isAuthenticated, logout, updateUserProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return undefined;
    if (!isAuthenticated) {
      setOrdersLoading(false);
      return undefined;
    }
    let cancelled = false;
    fetchOrders()
      .then((results) => {
        if (!cancelled) setOrders(results);
      })
      .catch((error) => {
        if (!cancelled) setOrdersError(error.message);
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size={28} /></div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="container-shop py-10">
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow">Account</span>
          <h1 className="mt-2 font-display text-3xl text-ink-900 sm:text-4xl">
            Hi, {user.name.split(" ")[0]}
          </h1>
        </div>
        <button onClick={logout} className="btn-secondary"><LogOut size={15} />Sign out</button>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[360px_1fr]">
        <UserProfile user={user} onSave={updateUserProfile} />
        <section id="orders">
          <h2 className="flex items-center gap-2 font-display text-xl text-ink-900">
            <Package size={18} className="text-moss-700" />Order history
          </h2>
          {ordersLoading ? (
            <div className="mt-5"><Spinner size={24} /></div>
          ) : ordersError ? (
            <p role="alert" className="mt-5 text-sm text-clay-600">{ordersError}</p>
          ) : (
            <OrderHistory orders={orders} />
          )}
        </section>
      </div>
    </div>
  );
}
