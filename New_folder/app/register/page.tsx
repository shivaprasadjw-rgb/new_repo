import { Suspense } from "react";
import RegistrationForm from "@/components/RegistrationForm";

export const metadata = {
  title: "Register",
  description: "Register for a badminton tournament.",
};

export const revalidate = 60; // ISR: refresh every minute

export default function RegisterPage() {
  return (
    <div className="grid gap-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold">Tournament Registration</h1>
      <Suspense fallback={<div className="card p-4 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div><p className="text-gray-600">Loading form...</p></div>}>
        <RegistrationForm />
      </Suspense>
    </div>
  );
}
