import { useState } from "react";
import { saveUser } from "../../utils/userStorage";

const emptyProfile = {
  name: "",
  email: "",
  phone: "",
  shippingAddress: { street: "", city: "", state: "", pincode: "" },
};

export default function UserProfile({ user, onSave }) {
  const [profile, setProfile] = useState(() => ({
    ...emptyProfile,
    ...user,
    shippingAddress: { ...emptyProfile.shippingAddress, ...user?.shippingAddress },
  }));
  const [saved, setSaved] = useState(false);

  const update = (field) => (event) => {
    setProfile((current) => ({ ...current, [field]: event.target.value }));
    setSaved(false);
  };
  const updateAddress = (field) => (event) => {
    setProfile((current) => ({
      ...current,
      shippingAddress: { ...current.shippingAddress, [field]: event.target.value },
    }));
    setSaved(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const savedProfile = saveUser(profile);
    onSave?.(savedProfile);
    setSaved(true);
  };

  return (
    <section className="card-surface p-5">
      <h2 className="font-display text-xl text-ink-900">Profile</h2>
      <p className="mt-1 text-sm text-ink-400">Your saved contact and delivery details.</p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <label className="block"><span className="mb-1.5 block text-sm text-ink-600">Name</span><input required value={profile.name} onChange={update("name")} className="input-field" /></label>
        <label className="block"><span className="mb-1.5 block text-sm text-ink-600">Email</span><input type="email" required value={profile.email} onChange={update("email")} className="input-field" /></label>
        <label className="block"><span className="mb-1.5 block text-sm text-ink-600">Phone</span><input value={profile.phone} onChange={update("phone")} className="input-field" /></label>
        <label className="block"><span className="mb-1.5 block text-sm text-ink-600">Street address</span><input value={profile.shippingAddress.street} onChange={updateAddress("street")} className="input-field" /></label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <label className="block"><span className="mb-1.5 block text-sm text-ink-600">City</span><input value={profile.shippingAddress.city} onChange={updateAddress("city")} className="input-field" /></label>
          <label className="block"><span className="mb-1.5 block text-sm text-ink-600">State</span><input value={profile.shippingAddress.state} onChange={updateAddress("state")} className="input-field" /></label>
        </div>
        <label className="block"><span className="mb-1.5 block text-sm text-ink-600">Pincode</span><input value={profile.shippingAddress.pincode} onChange={updateAddress("pincode")} className="input-field" /></label>
        <button className="btn-primary w-full" type="submit">Save profile</button>
        {saved && <p className="text-center text-sm text-moss-700">Profile saved.</p>}
      </form>
    </section>
  );
}
