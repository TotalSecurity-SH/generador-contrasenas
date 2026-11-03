"use client";

import { useCallback, useMemo, useState } from "react";
import {
  auditar,
  entropiaContrasena,
  entropiaFrase,
  generarContrasena,
  generarFrase,
  type Conjunto,
  type OpcionesContrasena,
  type OpcionesFrase,
} from "@/lib/passwords";

const NOMBRES: Record<Conjunto, string> = {
  minusculas: "Minúsculas (a-z)",
  mayusculas: "Mayúsculas (A-Z)",
  numeros: "Números (0-9)",
  simbolos: "Símbolos (!@#$)",
};

const COLORES = ["bg-bad", "bg-bad", "bg-warn", "bg-ok", "bg-ok"];
const TEXTO = ["text-bad", "text-bad", "text-warn", "text-ok", "text-ok"];

function Medidor({ nivel, etiqueta, detalle }: { nivel: number; etiqueta: string; detalle: string }) {
  return (
    <div>
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < nivel ? COLORES[nivel] : "bg-[var(--line)]"}`} />
        ))}
      </div>
      <p className="mt-2 text-sm">
        <b className={TEXTO[nivel]}>{etiqueta}</b> <span className="muted">· {detalle}</span>
      </p>
    </div>
  );
}

function BotonCopiar({ valor }: { valor: string }) {
  const [estado, setEstado] = useState<"" | "ok" | "error">("");
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor);
      setEstado("ok");
    } catch {
      setEstado("error");
    }
    setTimeout(() => setEstado(""), 1600);
  };
  return (
    <button
      onClick={copiar}
      className="shrink-0 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 dark:bg-teal dark:text-navy-950"
    >
      {estado === "ok" ? "Copiada" : estado === "error" ? "Selecciónala" : "Copiar"}
    </button>
  );
}

function Resultado({ valor, onNueva }: { valor: string; onNueva: () => void }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <output className="min-w-0 flex-1 select-all break-all rounded-lg border border-[var(--line)] bg-black/[.03] px-4 py-3 font-mono text-lg dark:bg-white/[.03]">
        {valor || "—"}
      </output>
      <div className="flex gap-2">
        <button onClick={onNueva} className="shrink-0 rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm font-semibold hover:border-teal">
          Generar otra
        </button>
        <BotonCopiar valor={valor} />
      </div>
    </div>
  );
}

function nivelPorEntropia(bits: number) {
  return bits < 28 ? 0 : bits < 36 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
}
const ETIQUETAS = ["Muy débil", "Débil", "Aceptable", "Fuerte", "Muy fuerte"];

export default function Generador() {
  const [tab, setTab] = useState<"contrasena" | "frase" | "auditar">("contrasena");
  const [oc, setOc] = useState<OpcionesContrasena>({ longitud: 20, conjuntos: ["minusculas", "mayusculas", "numeros", "simbolos"], sinAmbiguos: true });
  const [of, setOf] = useState<OpcionesFrase>({ palabras: 6, separador: "-", mayuscula: true, numero: true });
  const [semilla, setSemilla] = useState(0);
  const [propia, setPropia] = useState("");

  // semilla fuerza una nueva generación sin cambiar opciones
  const contrasena = useMemo(() => (semilla >= 0 ? generarContrasena(oc) : ""), [oc, semilla]);
  const frase = useMemo(() => (semilla >= 0 ? generarFrase(of) : ""), [of, semilla]);
  const auditoria = useMemo(() => auditar(propia), [propia]);
  const nueva = useCallback(() => setSemilla((s) => s + 1), []);

  const bitsC = entropiaContrasena(oc);
  const bitsF = entropiaFrase(of);
  const tabs = [
    ["contrasena", "Contraseña"],
    ["frase", "Frase de acceso"],
    ["auditar", "Revisar la mía"],
  ] as const;

  return (
    <main className="mx-auto -mt-16 w-full max-w-4xl flex-1 px-4 pb-16 sm:px-6">
      <section className="card fade-up p-2 shadow-xl shadow-black/5" style={{ animationDelay: ".25s" }}>
        <div className="flex flex-wrap gap-1 p-1" role="tablist">
          {tabs.map(([k, l]) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === k ? "bg-navy-900 text-white dark:bg-teal/20 dark:text-teal" : "muted hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="space-y-6 p-3 sm:p-4">
          {tab === "contrasena" && (
            <>
              <Resultado valor={contrasena} onNueva={nueva} />
              <Medidor nivel={nivelPorEntropia(bitsC)} etiqueta={ETIQUETAS[nivelPorEntropia(bitsC)]} detalle={`${Math.round(bitsC)} bits de entropía`} />
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="flex justify-between text-sm font-medium">
                    Longitud <b className="font-mono">{oc.longitud}</b>
                  </span>
                  <input
                    id="longitud"
                    type="range"
                    min={8}
                    max={64}
                    value={oc.longitud}
                    onChange={(e) => setOc({ ...oc, longitud: Number(e.target.value) })}
                    className="w-full accent-[#2f7f94]"
                  />
                </label>
                <fieldset className="grid grid-cols-2 gap-2 text-sm">
                  <legend className="sr-only">Caracteres</legend>
                  {(Object.keys(NOMBRES) as Conjunto[]).map((c) => (
                    <label key={c} className="flex items-center gap-2">
                      <input
                        id={`c-${c}`}
                        type="checkbox"
                        checked={oc.conjuntos.includes(c)}
                        disabled={oc.conjuntos.length === 1 && oc.conjuntos.includes(c)}
                        onChange={(e) =>
                          setOc({ ...oc, conjuntos: e.target.checked ? [...oc.conjuntos, c] : oc.conjuntos.filter((x) => x !== c) })
                        }
                        className="accent-[#2f7f94]"
                      />
                      {NOMBRES[c]}
                    </label>
                  ))}
                  <label className="col-span-2 flex items-center gap-2">
                    <input
                      id="sin-ambiguos"
                      type="checkbox"
                      checked={oc.sinAmbiguos}
                      onChange={(e) => setOc({ ...oc, sinAmbiguos: e.target.checked })}
                      className="accent-[#2f7f94]"
                    />
                    Evitar caracteres confusos (I, l, 1, O, 0)
                  </label>
                </fieldset>
              </div>
            </>
          )}

          {tab === "frase" && (
            <>
              <Resultado valor={frase} onNueva={nueva} />
              <Medidor nivel={nivelPorEntropia(bitsF)} etiqueta={ETIQUETAS[nivelPorEntropia(bitsF)]} detalle={`${Math.round(bitsF)} bits · fácil de recordar y de escribir`} />
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="flex justify-between text-sm font-medium">
                    Palabras <b className="font-mono">{of.palabras}</b>
                  </span>
                  <input
                    id="palabras"
                    type="range"
                    min={3}
                    max={10}
                    value={of.palabras}
                    onChange={(e) => setOf({ ...of, palabras: Number(e.target.value) })}
                    className="w-full accent-[#2f7f94]"
                  />
                </label>
                <div className="grid gap-2 text-sm">
                  <label className="flex items-center gap-2">
                    Separador
                    <select
                      id="separador"
                      value={of.separador}
                      onChange={(e) => setOf({ ...of, separador: e.target.value })}
                      className="rounded-md border border-[var(--line)] bg-transparent px-2 py-1"
                    >
                      <option value="-">guion (-)</option>
                      <option value=".">punto (.)</option>
                      <option value="_">guion bajo (_)</option>
                      <option value=" ">espacio</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    <input id="mayuscula" type="checkbox" checked={of.mayuscula} onChange={(e) => setOf({ ...of, mayuscula: e.target.checked })} className="accent-[#2f7f94]" />
                    Primera letra en mayúscula
                  </label>
                  <label className="flex items-center gap-2">
                    <input id="numero" type="checkbox" checked={of.numero} onChange={(e) => setOf({ ...of, numero: e.target.checked })} className="accent-[#2f7f94]" />
                    Agregar un número al final
                  </label>
                </div>
              </div>
            </>
          )}

          {tab === "auditar" && (
            <>
              <label htmlFor="propia" className="block text-sm font-medium">
                Escribe una contraseña para revisar su fuerza
              </label>
              <input
                id="propia"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={propia}
                onChange={(e) => setPropia(e.target.value)}
                placeholder="Tu contraseña"
                className="w-full rounded-lg border border-[var(--line)] bg-transparent px-4 py-3 font-mono text-lg outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/25"
              />
              {propia && (
                <>
                  <Medidor nivel={auditoria.nivel} etiqueta={auditoria.etiqueta} detalle={`${auditoria.entropia} bits · se descifra en ${auditoria.tiempo}`} />
                  {auditoria.avisos.length > 0 ? (
                    <ul className="space-y-1.5 text-sm">
                      {auditoria.avisos.map((a) => (
                        <li key={a} className="flex gap-2">
                          <span className="text-warn" aria-hidden>▲</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-ok">✓ No encontramos patrones débiles.</p>
                  )}
                </>
              )}
              <p className="muted text-xs">
                El tiempo estima un ataque sin conexión de 10 mil millones de intentos por segundo. Lo que escribes no sale de tu navegador.
              </p>
            </>
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Aleatoriedad real", "Usa el generador criptográfico del navegador (crypto.getRandomValues), sin sesgos."],
          ["Nada sale de tu equipo", "Todo se calcula en tu navegador. No hay servidor que vea tus contraseñas."],
          ["Frases en español", "Palabras comunes, fáciles de recordar y con entropía medida en bits."],
        ].map(([t, d]) => (
          <div key={t} className="card p-5">
            <h3 className="font-semibold">{t}</h3>
            <p className="muted mt-1 text-sm leading-relaxed">{d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
