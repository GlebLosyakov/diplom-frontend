import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  MousePointerClick,
  Loader2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Analytics, api, Experiment, SNIPPET_ORIGIN } from "@/api/client";
import { fmtPct } from "@/lib/utils";

export default function DetailPage() {
  const { name = "" } = useParams();
  const [data, setData] = useState<Analytics | null>(null);
  const [exp, setExp] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [auto, setAuto] = useState(true);

  async function load() {
    setErr(null);
    try {
      const d = await api.analytics(name);
      setData(d);
      const all = await api.listExperiments();
      setExp(all.find((e) => e.name === name) || null);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [name]);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [auto, name]);

  const snippet = `<script src="${SNIPPET_ORIGIN}/static/ab_platform.js" async></script>`;

  function copySnippet() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function toggleStatus() {
    if (!exp) return;
    const next = exp.status === "active" ? "finished" : "active";
    await api.updateStatus(exp.id, next);
    load();
  }

  if (loading)
    return (
      <div className="py-20 text-center text-muted">
        <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" />
        Загрузка...
      </div>
    );
  if (err)
    return (
      <div className="card text-danger">
        Ошибка: {err}
        <div className="mt-3">
          <Link to="/" className="btn btn-ghost">
            <ArrowLeft className="w-4 h-4" /> К списку
          </Link>
        </div>
      </div>
    );
  if (!data) return null;

  const A = data.variants.A;
  const B = data.variants.B;
  const totalViews = A.views + B.views;
  const totalClicks = A.clicks + B.clicks;
  const winner = data.statistics.significant
    ? B.cr > A.cr
      ? "B"
      : "A"
    : null;

  const algoMap: Record<string, string> = {
    "classic": "A/B 50/50",
    "thompson": "Thompson Sampling",
    "epsilon_greedy": "Epsilon-Greedy"
  };
  const algoName = data.algorithm ? algoMap[data.algorithm] || data.algorithm : "Неизвестно";


  const chartData = [
    { variant: "A (контроль)", CR: Number(A.cr.toFixed(2)), views: A.views, clicks: A.clicks },
    { variant: "B (тест)", CR: Number(B.cr.toFixed(2)), views: B.views, clicks: B.clicks },
  ];

  return (
    <div>
      <header className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/" className="btn btn-ghost">
            <ArrowLeft className="w-4 h-4" /> Назад
          </Link>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-3">
              {data.experiment_name}
              <span
                className={`badge ${
                  data.status === "active" || data.status === "in_progress"
                    ? "badge-success"
                    : "badge-muted"
                }`}
              >
                {data.status}
              </span>
            </h1>
            <p className="text-sm text-muted mt-1">
              Алгоритм: <span className="text-fg font-medium">{algoName}</span> · Ожидаемый CR: {data.expected_cr}% · авто-обновление {auto ? "вкл" : "выкл"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={() => setAuto((v) => !v)}>
            {auto ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {auto ? "Пауза" : "Авто"}
          </button>
          <button className="btn btn-ghost" onClick={load}>
            <RefreshCw className="w-4 h-4" /> Обновить
          </button>
          <a
            className="btn btn-ghost"
            href={api.exportCsvUrl(name)}
            target="_blank"
            rel="noreferrer"
          >
            <Download className="w-4 h-4" /> CSV
          </a>
          {exp && (
            <button className="btn btn-primary" onClick={toggleStatus}>
              {exp.status === "active" ? "Остановить" : "Запустить"}
            </button>
          )}
        </div>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi
          icon={<Users className="w-4 h-4" />}
          label="Всего просмотров"
          value={totalViews.toLocaleString()}
          accent="from-accent to-accent2"
        />
        <Kpi
          icon={<MousePointerClick className="w-4 h-4" />}
          label="Всего кликов"
          value={totalClicks.toLocaleString()}
          accent="from-cyan-400 to-sky-500"
        />
        <Kpi
          icon={<TrendingUp className="w-4 h-4" />}
          label="Lift (B vs A)"
          value={`${data.statistics.lift > 0 ? "+" : ""}${data.statistics.lift.toFixed(2)}%`}
          tone={data.statistics.lift >= 0 ? "good" : "bad"}
          accent="from-emerald-400 to-emerald-600"
        />
        <Kpi
          icon={<Sparkles className="w-4 h-4" />}
          label="p-value"
          value={data.statistics.p_value.toFixed(4)}
          sub={
            data.statistics.significant
              ? "статистически значимо"
              : "недостаточно данных"
          }
          tone={data.statistics.significant ? "good" : "muted"}
          accent="from-fuchsia-400 to-purple-600"
        />
      </section>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Сравнение вариантов</h2>
            {winner && (
              <span className="badge badge-success">
                Победитель: вариант {winner}
              </span>
            )}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="#1f2330" vertical={false} />
                <XAxis dataKey="variant" stroke="#8b93a7" fontSize={12} />
                <YAxis stroke="#8b93a7" fontSize={12} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    background: "#0e1119",
                    border: "1px solid #1f2330",
                    borderRadius: 12,
                  }}
                  formatter={(v: any) => `${v}%`}
                />
                <Bar dataKey="CR" radius={[8, 8, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#6366f1" : "#22d3ee"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <VariantCard letter="A" label="Контроль" v={A} color="#6366f1" />
            <VariantCard letter="B" label="Тест" v={B} color="#22d3ee" />
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-2">JS-сниппет для сайта</h2>
          <p className="text-xs text-muted mb-3">
            Вставьте перед закрывающим <code className="text-fg">&lt;/body&gt;</code> на
            клиентском сайте. Скрипт сам подтянет конфиг активных тестов и начнёт собирать
            события.
          </p>
          <div className="bg-black/60 border border-border rounded-lg p-3 font-mono text-xs whitespace-pre-wrap break-all mb-3">
            {snippet}
          </div>
          <button className="btn btn-primary w-full justify-center" onClick={copySnippet}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Скопировано" : "Скопировать"}
          </button>

          <div className="mt-5 pt-5 border-t border-border/60">
            <div className="text-xs text-muted mb-2">Статус соединения</div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  totalViews > 0 ? "bg-success animate-pulse" : "bg-muted"
                }`}
              ></span>
              <span className="text-sm">
                {totalViews > 0
                  ? `События поступают (${totalViews} просмотров)`
                  : "Ожидаем первые события..."}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* --- НОВЫЙ БЛОК: РАСПРЕДЕЛЕНИЕ ПО УСТРОЙСТВАМ --- */}
      <div className="card mt-6">
        <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted">Распределение просмотров по устройствам</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-muted border-b border-border/60">
              <tr>
                <th className="pb-3 font-medium">Тип устройства</th>
                <th className="pb-3 font-medium">Вариант A (Контроль)</th>
                <th className="pb-3 font-medium">Вариант B (Тест)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {['Desktop', 'Mobile', 'Tablet'].map(dev => (
                <tr key={dev} className="hover:bg-black/10 transition-colors">
                  <td className="py-3 font-medium">{dev}</td>
                  <td className="py-3 text-muted">
                    <span className="text-fg font-semibold mr-1">
                      {data.devices[dev as keyof typeof data.devices]?.A || 0}
                    </span>
                    просмотров
                  </td>
                  <td className="py-3 text-muted">
                    <span className="text-fg font-semibold mr-1">
                      {data.devices[dev as keyof typeof data.devices]?.B || 0}
                    </span>
                    просмотров
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* ------------------------------------------------ */}
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  tone = "muted",
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "bad" | "muted";
  accent?: string;
}) {
  const toneCls =
    tone === "good" ? "text-success" : tone === "bad" ? "text-danger" : "text-muted";
  return (
    <div className="card relative overflow-hidden">
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${
          accent || "from-accent to-accent2"
        } opacity-10 blur-2xl`}
      />
      <div className="flex items-center gap-2 text-muted text-xs mb-2">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className={`text-xs mt-1 ${toneCls}`}>{sub}</div>}
    </div>
  );
}

function VariantCard({
  letter,
  label,
  v,
  color,
}: {
  letter: string;
  label: string;
  v: { views: number; clicks: number; cr: number };
  color: string;
}) {
  return (
    <div className="border border-border/60 rounded-xl p-4 bg-black/20">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-white"
          style={{ background: color }}
        >
          {letter}
        </div>
        <div>
          <div className="font-medium">Вариант {letter}</div>
          <div className="text-xs text-muted">{label}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Metric label="Views" value={v.views.toLocaleString()} />
        <Metric label="Clicks" value={v.clicks.toLocaleString()} />
        <Metric label="CR" value={fmtPct(v.cr)} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/30 rounded-lg py-2 px-2 border border-border/40">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
