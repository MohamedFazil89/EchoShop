import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-shop flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-100 text-moss-700">
        <Compass size={28} strokeWidth={1.5} />
      </span>
      <p className="mt-6 font-display text-6xl text-ink-900">404</p>
      <h1 className="mt-2 font-display text-2xl text-ink-900">This page wandered off</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-400">
        The page you're looking for doesn't exist or may have moved. Let's get you back on track.
      </p>
      <Link to="/" className="btn-primary mt-8">
        Back to home
      </Link>
    </div>
  );
}
