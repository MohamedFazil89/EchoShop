import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatCurrency";

const statusStyles = {
  placed: "bg-clay-100 text-clay-600",
  processing: "bg-clay-100 text-clay-600",
  shipped: "bg-moss-100 text-moss-700",
  delivered: "bg-moss-100 text-moss-700",
};

export default function OrderHistory({ orders }) {
  if (!orders.length) {
    return <p className="mt-5 text-sm text-ink-400">No orders yet. <Link to="/shop" className="font-semibold text-moss-700 hover:underline">Start shopping</Link>.</p>;
  }

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-ink-800/[0.06]">
      <table className="w-full text-left text-sm">
        <thead className="bg-cream-100 text-xs uppercase tracking-wide text-ink-400"><tr><th className="px-5 py-3 font-medium">Order</th><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium text-right">Total</th></tr></thead>
        <tbody className="divide-y divide-ink-800/[0.06]">
          {orders.map((order) => <tr key={order.id}>
            <td className="px-5 py-4 font-medium text-moss-700"><Link to={`/orders/${order.id}`} className="hover:underline">{order.id}</Link></td>
            <td className="px-5 py-4 text-ink-600">{new Date(order.date).toLocaleDateString()}</td>
            <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[order.status]}`}>{order.status}</span></td>
            <td className="px-5 py-4 text-right font-medium text-ink-800">{formatCurrency(order.total)}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}
