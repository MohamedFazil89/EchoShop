import { Link, useParams } from "react-router-dom";
import OrderDetail from "../components/account/OrderDetail";
import { getOrderById } from "../utils/userStorage";

export default function OrderDetails() {
  const { orderId } = useParams();
  const order = getOrderById(orderId);

  if (!order) {
    return <div className="container-shop py-16"><h1 className="font-display text-3xl text-ink-900">Order not found</h1><Link to="/account" className="btn-primary mt-6">View order history</Link></div>;
  }
  return <OrderDetail order={order} />;
}
