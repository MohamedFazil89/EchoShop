import { Navigate } from "react-router-dom";
import { LogOut, Package } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import UserProfile from "../components/account/UserProfile";
import OrderHistory from "../components/account/OrderHistory";
import { getOrders, getUser } from "../utils/userStorage";

export default function Account() {
  const { user, isAuthenticated, logout } = useAuth();
  const orders = getOrders().sort((a, b) => new Date(b.date) - new Date(a.date));
  const profile = getUser() ?? user;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="container-shop py-10">
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow">Account</span>
          <h1 className="mt-2 font-display text-3xl text-ink-900 sm:text-4xl">Hi, {user.name.split(" ")[0]}</h1>
        </div>
        <button onClick={logout} className="btn-secondary"><LogOut size={15} />Sign out</button>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[360px_1fr]">
        <UserProfile user={profile} />
        <section id="orders">
          <h2 className="flex items-center gap-2 font-display text-xl text-ink-900"><Package size={18} className="text-moss-700" />Order history</h2>
          <OrderHistory orders={orders} />
        </section>
      </div>
    </div>
  );
}
