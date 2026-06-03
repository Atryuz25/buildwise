import React, { useState, useEffect } from "react";
import { useToast } from "../../shared/components/ToastContext";
import { apiClient } from "../../api/apiClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";
import { useAIHeadcount } from "./useAIHeadcount";

export const AttendanceTrackerPage: React.FC = () => {
  const { showToast } = useToast();
  const { analyzeImage, isAnalyzing, result } = useAIHeadcount();
  const userRole = localStorage.getItem('userRole') || 'project_manager';
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  // Fix for randomly shifting numbers: memoize the days generation so it only happens once
  const daysInMonth = React.useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        date: `2023-10-${(i + 1).toString().padStart(2, "0")}`,
        dayName: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][(i + 1) % 7], // Mock offset
        expected: 150,
        actual: (i + 1) % 7 === 0 ? 0 : Math.floor(Math.random() * 40) + 110, // Sunday = 0
      })),
    [],
  );

  const [crews, setCrews] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);

  // Seeded project ID for demo purposes
  const projectId = "294b2977-35cb-491f-9244-e9d983523101";

  useEffect(() => {
    const fetchCrewsAndAttendance = async () => {
      try {
        const [crewsRes, attendanceRes] = await Promise.all([
          apiClient.get(`/crews/project/${projectId}`),
          apiClient.get(
            `/attendance/project/${projectId}?date=${selectedDate}`,
          ),
        ]);

        // Map crews with their attendance actuals
        const mappedCrews = crewsRes.map((crew: any) => {
          const att = attendanceRes.find((a: any) => a.crewId === crew.id);
          return {
            id: crew.id,
            name: `${crew.tradeType} - ${crew.contractorName}`,
            contractor: crew.contractorName,
            expected: crew.size,
            actual: att ? att.presentCount : 0,
            foreman: "Assignee", // Mocked or fetched from relation
          };
        });

        setCrews(mappedCrews);
        setAttendances(attendanceRes);
      } catch (err) {
        console.error("Failed to fetch attendance data:", err);
      }
    };

    fetchCrewsAndAttendance();
  }, [selectedDate]);

  const totalExpected = crews.reduce((acc, c) => acc + c.expected, 0);
  const totalActual = crews.reduce((acc, c) => acc + c.actual, 0);
  const isToday = selectedDate === today;

  // Mock data for trends
  const trendData = Array.from({ length: 7 }, (_, i) => ({
    day: `Oct ${24 - 6 + i}`,
    actual: Math.floor(Math.random() * 20) + 130,
    target: 150,
  }));

  const comparisonData = crews
    .map((c) => ({
      name: c.name,
      attendance: Math.round((c.actual / c.expected) * 100),
    }))
    .sort((a, b) => a.attendance - b.attendance);

  const getStatusColor = (pct: number) => {
    if (pct >= 90) return "#166534"; // Green
    if (pct >= 70) return "#c2410c"; // Amber
    return "#b91c1c"; // Red
  };

  const getStatusBg = (pct: number) => {
    if (pct >= 90) return "bg-[#dcfce7]";
    if (pct >= 70) return "bg-[#fff7ed]";
    return "bg-error-container";
  };

  const getStatusText = (pct: number) => {
    if (pct >= 90) return "text-[#166534]";
    if (pct >= 70) return "text-[#c2410c]";
    return "text-error";
  };

  return (
    <div className="p-page-padding w-full h-full flex flex-col gap-6 overflow-hidden">
      <div className="flex justify-between items-end pb-2 shrink-0 border-b border-outline-variant">
        <div>
          <h1 className="font-section-heading text-[24px] font-bold text-on-surface">
            Attendance Tracker
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Daily headcount by crew. Data feeds directly from daily site
            reports.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto custom-scroll">
        {/* Calendar View (Top) */}
        <div className="bg-surface-lowest border border-outline-variant rounded p-4 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-section-heading text-lg font-bold text-primary">
              October 2023
            </h2>
            <div className="flex gap-4 text-xs font-bold">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-[#166534] rounded-sm"></div> ≥ 90%
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-[#c2410c] rounded-sm"></div> 70-90%
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-error rounded-sm"></div> &lt; 70%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-widest"
              >
                {d}
              </div>
            ))}
            {/* Empty slots for month start (mocking offset) */}
            <div className="p-2"></div>

            {daysInMonth.map((day) => {
              const isSunday = day.dayName === "Sun";
              const pct = (day.actual / day.expected) * 100;
              const isSelected = selectedDate === day.date;

              let bg = "bg-surface-variant/30";
              let text = "text-on-surface";
              if (!isSunday) {
                bg =
                  pct >= 90
                    ? "bg-[#dcfce7]"
                    : pct >= 70
                      ? "bg-[#fff7ed]"
                      : "bg-error-container";
                text =
                  pct >= 90
                    ? "text-[#166534]"
                    : pct >= 70
                      ? "text-[#c2410c]"
                      : "text-error";
              }

              return (
                <div
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`border rounded p-2 h-16 flex flex-col justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary shadow-sm ring-1 ring-primary"
                      : "border-outline-variant hover:border-primary-container"
                  } ${isSunday ? "bg-surface-variant/50 text-on-surface-variant opacity-50" : bg}`}
                >
                  <div className={`text-xs font-bold ${text}`}>
                    {day.date.split("-")[2]}
                  </div>
                  {!isSunday && (
                    <div className="text-right">
                      <div className={`text-sm font-bold ${text}`}>
                        {day.actual}
                      </div>
                      <div className="text-[9px] opacity-70">
                        / {day.expected}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lower Section (2 cols) */}
        <div className="flex gap-6 min-h-0 shrink-0 h-[600px]">
          {/* Crew Breakdown Table (60%) */}
          <div className="w-[60%] bg-surface-lowest border border-outline-variant rounded flex flex-col">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-variant/20">
              <h2 className="font-section-heading text-lg font-bold text-primary flex items-center gap-4">
                <span>
                  Crew Breakdown:{" "}
                  {new Date(selectedDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {isToday && ['admin', 'project_manager'].includes(userRole) && (
                  <div className="flex gap-2 items-center">
                    <label className="flex items-center gap-1.5 bg-surface-variant/20 border border-outline-variant hover:border-primary-container px-3 py-1 rounded text-xs font-bold text-on-surface-variant transition-colors cursor-pointer">
                      <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                      Upload Site Photo
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            showToast('Photo uploaded for verification', 'success');
                            analyzeImage(e.target.files[0], totalActual);
                          }
                        }} 
                      />
                    </label>
                    <button
                      onClick={() => analyzeImage(new File([], "site_photo.jpg"), totalActual)}
                      disabled={isAnalyzing}
                      className="flex items-center gap-1.5 bg-[#f8fafc] border border-outline-variant hover:border-primary-container px-3 py-1 rounded text-xs font-bold text-primary transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                      {isAnalyzing ? "Analyzing..." : "AI Verify"}
                    </button>
                  </div>
                )}
              </h2>
              <div className="flex gap-2">
                {result && (
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${result.status === "Match" ? "bg-[#dcfce7] text-[#166534]" : "bg-error-container text-error"}`}
                  >
                    AI:{" "}
                    {result.status === "Match"
                      ? "Matched"
                      : `${result.divergencePct.toFixed(0)}% Divergence`}
                  </span>
                )}
                {isToday && (
                  <span className="bg-primary-container text-on-primary text-xs font-bold px-2 py-1 rounded flex items-center">
                    Editable Today
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-surface-lowest z-10 shadow-sm">
                  <tr className="border-b border-outline-variant text-on-surface-variant font-card-label text-xs uppercase tracking-wider bg-surface-variant/10">
                    <th className="p-4">Crew Name / Contractor</th>
                    <th className="p-4 text-center">Expected</th>
                    <th className="p-4 text-center">Present</th>
                    <th className="p-4 text-center">Absent</th>
                    <th className="p-4 text-center">Att %</th>
                    <th className="p-4">Foreman</th>
                  </tr>
                </thead>
                <tbody>
                  {crews.map((crew) => {
                    const pct = (crew.actual / crew.expected) * 100;
                    return (
                      <tr
                        key={crew.id}
                        className={`border-b border-outline-variant/50 ${getStatusBg(pct)}/20 hover:bg-surface-variant/30 transition-colors`}
                      >
                        <td className="p-4">
                          <div className="font-bold text-primary">
                            {crew.name}
                          </div>
                          <div className="text-xs text-on-surface-variant">
                            {crew.contractor}
                          </div>
                        </td>
                        <td className="p-4 text-center font-bold text-on-surface-variant">
                          {crew.expected}
                        </td>
                        <td className="p-4 text-center">
                          {isToday ? (
                            <input
                              type="number"
                              defaultValue={crew.actual}
                              className="w-16 text-center border-outline-variant rounded p-1 font-bold focus:border-primary"
                            />
                          ) : (
                            <span className="font-bold">{crew.actual}</span>
                          )}
                        </td>
                        <td className="p-4 text-center text-error font-bold">
                          {crew.expected - crew.actual}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`font-bold px-2 py-1 rounded text-xs ${getStatusBg(pct)} ${getStatusText(pct)}`}
                          >
                            {pct.toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-4 text-on-surface-variant">
                          {crew.foreman}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-surface-variant/40 font-bold border-t-2 border-outline-variant">
                    <td className="p-4">Total</td>
                    <td className="p-4 text-center">{totalExpected}</td>
                    <td className="p-4 text-center text-primary">
                      {totalActual}
                    </td>
                    <td className="p-4 text-center text-error">
                      {totalExpected - totalActual}
                    </td>
                    <td className="p-4 text-center">
                      {((totalActual / totalExpected) * 100).toFixed(1)}%
                    </td>
                    <td className="p-4"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Trends Panel (40%) */}
          <div className="w-[40%] flex flex-col gap-6 min-h-0">
            <div className="bg-surface-lowest border border-outline-variant rounded p-4 flex-1 flex flex-col">
              <h3 className="font-section-heading font-bold text-primary mb-4 text-sm">
                7-Day Attendance Trend
              </h3>
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <ReferenceLine
                      y={150}
                      stroke="#94a3b8"
                      strokeDasharray="3 3"
                      label={{
                        position: "insideTopLeft",
                        value: "Target: 150",
                        fill: "#64748b",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#0f172a"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface-lowest border border-outline-variant rounded p-4 flex-1 flex flex-col">
              <h3 className="font-section-heading font-bold text-primary mb-4 text-sm">
                Crew Comparison (Last 7 Days Avg)
              </h3>
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      width={100}
                    />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Bar
                      dataKey="attendance"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    >
                      {comparisonData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getStatusColor(entry.attendance)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-surface-lowest border border-outline-variant rounded p-4 flex-1 flex flex-col">
              <h3 className="font-section-heading font-bold text-primary mb-4 text-sm">
                Day vs Avg Absence Pattern
              </h3>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant text-on-surface-variant font-bold text-xs uppercase tracking-wider">
                      <th className="pb-2">Day</th>
                      <th className="pb-2 text-right">Avg Absence</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-outline-variant/50">
                      <td className="py-2">Monday</td>
                      <td className="py-2 text-right">5%</td>
                    </tr>
                    <tr className="border-b border-outline-variant/50 bg-[#fff7ed]">
                      <td className="py-2 text-[#c2410c] font-bold">Friday</td>
                      <td className="py-2 text-right text-[#c2410c] font-bold">12%</td>
                    </tr>
                    <tr className="border-b border-outline-variant/50 bg-error-container">
                      <td className="py-2 text-error font-bold">Saturday</td>
                      <td className="py-2 text-right text-error font-bold">18%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
