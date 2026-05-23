import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import api from "../api/client";
import toast from "react-hot-toast";
import { FaFilePdf, FaShieldAlt, FaExclamationTriangle } from "react-icons/fa";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { buildAttackAnalytics, formatAttackLabel } from "../utils/attackAnalytics";
import { exportAttacksPdf } from "../utils/exportAttackPdf";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const chartColors = [
  "#22d3ee",
  "#f87171",
  "#a78bfa",
  "#fbbf24",
  "#34d399",
  "#fb923c",
  "#e879f9",
  "#94a3b8",
];

function AttacksPage() {
  const [attacks, setAttacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttacks = async () => {
      try {
        const res = await api.get("/api/attacks");
        setAttacks(res.data);
      } catch {
        toast.error("Could not load attack history");
      } finally {
        setLoading(false);
      }
    };

    fetchAttacks();
  }, []);

  const analytics = useMemo(() => buildAttackAnalytics(attacks), [attacks]);

  const doughnutData = {
    labels: analytics.typeLabels,
    datasets: [
      {
        data: analytics.typeValues,
        backgroundColor: chartColors.slice(0, analytics.typeLabels.length),
        borderWidth: 0,
      },
    ],
  };

  const barData = {
    labels: analytics.dateLabels,
    datasets: [
      {
        label: "Scans per day",
        data: analytics.dateValues,
        backgroundColor: "rgba(6, 182, 212, 0.7)",
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "#94a3b8" },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: {
        ticks: { color: "#94a3b8" },
        grid: { color: "rgba(148, 163, 184, 0.1)" },
      },
      y: {
        ticks: { color: "#94a3b8", stepSize: 1 },
        grid: { color: "rgba(148, 163, 184, 0.1)" },
        beginAtZero: true,
      },
    },
  };

  const handleExportPdf = () => {
    if (attacks.length === 0) {
      toast.error("No data to export");
      return;
    }
    exportAttacksPdf(attacks);
    toast.success("PDF report downloaded");
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Attack log & analytics</h1>
            <p className="text-slate-400">
              Charts, history, and exportable reports from all scans
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={attacks.length === 0}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 px-5 py-3 rounded-xl font-semibold"
          >
            <FaFilePdf />
            Export PDF report
          </button>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : attacks.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-slate-400">
            No scans yet. Upload traffic from the Upload Traffic page.
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-slate-400 text-sm">Total scans</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {analytics.totalScans}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-slate-400 text-sm flex items-center gap-1">
                  <FaExclamationTriangle className="text-red-400" />
                  Threats
                </p>
                <p className="text-3xl font-bold text-red-400 mt-1">
                  {analytics.threats}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-slate-400 text-sm flex items-center gap-1">
                  <FaShieldAlt className="text-green-400" />
                  Normal
                </p>
                <p className="text-3xl font-bold text-green-400 mt-1">
                  {analytics.safe}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-slate-400 text-sm">Avg confidence</p>
                <p className="text-3xl font-bold text-cyan-400 mt-1">
                  {analytics.avgConfidence.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Attack types</h2>
                <div className="h-[260px] flex items-center justify-center">
                  {analytics.typeLabels.length > 0 ? (
                    <Doughnut data={doughnutData} options={chartOptions} />
                  ) : (
                    <p className="text-slate-500">No data</p>
                  )}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Scans over time</h2>
                <div className="h-[260px]">
                  {analytics.dateLabels.length > 0 ? (
                    <Bar data={barData} options={barOptions} />
                  ) : (
                    <p className="text-slate-500 text-center pt-20">No data</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <h2 className="text-lg font-semibold p-4 border-b border-slate-800">
                Scan history
              </h2>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="p-4">Date</th>
                    <th className="p-4">Attack type</th>
                    <th className="p-4">Confidence</th>
                    <th className="p-4">Uploaded by</th>
                  </tr>
                </thead>
                <tbody>
                  {attacks.map((item) => (
                    <tr key={item._id} className="border-b border-slate-800">
                      <td className="p-4">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={
                            item.attackType === "normal"
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {formatAttackLabel(item.attackType)}
                        </span>
                      </td>
                      <td className="p-4">
                        {item.confidence != null
                          ? `${Number(item.confidence).toFixed(1)}%`
                          : "—"}
                      </td>
                      <td className="p-4 text-slate-300">
                        {item.uploadedBy?.name || item.uploadedBy?.email || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AttacksPage;
