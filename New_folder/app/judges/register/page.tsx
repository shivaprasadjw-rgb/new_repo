"use client";

import { useState } from "react";

export default function JudgeRegisterPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/judges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      setMessage("Thanks! Your judge application is submitted. Await admin approval.");
      e.currentTarget.reset();
    } catch (err: any) {
      setMessage(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Register as Judge</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <input name="fullName" placeholder="Full Name" className="border rounded px-3 py-2" required />
        <select name="gender" className="border rounded px-3 py-2" required>
          <option value="">Gender</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
        <input name="email" type="email" placeholder="Email" className="border rounded px-3 py-2" required />
        <input name="phone" placeholder="Phone (WhatsApp)" className="border rounded px-3 py-2" required />
        <input name="judgeType" placeholder="Judge Type (Carrom, Chess, ...)" className="border rounded px-3 py-2" required />
        <input name="schoolOrEmployer" placeholder="School/Employer (optional)" className="border rounded px-3 py-2" />
        <textarea name="experience" placeholder="Experience / Qualification (optional)" className="border rounded px-3 py-2" rows={4} />
        <button disabled={submitting} className="bg-primary text-white rounded px-4 py-2">{submitting ? "Submitting..." : "Submit"}</button>
      </form>
      {message && <div className="mt-4 text-sm">{message}</div>}
    </div>
  );
}


