import { getJudgeById } from "@/lib/judgeStorage";

export const revalidate = 300;

export default function JudgeProfilePage({ params }: { params: { tid: string; jid: string } }) {
  const judge = getJudgeById(params.jid);
  if (!judge || judge.status !== "approved") {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-gray-600">Judge not found.</div>;
  }
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{judge.fullName}</h1>
      <div className="text-gray-600 mb-4">{judge.gender} • {judge.judgeType}</div>
      {judge.schoolOrEmployer && <div className="mb-2">{judge.schoolOrEmployer}</div>}
      {judge.experience && <div className="whitespace-pre-wrap text-sm text-gray-800">{judge.experience}</div>}
    </div>
  );
}


