import React, { useEffect, useMemo, useState } from "react";
import { dataService } from "../services/dataService";

const DatabaseView: React.FC = () => {
  const [activeTable, setActiveTable] = useState("USER_ACCOUNT");
  const [refreshKey, setRefreshKey] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<Record<string, any[]>>({
    USER_ACCOUNT: [],
    DOCTOR_PROFILE: [],
    PATIENT_PROFILE: [],
    APPOINTMENT: [],
    VISIT_NOTE: [],
    UPLOAD: [],
    CONTACT_MESSAGE: [],
  });

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const d = await dataService.getRawData();
        setData(d);

        // if active table doesn't exist anymore, fallback
        if (!d[activeTable]) {
          const first = Object.keys(d)[0] || "USER_ACCOUNT";
          setActiveTable(first);
        }
      } catch (e: any) {
        const msg = e?.message || "Failed to load data";
        setError(msg.includes("403") ? "Admin only: you don’t have permission." : msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  const tableNames = useMemo(() => Object.keys(data), [data]);

  const renderTable = (tableName: string, rows: any[]) => {
    if (!rows || rows.length === 0)
      return <div className="p-8 text-center text-slate-400 italic">Table is empty</div>;

    const allKeys = Array.from(new Set(rows.flatMap(Object.keys)));

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-mono border-collapse">
          <thead className="bg-slate-100 border-b border-slate-200 sticky top-0">
            <tr>
              {allKeys.map((h) => (
                <th key={h} className="p-3 font-bold text-slate-600 uppercase text-xs tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-blue-50 transition-colors">
                {allKeys.map((h) => (
                  <td key={h} className="p-3 text-slate-700 whitespace-nowrap border-r border-slate-50 last:border-none">
                    {row[h] === undefined || row[h] === null ? (
                      <span className="text-slate-300">null</span>
                    ) : typeof row[h] === "object" ? (
                      <span className="text-xs text-blue-600 bg-blue-50 px-1 rounded">
                        {JSON.stringify(row[h]).substring(0, 40) +
                          (JSON.stringify(row[h]).length > 40 ? "..." : "")}
                      </span>
                    ) : (
                      String(row[h])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Backend Database Admin</h2>
          <p className="text-slate-500 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${error ? "bg-red-500" : "bg-green-500"} animate-pulse`}></span>
            {error ? "Not connected" : "Connected"}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-sm font-medium transition-colors"
        >
          ↻ Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col flex-1">
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
          {tableNames.map((table) => (
            <button
              key={table}
              onClick={() => setActiveTable(table)}
              className={`px-6 py-3 text-sm font-bold transition-colors border-r border-slate-200 flex-shrink-0 ${
                activeTable === table
                  ? "bg-white text-emerald-600 border-b-2 border-b-emerald-600"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              {table.toUpperCase()}{" "}
              <span className="ml-2 text-xs opacity-50 bg-slate-200 px-1.5 py-0.5 rounded-full">
                {(data[table] || []).length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto bg-slate-50/50">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : (
            renderTable(activeTable, data[activeTable] || [])
          )}
        </div>

        <div className="p-2 bg-slate-100 border-t border-slate-200 text-xs text-slate-500 font-mono text-right">
          Query executed
        </div>
      </div>
    </div>
  );
};

export default DatabaseView;
