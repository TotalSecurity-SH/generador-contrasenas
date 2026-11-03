"use client";

import dynamic from "next/dynamic";

// Genera valores aleatorios, así que se renderiza solo en el navegador.
const Generador = dynamic(() => import("./Generador"), {
  ssr: false,
  loading: () => <div className="mx-auto -mt-16 h-72 w-full max-w-4xl px-4 sm:px-6"><div className="card h-full" /></div>,
});

export default function GeneradorClient() {
  return <Generador />;
}
