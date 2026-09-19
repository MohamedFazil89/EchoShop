import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatCurrency";

export default function OrderDetail({ order }) {
  return (
    <div className="container-shop py-10">
      <Link to="/account#orders" className="link-underline text-sm font-semibold text-moss-700">Back to order history</Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3"><div><span className="eyebrow">Order details</span><h1 className="mt-2 font-display text-3xl text-ink-900">{order.id}</h1></div><span className="rounded-full bg-clay-100 px-3 py-1 text-sm font-semibold text-clay-600">{order.status}</span></div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-2xl border border-ink-800/[0.06]"><div className="border-b border-ink-800/[0.06] bg-cream-100 px-5 py-4 text-sm text-ink-600">Placed {new Date(order.date).toLocaleString()}</div><ul className="divide-y divide-ink-800/[0.06]">{order.items.map((item) => <li key={item.id} className="flex items-center gap-4 px-5 py-4"><img src={item.image} alt={item.title} className="h-16 w-14 rounded-lg bg-moss-100 object-cover" /><div className="min-w-0 flex-1"><p className="font-medium text-ink-800">{item.title}</p><p className="mt-1 text-sm text-ink-400">Quantity: {item.quantity}</p></div><span className="font-medium text-ink-800">{formatCurrency(item.price * item.quantity)}</span></li>)}</ul></section>
        <aside className="card-surface h-fit p-5"><h2 className="font-display text-lg text-ink-900">Shipping address</h2><address className="mt-3 not-italic text-sm leading-6 text-ink-600">{order.shippingAddress.street}<br />{order.shippingAddress.city}, {order.shippingAddress.state}<br />{order.shippingAddress.pincode}</address><div className="mt-6 flex justify-between border-t border-ink-800/[0.06] pt-4"><span className="font-semibold text-ink-900">Total</span><span className="font-display text-lg text-ink-900">{formatCurrency(order.total)}</span></div></aside>
      </div>
    </div>
  );
}
