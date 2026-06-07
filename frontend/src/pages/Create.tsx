import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Wand2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { api, ParsedElement, UIChangeItem } from "@/api/client";

const EMPTY_CHANGE: UIChangeItem = {
  selector: "",
  element_type: "button",
  element_text: "",
  change_type: "text",
  value_a: "",
  value_b: "",
};

export default function CreatePage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [algorithm, setAlgorithm] = useState("epsilon_greedy");
  const [expectedCr, setExpectedCr] = useState(10);
  const [status, setStatus] = useState("active");
  const [changes, setChanges] = useState<UIChangeItem[]>([{ ...EMPTY_CHANGE }]);

  const [parseUrl, setParseUrl] = useState("");
  const [parsed, setParsed] = useState<ParsedElement[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseErr, setParseErr] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [modColor, setModColor] = useState("");
  const [modWidth, setModWidth] = useState("");
  const [modHeight, setModHeight] = useState("");

  function updateChange(i: number, patch: Partial<UIChangeItem>) {
    setChanges((arr) => arr.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function removeChange(i: number) {
    setChanges((arr) => arr.filter((_, idx) => idx !== i));
  }
  function addChange() {
    setChanges((arr) => [...arr, { ...EMPTY_CHANGE }]);
  }

  async function doParse() {
    setParsing(true);
    setParseErr(null);
    try {
      const res = await api.parseElements(parseUrl);
      setParsed(res.elements);
    } catch (e: any) {
      setParseErr(e.message);
    } finally {
      setParsing(false);
    }
  }

  function pickElement(el: ParsedElement) {
    setChanges((arr) => [
      ...arr,
      {
        selector: el.selector,
        element_type: el.type,
        element_text: el.text,
        change_type: "text",
        value_a: el.text,
        value_b: "",
      },
    ]);
  }

  async function onSave() {
    setSaving(true);
    setErr(null);
    try {
      if (!name.trim()) throw new Error("Введите название эксперимента");
      if (changes.length === 0) throw new Error("Добавьте хотя бы одно изменение");
      const cleaned = changes.filter((c) => c.selector.trim() !== "");
      if (cleaned.length === 0) throw new Error("Заполните селектор хотя бы в одном изменении");
      const preparedChanges = changes.map(c => ({
        selector: c.selector,
        element_type: c.element_type,
        element_text: c.element_text,
        change_type: c.change_type,
        value_a: c.value_a,
        // Записываем в value_b JSON-строку
        value_b: JSON.stringify({
          text: c.value_b || c.element_text,
          color: c.modColor || null,
          width: c.modWidth || null,
          height: c.modHeight || null
        })
      }));

      await api.createExperiment({
        name: name.trim(),
        algorithm,
        expected_cr: Number(expectedCr),
        status,
        changes: preparedChanges, // Отправляем упакованные данные
      });
      nav(`/exp/${encodeURIComponent(name.trim())}`);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <header className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/" className="btn btn-ghost">
            <ArrowLeft className="w-4 h-4" /> Назад
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Новый A/B-тест</h1>
            <p className="text-sm text-muted mt-1">Настройте варианты и запустите эксперимент</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={onSave} disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? "Сохраняем..." : "Создать тест"}
        </button>
      </header>

      {err && (
        <div className="text-danger text-sm mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg">
          {err}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <section className="card">
            <h2 className="font-semibold mb-4">Основные параметры</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Название</label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="checkout_button_color"
                />
              </div>
              <div>
                <label className="label">Алгоритм</label>
                <select
                  className="select"
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                >
                  <option value="epsilon_greedy">Epsilon-Greedy</option>
                  <option value="classic">A/B 50/50</option>
                  <option value="thompson">Thompson Sampling</option>
                </select>
              </div>
              <div>
                <label className="label">Ожидаемый CR (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={expectedCr}
                  onChange={(e) => setExpectedCr(Number(e.target.value))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Статус при создании</label>
                <div className="flex gap-2">
                  {["draft", "active"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`btn ${status === s ? "btn-primary" : "btn-ghost"}`}
                    >
                      {s === "draft" ? "Черновик" : "Запустить сразу"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Изменения (варианты A → B)</h2>
                <p className="text-xs text-muted mt-1">
                  A — оригинал, B — что показывать вариативной группе
                </p>
              </div>
              <button className="btn btn-ghost" onClick={addChange}>
                <Plus className="w-4 h-4" /> Добавить
              </button>
            </div>

            <div className="space-y-4">
              {changes.map((c, i) => (
                <div key={i} className="border border-border/60 rounded-xl p-4 bg-black/20">

                  {/* Шапка карточки с номером и удалением */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="badge badge-muted">#{i + 1}</span>
                    <button
                      className="btn btn-danger"
                      onClick={() => removeChange(i)}
                      disabled={changes.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Основная сетка полей */}
                  <div className="grid sm:grid-cols-2 gap-3">

                    {/* CSS Селектор */}
                    <div className="sm:col-span-2">
                      <label className="label">CSS-селектор</label>
                      <input
                        className="input font-mono text-sm"
                        value={c.selector}
                        onChange={(e) => updateChange(i, { selector: e.target.value })}
                        placeholder="#buy-btn или .cta-primary"
                      />
                    </div>

                    {/* Тип элемента */}
                    <div>
                      <label className="label">Тип элемента</label>
                      <input
                        className="input"
                        value={c.element_type}
                        onChange={(e) => updateChange(i, { element_type: e.target.value })}
                        placeholder="button"
                      />
                    </div>

                    {/* Тип изменения */}
                    <div>
                      <label className="label">Тип изменения</label>
                      <select
                        className="select"
                        value={c.change_type}
                        onChange={(e) => updateChange(i, { change_type: e.target.value })}
                      >
                        <option value="text">Текст</option>
                        <option value="style">CSS-стиль</option>
                      </select>
                    </div>

                    {/* Текущий текст */}
                    <div className="sm:col-span-2">
                      <label className="label">Текущий текст элемента</label>
                      <input
                        className="input"
                        value={c.element_text}
                        onChange={(e) => updateChange(i, { element_text: e.target.value })}
                      />
                    </div>

                    {/* БЛОК ВИЗУАЛЬНЫХ НАСТРОЕК СТИЛЯ ДЛЯ ВАРИАНТА B */}
                    <div className="sm:col-span-2 border-t border-border/40 pt-4 mt-2 space-y-4">
                      <h4 className="text-xs font-semibold text-accent uppercase tracking-wider">
                        Визуальный стиль Варианта B
                      </h4>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Выбор цвета */}
                        <div>
                          <label className="label text-xs">Цвет фона / кнопки</label>
                          <div className="flex gap-2">
                            <select
                              className="select flex-1 text-sm"
                              value={c.modColor || ""}
                              onChange={(e) => updateChange(i, { modColor: e.target.value })}
                            >
                              <option value="">Без изменений</option>
                              <option value="#dc3545">Красный</option>
                              <option value="#0d6efd">Синий</option>
                              <option value="#198754">Зеленый</option>
                              <option value="#ffc107">Желтый</option>
                              <option value="#212529">Темный</option>
                            </select>
                            <input
                              type="color"
                              className="w-10 h-10 p-0 border border-border rounded-lg bg-transparent cursor-pointer"
                              value={c.modColor || ""}
                              onChange={(e) => updateChange(i, { modColor: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Размеры */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="label text-xs">Ширина (px)</label>
                            <input
                              className="input text-sm"
                              placeholder="Исходная"
                              value={c.modWidth || ""}
                              onChange={(e) => updateChange(i, { modWidth: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="label text-xs">Высота (px)</label>
                            <input
                              className="input text-sm"
                              placeholder="Исходная"
                              value={c.modHeight || ""}
                              onChange={(e) => updateChange(i, { modHeight: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Текстовые значения вариантов */}
                    <div>
                      <label className="label">Вариант A (контроль)</label>
                      <textarea
                        rows={2}
                        className="textarea"
                        value={c.value_a}
                        onChange={(e) => updateChange(i, { value_a: e.target.value })}
                        placeholder="Купить"
                      />
                    </div>

                    <div>
                      <label className="label">Вариант B (новый текст)</label>
                      <textarea
                        rows={2}
                        className="textarea"
                        value={c.value_b}
                        onChange={(e) => updateChange(i, { value_b: e.target.value })}
                        placeholder="Купить сейчас"
                      />
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-accent2" /> Парсер элементов
            </h2>
            <p className="text-xs text-muted mb-3">
              Введите URL — мы найдём кнопки, ссылки и заголовки. Кликом добавляйте их в эксперимент.
            </p>
            <div className="flex gap-2 mb-3">
              <input
                className="input flex-1"
                value={parseUrl}
                onChange={(e) => setParseUrl(e.target.value)}
                placeholder="https://example.com"
              />
              <button className="btn btn-primary" onClick={doParse} disabled={parsing || !parseUrl}>
                {parsing ? "..." : "Найти"}
              </button>
            </div>
            {parseErr && (
              <div className="text-xs text-danger mb-2">{parseErr}</div>
            )}
            <div className="max-h-[420px] overflow-y-auto space-y-1.5">
              {parsed.map((el, idx) => (
                <button
                  key={idx}
                  onClick={() => pickElement(el)}
                  className="w-full text-left p-2.5 rounded-lg border border-border/60 bg-black/30 hover:border-accent/60 hover:bg-accent/5 transition"
                >
                  <div className="text-xs text-muted font-mono truncate">{el.selector}</div>
                  <div className="text-sm truncate">{el.text}</div>
                  <span className="badge badge-muted mt-1 text-[10px]">{el.type}</span>
                </button>
              ))}
              {parsed.length === 0 && !parsing && (
                <div className="text-xs text-muted text-center py-6">
                  Элементы появятся здесь
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
