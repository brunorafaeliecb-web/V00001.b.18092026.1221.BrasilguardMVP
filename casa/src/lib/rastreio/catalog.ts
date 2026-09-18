import { newerPaper, parsePaperId, paperStamp, type PaperId } from "./parse";

const raw = import.meta.glob("./papers/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

export type Paper = PaperId & {
  body: string;
  stamp: string;
};

function fileId(path: string) {
  const base = path.split("/").pop() ?? "";
  return base.replace(/\.md$/, "");
}

export const PAPERS: Paper[] = Object.entries(raw)
  .map(([path, body]) => {
    const parsed = parsePaperId(fileId(path));
    if (!parsed) return null;
    return { ...parsed, body, stamp: paperStamp(parsed) };
  })
  .filter((p): p is Paper => p !== null)
  .sort((a, b) => {
    const n = newerPaper(a, b);
    return n === a ? -1 : 1;
  });

export function paperById(id: string) {
  return PAPERS.find((p) => p.id === id) ?? null;
}

export function currentByNome() {
  const map = new Map<string, Paper>();
  for (const p of PAPERS) {
    const prev = map.get(p.nome);
    if (!prev || newerPaper(p, prev) === p) map.set(p.nome, p);
  }
  return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
}

export function historyOf(nome: string) {
  return PAPERS.filter((p) => p.nome === nome);
}
