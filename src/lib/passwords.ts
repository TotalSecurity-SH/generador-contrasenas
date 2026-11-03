// Generación con crypto.getRandomValues (CSPRNG) y auditoría de fuerza por entropía y patrones.

export const CONJUNTOS = {
  minusculas: "abcdefghijklmnopqrstuvwxyz",
  mayusculas: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numeros: "0123456789",
  simbolos: "!@#$%^&*()-_=+[]{};:,.?/",
} as const;

export type Conjunto = keyof typeof CONJUNTOS;
const AMBIGUOS = /[Il1O0o]/g;

/** Entero uniforme en [0, max) sin sesgo de módulo (muestreo por rechazo). */
export function aleatorio(max: number): number {
  const limite = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limite);
  return buf[0] % max;
}

export interface OpcionesContrasena {
  longitud: number;
  conjuntos: Conjunto[];
  sinAmbiguos: boolean;
}

export function generarContrasena({ longitud, conjuntos, sinAmbiguos }: OpcionesContrasena): string {
  const grupos = conjuntos.map((c) => (sinAmbiguos ? CONJUNTOS[c].replace(AMBIGUOS, "") : CONJUNTOS[c]));
  if (!grupos.length) return "";
  const todos = grupos.join("");
  // Garantiza al menos un carácter de cada conjunto elegido y mezcla con Fisher-Yates.
  const chars = grupos.map((g) => g[aleatorio(g.length)]);
  while (chars.length < longitud) chars.push(todos[aleatorio(todos.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = aleatorio(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, longitud).join("");
}

export function entropiaContrasena({ longitud, conjuntos, sinAmbiguos }: OpcionesContrasena): number {
  const n = conjuntos.reduce((s, c) => s + (sinAmbiguos ? CONJUNTOS[c].replace(AMBIGUOS, "") : CONJUNTOS[c]).length, 0);
  return n ? longitud * Math.log2(n) : 0;
}

/* ------------------------------ Frases ------------------------------ */

export const PALABRAS = `abeja abrazo aceite agua aguila ahorro aire ajedrez alba alegria almohada altura amigo ancla angel anillo antena arbol arena arroz astro atun avena avion azucar bahia baile balcon ballena banco bandera barco barro bastion bateria bigote bosque bota brisa brujula burbuja caballo cabana cacao cactus cafe caja calma camino campana canoa canto capitan carbon carta casco castillo cebolla cedro cereza cielo cima cine circo ciudad clavel cobre cohete colina cometa concha conejo copa coral corona cosecha cuaderno cuerda cumbre delfin desierto diamante domingo dragon duna eco eclipse elefante enigma escalera espejo estrella faro fiesta flecha flor fogata fresa fruta fuego galaxia galleta gato gema girasol globo golondrina granito grillo guitarra halcon helado hielo hierro hoja horizonte huella iglu imán isla jaguar jardin jarra jirafa joya juglar lago lampara lapiz laurel leon libro limon linterna llama lluvia lobo luna madera maiz manzana mapa mar marea mariposa martillo medalla melodia mesa miel mina mirador molino montana mostaza motor muelle musgo naranja nave neblina nido nieve noche nogal nube oasis ocaso oceano olivo onda oro oruga oso otono pajaro palma panal papel paraguas pasto pausa perla piano pino pirata planeta playa pluma polen puente puerto pulpo queso quetzal radar raiz rama rayo reloj rio roble roca rosa rubi sal salmon selva semilla sendero sierra silencio sol sombra sonido suelo tambor tejado telar templo tigre tinta tormenta tortuga trigo trueno tulipan tunel uva valle vela velero ventana verano viento violin volcan yate zafiro zorro`
  .replace("imán", "iman")
  .split(" ");

export interface OpcionesFrase {
  palabras: number;
  separador: string;
  mayuscula: boolean;
  numero: boolean;
}

export function generarFrase({ palabras, separador, mayuscula, numero }: OpcionesFrase): string {
  const lista = Array.from({ length: palabras }, () => {
    const p = PALABRAS[aleatorio(PALABRAS.length)];
    return mayuscula ? p[0].toUpperCase() + p.slice(1) : p;
  });
  if (numero) lista.push(String(aleatorio(100)).padStart(2, "0"));
  return lista.join(separador);
}

export function entropiaFrase({ palabras, numero }: OpcionesFrase): number {
  return palabras * Math.log2(PALABRAS.length) + (numero ? Math.log2(100) : 0);
}

/* ------------------------------ Auditoría ------------------------------ */

const COMUNES = new Set(
  `123456 123456789 12345678 password 12345 qwerty 1234567 111111 123123 abc123 1234567890 000000 password1 iloveyou
  admin welcome monkey dragon letmein football sunshine princess 654321 superman qwerty123 1q2w3e4r baseball master
  contraseña contrasena hola123 mexico teamo teamo123 amor amorcito 12345678910 qwertyuiop asdfgh zxcvbn passw0rd
  admin123 root toor changeme secreto tequila america chivas`.split(/\s+/),
);

const SECUENCIAS = ["abcdefghijklmnopqrstuvwxyz", "qwertyuiopasdfghjklzxcvbnm", "01234567890"];

export interface Auditoria {
  entropia: number;
  nivel: 0 | 1 | 2 | 3 | 4;
  etiqueta: string;
  tiempo: string;
  avisos: string[];
}

const NIVELES = ["Muy débil", "Débil", "Aceptable", "Fuerte", "Muy fuerte"];

function duracion(segundos: number): string {
  if (segundos < 1) return "al instante";
  const u: [number, string, string][] = [
    [60, "segundo", "segundos"], [60, "minuto", "minutos"], [24, "hora", "horas"],
    [30, "día", "días"], [12, "mes", "meses"], [100, "año", "años"],
  ];
  let v = segundos;
  for (const [div, s, p] of u) {
    if (v < div) return `${Math.round(v)} ${Math.round(v) === 1 ? s : p}`;
    v /= div;
  }
  return v < 1000 ? `${Math.round(v)} siglos` : "más de mil siglos";
}

export function auditar(pw: string): Auditoria {
  const avisos: string[] = [];
  if (!pw) return { entropia: 0, nivel: 0, etiqueta: NIVELES[0], tiempo: "—", avisos };

  let alfabeto = 0;
  if (/[a-z]/.test(pw)) alfabeto += 26;
  if (/[A-Z]/.test(pw)) alfabeto += 26;
  if (/\d/.test(pw)) alfabeto += 10;
  if (/[^a-zA-Z\d]/.test(pw)) alfabeto += 33;
  let entropia = pw.length * Math.log2(Math.max(alfabeto, 1));

  const bajo = pw.toLowerCase();
  if (COMUNES.has(bajo) || COMUNES.has(bajo.replace(/[^a-z0-9ñ]/g, ""))) {
    avisos.push("Está en las listas de contraseñas más usadas");
    entropia = Math.min(entropia, 10);
  }
  if (/(.)\1{2,}/.test(pw)) {
    avisos.push("Repite el mismo carácter varias veces");
    entropia *= 0.8;
  }
  const tieneSecuencia = SECUENCIAS.some((sec) =>
    Array.from({ length: sec.length - 3 }, (_, i) => sec.slice(i, i + 4)).some((trozo) => bajo.includes(trozo)),
  );
  if (tieneSecuencia) {
    avisos.push("Contiene una secuencia de teclado o alfabeto");
    entropia *= 0.75;
  }
  if (/(19|20)\d{2}/.test(pw)) {
    avisos.push("Incluye algo que parece un año");
    entropia *= 0.9;
  }
  if (pw.length < 12) avisos.push("Usa al menos 12 caracteres");
  if (alfabeto <= 26) avisos.push("Combina mayúsculas, números y símbolos");

  // Ataque sin conexión contra un hash rápido: ~10 mil millones de intentos por segundo.
  const segundos = Math.pow(2, entropia) / 2 / 1e10;
  const nivel = (entropia < 28 ? 0 : entropia < 36 ? 1 : entropia < 60 ? 2 : entropia < 80 ? 3 : 4) as Auditoria["nivel"];
  return { entropia: Math.round(entropia), nivel, etiqueta: NIVELES[nivel], tiempo: duracion(segundos), avisos };
}
