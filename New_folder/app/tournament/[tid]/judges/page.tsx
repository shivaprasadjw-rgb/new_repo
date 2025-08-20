import { readAllJudges } from "@/lib/judgeStorage";
import Link from "next/link";

export const revalidate = 300;

export default function JudgesListPage({ params }: { params: { tid: string } }) {
  const judges = readAllJudges().filter(j => j.status === "approved" && (!j.tournaments?.length || j.tournaments.includes(params.tid)));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Judges</h1>
      {judges.length === 0 ? (
        <div className="text-gray-600">No approved judges yet.</div>
      ) : (
        <div className="grid gap-4">
          {judges.map(j => (
            <div key={j.id} className="bg-white border rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{j.fullName}</div>
                  <div className="text-sm text-gray-600">{j.gender} • {j.judgeType}</div>
                  {j.experience && <div className="text-sm text-gray-700 mt-1">{j.experience}</div>}
                </div>
                <Link href={`./judges/${j.id}`} className="text-primary">View Profile</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


