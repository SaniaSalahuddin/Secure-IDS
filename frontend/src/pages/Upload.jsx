import { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import api from "../api/client";
import toast from "react-hot-toast";
import {
  FaCloudUploadAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileCsv,
  FaFileCode,
} from "react-icons/fa";

const SAMPLE_FILES = [
  { name: "sample_traffic_test.csv", hint: "2 normal + 1 neptune" },
  { name: "all_normal.csv", hint: "All safe" },
  { name: "all_attacks.csv", hint: "Neptune, smurf, satan" },
  { name: "single_neptune_dos.csv", hint: "One DoS row" },
  { name: "single_smurf.csv", hint: "One smurf row" },
  { name: "mixed_5_rows.csv", hint: "Mixed 5 rows" },
  { name: "test_capture.pcap", hint: "Wireshark test capture" },
];

function UploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const isWiresharkFile = (name = "") => /\.(pcap|pcapng)$/i.test(name);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(response.data);
      toast.success(
        isWiresharkFile(file.name)
          ? "Wireshark capture analyzed"
          : "CSV analyzed"
      );
    } catch (error) {
      const message =
        error.response?.data?.message || "Upload failed. Check backend and ML service.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const attacksDetected =
    result?.attacksDetected ??
    result?.predictions?.filter((r) => r.is_attack).length ??
    0;

  const hasAttack = result?.isAttack === true || attacksDetected > 0;
  const isSafe = result && !hasAttack;
  const fromWireshark =
    result?.source === "wireshark" || isWiresharkFile(result?.sourceFile);

  const formatAttackType = (type) => {
    if (!type) return "—";
    if (type === "normal") return "Normal (No Attack)";
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatConfidence = (value) => {
    if (value == null) return "—";
    return `${Number(value).toFixed(1)}%`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2">Upload traffic for detection</h1>
          <p className="text-slate-400 mb-6">
            Upload a <strong className="text-slate-300">CSV</strong> (sample test files)
            or a <strong className="text-slate-300">Wireshark</strong> capture (
            <code className="text-cyan-400">.pcap</code> /{" "}
            <code className="text-cyan-400">.pcapng</code>). PCAP files are converted
            automatically, then analyzed by the model.
          </p>

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-8">
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <FaFileCsv className="text-cyan-400" />
              Sample files (folder: <code className="text-cyan-400">samples/</code>)
            </h2>
            {/* <ul className="grid sm:grid-cols-2 gap-2 text-sm text-slate-400">
              {SAMPLE_FILES.map((sample) => (
                <li key={sample.name} className="flex items-start gap-2">
                  <span className="text-slate-200 shrink-0">{sample.name}</span>
                  <span className="text-slate-500">— {sample.hint}</span>
                </li>
              ))}
            </ul> */}
            <p className="text-xs text-slate-500 mt-3">
              Pick any of these from{" "}
              <code>d:\Intrusion-Detection-System\samples\</code> on your PC, or use
              your own Wireshark export.
            </p>
          </div>

          <form onSubmit={handleUpload}>
            <label className="block border-2 border-dashed border-slate-700 rounded-2xl p-10 text-center cursor-pointer hover:border-cyan-500/50 transition">
              <FaCloudUploadAlt className="text-4xl text-cyan-500 mx-auto mb-4" />
              <input
                type="file"
                accept=".csv,.pcap,.pcapng"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-white font-medium">
                {file ? file.name : "Click to choose CSV or Wireshark file"}
              </p>
              <p className="text-slate-400 mt-2 text-sm">
                Supported: .csv · .pcap · .pcapng
              </p>
              {file && isWiresharkFile(file.name) && (
                <p className="text-cyan-400 text-xs mt-2 flex items-center justify-center gap-1">
                  <FaFileCode /> Will convert from Wireshark format first
                </p>
              )}
            </label>

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition mt-6 py-4 rounded-xl font-semibold"
            >
              {loading
                ? isWiresharkFile(file?.name)
                  ? "Converting & analyzing..."
                  : "Analyzing traffic..."
                : "Start detection"}
            </button>
          </form>
        </div>

        {result && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mt-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {isSafe ? (
                <FaCheckCircle className="text-3xl text-green-400" />
              ) : (
                <FaExclamationTriangle className="text-3xl text-red-400" />
              )}
              <div className="flex-1 min-w-[200px]">
                <h2 className="text-2xl font-bold">Detection results</h2>
                <p className="text-slate-400 text-sm">{result.message}</p>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  fromWireshark
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                }`}
              >
                {fromWireshark ? "Wireshark → CSV" : "CSV upload"}
              </span>
            </div>

            {result.note && (
              <p className="text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-6">
                {result.note}
              </p>
            )}

            <div
              className={`rounded-xl p-4 mb-8 border ${
                isSafe
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <p className="text-lg font-semibold">
                {isSafe
                  ? "No attack detected — all rows are normal"
                  : `${attacksDetected} attack${attacksDetected === 1 ? "" : "s"} detected in ${result.totalRows} row${result.totalRows === 1 ? "" : "s"}`}
              </p>
              {!isSafe && result.safeRows > 0 && (
                <p className="text-slate-400 text-sm mt-2">
                  {result.safeRows} row{result.safeRows === 1 ? "" : "s"} classified
                  as normal
                </p>
              )}
            </div>

            {hasAttack && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-800 p-6 rounded-xl">
                  <h3 className="text-slate-400 text-sm">Detected attack</h3>
                  <p className="text-xl font-bold mt-2 text-red-400">
                    {formatAttackType(result.attackType)}
                  </p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl">
                  <h3 className="text-slate-400 text-sm">Attack confidence</h3>
                  <p className="text-2xl font-bold text-cyan-400 mt-2">
                    {formatConfidence(result.confidence)}
                  </p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl">
                  <h3 className="text-slate-400 text-sm">Status</h3>
                  <p className="text-2xl font-bold mt-2 text-yellow-400">
                    {result.status || "ALERT"}
                  </p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl">
                  <h3 className="text-slate-400 text-sm">Rows analyzed</h3>
                  <p className="text-2xl font-bold text-white mt-2">
                    {result.totalRows ?? "—"}
                  </p>
                </div>
              </div>
            )}

            {isSafe && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-800 p-6 rounded-xl">
                  <h3 className="text-slate-400 text-sm">Classification</h3>
                  <p className="text-xl font-bold mt-2 text-green-400">
                    Normal (No Attack)
                  </p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl">
                  <h3 className="text-slate-400 text-sm">Confidence</h3>
                  <p className="text-2xl font-bold text-cyan-400 mt-2">
                    {formatConfidence(result.confidence)}
                  </p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl">
                  <h3 className="text-slate-400 text-sm">Rows analyzed</h3>
                  <p className="text-2xl font-bold text-white mt-2">
                    {result.totalRows ?? "—"}
                  </p>
                </div>
              </div>
            )}

            {result.predictions?.length > 0 && (
              <div className="overflow-x-auto">
                <h3 className="text-lg font-semibold mb-4">Per-row predictions</h3>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-3 pr-4">#</th>
                      <th className="py-3 pr-4">Attack type</th>
                      <th className="py-3 pr-4">Confidence</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.predictions.map((row, index) => (
                      <tr
                        key={index}
                        className={`border-b border-slate-800 ${
                          row.is_attack ? "bg-red-500/5" : ""
                        }`}
                      >
                        <td className="py-3 pr-4">{index + 1}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={
                              row.is_attack ? "text-red-400 font-medium" : "text-green-400"
                            }
                          >
                            {formatAttackType(row.attack_type)}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {formatConfidence(row.confidence_percentage)}
                        </td>
                        <td className="py-3">
                          <span
                            className={
                              row.is_attack ? "text-red-400" : "text-green-400"
                            }
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default UploadPage;
