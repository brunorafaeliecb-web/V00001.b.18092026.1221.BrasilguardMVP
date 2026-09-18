import { cn } from "@/lib/utils";

export function PaperBody({ text, className }: { text: string; className?: string }) {
  const blocks = splitBlocks(text.trim());
  return (
    <div className={cn("space-y-4 text-sm leading-relaxed text-foreground", className)}>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

function splitBlocks(text: string) {
  const out: string[] = [];
  let buf: string[] = [];
  let fence = false;
  let table = false;
  for (const line of text.split("\n")) {
    if (line.startsWith("```")) {
      if (fence) {
        buf.push(line);
        out.push(buf.join("\n"));
        buf = [];
        fence = false;
      } else {
        if (buf.length) out.push(buf.join("\n"));
        buf = [line];
        fence = true;
      }
      continue;
    }
    if (fence) {
      buf.push(line);
      continue;
    }
    const isTable = line.includes("|");
    if (isTable) {
      if (!table && buf.length) {
        out.push(buf.join("\n"));
        buf = [];
      }
      table = true;
      buf.push(line);
      continue;
    }
    if (table) {
      out.push(buf.join("\n"));
      buf = [];
      table = false;
    }
    if (line.trim() === "") {
      if (buf.length) {
        out.push(buf.join("\n"));
        buf = [];
      }
    } else {
      buf.push(line);
    }
  }
  if (buf.length) out.push(buf.join("\n"));
  return out;
}

function Block({ block }: { block: string }) {
  if (block.startsWith("```")) {
    const inner = block.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
    return (
      <pre className="overflow-x-auto rounded-2xl bg-secondary px-4 py-3 font-mono text-xs leading-relaxed">
        {inner}
      </pre>
    );
  }
  const lines = block.split("\n");
  if (lines[0].startsWith("|")) {
    const rows = lines.filter((l) => !/^\|?\s*-+\s*\|/.test(l)).map((l) =>
      l
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean),
    );
    const head = rows[0] ?? [];
    const body = rows.slice(1);
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr>
              {head.map((c) => (
                <th key={c} className="border-b border-border py-2 pr-4 font-medium">
                  <Inline text={c} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, i) => (
              <tr key={i}>
                {row.map((c, j) => (
                  <td key={j} className="border-b border-border py-2 pr-4 align-top text-muted">
                    <Inline text={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (lines.every((l) => /^\s*(-|\d+\.)\s+/.test(l))) {
    return (
      <ul className="space-y-1 pl-4">
        {lines.map((line, j) => (
          <li key={j} className="list-disc text-muted">
            <Inline text={line.replace(/^\s*(-|\d+\.)\s+/, "")} />
          </li>
        ))}
      </ul>
    );
  }
  if (block.startsWith("# ")) {
    return <h1 className="text-3xl font-semibold tracking-tight">{block.slice(2)}</h1>;
  }
  if (block.startsWith("## ")) {
    return <h2 className="text-xl font-semibold tracking-tight">{block.slice(3)}</h2>;
  }
  if (block.startsWith("### ")) {
    return <h3 className="text-base font-semibold tracking-tight">{block.slice(4)}</h3>;
  }
  return (
    <p className="text-muted">
      {block.split("\n").map((line, i) => (
        <span key={i}>
          {i > 0 ? <br /> : null}
          <Inline text={line} />
        </span>
      ))}
    </p>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-medium text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="font-mono text-xs text-foreground">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
