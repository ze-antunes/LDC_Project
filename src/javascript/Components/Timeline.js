import { useMemo } from "react";
import { useExplorer } from "../stores/useExplorer";
import { formatDate } from "../data/battles";
export default function Timeline({ battles, visible, clusters }) {
  const selectedId = useExplorer((s) => s.selectedId),
    year = useExplorer((s) => s.year),
    playing = useExplorer((s) => s.playing);
  const drawer = useExplorer((s) => s.drawer),
    tab = useExplorer((s) => s.readingTab),
    comparisonId = useExplorer((s) => s.comparisonId);
  const compared =
    drawer === "event" && tab === "compare"
      ? battles.find((b) => b.id === comparisonId)
      : null;
  const selected = battles.find((b) => b.id === selectedId),
    index = visible.findIndex((b) => b.id === selectedId);
  const firstYear = battles[0]?.year ?? 1940,
    lastYear = battles.at(-1)?.year ?? 1945;
  const start = Date.UTC(firstYear, 0, 1),
    end = Date.UTC(lastYear + 1, 0, 1);
  const x = (date) => 20 + ((date - start) / (end - start)) * 960;
  const months = useMemo(() => {
    const bins = Array.from(
      { length: (lastYear - firstYear + 1) * 12 },
      (_, i) => ({ date: new Date(Date.UTC(firstYear, i, 1)), events: [] }),
    );
    for (const b of visible) {
      const i = (b.year - firstYear) * 12 + b.dateObject.getUTCMonth();
      bins[i]?.events.push(b);
    }
    return bins;
  }, [visible, firstYear, lastYear]);
  const max = Math.max(1, ...months.map((m) => m.events.length));
  const activate = (battle) => {
    if (!battle) return;
    const state = useExplorer.getState();
    if (state.drawer === "event") state.select(battle.id);
    else if (state.drawer) {
      state.select(battle.id);
      state.openReadings("event");
    } else state.navigate(battle.id);
  };
  const step = (direction) => {
    const b =
      visible[Math.max(0, Math.min(visible.length - 1, index + direction))];
    activate(b);
  };
  return (
    <footer className="chronology" aria-label="Cronologia interativa">
      <div className="chronology-top">
        <div>
          <span className="chronology-date">
            {selected ? formatDate(selected) : "1940 — 1945"}
          </span>
          <span className="chronology-event">
            {selected?.name || "Explora o arquivo ao teu ritmo"}
          </span>
        </div>
        <div className="chronology-actions">
          <button
            aria-label="Evento anterior na cronologia"
            disabled={index <= 0}
            onClick={() => step(-1)}
          >
            Anterior
          </button>
          <button
            disabled={!visible.length}
            onClick={() => useExplorer.getState().togglePlay()}
          >
            {playing ? "Ⅱ Parar visita" : "▷ Visita lenta"}
          </button>
          <button
            aria-label="Evento seguinte na cronologia"
            disabled={index < 0 || index >= visible.length - 1}
            onClick={() => step(1)}
          >
            Seguinte
          </button>
        </div>
      </div>
      <svg
        className="chronology-chart"
        viewBox="0 0 1000 78"
        preserveAspectRatio="none"
        role="group"
        aria-label="Registos por mês; a altura representa quantidade de registos"
      >
        <line x1="20" x2="980" y1="54" y2="54" stroke="#666" />
        {months.map(({ date, events }, i) => {
          const next = new Date(
            Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1),
          );
          const height = events.length
            ? 5 + Math.sqrt(events.length / max) * 31
            : 0;
          return (
            <g key={i}>
              <line
                x1={x(date)}
                x2={x(date)}
                y1="54"
                y2={date.getUTCMonth() === 0 ? 60 : 57}
                stroke="#777"
              />
              {!!events.length && (
                <rect
                  x={x(date) + 2}
                  width={Math.max(2, x(next) - x(date) - 4)}
                  y={54 - height}
                  height={height}
                  fill={
                    selected && events.some((b) => b.id === selected.id)
                      ? "#ed1321"
                      : "#858585"
                  }
                  tabIndex={0}
                  role="button"
                  aria-label={`${date.toLocaleDateString("pt-PT", { month: "long", year: "numeric", timeZone: "UTC" })}: ${events.length} registos`}
                  onClick={() => activate(events[0])}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      activate(events[0]);
                    }
                  }}
                >
                  <title>
                    {date.toLocaleDateString("pt-PT", {
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    })}{" "}
                    · {events.length} registos
                  </title>
                </rect>
              )}
              {date.getUTCMonth() === 0 && (
                <text x={x(date) + 4} y="73" fill="#ddd" fontSize="11">
                  {date.getUTCFullYear()}
                </text>
              )}
            </g>
          );
        })}
        {selected && (
          <line
            x1={x(selected.dateObject)}
            x2={x(selected.dateObject)}
            y1="10"
            y2="59"
            stroke="#f00511"
            strokeWidth="1.3"
          />
        )}
        {compared && (
          <line
            x1={x(compared.dateObject)}
            x2={x(compared.dateObject)}
            y1="10"
            y2="59"
            stroke="#eee"
            strokeWidth="1.3"
            strokeDasharray="3 3"
          >
            <title>Confronto B: {compared.name}</title>
          </line>
        )}
      </svg>
      <div className="chronology-bottom">
        <button
          className={year === "all" ? "active" : ""}
          onClick={() => useExplorer.getState().setFilter({ year: "all" })}
        >
          Todos os anos
        </button>
        {Array.from(
          { length: lastYear - firstYear + 1 },
          (_, i) => firstYear + i,
        ).map((y) => (
          <button
            key={y}
            className={Number(year) === y ? "active" : ""}
            onClick={() =>
              useExplorer.getState().setFilter({ year: String(y) })
            }
          >
            {y}
          </button>
        ))}
        <span>
          {visible.length} registos · {clusters.length} clusters · barras:
          registos/mês {compared ? " · A vermelho / B claro" : ""}
        </span>
      </div>
    </footer>
  );
}
