export const metadata = {
  title: "Contact & Support",
  description: "Get in touch with the organizers for support.",
};

export const revalidate = 86400; // cache static contact page for 1 day

export default function ContactPage() {
  return (
    <div className="grid gap-6 max-w-2xl">
      <h1 className="text-xl font-semibold">Contact / Support</h1>
      <div className="card p-4 grid gap-3 text-sm text-slate-700">
        <p>For support, email support@badminton-india.example or call +91-99999-00000.</p>
        <p>For tournament-specific questions, see the organizer contact details on the tournament page.</p>
      </div>
    </div>
  );
}
