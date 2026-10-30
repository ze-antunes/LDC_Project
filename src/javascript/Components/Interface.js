import { useEffect, useMemo } from "react";
import { geoNaturalEarth1, geoPath } from "d3";
import { useExplorer } from "../stores/useExplorer";
import { filterBattles, formatDate, mapPosition } from "../data/battles";
import { clusterBattles } from "../data/clusters";
import { PROJECTION_SCALE } from "../data/geography";
import { AIRCRAFT } from "../data/aircraft";
import { world } from "../data/world";
import Timeline from "./Timeline";
import Compass from "./Compass";
import useDrawerModal from "../hooks/useDrawerModal";
import ReadingDrawer from "./ReadingDrawer";
import { countryIndex } from "../data/countries";
const projection = geoNaturalEarth1().fitExtent(
  [
    [4, 4],
    [216, 108],
  ],
  world,
);
const worldPath = geoPath(projection)(world);
function Locator({ clusters, telemetry, nearbyId, selected, compared }) {
  const offset = projection.translate(),
    scale = projection.scale();
  const x = (telemetry.x / PROJECTION_SCALE[0]) * scale + offset[0];
  const z = (telemetry.z / PROJECTION_SCALE[1]) * scale + offset[1];
  return (
    <svg
      className="locator-map"
      viewBox="0 0 220 112"
      aria-label="Minimapa com posição do avião"
      role="img"
    >
      <path d={worldPath} fill="#555" stroke="#222" strokeWidth="0.3" />
      {clusters.map((c) => (
        <circle
          key={c.id}
          cx={(c.x / PROJECTION_SCALE[0]) * scale + offset[0]}
          cy={(c.z / PROJECTION_SCALE[1]) * scale + offset[1]}
          r={1 + Math.sqrt(c.count) * 0.45}
          fill={c.id === nearbyId ? "#fff" : "#f00511"}
        />
      ))}
      {[
        selected && { battle: selected, label: "A", color: "#f00511" },
        compared && { battle: compared, label: "B", color: "#eeeeee" },
      ]
        .filter(Boolean)
        .map(({ battle, label, color }) => {
          const [px, , pz] = mapPosition(battle),
            mx = (px / PROJECTION_SCALE[0]) * scale + offset[0],
            my = (pz / PROJECTION_SCALE[1]) * scale + offset[1];
          return (
            <g key={label}>
              <circle
                cx={mx}
                cy={my}
                r={3.2}
                fill={color}
                stroke="#fff"
                strokeWidth="0.6"
              />
              <title>
                {label} · {battle.name} · {formatDate(battle)}
              </title>
              {compared && (
                <text
                  x={mx + 4}
                  y={my - 3}
                  fill={color}
                  fontSize="5"
                  stroke="#000"
                  strokeWidth="0.1"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      <path
        d="M0 -5L3 4L0 2L-3 4Z"
        transform={`translate(${x},${z}) rotate(${(-telemetry.heading * 180) / Math.PI})`}
        fill="white"
        stroke="black"
        strokeWidth="0.5"
      />
    </svg>
  );
}
export default function Interface() {
  const state = useExplorer();
  const {
    battles,
    year,
    theatre,
    query,
    selectedId,
    nearbyId,
    telemetry,
    aircraft,
    drawer,
    cameraMode,
    paused,
    destinationId,
    playing,
  } = state;
  useDrawerModal(drawer, state.openDrawer);
  const visible = useMemo(
    () => filterBattles(battles, { year, theatre, query }),
    [battles, year, theatre, query],
  );
  const clusters = useMemo(() => clusterBattles(visible), [visible]);
  const nearby = clusters.find((c) => c.id === nearbyId);
  const expanded = clusters.find((c) => c.id === state.expandedClusterId);
  const selectedCluster = clusters.find((c) =>
    c.events.some((b) => b.id === selectedId),
  );
  const context =
    drawer === "event"
      ? selectedCluster
      : expanded || nearby || selectedCluster;
  const readingRecord = battles.find((b) => b.id === selectedId);
  const comparisonRecord =
    drawer === "event" && state.readingTab === "compare"
      ? battles.find((b) => b.id === state.comparisonId)
      : null;
  const localEvent =
    nearby?.events.find((b) => b.id === selectedId) || nearby?.events[0];
  const countries = useMemo(
    () => countryIndex(visible, world.features),
    [visible],
  );
  const country = countries.countries.find(
    (c) => c.id === state.selectedCountryId,
  );
  const hoveredCountry = countries.countries.find(
    (c) => c.id === state.hoveredCountryId,
  );
  const route = battles.find((b) => b.id === destinationId);
  const model = AIRCRAFT.find((a) => a.id === aircraft);
  useEffect(() => {
    state.load();
  }, [state.load]);
  useEffect(() => {
    const release = () => useExplorer.getState().release();
    const key = (event) => {
      const current = useExplorer.getState();
      if (event.code === "Escape" && current.drawer) {
        event.preventDefault();
        current.openDrawer(null);
        return;
      }
      if (
        document.activeElement?.matches("input,select,textarea,button") ||
        event.repeat ||
        current.drawer
      )
        return;
      if (event.code === "Space") {
        event.preventDefault();
        current.togglePause();
      }
      if (event.code === "KeyR") current.resetFlight();
      if (event.code === "KeyM")
        current.setCamera(
          current.cameraMode === "flight" ? "overview" : "flight",
        );
    };
    window.addEventListener("keydown", key);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("blur", release);
      release();
    };
  }, []);
  return (
    <div
      className={`flight-interface ${drawer ? "has-drawer" : ""}`}
    >
      <header className="project-header">
        <div className="project-brand">
          <p>MDM · UNIVERSIDADE DE COIMBRA</p>
          <h1>
            Understanding
            <br />
            the magnitude of WWII
          </h1>
          <small>José Antunes · Laboratório de Design Computacional</small>
        </div>
        <div className="header-context" aria-label="Contexto da exploração">
          <p className="header-nearby">
            {nearby
              ? `EM ALCANCE / ${nearby.count} ${nearby.count === 1 ? "EVENTO" : "EVENTOS"}`
              : "EXPLORAÇÃO LIVRE"}
          </p>
          <strong>
            {localEvent?.name || "Descobre os eventos ao sobrevoar o mapa"}
          </strong>
          <span>
            {localEvent
              ? `${formatDate(localEvent)} · ${localEvent.campaign}`
              : "Aproxima-te das explosões ou escolhe uma leitura no arquivo."}
          </span>
          <div className="header-context-actions">
            {nearby && (
              <button onClick={() => state.openCluster(nearby.id)}>
                Abrir cluster
              </button>
            )}
            {localEvent && (
              <button
                onClick={() => {
                  state.select(localEvent.id);
                  state.openReadings("event");
                }}
              >
                Ler evento
              </button>
            )}
          </div>
        </div>
        <div className="header-functions">
          <nav aria-label="Funcionalidades do projeto">
            <button
              className={drawer === "archive" ? "active" : ""}
              onClick={() => state.openDrawer("archive")}
            >
              Arquivo
            </button>
            <button
              className={drawer === "event" ? "active" : ""}
              onClick={() => state.openReadings("campaign")}
            >
              Leituras
            </button>
            <button
              className={drawer === "aircraft" ? "active" : ""}
              onClick={() => state.openDrawer("aircraft")}
            >
              Avião
            </button>
            <button
              className={drawer === "help" ? "active" : ""}
              onClick={() => state.openDrawer("help")}
            >
              Sobre / ajuda
            </button>
          </nav>
          <div className="flight-modes" role="group" aria-label="Modo de voo">
            <button
              aria-pressed={state.navigationMode === "free"}
              onClick={() => state.setNavigationMode("free")}
            >
              Voo livre
            </button>
            <button
              aria-pressed={state.navigationMode === "events"}
              disabled={!visible.length}
              onClick={() => state.setNavigationMode("events")}
            >
              Seguir eventos
            </button>
          </div>
          <div className="header-instruments">
            <span>
              {String(
                Math.round(
                  ((((-telemetry.heading * 180) / Math.PI) % 360) + 360) % 360,
                ),
              ).padStart(3, "0")}
              °
            </span>
            <span>ALT {telemetry.y.toFixed(1)}</span>
            <span>VEL {telemetry.speed.toFixed(1)}</span>
            <button
              className="resume-flight"
              onClick={() => {
                if (drawer) state.openDrawer(null);
                state.togglePause();
              }}
            >
              {state.playing && state.atEvent
                ? "Próximo evento"
                : paused
                  ? "▶ Retomar voo"
                  : "Ⅱ Pausar"}
            </button>
          </div>
          {route && (
            <div className="header-route">
              {playing ? "VISITA CRONOLÓGICA" : "ROTA"} · {route.name}
              <button aria-label="Cancelar rota" onClick={state.cancelRoute}>
                ×
              </button>
            </div>
          )}
        </div>
        <div className="event-progress" role="progressbar" aria-label="Tempo de leitura do evento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.playing && state.atEvent ? state.eventProgress * 100 : 0)}>
          <div style={{ transform: `scaleX(${state.playing && state.atEvent ? state.eventProgress : 0})` }} />
        </div>
      </header>
      <Compass />
      {state.status === "loading" && (
        <div className="loading-message" role="status">
          A carregar o mapa e os eventos…
        </div>
      )}
      {state.status === "error" && (
        <div className="loading-message" role="alert">
          {state.error}
          <button onClick={state.load}>Tentar novamente</button>
        </div>
      )}
      {state.modelStatus !== "ready" && (
        <p className="model-status" role="status">
          {state.modelStatus === "error"
            ? "Modelo indisponível. Escolhe outro avião."
            : "A carregar avião…"}
        </p>
      )}
      {hoveredCountry && !drawer && (
        <div className="country-hover">
          {hoveredCountry.name} · {hoveredCountry.events.length} registos{" "}
          <small>clica para explorar</small>
        </div>
      )}
      {drawer && (
        <button
          className="drawer-backdrop"
          aria-label="Fechar drawer"
          tabIndex={-1}
          onClick={() => state.openDrawer(null)}
        />
      )}
      {drawer && drawer !== "event" && (
        <aside
          className="drawer"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          aria-label={
            drawer === "aircraft"
              ? "Escolher avião"
              : drawer === "event"
                ? "Detalhes do evento"
                : drawer === "cluster"
                  ? "Explorar cluster"
                  : drawer === "country"
                    ? "Informação do país"
                    : drawer === "help"
                      ? "Informações e ajuda"
                      : "Arquivo de eventos"
          }
        >
          <div className="drawer-heading">
            <h2>
              {drawer === "aircraft"
                ? "O teu avião"
                : drawer === "event"
                  ? "O evento"
                  : drawer === "cluster"
                    ? "O cluster"
                    : drawer === "country"
                      ? country?.name
                      : drawer === "help"
                        ? "Sobre o projeto"
                        : "O arquivo"}
            </h2>
            <button
              aria-label="Fechar painel"
              onClick={() => state.openDrawer(null)}
            >
              ×
            </button>
          </div>
          {drawer === "aircraft" && (
            <>
              <label>
                Modelo
                <select
                  id="aircraft"
                  value={aircraft}
                  onChange={(e) => state.setAircraft(e.target.value)}
                >
                  {AIRCRAFT.map((a) => (
                    <option value={a.id} key={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="model-credit">
                <a
                  href={`https://sketchfab.com/3d-models/${model.source}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {model.author}
                </a>{" "}
                ·{" "}
                <a
                  href={
                    model.license.includes("NC")
                      ? "https://creativecommons.org/licenses/by-nc/4.0/"
                      : "https://creativecommons.org/licenses/by/4.0/"
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  {model.license}
                </a>
              </p>
              {model.note && <p>{model.note}</p>}
              <label>
                Distância de desenho
                <select
                  value={state.viewDistance}
                  onChange={(event) =>
                    state.setViewDistance(event.target.value)
                  }
                >
                  <option value={48}>Curta · 48 unidades</option>
                  <option value={84}>Média · 84 unidades</option>
                  <option value={120}>Longa · 120 unidades</option>
                </select>
              </label>
              <p>
                No voo livre, a direção depende dos teus comandos. Em “Seguir
                eventos”, o avião visita os registos por ordem e faz pausas para
                leitura.
              </p>
              <h3>Controlos de voo</h3>
              <dl className="control-guide">
                <div>
                  <dt>A / D ou ← / →</dt>
                  <dd>Inclinar e virar</dd>
                </div>
                <div>
                  <dt>W / ↑ · S / ↓</dt>
                  <dd>Baixar · levantar o nariz</dd>
                </div>
                <div>
                  <dt>Q / E</dt>
                  <dd>Leme de direção</dd>
                </div>
                <div>
                  <dt>Shift / Ctrl</dt>
                  <dd>Acelerar / desacelerar</dd>
                </div>
                <div>
                  <dt>Espaço</dt>
                  <dd>Pausar exploração</dd>
                </div>
                <div>
                  <dt>R</dt>
                  <dd>Regressar ao evento</dd>
                </div>
              </dl>
              <button
                onClick={() => {
                  state.resetFlight();
                  state.openDrawer(null);
                }}
              >
                Regressar ao evento
              </button>
              <p>
                O voo avança sempre na direção do nariz. As curvas inclinam o
                avião; a câmara acompanha a sua orientação.
              </p>
            </>
          )}
          {drawer === "archive" && (
            <>
              <label>
                Teatro
                <select
                  value={theatre}
                  onChange={(e) => state.setFilter({ theatre: e.target.value })}
                >
                  <option value="all">Todos</option>
                  <option value="europe">Europa</option>
                  <option value="africa">Norte de África</option>
                  <option value="pacific">Ásia e Pacífico</option>
                </select>
              </label>
              <label>
                Procurar
                <input
                  type="search"
                  placeholder="Batalha, campanha ou força…"
                  value={query}
                  onChange={(e) => state.setFilter({ query: e.target.value })}
                />
              </label>
              <p>
                {visible.length} registos · {clusters.length} clusters. A
                dimensão de cada explosão cresce com o número de eventos
                agrupados.
              </p>
              {!visible.length && (
                <>
                  <p>Sem eventos neste recorte.</p>
                  <button
                    onClick={() =>
                      state.setFilter({
                        year: "all",
                        theatre: "all",
                        query: "",
                      })
                    }
                  >
                    Limpar filtros
                  </button>
                </>
              )}
              <label>
                Tempo de leitura em cada paragem
                <select
                  value={state.readingSeconds}
                  onChange={(e) =>
                    state.setReadingSeconds(Number(e.target.value))
                  }
                >
                  <option value={18}>18 segundos · calmo</option>
                  <option value={30}>30 segundos · demorado</option>
                  <option value={45}>45 segundos · contemplativo</option>
                </select>
              </label>
              <button disabled={!visible.length} onClick={state.togglePlay}>
                {playing ? "Parar rota cronológica" : "Voar pela cronologia"}
              </button>
              <div className="archive-list">
                {visible.map((b) => (
                  <button key={b.id} onClick={() => state.navigate(b.id)}>
                    <strong>{b.name}</strong>
                    <span>
                      {formatDate(b)} · {b.campaign}
                    </span>
                    <small>Traçar rota →</small>
                  </button>
                ))}
              </div>
              <details>
                <summary>Sobre os dados</summary>
                <p>
                  178 registos do CSV do projeto, de 1940 a 1945. Uma amostra
                  parcial, não uma história completa da guerra. Datas
                  aproximadas a partir de anos decimais. Os limites do mapa não
                  representam ocupações territoriais.
                </p>
                <p>
                  Clusters agrupam locais próximos e respeitam os filtros. O
                  tamanho representa quantidade de registos, não baixas nem tipo
                  de arma. A forma das explosões é uma metáfora visual; não
                  identifica ataques nucleares.
                </p>
              </details>
            </>
          )}
          {drawer === "country" && country && (
            <>
              <p className="country-boundary-note">
                Localização pelos limites cartográficos atuais. Não representa
                os beligerantes nem a ocupação durante a guerra.
              </p>
              <div className="country-summary">
                <strong>{country.events.length}</strong>
                <span>registos localizados</span>
                <strong>{country.campaigns}</strong>
                <span>designações de campanha</span>
              </div>
              {country.events.length ? (
                <>
                  <p>
                    De {formatDate(country.events[0])} a{" "}
                    {formatDate(country.events.at(-1))}, nesta amostra.
                  </p>
                  <div className="archive-list">
                    {country.events.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          state.select(b.id);
                          state.openDrawer("event");
                        }}
                      >
                        <strong>{b.name}</strong>
                        <span>
                          {formatDate(b)} · {b.campaign}
                        </span>
                        <small>Consultar registo →</small>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p>
                  Não há registos localizados dentro deste limite nesta amostra.
                  Isto não significa que o país não tenha sido afetado pela
                  guerra.
                </p>
              )}
              <p className="data-note">
                O mapa de apoio é simplificado; pequenas ilhas e pontos junto à
                costa podem ficar sem atribuição. Não inferimos um país por
                proximidade.
              </p>
            </>
          )}
          {drawer === "cluster" && expanded && (
            <>
              <p className="nearby-label">
                {expanded.count} REGISTOS NESTA ZONA
              </p>
              <h3>{expanded.name}</h3>
              <p>
                De {formatDate(expanded.events[0])} a{" "}
                {formatDate(expanded.events.at(-1))}.{" "}
                {new Set(expanded.events.map((b) => b.campaign)).size}{" "}
                designações de campanha.
              </p>
              <p>
                Os pontos abertos são afastados para facilitar a seleção; as
                linhas ligam-nos às coordenadas reais.
              </p>
              <button onClick={state.closeCluster}>Recolher cluster</button>
              <div className="archive-list">
                {expanded.events.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      state.select(b.id);
                      state.openDrawer("event");
                    }}
                  >
                    <strong>{b.name}</strong>
                    <span>
                      {formatDate(b)} · {b.campaign}
                    </span>
                    <small>Forças e baixas →</small>
                  </button>
                ))}
              </div>
            </>
          )}
          {drawer === "help" && (
            <>
              <h3>Explorar a magnitude de um conflito</h3>
              <p>
                Projeto de José Antunes para Laboratório de Design
                Computacional, Mestrado em Design e Multimédia, Universidade de
                Coimbra.
              </p>
              <p>
                O avião é o ponto de partida. As explosões agrupam eventos
                próximos; o tamanho representa quantidade de registos. Os pontos
                vermelhos mantêm as coordenadas do CSV.
              </p>
              <h3>Funcionalidades</h3>
              <ul className="help-list">
                <li>
                  Clica no minimapa, junto da timeline, para alternar entre a
                  vista do avião e a vista geral.
                </li>
                <li>
                  Usa o header para abrir clusters, consultar eventos, escolher
                  o avião e pausar.
                </li>
                <li>
                  No drawer de leituras, percorre campanhas, compara dois
                  confrontos e consulta a cobertura da amostra.
                </li>
                <li>
                  Clica num país para consultar os registos localizados dentro
                  dos limites atuais.
                </li>
              </ul>
              <h3>Controlos</h3>
              <dl className="control-guide">
                <div>
                  <dt>A/D ou ←/→</dt>
                  <dd>Inclinar e virar</dd>
                </div>
                <div>
                  <dt>W/S ou ↑/↓</dt>
                  <dd>Baixar / levantar o nariz</dd>
                </div>
                <div>
                  <dt>Q/E</dt>
                  <dd>Leme de direção</dd>
                </div>
                <div>
                  <dt>Shift/Ctrl</dt>
                  <dd>Acelerar / desacelerar</dd>
                </div>
                <div>
                  <dt>Espaço</dt>
                  <dd>Pausar</dd>
                </div>
                <div>
                  <dt>M</dt>
                  <dd>Alternar vista</dd>
                </div>
                <div>
                  <dt>R</dt>
                  <dd>Regressar ao evento</dd>
                </div>
              </dl>
              <p className="data-note">
                Fonte: CSV original do projeto, 178 registos de 1940 a 1945.
                Datas aproximadas; baixas não equivalem a mortes. A amostra e os
                limites atuais do mapa não representam toda a guerra nem
                ocupações históricas.
              </p>
            </>
          )}
        </aside>
      )}
      {drawer === "event" && (
        <ReadingDrawer battles={battles} visible={visible} cluster={context} />
      )}
      <div className="current-year" aria-live="polite">
        <span>ANO EM LEITURA</span>
        <svg
          viewBox="0 0 240 88"
          role="img"
          aria-label={`Ano ${readingRecord?.year ?? "não selecionado"}`}
        >
          <text x="0" y="78" textLength="240" lengthAdjust="spacingAndGlyphs">
            {readingRecord?.year ?? "—"}
          </text>
        </svg>
      </div>
      <div className="exploration-dock">
        <button
          className="locator-toggle"
          aria-label={
            cameraMode === "flight"
              ? "Mostrar vista do mapa"
              : "Regressar à vista do avião"
          }
          aria-pressed={cameraMode === "overview"}
          onClick={() =>
            state.setCamera(cameraMode === "flight" ? "overview" : "flight")
          }
        >
          <span className="locator-caption">
            MAPA DE NAVEGAÇÃO{" "}
            <b>{cameraMode === "flight" ? "ABRIR MAPA" : "VOLTAR AO AVIÃO"}</b>
          </span>
          <Locator
            clusters={clusters}
            telemetry={telemetry}
            nearbyId={nearbyId}
            selected={readingRecord}
            compared={comparisonRecord}
          />
          <span className="locator-hint">Clica para alternar a vista · M</span>
        </button>
        <Timeline battles={battles} visible={visible} clusters={clusters} />
      </div>
    </div>
  );
}
