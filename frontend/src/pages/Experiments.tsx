import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, BarChart3, RefreshCw, Search } from "lucide-react";
import { api, Experiment } from "@/api/client";

export default function ExperimentsPage() {
  const [items, setItems] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const nav = useNavigate();

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      setItems(await api.listExperiments());
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id: number) {
    if (!confirm("Удалить эксперимент? Это действие необратимо.")) return;
    await api.deleteExperiment(id);
    load();
  }

  async function onToggle(exp: Experiment) {
    const next = exp.status === "active" ? "finished" : "active";
    await api.updateStatus(exp.id, next);
    load();
  }

  const filtered = items.filter((e) =>
    e.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <header className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Эксперименты</h1>
          <p className="text-sm text-muted mt-1">
            Управляйте A/B-тестами, статусом и аналитикой
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={load}>
            <RefreshCw className="w-4 h-4" />
            Обновить
          </button>
          <Link to="/create" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Новый тест
          </Link>
        </div>
      </header>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по названию..."
              className="input pl-9"
            />
          </div>
          <span className="badge badge-muted">{filtered.length} шт.</span>
        </div>

        {err && (
          <div className="text-danger text-sm mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg">
            {err}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-muted">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-muted mb-3">Нет экспериментов</div>
            <Link to="/create" className="btn btn-primary inline-flex">
              <Plus className="w-4 h-4" /> Создать первый
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Алгоритм</th>
                  <th>Ожид. CR</th>
                  <th>Статус</th>
                  <th className="text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link
                        to={`/exp/${encodeURIComponent(e.name)}`}
                        className="font-medium hover:text-accent2"
                      >
                        {e.name}
                      </Link>
                      <div className="text-xs text-muted">ID #{e.id}</div>
                    </td>
                    <td className="text-muted">{e.algorithm}</td>
                    <td>{e.expected_cr}%</td>
                    <td>
                      <button onClick={() => onToggle(e)}>
                        <StatusBadge status={e.status} />
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="btn btn-ghost"
                          onClick={() => nav(`/exp/${encodeURIComponent(e.name)}`)}
                        >
                          <BarChart3 className="w-4 h-4" />
                          Статистика
                        </button>
                        <button className="btn btn-danger" onClick={() => onDelete(e.id)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "active" || status === "in_progress"
      ? "badge-success"
      : status === "draft"
      ? "badge-warn"
      : "badge-muted";
  return <span className={`badge ${cls}`}>{status}</span>;
}
