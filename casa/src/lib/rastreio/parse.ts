export const PAPER_RE =
  /^V\.(\d{4})\.([a-z])\.(\d{2})\.(\d{2})\.(\d{4})\.(\d{2})\.(\d{2})\.(.+)$/;

export type PaperId = {
  id: string;
  versao: string;
  letra: string;
  dia: string;
  mes: string;
  ano: string;
  hora: string;
  minuto: string;
  nome: string;
};

export function parsePaperId(id: string): PaperId | null {
  const m = PAPER_RE.exec(id);
  if (!m) return null;
  return {
    id,
    versao: m[1],
    letra: m[2],
    dia: m[3],
    mes: m[4],
    ano: m[5],
    hora: m[6],
    minuto: m[7],
    nome: m[8],
  };
}

export function paperStamp(p: PaperId) {
  return `${p.dia}.${p.mes}.${p.ano}.${p.hora}.${p.minuto}`;
}

export function paperRank(p: PaperId) {
  return [
    Number(p.versao),
    p.letra.charCodeAt(0),
    Number(p.ano),
    Number(p.mes),
    Number(p.dia),
    Number(p.hora),
    Number(p.minuto),
  ];
}

export function newerPaper(a: PaperId, b: PaperId) {
  const ra = paperRank(a);
  const rb = paperRank(b);
  for (let i = 0; i < ra.length; i++) {
    if (ra[i] !== rb[i]) return ra[i] > rb[i] ? a : b;
  }
  return a;
}

export const RELEASE_ID = "V.0001.a.18.09.2026.11.32.BrasilGuarD";
