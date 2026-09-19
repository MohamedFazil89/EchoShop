import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Lock, Mail, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await register(form);
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
          <h1 className="mt-4 font-display text-2xl text-ink-900">Create your account</h1>
          <p className="mt-1 text-sm text-ink-400">Join for faster checkout and order tracking</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-600">Full name</span>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                required
                value={form.name}
                onChange={update("name")}
                className="input-field pl-10"
                placeholder="Jane Doe"
              />
            </div>
          </label>
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
                placeholder="At least 6 characters"
              />
            </div>
          </label>

          {error && <p className="text-sm text-clay-600">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-moss-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
