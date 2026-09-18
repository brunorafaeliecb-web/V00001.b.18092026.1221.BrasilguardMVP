# MCP — GitHub, Vercel, Supabase, Firebase

Nascido: 18.09.2026 12.25  
Papel: V.0001.b.18.09.2026.12.25.mcp  
Produto: BrasilGuarD  
Arquivo na casa: `.mcp.json`  
Não reescrevemos servidor. Usamos o MCP **oficial** de cada um.

---

## O que é

MCP = a tomada padrão. A IA pede, o serviço responde.  
Não é o site da BrasilGuarD. É a ponte das IAs (Grok, Cursor, Claude) até a conta.

## Os quatro

| Serviço | MCP oficial | Como entra |
|---|---|---|
| GitHub | `https://api.githubcopilot.com/mcp/` | OAuth na primeira chamada |
| Vercel | `https://mcp.vercel.com` | OAuth na primeira chamada |
| Supabase | `https://mcp.supabase.com/mcp` | OAuth no navegador (conta Supabase) |
| Firebase | `npx firebase-tools@latest mcp` | Login Google / `firebase login` |

Nenhuma chave no arquivo. Login no navegador.

## O que o Grok já tem (aqui neste chat)

- GitHub: ligado. Lista repositório. **Não cria** repositório (falta permissão).
- Vercel: ligado.
- Drive: ligado.
- Supabase: **não tem cartão neste Grok.** O MCP oficial do Supabase serve no Cursor / Claude / outras IAs, e no Grok só se a plataforma um dia incluir o conector.
- Firebase: **não tem cartão neste Grok.** Mesma regra.

`.mcp.json` **não liga** o cartão de login deste Grok. Liga as outras IAs no mesmo padrão.

## O que não fazer

- Não escrever MCP nosso para GitHub / Vercel / Supabase / Firebase. Eles já existem.
- Não colocar token no arquivo.
- Não ligar Firebase como banco da casa. A casa é Postgres. Firebase MCP é só se o dono mandar.

## Para o dono, agora

1. Cursor / Claude: apontar para este `.mcp.json`. Entrar no OAuth de cada um.
2. Supabase neste Grok: criar o projeto em supabase.com e colar a URL pooler.
3. Repositório `V00001.b.18092026.1221.Brasilguard`: criar na conta. Depois a casa sobe.
