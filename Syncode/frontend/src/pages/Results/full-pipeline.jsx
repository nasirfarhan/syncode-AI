import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function FullPipelineResultsPage() {
  const { caseId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!caseId) {
      setError("Invalid or missing Case ID");
      setLoading(false);
      setResult({
        medicalCodes: [
          { code: "A123", type: "ICD-10" },
          { code: "B456", type: "ICD-10" },
        ],
      });
      return;
    }

    let retryTimer;

    const fetchResult = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/results/${caseId}`,
          { credentials: "include" }
        );

        if (res.status === 202) {
          setError("Processing results. Please wait...");
          retryTimer = setTimeout(fetchResult, 2000);
          return;
        }

        const data = await res.json();

        if (res.ok) {
          setResult(data);
          setError("");
        } else {
          setError(data.error || "Failed to fetch results");
          setResult({ medicalCodes: [] });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load results.");
        setResult({ medicalCodes: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchResult();

    return () => clearTimeout(retryTimer);
  }, [caseId]);

  const handleDownload = () => {
    if (!result) return;

    const content = `
Full Pipeline Results
====================

Case ID: ${caseId}

Extracted Medical Codes:
------------------------
${result.medicalCodes
  ?.map((c, i) => `${i + 1}. ${c.code} (${c.type}) - ${c.description || ""}`.trim())
  .join("\n")}
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `extracted-codes-${caseId}.txt`;
    a.click();

    URL.revokeObjectURL(url);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0b1f17] text-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#11d462]" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0b1f17] text-white p-6 space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <button className="p-2 rounded-lg bg-[#0f2a1f] hover:bg-[#123b2a] border border-[#11d462]">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold">Full Pipeline Result</h1>
            <p className="text-slate-400 text-sm">
              Case ID: <span className="text-white">{caseId}</span>
            </p>
            {error && <p className="text-yellow-400 text-xs mt-1">{error}</p>}
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-[#11d462] text-black px-4 py-2 rounded-xl font-semibold hover:opacity-90"
        >
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>
      <div className="w-40 h-40 border-2 border-[#11d462] rounded-xl bg-[#0f2a1f] flex flex-col items-center justify-center">
        <p className="text-xs text-slate-400 uppercase tracking-wide">
          Codes Extracted
        </p>
        <p className="text-4xl font-bold text-[#11d462] mt-2">
          {result?.medicalCodes?.length || 0}
        </p>
      </div>

      <div className="bg-[#0f2a1f] border border-[#11d462] rounded-xl p-6">
        <h2 className="font-semibold mb-4 text-white">
          Extracted Medical Codes
        </h2>

        {result?.medicalCodes?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[300px]">
              <thead className="text-slate-400 border-b border-[#11d46233]">
                <tr>
                  <th className="text-left pb-2">#</th>
                  <th className="text-left pb-2">Code</th>
                  <th className="text-left pb-2">Name</th>
                  <th className="text-left pb-2">Type</th>
                </tr>
              </thead>

              <tbody>
                {result.medicalCodes.map((code, index) => (
                  <tr key={index} className="border-t border-[#11d4621a]">
                    <td className="py-3 text-[#11d462] font-semibold">
                      {index + 1}
                    </td>
                    <td className="py-3 font-mono">{code.code}</td>
                    <td className="py-3">{code.description || "—"}</td>
                    <td>{code.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-400">No medical codes extracted.</p>
        )}
      </div>
    </div>
  );
}
