export const metadata = {
  title: "About & Rules",
  description: "Tournament rules, formats, and general information.",
};

export default function AboutPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold">About / Rules</h1>
      <div className="card p-4 grid gap-3 text-sm text-slate-700">
        <section>
          <h2 className="font-semibold">General Rules</h2>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Matches follow BWF standard scoring unless stated otherwise.</li>
            <li>Players must report 15 minutes before scheduled time.</li>
            <li>Non-marking shoes and proper attire required.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-semibold">Cancellation / Refund Policy</h2>
          <p className="mt-2">Refunds are available up to 48 hours before the registration deadline.</p>
        </section>
      </div>
    </div>
  );
}
