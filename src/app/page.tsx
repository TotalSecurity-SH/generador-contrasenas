import { ToolHero } from "@/components/ToolHero";
import Generador from "@/components/GeneradorClient";

export default function Page() {
  return (
    <>
      <ToolHero
        slug="contrasenas"
        title={
          <>
            Contraseñas <span className="text-teal">seguras</span> en un clic
          </>
        }
        subtitle="Genera contraseñas y frases de acceso con criptografía del navegador, y revisa qué tan fuerte es la tuya."
        chips={["Criptográficamente seguro", "Frases en español", "Medidor de entropía", "Sin enviar datos"]}
      />
      <Generador />
    </>
  );
}
