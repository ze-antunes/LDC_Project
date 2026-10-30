import { useExplorer } from "../stores/useExplorer";
import { mapPosition } from "../data/battles";
import { nearestWorldPosition } from "../data/worldStream";
import { compassHeading, normalizeBearing, relativeBearing, compassPoint, bearingTo } from "../data/navigation";

export default function Compass() {
  const { telemetry, destinationId, battles } = useExplorer();
  const heading = compassHeading(telemetry.heading);
  const destination = battles.find(b => b.id === destinationId);
  const target = destination && nearestWorldPosition(mapPosition(destination), telemetry);
  const bearing = target && bearingTo(telemetry, target);
  const relative = target ? relativeBearing(bearing, heading) : 0;
  const ticks = Array.from({ length: 19 }, (_, i) => Math.floor(heading / 10) * 10 + (i - 9) * 10);
  const digits = value => String(Math.round(value) % 360).padStart(3, "0");
  return (
    <section className="flight-compass" aria-label={`Bússola: rumo ${digits(heading)} graus, ${compassPoint(heading)}`}>
      <div className="compass-heading"><span>RUMO</span><strong>{digits(heading)}<small>°</small></strong><span>{compassPoint(heading)}</span></div>
      <svg viewBox="0 0 256 48" role="img" aria-label="Escala de orientação; o marcador central indica a direção do voo">
        <defs><clipPath id="compass-window"><rect x="4" y="0" width="248" height="48" /></clipPath></defs>
        <g clipPath="url(#compass-window)">
          <path d="M4 36H252" stroke="#555" />
          {ticks.map(tick => {
            const value = normalizeBearing(tick), x = 128 + (tick - heading) * 2;
            const cardinal = value % 90 === 0;
            return <g key={tick} transform={`translate(${x} 0)`}>
              <path d={`M0 ${cardinal ? 23 : 29}V36`} stroke={cardinal ? "#eee" : "#888"} />
              {value % 30 === 0 && <text y="18" textAnchor="middle" fill={cardinal ? "#fff" : "#aaa"}>{cardinal ? compassPoint(value) : digits(value)}</text>}
            </g>;
          })}
          {target && <path className="compass-target" d="M0 -4L4 0L0 4L-4 0Z" transform={`translate(${128 + Math.max(-60, Math.min(60, relative)) * 2} 42)`} />}
        </g>
        <path d="M123 1L128 7L133 1" fill="none" stroke="#f00511" strokeWidth="2" />
        <path d="M128 25V37" stroke="#f00511" strokeWidth="2" />
      </svg>
      <div className="compass-caption">{target ? <><span className="compass-target">◆</span> EVENTO · {digits(bearing)}° <span>{Math.abs(relative) < 5 ? "EM FRENTE" : relative > 0 ? "DIREITA →" : "← ESQUERDA"}</span></> : <span>O rumo acompanha o nariz do avião</span>}</div>
    </section>
  );
}
