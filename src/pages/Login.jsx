import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Lock, Mail } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(form);
      navigate("/account");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-shop flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-moss-700 text-cream-50">
            <Leaf size={20} />
          </span>
          <h1 className="mt-4 font-display text-2xl text-ink-900">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-400">Sign in to view your orders and wishlist</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-600">Email</span>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="email"
                required
                value={form.email}
                onChange={update("email")}
                className="input-field pl-10"
                placeholder="you@example.com"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-600">Password</span>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={update("password")}
                className="input-field pl-10"
                placeholder="••••••••"
              />
            </div>
          </label>

          {error && <p className="text-sm text-clay-600">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-moss-700 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
