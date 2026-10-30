import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useExplorer } from "../stores/useExplorer";
import { formatDate, formatNumber } from "../data/battles";
import {
  campaignGroups,
  coverageSummary,
  recordMetrics,
  relativeLosses,
  formatPercent,
  comparisonInsight,
  suggestedComparison,
} from "../data/readings";

function ValueBar({ value, max, percent = false, tone = "red" }) {
  const label = percent ? formatPercent(value) : formatNumber(value);
  return (
    <div className={`value-bar ${tone}`}>
      <span>{label}</span>
      <div className="bar-track">
        <i
          style={{
            width:
              value === null
                ? "0%"
                : `${Math.min(100, (value / Math.max(1, max)) * 100)}%`,
          }}
        />
      </div>
    </div>
  );
}
function EventReading({ battle }) {
  const maxStrength = Math.max(
    battle.attackerStrength || 0,
    battle.defenderStrength || 0,
    1,
  );
  const maxLoss = Math.max(
    battle.attackerLosses || 0,
    battle.defenderLosses || 0,
    1,
  );
  return (
    <article className="event-reading">
      <p className="reading-kicker">DIMENSÃO E CUSTO RELATIVO</p>
      <h3>{battle.name}</h3>
      <p className="reading-subtitle">
        {formatDate(battle)} ≈ · {battle.campaign}
      </p>
      <p>
        Neste registo, <strong>{battle.attacker}</strong> ataca e{" "}
        <strong>{battle.defender}</strong> defende.
      </p>
      <div className="reading-sides">
        <section>
          <h4>ATACANTE</h4>
          <strong>{battle.attacker}</strong>
          <small>
            {battle.attackerCommander === "?"
              ? "Comandante não indicado"
              : battle.attackerCommander}
          </small>
        </section>
        <section>
          <h4>DEFENSOR</h4>
          <strong>{battle.defender}</strong>
          <small>
            {battle.defenderCommander === "?"
              ? "Comandante não indicado"
              : battle.defenderCommander}
          </small>
        </section>
      </div>
      <section className="paired-measure">
        <h4>Efetivos reportados</h4>
        <div>
          <ValueBar value={battle.attackerStrength} max={maxStrength} />
          <ValueBar
            value={battle.defenderStrength}
            max={maxStrength}
            tone="white"
          />
        </div>
      </section>
      <section className="paired-measure">
        <h4>Baixas de pessoal</h4>
        <div>
          <ValueBar value={battle.attackerLosses} max={maxLoss} />
          <ValueBar value={battle.defenderLosses} max={maxLoss} tone="white" />
        </div>
      </section>
      <section className="paired-measure">
        <h4>Baixas / efetivos reportados</h4>
        <div>
          <ValueBar
            value={relativeLosses(
              battle.attackerLosses,
              battle.attackerStrength,
            )}
            max={100}
            percent
          />
          <ValueBar
            value={relativeLosses(
              battle.defenderLosses,
              battle.defenderStrength,
            )}
            max={100}
            percent
            tone="white"
          />
        </div>
      </section>
      <p className="reading-note">
        A razão permite ler o custo em proporção aos efetivos de cada lado.
        Baixas não equivalem a mortes e não determinam, por si só, o vencedor.
      </p>
      <div className="reading-coordinate">
        {battle.latitude.toFixed(4)}° N ·{" "}
        {Math.abs(battle.longitude).toFixed(4)}°{" "}
        {battle.longitude < 0 ? "O" : "E"}
        <span>Data aproximada a partir do ano decimal.</span>
      </div>
    </article>
  );
}
function Comparison({ first, second }) {
  if (!second)
    return (
      <p className="reading-empty">
        Não existe outro confronto neste recorte. Ativa a opção de comparar com
        toda a amostra para escolher um segundo registo.
      </p>
    );
  const a = recordMetrics(first),
    b = recordMetrics(second);
  return (
    <section className="comparison-reading">
      <div className="comparison-head">
        <article>
          <span>CONFRONTO A</span>
          <h3>{first.name}</h3>
          <p>
            {formatDate(first)} · {first.campaign}
          </p>
        </article>
        <article>
          <span>CONFRONTO B</span>
          <h3>{second.name}</h3>
          <p>
            {formatDate(second)} · {second.campaign}
          </p>
        </article>
      </div>
      <p className="reading-insight">{comparisonInsight(first, second)}</p>
      <div
        className="comparison-table"
        role="table"
        aria-label="Comparação entre dois confrontos"
      >
        <div className="comparison-row column-labels" role="row">
          <span role="columnheader">Indicador</span>
          <span role="columnheader">A</span>
          <span role="columnheader">B</span>
        </div>
        {a.map((metric, index) => {
          const next = b[index],
            percent = metric.unit === "percent",
            max = percent
              ? 100
              : Math.max(metric.value || 0, next.value || 0, 1);
          return (
            <div className="comparison-row" role="row" key={metric.id}>
              <span role="rowheader">{metric.label}</span>
              <div role="cell">
                <ValueBar value={metric.value} max={max} percent={percent} />
              </div>
              <div role="cell">
                <ValueBar
                  value={next.value}
                  max={max}
                  percent={percent}
                  tone="white"
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="reading-note">
        No mapa e na timeline, A é vermelho e B é claro. A escala de cada linha
        é comum aos dois confrontos. As razões usam uma escala de 0–100%.
        “Atacante” e “defensor” são funções de cada registo e podem corresponder
        a forças diferentes. Não somamos perdas nem inferimos vitórias.
      </p>
    </section>
  );
}
function CoverageReading({ battles, visible }) {
  const coverage = useMemo(() => coverageSummary(battles), [battles]);
  const peak = coverage.years.reduce((a, b) => (b.count > a.count ? b : a), {
    count: 0,
    year: null,
    percent: 0,
  });
  return (
    <article className="coverage-reading">
      <p className="reading-kicker">O QUE ESTE ARQUIVO DEIXA VER</p>
      <h3>Uma amostra, várias concentrações.</h3>
      <p>
        O arquivo contém <strong>{coverage.total} registos</strong> e{" "}
        {coverage.campaigns} designações de campanha. O recorte atual mostra{" "}
        {visible.length} registos.
      </p>
      <p className="reading-insight">
        {formatPercent(peak.percent)} dos registos situam-se em {peak.year}.
        Esta distribuição descreve a amostra e não a intensidade global da
        guerra.
      </p>
      <div className="coverage-years">
        {coverage.years.map((row) => (
          <div key={row.year}>
            <span>{row.year}</span>
            <div>
              <i
                style={{
                  width: `${(row.count / Math.max(1, peak.count)) * 100}%`,
                }}
              />
            </div>
            <strong>{row.count}</strong>
            <small>{formatPercent(row.percent)}</small>
          </div>
        ))}
      </div>
      <h4>Valores conhecidos para os dois lados</h4>
      <dl className="coverage-fields">
        <div>
          <dt>Efetivos</dt>
          <dd>
            {coverage.strengthPairs} / {coverage.total}
          </dd>
        </div>
        <div>
          <dt>Baixas</dt>
          <dd>
            {coverage.casualtyPairs} / {coverage.total}
          </dd>
        </div>
        <div>
          <dt>Razões baixas / efetivos</dt>
          <dd>
            {coverage.relativePairs} / {coverage.total}
          </dd>
        </div>
      </dl>
      <p className="reading-note">
        Não há registos de 1939 neste ficheiro. Uma zona sem pontos não
        significa ausência de guerra. Valores ausentes continuam ausentes; os
        limites do mapa são atuais e a cartografia simplificada não resolve
        todas as ilhas.
      </p>
      <details className="reading-sources">
        <summary>Como foram construídas estas leituras</summary>
        <p>
          Fonte: o CSV original do projeto. As datas provêm de anos decimais. A
          razão divide as baixas pelos efetivos reportados do mesmo lado e do
          mesmo registo; um denominador ausente ou zero não produz uma
          percentagem.
        </p>
        <p>
          As sequências agrupam a designação da campanha e o ano, para separar
          nomes reutilizados em anos diferentes. Esse agrupamento serve a
          navegação e não substitui uma classificação histórica.
        </p>
        <p>
          Equipamento e terreno são caminhos seguintes do plano de leituras. As
          suas unidades e codificações precisam de um dicionário antes de novas
          interpretações. O CSV não sustenta ocupação territorial, mortes civis,
          fabricantes ou identificação do vencedor.
        </p>
      </details>
    </article>
  );
}
function ReadingDrawer({ battles, visible, cluster }) {
  const selectedId = useExplorer((s) => s.selectedId),
    tab = useExplorer((s) => s.readingTab),
    comparisonId = useExplorer((s) => s.comparisonId);
  const [allCandidates, setAllCandidates] = useState(false);
  const drawer = useRef();
  const selected = battles.find((b) => b.id === selectedId) || battles[0];
  const groups = useMemo(() => campaignGroups(battles), [battles]);
  const group = groups.find((g) => g.events.some((b) => b.id === selected?.id));
  const candidates = (allCandidates ? battles : group?.events || []).filter(
    (b) => b.id !== selected?.id,
  );
  const second = candidates.find((b) => b.id === comparisonId) || candidates[0];
  useEffect(() => {
    drawer.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (tab === "compare" && second && second.id !== comparisonId)
      useExplorer.getState().setComparison(second.id);
  }, [tab, second?.id, comparisonId]);
  const suggestion = useMemo(() => suggestedComparison(battles), [battles]);
  const state = useExplorer.getState();
  const applySuggestion = () => {
    if (!suggestion) return;
    state.select(suggestion.first.id);
    state.setComparison(suggestion.second.id);
    state.setReadingTab("compare");
    setAllCandidates(false);
  };
  return (
    <aside
      ref={drawer}
      tabIndex={-1}
      className="reading-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Leituras dos eventos"
    >
      <div className="reading-heading">
        <div>
          <p className="reading-kicker">EXPLORAR COM TEMPO</p>
          <h2>Leituras dos eventos</h2>
        </div>
        <button
          aria-label="Fechar drawer de eventos"
          onClick={() => state.openDrawer(null)}
        >
          ×
        </button>
      </div>
      <nav className="reading-tabs" aria-label="Tipo de leitura">
        {[
          ["event", "Confronto"],
          ["campaign", "Campanha"],
          ["compare", "Comparar"],
          ["coverage", "Amostra"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={tab === id}
            className={tab === id ? "active" : ""}
            onClick={() => state.setReadingTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab !== "coverage" && selected && (
        <div className="reading-navigation">
          <label>
            Campanha / ano
            <select
              value={group?.id || ""}
              onChange={(e) => {
                const g = groups.find((g) => g.id === e.target.value);
                if (g) state.select(g.events[0].id);
              }}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} · {g.year} ({g.events.length})
                </option>
              ))}
            </select>
          </label>
          <label>
            Confronto em leitura
            <select
              value={selected.id}
              onChange={(e) => state.select(e.target.value)}
            >
              {group?.events.map((b, i) => (
                <option key={b.id} value={b.id}>
                  {i + 1}. {b.name} · {formatDate(b)}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className="reading-body">
        {selected &&
          tab !== "coverage" &&
          !visible.some((b) => b.id === selected.id) && (
            <p className="reading-note">
              Este confronto está fora dos filtros atuais do mapa.{" "}
              <button
                onClick={() =>
                  state.setFilter({ year: "all", theatre: "all", query: "" })
                }
              >
                Mostrar no mapa
              </button>
            </p>
          )}

        {suggestion && tab === "campaign" && group?.events.length < 2 && (
          <div className="reading-suggestion">
            <p>
              Para começar uma leitura comparativa, sugerimos dois confrontos de{" "}
              {suggestion.group.name} · {suggestion.group.year}, com efetivos e
              baixas conhecidos nos dois lados.
            </p>
            <button onClick={applySuggestion}>Abrir comparação sugerida</button>
          </div>
        )}

        {!selected && tab !== "coverage" && (
          <p className="reading-empty">
            O arquivo ainda não tem eventos disponíveis.
          </p>
        )}
        {tab === "event" && selected && <EventReading battle={selected} />}
        {tab === "campaign" && group && (
          <section className="campaign-reading">
            <p className="reading-kicker">O MESMO CONTEXTO, VÁRIOS MOMENTOS</p>
            <h3>
              {group.name} · {group.year}
            </h3>
            <p>
              {group.events.length} registos, de {formatDate(group.events[0])} a{" "}
              {formatDate(group.events.at(-1))}. Seleciona um confronto para o
              consultar ou fixa-o como segundo termo da comparação.
            </p>
            <ol className="campaign-sequence">
              {group.events.map((battle, i) => (
                <li
                  key={battle.id}
                  className={battle.id === selectedId ? "selected" : ""}
                >
                  <span className="sequence-number">{i + 1}</span>
                  <div>
                    <small>{formatDate(battle)}</small>
                    <h4>{battle.name}</h4>
                    <p>
                      {battle.attacker} / {battle.defender}
                    </p>
                    <div className="sequence-actions">
                      <button
                        onClick={() => {
                          state.select(battle.id);
                          state.setReadingTab("event");
                        }}
                      >
                        Ler confronto
                      </button>
                      <button
                        disabled={battle.id === selectedId}
                        onClick={() => {
                          state.setComparison(battle.id);
                          state.setReadingTab("compare");
                        }}
                      >
                        Comparar com A
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <p className="reading-note">
              Os pontos mantêm as coordenadas do CSV. A ordem temporal não
              representa uma rota de avanço das tropas.
            </p>
          </section>
        )}
        {tab === "compare" && selected && (
          <>
            <div className="comparison-settings">
              <label>
                Confronto B
                <select
                  value={second?.id || ""}
                  disabled={!candidates.length}
                  onChange={(e) => state.setComparison(e.target.value)}
                >
                  {!candidates.length && (
                    <option value="">Sem outro registo neste grupo</option>
                  )}
                  {candidates.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} · {formatDate(b)}
                      {allCandidates ? ` · ${b.campaign}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="checkbox-setting">
                <input
                  type="checkbox"
                  checked={allCandidates}
                  onChange={(e) => setAllCandidates(e.target.checked)}
                />{" "}
                Permitir comparação com toda a amostra
              </label>
            </div>
            <Comparison first={selected} second={second} />
          </>
        )}
        {tab === "coverage" && (
          <CoverageReading battles={battles} visible={visible} />
        )}
      </div>
      <footer className="reading-footer">
        <span>O voo fica pausado durante a leitura.</span>
        <div>
          {cluster && (
            <button onClick={() => state.openCluster(cluster.id)}>
              Abrir zona ({cluster.count})
            </button>
          )}
          {selected && (
            <button
              className="primary"
              onClick={() => state.navigate(selected.id)}
            >
              Voar até este local
            </button>
          )}
        </div>
      </footer>
    </aside>
  );
}
export default memo(ReadingDrawer);
