import React, { useMemo, useState } from "react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role?: string;
}

type MenuItem = {
  id: string;
  label: string;
  icon: string;
  roles: string[];
};

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role }) => {
  const [open, setOpen] = useState(false);

  const menuItems: MenuItem[] = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard", icon: "📊", roles: ["Admin", "Doctor"] },

      { id: "appointments", label: "Appointments", icon: "📋", roles: ["Admin", "Doctor", "Patient"] },

      { id: "patients", label: "My Files", icon: "📁", roles: ["Admin", "Doctor", "Patient"] },

      // NEW: patient can view doctor notes
      { id: "notes", label: "My Notes", icon: "📝", roles: ["Patient"] },

      { id: "messages", label: "Messages", icon: "📨", roles: ["Admin", "Doctor", "Patient"] },

      { id: "system", label: "Database", icon: "🗄️", roles: ["Admin"] },
    ],
    []
  );

  const visibleItems = useMemo(
    () => menuItems.filter((i) => !role || i.roles.includes(role)),
    [menuItems, role]
  );

  const handleClick = (id: string) => {
    setActiveTab(id);
    setOpen(false); // close sidebar on mobile after click
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow">
        <div className="font-bold flex items-center gap-2">
          <span>👁️</span>
          <span>EyeCare HIS</span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-2 rounded-lg bg-white/10 border border-white/20"
          aria-label="Toggle menu"
        >
          {open ? "✖" : "☰"}
        </button>
      </div>

      {/* Overlay when open on mobile */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed md:static top-0 left-0 z-50 h-full w-72 bg-slate-900 text-white",
          "transform transition-transform duration-200",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "pt-16 md:pt-0", // space for mobile top bar
          "flex flex-col",
        ].join(" ")}
      >
        <div className="p-6 border-b border-white/10 hidden md:block">
          <div className="text-xl font-bold flex items-center gap-2">
            <span>👁️</span>
            <span>EyeCare HIS</span>
          </div>
          <div className="text-sm text-white/70 mt-1">Ophthalmology Department</div>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-auto">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={[
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition",
                activeTab === item.id ? "bg-blue-600" : "hover:bg-white/10",
              ].join(" ")}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-xs text-white/70 font-semibold mb-2">CLINIC STATUS</div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              <span>System Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
