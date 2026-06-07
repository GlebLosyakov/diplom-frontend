import { Link, NavLink, Route, Routes } from "react-router-dom";
import { FlaskConical, LayoutDashboard, Plus } from "lucide-react";
import ExperimentsPage from "./pages/Experiments";
import CreatePage from "./pages/Create";
import DetailPage from "./pages/Detail";

export default function App() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-border/60 p-5 hidden md:flex flex-col gap-2 bg-black/20">
        <Link to="/" className="flex items-center gap-2 mb-6 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shadow-glow">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold">A/B Lab</div>
            <div className="text-xs text-muted">Testing Platform</div>
          </div>
        </Link>

        <NavItem to="/" icon={<LayoutDashboard className="w-4 h-4" />} label="Эксперименты" />
        <NavItem to="/create" icon={<Plus className="w-4 h-4" />} label="Новый тест" />

        <div className="mt-auto text-xs text-muted px-3 py-2 border border-border/60 rounded-lg">
          API: <span className="text-fg">/api</span>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 max-w-[1400px] mx-auto w-full">
        <Routes>
          <Route path="/" element={<ExperimentsPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/exp/:name" element={<DetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
          isActive ? "bg-accent/15 text-white border border-accent/30" : "text-muted hover:text-fg hover:bg-white/5"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
