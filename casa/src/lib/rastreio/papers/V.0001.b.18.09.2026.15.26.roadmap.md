# Roadmap — o que fazer e o que não fazer

Nascido: 18.09.2026 15.26  
Papel: V.0001.b.18.09.2026.15.26.roadmap  
Produto: BrasilGuarD  
Não apaga. Não edita. Se mudar o plano, nasce letra nova.

Como ler a %: 100 feito · 50 pela metade · 0 nem começou.  
A % é **desta casa** (caixa, ficha, quadro), não do v2 no GitHub.

---

## Trilho A — segunda (mostrar)

Objetivo: você na frente, o time vê. Cliente **não** precisa de Grok.

| # | Passo | % | Fazer | Não fazer |
|---|---|---|---|---|
| 1 | Visual, marca, Ana / Carla / Cátia / Taiz / Simone | 95 | Mostrar como está | Não redesenhar |
| 2 | Login e papéis (operador, supervisor, administrador) | 85 | Usar na demo | Não misturar os papéis na hora |
| 3 | Porta Mensagens + porta Quadro (quem usa escolhe) | 90 | Trocar as duas portas na demo | Não inventar terceira porta agora |
| 4 | Ficha (origem, indicação, o que falta) | 80 | Abrir uma ficha ao vivo | Não ligar WhatsApp real ainda |
| 5 | Rastreio (papéis V.0001…) | 90 | Abrir a aba Rastreio 10 s | Não editar papel velho |
| 6 | Código do supervisor no chat | 0 | **Adiar** se o tempo apertar | Não improvisar “eu entro no chat dos outros” |
| 7 | Esta casa no GitHub (não o v2) | 0 | Só quando você mandar subir | Não misturar com o HTML do v2 |
| 8 | Link Vercel desta casa | 0 | Depois do 7 | Não publicar o v2 achando que é esta casa |
| 9 | Demo no **seu** notebook / celular | 100 do caminho se 1–5 | Segunda **cabe** assim | Não depender do notebook do cliente |
| 10 | Demo no notebook **do cliente**, sem Grok | 0 | Precisa 7 + 8 | Não pedir conta Grok para o cliente |

**Segunda, se não der 7 e 8:** faça 9. Conclusão do trilho A hoje: **~55%**. Com 7+8: ~75%. 100% do trilho A = cliente abre o link sozinho.

---

## Trilho B — produto que cobra

Objetivo: corretor usa de verdade. Paga o que usa.

| # | Passo | % | Fazer | Não fazer |
|---|---|---|---|---|
| 11 | Banco na nuvem (Supabase = Postgres) | 0 | Criar projeto, colar URL pooler | Não ligar Firebase como segundo banco |
| 12 | Login da casa (o de agora) | 85 | Manter | Não trocar pelo login do Supabase |
| 13 | Cliente `00001 Nome` | 10 | Ligar número contínuo de 5 dígitos | Não nome enorme de arquivo |
| 14 | Pasta Drive por cliente (5 TB) | 20 | Pasta já existe; falta 1:1 com `00001` | Não jogar tudo numa pasta só |
| 15 | Cofre: apagou no chat, não apaga no fundo | 0 | Storage + log | Não apagar no banco porque apagou no WhatsApp |
| 16 | Aba Operadoras (normativa campo a campo, treino da IA) | 0 | Uma aba, cada plano separado | Não um PDF único misturado |
| 17 | WhatsApp oficial (API) | 0 | Depois de vender o MVP | Não fingir API na segunda |
| 18 | Telegram / Messenger / Direct | 0 | Depois do 17 redondo | Não os quatro de uma vez |
| 19 | Agente de IA por demanda (Ana etc.) | 40 | Persona + ensaio | Não bot genérico |
| 20 | Paga o que usa (API) | 0 | Depois de 17 | Não precificar API que ainda não existe |

**Conclusão do trilho B hoje: ~15%.**

---

## Trilho C — as três oficinas (Grok, ChatGPT, Gemini)

Objetivo: você constrói com as três. O cliente **não** entra nessas contas.

| # | Passo | % | Fazer | Não fazer |
|---|---|---|---|---|
| 21 | GitHub = a mesa das três | 70 | Repo público criado; tem o **v2** | Não achar que as três já veem esta casa |
| 22 | Grok neste chat | 80 | Continuar aqui | Não colar ChatGPT dentro do Grok |
| 23 | ChatGPT no mesmo repo | 0 | MCP / conector GitHub lá | Não login ChatGPT na BrasilGuarD |
| 24 | Gemini no mesmo repo | 0 | MCP GitHub / Firebase só se for Google | Não dois bancos |
| 25 | MCP oficial (GitHub, Vercel, Supabase, Firebase) | 30 | Arquivo `.mcp.json` nesta casa | Não escrever MCP nosso |
| 26 | Cartão Supabase neste Grok | — | **Não existe.** URL pooler no site | Não esperar o botão |

**Conclusão do trilho C hoje: ~35%.**

---

## Ordem que eu seguiria (se fosse você)

1. Segunda = trilho A itens 1–5 e 9. **Fecha a demo.**  
2. Depois da segunda: item 7 (esta casa no GitHub, repo **novo** ou pasta nova — **não** por cima do v2 sem você mandar).  
3. Item 8 (Vercel) → link para o cliente.  
4. Item 11 (Supabase).  
5. Itens 13, 14, 16.  
6. Item 17 (WhatsApp) quando alguém pagar.  
7. 18 e 20 por último.

## O que não fazer nunca neste ciclo

- Firebase em cima do Postgres  
- Dois logins (casa + Supabase Auth)  
- Apagar papel de rastreio  
- Pedir Grok / ChatGPT / Gemini para o **cliente**  
- Publicar o v2 e chamar de esta casa  
- Quatro canais antes do WhatsApp redondo  

## Totais

| Escopo | % agora |
|---|---|
| Demo segunda no seu aparelho (A 1–5, 9) | ~90 |
| Cliente abre sozinho, sem Grok (A 7–8, 10) | ~0 |
| Produto que cobra (B) | ~15 |
| Três oficinas alinhadas (C) | ~35 |
| Visão inteira (A+B+C) | ~25 |
