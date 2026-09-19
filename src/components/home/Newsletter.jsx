import { useState } from "react";
import { Send } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import SplitText from "../ui/SplitText";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const { showToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    showToast("You're on the list — thanks for subscribing!", { type: "success" });
    setEmail("");
  };

  return (
    <section className="container-shop mt-24">
      <div className="rounded-3xl bg-clay-100 px-6 py-14 text-center sm:px-16">
        <span className="eyebrow text-clay-600">Stay in the loop</span>
        <h2 className="mx-auto mt-3 max-w-md font-display text-2xl text-ink-900 sm:text-3xl">
          <SplitText text="Get 10% off your first order, plus care guides and early drops." />
        </h2>
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input-field flex-1 bg-cream-50"
          />
          <button type="submit" className="btn-clay">
            Subscribe
            <Send size={15} />
          </button>
        </form>
      </div>
    </section>
  );
}
