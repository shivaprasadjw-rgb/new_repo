export const metadata = {
  title: "Results & Past Winners",
  description: "View results and past winners of completed tournaments.",
};

export const revalidate = 300; // cache results page for 5 minutes

export default function ResultsPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold">Results / Past Winners</h1>
      <div className="card p-4 text-sm text-slate-700">
        <p>Results will appear here as tournaments complete. Check back soon.</p>
      </div>
    </div>
  );
}
