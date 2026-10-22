const DATA_URL = "data/content.json";
const STORAGE_KEY = "caderno-combate-dpm-v1";
const app = document.getElementById("app");
const state = loadState();
let data = null;
let activeQuestion = null;
let pendingImport = null;
let toastTimer = 0;

const modules = [
  [0, "Orientação, edital e limites da incidência", "Entenda o recorte, as fontes e como usar o material.", "dpm-00-inicio", "Comece por aqui"],
  [1, "Fundamentos e vocabulário militar", "Legalidade, militar, superior, comando e conceitos essenciais.", "dpm-09-constituicao-e-atualizacoes", "Base"],
  [2, "Aplicação da lei no tempo e no espaço", "Separe sucessão de leis, tempo, lugar e alcance territorial.", "dpm-01-aplicacao", "Aula de referência"],
  [3, "Art. 9º e classificações", "Investigue o vínculo legal que classifica o fato como militar.", "dpm-02-artigo-9-e-classificacoes", "Protocolo"],
  [4, "Estrutura geral do crime", "Localize fato típico, ilicitude e culpabilidade.", "dpm-03-crime", "Árvore interativa"],
  [5, "Conduta, causalidade e omissão", "Examine resultado, nexo causal e dever de agir.", "dpm-03-crime", "Material-base"],
  [6, "Consumação, tentativa e institutos próximos", "Diferencie a causa da não consumação e a consequência legal.", "dpm-03-crime", "Material-base"],
  [7, "Ilicitude e excludentes", "Teste requisitos de justificação, defesa e excesso.", "dpm-03-crime", "Aula de referência"],
  [8, "Culpabilidade, erros e inexigibilidade", "Separe fundamento, requisitos e consequência.", "dpm-03-crime", "Material-base"],
  [9, "Imputabilidade e embriaguez", "Avalie capacidade ao tempo da conduta e regime do CPM.", "dpm-04-imputabilidade-e-agentes", "Material-base"],
  [10, "Concurso de agentes", "Individualize contribuição, vínculo subjetivo e responsabilidade.", "dpm-04-imputabilidade-e-agentes", "Material-base"],
  [11, "Método de leitura dos tipos penais", "Identifique verbo, sujeito, contexto, elemento subjetivo e consumação.", "dpm-07-disciplina-e-servico", "Método"],
  [12, "Autoridade, disciplina, serviço e dever", "Aplique a Parte Geral aos tipos prioritários.", "dpm-07-disciplina-e-servico", "Prioridade histórica"],
  [13, "Administração Militar", "Compare vínculos funcionais, verbos e modalidades próximas.", "dpm-08-demais-crimes-em-paz", "Comparadores"],
  [14, "Penas e efeitos", "Diferencie espécies, fases de aplicação e consequências.", "dpm-05-penas", "Material-base"],
  [15, "Medidas de segurança", "Relacione pressupostos, resposta legal e limites constitucionais.", "dpm-06-medidas-acao-e-extincao", "Material-base"],
  [16, "Ação penal e extinção da punibilidade", "Separe iniciativa, causas extintivas e marcos prescricionais.", "dpm-06-medidas-acao-e-extincao", "Material-base"],
  [17, "Demais títulos de crimes em paz", "Complete a cobertura por bem jurídico e estrutura típica.", "dpm-08-demais-crimes-em-paz", "Cobertura"],
  [18, "Casos integrados e revisão cumulativa", "Resolva situações novas e retome as dificuldades.", "dpm-13-fixacao", "Treino autoral"],
];

const featuredLessons = [
  { id: "tempo-do-crime", title: "Quando o crime é praticado?", noteId: "dpm-01-aplicacao", section: /^## 4\.\s*Tempo e lugar/i, objective: "Distinguir o momento da conduta do momento do resultado e não confundir tempo do crime com escolha da lei aplicável.", article: "art-5", item: 1, scenario: "Uma ação ocorre em 22 de outubro. O resultado aparece no dia seguinte, depois da entrada em vigor de uma lei nova. Qual data responde à pergunta sobre o tempo do crime?" },
  { id: "necessidade-diferenciadora", title: "Justificação ou exculpação?", noteId: "dpm-03-crime", section: /^## 6\.\s*Necessidade/i, objective: "Diferenciar os arts. 39 e 43 pelo plano atingido, pelos requisitos e pela consequência jurídica.", article: "art-43", item: 13, scenario: "Duas situações envolvem perigo atual. Em uma, o mal causado é consideravelmente inferior ao evitado. Na outra, a proteção de pessoa ligada por parentesco pode envolver sacrifício de direito alheio superior. O que muda na análise?" },
];

const sources = [
  ["CPM atualizado · Câmara dos Deputados", "https://www2.camara.leg.br/legin/fed/declei/1960-1969/decreto-lei-1001-21-outubro-1969-376258-normaatualizada-pe.html", "Fonte principal indicada para a transcrição legal."],
  ["Código Penal Militar compilado · Planalto", "https://www.planalto.gov.br/ccivil_03/decreto-lei/del1001compilado.htm", "Confronto da literalidade e dos marcadores de alteração."],
  ["Lei 14.688/2023 · Planalto", "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14688.htm", "Alterações legislativas destacadas nas anotações."],
  ["Constituição da República · Planalto", "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm", "Parâmetros constitucionais associados aos temas."],
  ["Edital PMAL 2026 · Cebraspe", "https://cdn.cebraspe.org.br/concursos/pm_al_26/arquivos/36A578E7BBD7D6B0DA5A2955B0A2ACEA35EA4061AE125D049C2A7825D94733F3.pdf", "Referência do recorte de Soldado que consta nas anotações."],
];

const incidence = [["Crimes em paz",48],["Aplicação da lei",40],["Teoria do crime",26],["Penas e efeitos",21],["Imputabilidade",10],["Concurso de agentes",9],["Extinção da punibilidade",5],["Medidas de segurança",4],["Ação penal",3]];

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { schema: 1, visited: parsed.visited || {}, read: parsed.read || {}, attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [], errors: Array.isArray(parsed.errors) ? parsed.errors : [], reviews: parsed.reviews || {}, notes: typeof parsed.notes === "string" ? parsed.notes : "", lastRoute: parsed.lastRoute || "" };
  } catch { return { schema: 1, visited: {}, read: {}, attempts: [], errors: [], reviews: {}, notes: "", lastRoute: "" }; }
}
function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { toast("Não foi possível salvar neste navegador."); } }
function toast(message) { const el = document.getElementById("toast"); el.textContent = message; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.hidden = true, 2600); }
function slugify(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function normalize(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function esc(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
function findNote(id) { return data.notes.find(note => note.id === id); }
function findArticle(id) { return data.articles.find(article => article.id === id); }
function articleId(number) { return "art-" + slugify(number); }
function setRoute(route) { location.hash = route; }
function dueDate(id) { return state.reviews[id]?.due ? new Date(state.reviews[id].due) : null; }
function dueCount() { const today = new Date(); today.setHours(23,59,59,999); return Object.keys(state.reviews).filter(id => { const due = dueDate(id); return due && due <= today; }).length; }
function stats() { const independent = state.attempts.filter(a => a.independent); const correct = independent.filter(a => a.correct).length; return { visited: Object.keys(state.visited).length, read: Object.keys(state.read).length, attempts: independent.length, correct, due: dueCount() }; }

function routeInfo() {
  const raw = decodeURIComponent((location.hash || "#inicio").slice(1));
  const [view, ...rest] = raw.split("/");
  return { view: view || "inicio", param: rest.join("/") };
}
function updateChrome(view, param) {
  const navView = view === "aula" ? "trilha" : view === "artigo" ? "lei" : view === "busca" ? "inicio" : view;
  document.querySelectorAll("[data-nav]").forEach(link => link.classList.toggle("active", link.dataset.nav === navView));
  const labels = { inicio: "Visão geral", trilha: "Trilha de estudo", arvore: "Árvore do crime", lei: "Lei por artigo", artigo: "Lei por artigo", treino: "Treino autoral", caderno: "Meu caderno", fontes: "Fontes e método", aula: "Estudar", busca: "Busca" };
  const name = view === "artigo" ? `Art. ${findArticle(param)?.number || ""}` : view === "aula" ? (findNote(param)?.title || featuredLessons.find(x => x.id === param)?.title || "Aula") : labels[view] || "Visão geral";
  document.getElementById("breadcrumb").innerHTML = `Direito Penal Militar <span>/</span> ${esc(name)}`;
  state.lastRoute = location.hash.slice(1);
  saveState();
}

function inlineMarkdown(text, currentNoteId) {
  const codes = [];
  let value = String(text).replace(/`([^`]+)`/g, (_, code) => { const key = `%%CODE${codes.length}%%`; codes.push(`<code>${esc(code)}</code>`); return key; });
  value = esc(value);
  value = value.replace(/!\[\[([^\]]+)\]\]/g, "");
  value = value.replace(/\[\[([^\]]+)\]\]/g, (_, target) => {
    const parts = target.split("|"); const destination = parts[0].trim(); const label = (parts[1] || destination.split("#").pop()).trim();
    const [noteTarget, heading] = destination.split("#");
    const lawMatch = `${noteTarget || ""} ${heading || ""}`.match(/Art\.\s*([\d]+(?:-[A-Za-z]+)?)/i);
    if ((noteTarget || "").startsWith("DPM - L") || lawMatch) {
      const no = lawMatch?.[1]; const found = no && data.articles.find(a => normalize(a.number) === normalize(no));
      return found ? `<a href="#artigo/${found.id}">${esc(label)}</a>` : esc(label);
    }
    const note = noteTarget ? data.notes.find(n => slugify(n.source.replace(/\.md$/i, "")) === slugify(noteTarget) || n.id === slugify(noteTarget)) : findNote(currentNoteId);
    return note ? `<a href="#aula/${note.id}${heading ? `?secao=${encodeURIComponent(slugify(heading))}` : ""}">${esc(label)}</a>` : esc(label);
  });
  value = value.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)/g, (_, label, url) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`);
  value = value.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  value = value.replace(/~~(.+?)~~/g, "<del>$1</del>");
  return value.replace(/%%CODE(\d+)%%/g, (_, i) => codes[Number(i)] || "");
}

function renderMarkdown(markdown, currentNoteId = "") {
  const lines = String(markdown || "").split(/\r?\n/); const out = []; let i = 0; let headingCounts = {};
  const heading = line => line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
  const pushParagraph = rows => { if (rows.length) out.push(`<p>${inlineMarkdown(rows.join(" "), currentNoteId)}</p>`); };
  const splitCells = line => line.trim().replace(/^\|/," ").replace(/\|$/," ").split("|").map(x => x.trim());
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || /^\s*---+\s*$/.test(line)) { i++; continue; }
    const h = heading(line);
    if (h) { let level = Math.min(4, h[1].length); const title = h[2].replace(/\*\*/g, ""); let id = slugify(title); headingCounts[id] = (headingCounts[id] || 0) + 1; if (headingCounts[id] > 1) id += `-${headingCounts[id]}`; out.push(`<h${level} id="${id}">${inlineMarkdown(title, currentNoteId)}</h${level}>`); i++; continue; }
    if (/^```/.test(line)) { const lang = line.slice(3).trim(); const block=[]; i++; while(i<lines.length && !/^```/.test(lines[i])) block.push(lines[i++]); i++; out.push(`<pre><code${lang?` class="language-${esc(lang)}"`:""}>${esc(block.join("\n"))}</code></pre>`); continue; }
    const callout = line.match(/^>\s*\[!(\w+)\][+-]?\s*(.*)$/i);
    if (callout) { const body=[]; if(callout[2]) body.push(callout[2]); i++; while(i<lines.length && /^>/.test(lines[i])) body.push(lines[i++].replace(/^>\s?/,"")); const type=slugify(callout[1]); out.push(`<aside class="callout ${type === "quote" ? "green" : type === "warning" ? "red" : ""}"><span class="callout-title">${inlineMarkdown(callout[2] || callout[1], currentNoteId)}</span>${renderMarkdown(body.slice(callout[2] ? 0 : 1).join("\n"), currentNoteId)}</aside>`); continue; }
    if (/^\|.*\|$/.test(line) && i+1<lines.length && /^\|?\s*:?-{3,}/.test(lines[i+1])) { const head=splitCells(line); i+=2; const rows=[]; while(i<lines.length && /^\|.*\|$/.test(lines[i])) rows.push(splitCells(lines[i++])); out.push(`<div class="table-scroll"><table><thead><tr>${head.map(c=>`<th>${inlineMarkdown(c,currentNoteId)}</th>`).join("")}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(c=>`<td>${inlineMarkdown(c,currentNoteId)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`); continue; }
    if (/^\s*[-*+]\s+/.test(line)) { const rows=[]; while(i<lines.length && /^\s*[-*+]\s+/.test(lines[i])) rows.push(lines[i++].replace(/^\s*[-*+]\s+/,"")); out.push(`<ul>${rows.map(x=>`<li>${inlineMarkdown(x,currentNoteId)}</li>`).join("")}</ul>`); continue; }
    if (/^\s*\d+[.)]\s+/.test(line)) { const rows=[]; while(i<lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) rows.push(lines[i++].replace(/^\s*\d+[.)]\s+/,"")); out.push(`<ol>${rows.map(x=>`<li>${inlineMarkdown(x,currentNoteId)}</li>`).join("")}</ol>`); continue; }
    if (/^>\s?/.test(line)) { const quote=[]; while(i<lines.length && /^>/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/,"")); out.push(`<blockquote>${renderMarkdown(quote.join("\n"),currentNoteId)}</blockquote>`); continue; }
    const para=[line]; i++; while(i<lines.length && lines[i].trim() && !heading(lines[i]) && !/^\s*[-*+]\s+/.test(lines[i]) && !/^\s*\d+[.)]\s+/.test(lines[i]) && !/^>/.test(lines[i]) && !/^```/.test(lines[i]) && !/^\|.*\|$/.test(lines[i]) && !/^\s*---+\s*$/.test(lines[i])) para.push(lines[i++]); pushParagraph(para);
  }
  return out.join("");
}

function extractSection(note, regex) {
  if (!note) return ""; const lines=note.content.split(/\r?\n/); const start=lines.findIndex(line=>regex.test(line)); if(start<0)return note.content;
  let end=lines.length; for(let i=start+1;i<lines.length;i++) if(/^##\s+/.test(lines[i])){end=i;break;} return lines.slice(start,end).join("\n");
}
function findQuestion(id) { return data.questions.find(q => q.id === id); }
function articleLink(number, label) { const a = data.articles.find(x => normalize(x.number) === normalize(number)); return a ? `<a href="#artigo/${a.id}">${esc(label || `Art. ${number}`)}</a>` : esc(label || `Art. ${number}`); }
function noteCard(note, index) { return `<a class="lesson-card" href="#aula/${note.id}"><div class="lesson-top"><span class="lesson-number">MATERIAL ${String(index+1).padStart(2,"0")}</span><span class="pill">Anotação importada</span></div><h3>${esc(note.title.replace(/ — .*/,""))}</h3><p>${esc(note.title)}</p><span class="card-link">Abrir conteúdo <span aria-hidden="true">→</span></span></a>`; }

function renderHome() {
  const s=stats(); const next=modules.find(m=>!state.read[m[3]]) || modules[0]; const last=state.lastRoute && state.lastRoute !== "inicio" ? state.lastRoute : `aula/${next[3]}`;
  const lastLabel=last.startsWith("aula/")?(findNote(last.split("/")[1])?.title||"Retomar aula"):last.startsWith("artigo/")?"Retomar consulta legal":"Retomar estudo";
  return `<section class="hero-panel"><span class="hero-label"><span class="status-dot"></span> TRILHA DIDÁTICA · PMAL SOLDADO</span><div class="eyebrow">Direito Penal Militar</div><h1>Estude a regra.<br>Entenda o caso.</h1><p>Uma trilha de aprendizagem que conecta a lei, a explicação e a aplicação. Comece pelos pré-requisitos, resolva sem ajuda e retome o que ainda exige atenção.</p><div class="hero-cta"><a class="btn primary" href="#trilha">Começar a trilha <span>→</span></a><a class="btn" href="#lei">Consultar um artigo <span>§</span></a></div></section>
  <div class="quick-stats"><div class="stat-card"><strong>${data.metadata.sourceNotes}</strong><span>notas mapeadas</span></div><div class="stat-card"><strong>${data.articles.length}</strong><span>artigos para consulta</span></div><div class="stat-card"><strong>${data.questions.length-1}</strong><span>itens autorais ativos</span></div><div class="stat-card"><strong>${s.due}</strong><span>revisões sugeridas para hoje</span></div></div>
  <div class="resume-card"><div><div class="eyebrow">PRÓXIMA AÇÃO</div><h3>${esc(next[1])}</h3><p>${esc(next[2])}</p></div><div><div class="resume-meta">${s.read} leituras concluídas · ${s.attempts} tentativas independentes</div><a class="btn" href="#${esc(last)}">${esc(lastLabel)} →</a></div></div>
  <div class="section-heading"><h2>Aulas de referência</h2><a href="#trilha">Ver trilha completa →</a></div>
  <div class="lesson-grid">${featuredLessons.map((l,i)=>`<a class="lesson-card" href="#aula/${l.id}"><div class="lesson-top"><span class="lesson-number">AULA-MODELO 0${i+1}</span><span class="pill green">Objetivo verificável</span></div><h3>${esc(l.title)}</h3><p>${esc(l.objective)}</p><span class="card-link">Estudar esta aula →</span></a>`).join("")}</div>
  <div class="two-col"><section><div class="section-heading"><h2>Continue pela ordem lógica</h2><a href="#trilha">Abrir trilha →</a></div><div class="module-list">${modules.slice(0,4).map(m=>moduleCard(m)).join("")}</div></section><aside><div class="section-heading"><h2>Seu registro</h2></div><div class="panel-card"><h3>Aprender, aplicar, revisar.</h3><p>A visita e a leitura ficam separadas das respostas independentes.</p><div class="progress-row"><span>Leituras concluídas</span><b>${s.read}</b></div><div class="progress-track"><span style="width:${Math.min(100,s.read/Math.max(1,modules.length)*100)}%"></span></div><div class="progress-row"><span>Desempenho independente</span><b>${s.correct}/${s.attempts}</b></div><a class="btn small" href="#caderno">Abrir meu caderno →</a></div></aside></div>
  <div class="callout green"><b>Como ler o conteúdo:</b> o material importado preserva a distinção entre lei literal, comentário didático, jurisprudência e exercício autoral. As anotações originais continuam no Obsidian; figuras antigas foram excluídas.</div>`;
}

function moduleCard(m) {
  const done=!!state.read[m[3]], visited=!!state.visited[m[3]];
  const status=done?'<span class="pill green">Leitura concluída</span>':visited?'<span class="pill blue">Já visitada</span>':`<span class="pill">${esc(m[4])}</span>`;
  return `<a class="module-card" href="#aula/${m[3]}"><span class="module-step">${String(m[0]).padStart(2,"0")}</span><span><h3>${esc(m[1])}</h3><p>${esc(m[2])}</p></span>${status}<span class="module-arrow" aria-hidden="true">→</span></a>`;
}

function renderTrilha() {
  const groups=[["Fundamentos e enquadramento",modules.slice(0,4)],["Teoria do crime",modules.slice(4,11)],["Tipos penais e consequências",modules.slice(11,18)],["Integração e revisão",modules.slice(18)]];
  return `<div class="page-head"><div><div class="eyebrow">Primeira aprendizagem · por pré-requisitos</div><h1>Trilha de estudo.</h1><p>O percurso começa pelos conceitos necessários e avança para aplicação em tipos penais. A prioridade histórica orienta a revisão, sem excluir os demais temas do programa.</p></div></div>
  <div class="callout">O rótulo <b>material-base</b> indica que há conteúdo de origem. Não equivale a uma aula individual revisada nem a domínio do tema.</div>
  ${groups.map(([label,list])=>`<div class="stage-label">${esc(label)}</div><div class="module-list">${list.map(m=>moduleCard(m)).join("")}</div>`).join("")}
  <div class="section-heading"><h2>Recursos que acompanham a trilha</h2></div><div class="lesson-grid"><a class="lesson-card" href="#arvore"><div class="lesson-top"><span class="lesson-number">MAPA INTERATIVO</span><span class="pill green">Componente existente</span></div><h3>Árvore do crime</h3><p>Volte ao mapa tripartido e abra um instituto para ver explicação, lei e exemplo.</p><span class="card-link">Abrir componente →</span></a><a class="lesson-card" href="#treino"><div class="lesson-top"><span class="lesson-number">26 ITENS</span><span class="pill amber">Autorais</span></div><h3>Treino por objetivo</h3><p>Julgue o item, indique o fundamento e confira o feedback depois de responder.</p><span class="card-link">Treinar agora →</span></a></div>`;
}

function renderReferenceLesson(lesson) {
  const note=findNote(lesson.noteId); const source=extractSection(note,lesson.section); const item=findQuestion(`item-${String(lesson.item).padStart(2,"0")}`); const art=findArticle(lesson.article);
  const legal=art?`<div class="law-excerpt"><div class="eyebrow">LEI LITERAL · ${esc(art.heading)}</div>${renderMarkdown(art.content, note.id)}<a class="btn small" href="#artigo/${art.id}">Abrir artigo completo →</a></div>`:`<a class="btn small" href="#lei">Consultar lei →</a>`;
  const itemText=item?`<div class="panel-card"><span class="pill amber">Item autoral · ${item.number}</span><p class="quiz-statement">${esc(item.statement)}</p><div class="hero-cta"><a class="btn primary" href="#treino/${item.id}">Responder sem ajuda →</a></div></div>`:"";
  return `<div class="page-head"><div><div class="eyebrow">Aula de referência · conteúdo em revisão editorial</div><h1>${esc(lesson.title)}</h1><p>${esc(lesson.objective)}</p></div><a class="btn" href="#trilha">← Voltar à trilha</a></div>
  <div class="callout green"><b>Objetivo:</b> ${esc(lesson.objective)}</div><div class="panel-card lesson-scenario"><span class="pill blue">Caso inicial</span><p>${esc(lesson.scenario)}</p><small>Registre sua hipótese antes de ler a explicação.</small></div>
  <div class="section-heading"><h2>Regra vinculada</h2><span>${art?`Art. ${esc(art.number)}`:"Fonte legal"}</span></div><div class="material-card">${legal}</div>
  <div class="section-heading"><h2>Explicação e requisitos</h2><span class="pill">Anotação de origem · ${esc(note?.source || "")}</span></div><article class="material-card"><div class="material-body">${renderMarkdown(source,note.id)}</div></article>
  <div class="section-heading"><h2>Tente sem ajuda</h2></div>${itemText}
  <div class="section-heading"><h2>Marque seu estudo</h2></div><div class="panel-card finish-card"><p>Concluir leitura registra que você terminou esta passagem. Isso não conta como evidência de domínio.</p><button class="btn primary" data-complete-note="${lesson.noteId}">Marcar leitura concluída</button></div>`;
}

function renderNote(noteId) {
  const note=findNote(noteId); if(!note)return `<div class="empty-state">Este conteúdo ainda não está disponível. <a href="#trilha">Voltar à trilha.</a></div>`;
  state.visited[note.id]=new Date().toISOString(); saveState();
  const stage=modules.find(m=>m[3]===note.id); const related=stage?`Etapa ${String(stage[0]).padStart(2,"0")} · ${stage[4]}`:"Biblioteca de anotações";
  return `<div class="page-head"><div><div class="eyebrow">${esc(related)} · conteúdo importado</div><h1>${esc(note.title)}</h1><p>Fonte: ${esc(note.source)}. O conteúdo aguarda revisão jurídica e didática antes de ser identificado como publicado.</p></div><a class="btn" href="#trilha">← Voltar à trilha</a></div>
  <div class="callout"><b>Estado editorial:</b> ${esc(note.editorialStatus)}. A publicação não monitora alterações legais automaticamente.</div>
  <div class="material-card"><div class="material-body">${renderMarkdown(note.content,note.id)}</div></div>
  <div class="finish-card panel-card"><p>Visitar esta nota e concluir a leitura são registros diferentes. Sua resposta independente fica no caderno de estudos.</p><button class="btn primary" data-complete-note="${note.id}">${state.read[note.id]?"Leitura concluída ✓":"Marcar leitura concluída"}</button> <a class="btn" href="#lei">Consultar artigo relacionado §</a></div>`;
}

function renderAula(param) {
  const featured=featuredLessons.find(x=>x.id===param); return featured?renderReferenceLesson(featured):renderNote(param);
}

function renderTree() {
  return `<div class="page-head"><div><div class="eyebrow">Componente interativo · módulo da trilha</div><h1>Árvore do crime.</h1><p>O mapa abre em seu próprio painel e mantém os detalhes, teorias e casos da página original.</p></div><a class="btn" href="#trilha">← Voltar à trilha</a></div><div class="callout green">A árvore localiza a estrutura do delito. O art. 9º e a punibilidade são perguntas relacionadas, tratadas em módulos próprios.</div><iframe class="tree-frame" src="arvore-do-crime.html" title="Árvore interativa do crime no Código Penal Militar" loading="lazy"></iframe>`;
}

function renderLaw(param="") {
  const selected=findArticle(param) || data.articles[0]; const groups=[...new Set(data.articles.map(a=>a.group))];
  return `<div class="page-head"><div><div class="eyebrow">Consulta literal · biblioteca do CPM</div><h1>Lei por artigo.</h1><p>Busque por número, palavra ou dispositivo. O artigo abre sem tirar você da biblioteca.</p></div><span class="pill blue">${data.articles.length} cabeçalhos importados</span></div>
  <div class="callout"><b>Texto de origem:</b> transcrição importada das notas de lei literal. Situação editorial: revisão jurídica pendente. Consulte a fonte oficial indicada antes de usar como atualização vigente.</div>
  <div class="article-search"><input class="field" id="article-query" type="search" placeholder="Ex.: 9, tentativa, prescrição…" value="${param?esc(selected.number):""}" aria-label="Buscar artigo ou expressão"><select class="field" id="article-group" aria-label="Filtrar título">${`<option value="">Todos os títulos</option>`+groups.map(g=>`<option value="${esc(g)}">${esc(g.replace(/^Lei literal — /,""))}</option>`).join("")}</select></div>
  <div class="article-layout"><div class="article-results" id="article-results" role="listbox" aria-label="Artigos encontrados">${renderArticleResults("", "")}</div><article class="article-detail" id="article-detail">${renderArticleDetail(selected)}</article></div>`;
}
function renderArticleResults(query, group) {
  const q=normalize(query); const results=data.articles.filter(a=>(!group||a.group===group)&&(!q||normalize(`${a.number} ${a.heading} ${a.group} ${a.content}`).includes(q))).slice(0,140);
  if(!results.length)return `<div class="empty-state">Nenhum artigo encontrado. Tente outro número ou termo.</div>`;
  return results.map(a=>`<a class="article-result ${location.hash.endsWith(a.id)?"selected":""}" href="#artigo/${a.id}" role="option" aria-label="Abrir ${esc(a.heading)}"><b>${esc(a.heading)}</b><small>${esc(a.group.replace(/^Lei literal — /,""))}</small></a>`).join("");
}
function renderArticleDetail(a) {
  if(!a)return `<div class="empty-state">Escolha um artigo para consultar.</div>`;
  const related=data.notes.filter(n=>new RegExp(`\\b${a.number.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,"i").test(n.content)).slice(0,3);
  return `<div class="eyebrow">${esc(a.group.replace(/^Lei literal — /,""))} · transcrição importada</div><h2>${esc(a.heading)}</h2><span class="pill amber">Revisão jurídica pendente</span><div class="material-body">${renderMarkdown(a.content,"")}</div><div class="callout">Confira a redação na fonte oficial e leia o alerta editorial do tema. O material não acompanha alterações automaticamente.</div>${related.length?`<h3>Aulas relacionadas</h3><div class="related-links">${related.map(n=>`<a class="btn small" href="#aula/${n.id}">${esc(n.title.replace(/ — .*/,""))} →</a>`).join(" ")}</div>`:""}<a class="btn small" href="https://www2.camara.leg.br/legin/fed/declei/1960-1969/decreto-lei-1001-21-outubro-1969-376258-normaatualizada-pe.html" target="_blank" rel="noopener noreferrer">Conferir fonte oficial ↗</a>`;
}

function renderQuiz(param="") {
  const active=data.questions.filter(q=>q.editorialStatus!=="Em revisão"); const topics=[...new Set(active.map(q=>q.topic))];
  const desired=findQuestion(param); activeQuestion=desired&&desired.editorialStatus!=="Em revisão"?desired:(active[0]||null);
  const index=active.findIndex(q=>q.id===activeQuestion?.id); const answered=activeQuestion && window.sessionAnswers?.[activeQuestion.id];
  const attemptCount=state.attempts.filter(a=>a.questionId===activeQuestion?.id&&a.independent).length;
  const review=activeQuestion&&state.reviews[activeQuestion.id];
  const excluded=data.questions.filter(q=>q.editorialStatus==="Em revisão");
  return `<div class="page-head"><div><div class="eyebrow">Treino · itens autorais</div><h1>Julgue e fundamente.</h1><p>Responda antes de ver o comentário. Cada tentativa é registrada como independente; questões reais e gabaritos oficiais não foram importados.</p></div><span class="pill amber">${active.length} ativos · ${excluded.length} em revisão</span></div>
  ${excluded.length?`<div class="callout red"><b>Item ${excluded[0].number} suspenso:</b> requer conferência do marco temporal da ADI 7.555. Não entra na avaliação até revisão.</div>`:""}
  <div class="quiz-card"><div class="quiz-meta"><span class="pill blue">${esc(activeQuestion?.topic||"Treino")}</span><span class="quiz-progress">ITEM ${String(index+1).padStart(2,"0")} DE ${active.length} · ${attemptCount} TENTATIVAS</span></div><p class="quiz-statement">${esc(activeQuestion?.statement||"Não há itens disponíveis.")}</p><div class="answer-actions"><button class="btn" data-answer="true" ${answered?"disabled":""}>Certo</button><button class="btn" data-answer="false" ${answered?"disabled":""}>Errado</button></div>
  ${answered?`<div class="feedback ${answered.correct?"":"wrong"}"><b>${answered.correct?"Resposta correta":"Reveja este ponto"}.</b> ${esc(activeQuestion.feedback)} <div class="feedback-source">Tema: ${esc(activeQuestion.topic)} · Origem autoral · v${activeQuestion.version}</div>${!answered.correct?`<label class="error-classify">Classifique a dificuldade <select id="error-category" class="field"><option>Desconhecimento da regra</option><option>Troca com o CP comum</option><option>Leitura do enunciado</option><option>Enquadramento</option><option>Confusão entre institutos</option><option>Atualização normativa</option></select></label><button class="btn small" data-classify="${activeQuestion.id}">Salvar classificação</button>`:""}</div>`:""}
  <div class="quiz-footer"><button class="btn small" data-quiz-step="${Math.max(0,index-1)}" ${index<=0?"disabled":""}>← Anterior</button><small>Sem ajuda · resposta após escolha</small><button class="btn small" data-quiz-step="${Math.min(active.length-1,index+1)}">Próximo →</button></div></div>
  <div class="section-heading"><h2>Casos autorais</h2><span class="pill">3 casos</span></div><div class="cases-grid">${data.cases.map(c=>renderCase(c)).join("")}</div>
  <div class="callout">O treino disponível é um ponto de partida. A quantidade de tentativas não comprova, sozinha, domínio. A origem e a versão de cada item acompanham o feedback.</div>`;
}
function renderCase(c) {
  const split=c.content.match(/^(.*?)\s*\*\*(Não|Sim)\.\*\*\s*(.*)$/s); const prompt=split?split[1]:c.content; const answer=split?`${split[2]}. ${split[3]}`:"Resposta ainda sem divisão editorial.";
  return `<details class="case-card"><summary>${esc(c.title)} · caso autoral</summary><div class="case-content"><p>${renderInlineCase(prompt)}</p><div class="case-answer"><b>Comentário</b><p>${renderInlineCase(answer)}</p></div></div></details>`;
}
function renderInlineCase(text) { return esc(text).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"); }

function renderNotebook() {
  const s=stats(); const due=Object.entries(state.reviews).filter(([,r])=>new Date(r.due)<=new Date()).sort((a,b)=>new Date(a[1].due)-new Date(b[1].due));
  const recent=[...state.attempts].reverse().slice(0,8); const errorItems=[...state.errors].reverse().slice(0,12);
  return `<div class="page-head"><div><div class="eyebrow">Progresso e revisão · somente neste dispositivo</div><h1>Meu caderno.</h1><p>Visita, leitura, exercício e evidência independente são registros separados. O histórico não sincroniza entre dispositivos.</p></div><div class="page-actions"><button class="btn" id="export-data">Exportar backup</button><label class="btn" for="import-file">Importar backup<input id="import-file" type="file" accept="application/json,.json" hidden></label></div></div>
  <div class="quick-stats"><div class="stat-card"><strong>${s.visited}</strong><span>aulas visitadas</span></div><div class="stat-card"><strong>${s.read}</strong><span>leituras concluídas</span></div><div class="stat-card"><strong>${s.attempts}</strong><span>tentativas independentes</span></div><div class="stat-card"><strong>${s.correct}/${s.attempts}</strong><span>acertos independentes · evidência ${s.attempts<5?"inicial":"em construção"}</span></div></div>
  <div id="import-preview" hidden></div><div class="notebook-grid"><section class="panel-card"><div class="section-heading"><h3>Revisões sugeridas</h3><span class="pill amber">${due.length} vencidas</span></div>${due.length?`<div class="error-list">${due.map(([id,r])=>{const q=findQuestion(id);return `<a class="error-item" href="#treino/${id}"><b>${esc(q?.topic||"Tema de estudo")}</b><p>${esc(q?.statement||id)}</p><small>Retomar hoje · ${new Date(r.due).toLocaleDateString("pt-BR")}</small></a>`}).join("")}</div>`:`<p class="muted">Ainda não há revisões sugeridas. Responder a um item inicia um intervalo ajustável de 1, 7 ou 21 dias.</p>`}</section>
  <section class="panel-card"><div class="section-heading"><h3>Meu resumo pessoal</h3><span class="pill">Texto local</span></div><textarea id="personal-notes" class="note-box" placeholder="Anote uma regra com suas palavras, uma dúvida ou o que deseja revisar…">${esc(state.notes)}</textarea><p class="storage-warning">Salvo neste navegador como texto simples. Não sincroniza nem envia dados.</p></section></div>
  <div class="section-heading"><h2>Dificuldades registradas</h2></div>${errorItems.length?`<div class="error-list">${errorItems.map(e=>`<a class="error-item" href="#treino/${e.questionId}"><b>${esc(e.topic)} <span class="pill amber">${esc(e.category||"A classificar")}</span></b><p>${esc(e.statement)}</p><small>${new Date(e.date).toLocaleString("pt-BR")} · ${esc(e.article||"Fundamento no feedback")}</small></a>`).join("")}</div>`:`<div class="panel-card"><p class="muted">Os erros independentes aparecerão aqui com tema, questão e próxima revisão.</p></div>`}
  <div class="section-heading"><h2>Tentativas recentes</h2></div>${recent.length?`<div class="error-list">${recent.map(a=>`<div class="error-item"><b>${a.correct?"Acerto":"Revisar"} · ${esc(findQuestion(a.questionId)?.topic||"Tema")}</b><p>${esc(findQuestion(a.questionId)?.statement||"")}</p><small>${new Date(a.date).toLocaleString("pt-BR")} · ${a.independent?"sem ajuda":"com ajuda"}</small></div>`).join("")}</div>`:`<div class="panel-card"><p class="muted">Você ainda não registrou tentativas.</p></div>`}
  <div class="callout">Ao importar, o arquivo é validado como JSON e seus campos são tratados como texto. Você poderá mesclar ou substituir o registro existente.</div>`;
}

function renderSources() {
  const max=Math.max(...incidence.map(x=>x[1])); const note=data.notes.find(n=>n.id==="dpm-11-bancas-e-evidencia");
  return `<div class="page-head"><div><div class="eyebrow">Método, fontes e limites</div><h1>Leia com contexto.</h1><p>O conteúdo foi importado das anotações do Obsidian. Fontes, comentários, jurisprudência e exercícios autorais mantêm rótulos próprios.</p></div></div>
  <div class="callout red"><b>Revisão jurídica:</b> o acervo ainda precisa de conferência editorial dispositivo por dispositivo. O site não monitora alterações normativas automaticamente. A data indicada nas notas é a data de consulta do material de origem.</div>
  <div class="two-col"><section class="panel-card"><span class="pill blue">Incidência na amostra · 166 itens</span><h3>Participação histórica por bloco</h3><p>Os números abaixo reproduzem a amostra descrita nas anotações. Não são probabilidade de cobrança futura e não foram auditados item a item nesta migração.</p><div class="coverage-bars">${incidence.map(([name,n])=>`<div class="bar-row"><span>${esc(name)}</span><span class="bar-bg"><i style="width:${n/max*100}%"></i></span><b>${n}</b></div>`).join("")}</div><div class="callout">Aplicação, teoria do crime e crimes em paz somam 68,67% da amostra descrita. Acrescentando penas, 81,33%. Use como prioridade de revisão, não como previsão.</div></section>
  <section class="panel-card"><span class="pill amber">Pendência sinalizada</span><h3>ADI 7.555</h3><p>A nota de atualização informa que não reconstituiu a data exata da publicação da ata pertinente à modulação. O item autoral 25 está suspenso até conferência de fonte oficial.</p><a class="btn small" href="#aula/dpm-09-constituicao-e-atualizacoes">Abrir nota de atualização →</a></section></div>
  <div class="section-heading"><h2>Fontes principais</h2></div><div class="source-list">${sources.map(([title,url,description])=>`<div class="source-item"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)} ↗</a><p>${esc(description)}</p></div>`).join("")}</div>
  <div class="section-heading"><h2>Estados editoriais</h2></div><div class="lesson-grid"><div class="panel-card"><span class="pill">Importado</span><p>Preservado a partir das anotações; aguarda conferência no site.</p></div><div class="panel-card"><span class="pill blue">Fonte conferida</span><p>Referência confrontada com fonte primária.</p></div><div class="panel-card"><span class="pill green">Revisado didaticamente</span><p>Explicação organizada para um objetivo de aprendizagem.</p></div><div class="panel-card"><span class="pill amber">Em revisão por alteração</span><p>Conteúdo afetado e sinalizado até nova conferência.</p></div></div>
  <div class="section-heading"><h2>Conteúdo importado</h2></div><div class="panel-card"><p>${data.metadata.sourceNotes} notas mapeadas, ${data.articles.length} cabeçalhos de artigo, ${data.questions.length} itens autorais e ${data.cases.length} casos autorais. Referências gráficas antigas foram excluídas. Os originais permanecem no Obsidian.</p><p class="muted">O recorte de estudo indicado é PMAL · Soldado, com foco de treino Cebraspe. A nota de início distingue conteúdo do edital e contexto complementar.</p><a class="btn small" href="#aula/dpm-00-inicio">Ler orientação do material →</a></div>`;
}

function renderView() {
  const {view,param}=routeInfo(); updateChrome(view,param);
  if(view==="inicio")app.innerHTML=renderHome();
  else if(view==="trilha")app.innerHTML=renderTrilha();
  else if(view==="aula")app.innerHTML=renderAula(param);
  else if(view==="arvore")app.innerHTML=renderTree();
  else if(view==="lei")app.innerHTML=renderLaw();
  else if(view==="artigo")app.innerHTML=renderLaw(param);
  else if(view==="treino")app.innerHTML=renderQuiz(param);
  else if(view==="caderno")app.innerHTML=renderNotebook();
  else if(view==="fontes")app.innerHTML=renderSources();
  else if(view==="busca")app.innerHTML=renderSearchPage(param);
  else app.innerHTML=renderHome();
  bindViewActions();
}
function renderSearchPage(query) { const q=normalize(query); const notes=data.notes.filter(n=>normalize(`${n.title} ${n.content}`).includes(q)).slice(0,12); const arts=data.articles.filter(a=>normalize(`${a.heading} ${a.content}`).includes(q)).slice(0,18); return `<div class="page-head"><div><div class="eyebrow">Busca</div><h1>Resultados.</h1><p>Correspondências para “${esc(query)}”.</p></div></div><div class="lesson-grid">${notes.map(n=>`<a class="lesson-card" href="#aula/${n.id}"><h3>${esc(n.title)}</h3><p>Nota de estudo</p><span class="card-link">Abrir →</span></a>`).join("")}${arts.map(a=>`<a class="lesson-card" href="#artigo/${a.id}"><h3>${esc(a.heading)}</h3><p>${esc(a.group)}</p><span class="card-link">Consultar →</span></a>`).join("")}</div>${!notes.length&&!arts.length?`<div class="empty-state">Nenhum resultado encontrado.</div>`:""}`; }

function bindViewActions() {
  app.querySelectorAll("[data-complete-note]").forEach(btn=>btn.addEventListener("click",()=>{const id=btn.dataset.completeNote;state.read[id]=new Date().toISOString();saveState();toast("Leitura registrada no seu caderno.");renderView();}));
  const query=document.getElementById("article-query"); if(query){const group=document.getElementById("article-group"),results=document.getElementById("article-results");query.addEventListener("input",()=>{results.innerHTML=renderArticleResults(query.value,group.value);});group.addEventListener("change",()=>{results.innerHTML=renderArticleResults(query.value,group.value);});}
  app.querySelectorAll("[data-answer]").forEach(btn=>btn.addEventListener("click",()=>answerCurrent(btn.dataset.answer==="true")));
  app.querySelectorAll("[data-quiz-step]").forEach(btn=>btn.addEventListener("click",()=>{const active=data.questions.filter(q=>q.editorialStatus!=="Em revisão");const q=active[Number(btn.dataset.quizStep)];if(q)setRoute(`treino/${q.id}`);}));
  app.querySelectorAll("[data-classify]").forEach(btn=>btn.addEventListener("click",()=>{const last=[...state.errors].reverse().find(e=>e.questionId===btn.dataset.classify);if(last){last.category=document.getElementById("error-category").value;saveState();toast("Dificuldade registrada.");renderView();}}));
  const personal=document.getElementById("personal-notes");if(personal)personal.addEventListener("input",()=>{state.notes=personal.value;saveState();});
  const exp=document.getElementById("export-data");if(exp)exp.addEventListener("click",exportBackup);
  const imp=document.getElementById("import-file");if(imp)imp.addEventListener("change",readBackup);
}

function answerCurrent(answer) {
  const q=activeQuestion; if(!q)return;
  const correct=answer===q.correct; const date=new Date(); const previous=[...state.attempts].reverse().find(a=>a.questionId===q.id); const streak=correct?(previous?.correct?Number(state.reviews[q.id]?.streak||1)+1:1):0; const interval=correct?[1,7,21][Math.min(streak-1,2)]:1; const due=new Date(date); due.setDate(due.getDate()+interval);
  const attempt={questionId:q.id,answer,correct,independent:true,date:date.toISOString(),version:q.version,topic:q.topic}; state.attempts.push(attempt); state.reviews[q.id]={due:due.toISOString(),interval,streak};
  if(!correct)state.errors.push({questionId:q.id,topic:q.topic,statement:q.statement,category:"A classificar",date:date.toISOString(),article:q.articles?.[0]||""});
  if(!window.sessionAnswers)window.sessionAnswers={}; window.sessionAnswers[q.id]={correct,answer}; saveState(); renderView();
}

function exportBackup() {
  const payload={app:"caderno-combate-dpm",schema:1,exportedAt:new Date().toISOString(),progress:state}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}); const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`caderno-dpm-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);toast("Backup exportado.");
}
function readBackup(event) {
  const file=event.target.files?.[0]; if(!file)return; const reader=new FileReader(); reader.onload=()=>{try{const payload=JSON.parse(String(reader.result));const p=payload.progress;if(payload.app!=="caderno-combate-dpm"||payload.schema!==1||!p||!Array.isArray(p.attempts)||!Array.isArray(p.errors)||typeof p.notes!=="string")throw new Error("Estrutura inválida");pendingImport=payload;const preview=document.getElementById("import-preview");preview.hidden=false;preview.innerHTML=`<div class="callout"><b>Backup validado:</b> ${p.attempts.length} tentativas, ${p.errors.length} dificuldades e ${Object.keys(p.read||{}).length} leituras. Escolha como aplicar.</div><button class="btn primary" data-import-mode="merge">Mesclar com o caderno</button> <button class="btn" data-import-mode="replace">Substituir o caderno atual</button>`;preview.querySelectorAll("[data-import-mode]").forEach(btn=>btn.addEventListener("click",()=>applyImport(btn.dataset.importMode)));}catch{toast("Arquivo inválido ou incompatível.");}event.target.value="";};reader.readAsText(file);
}
function applyImport(mode) {
  if(!pendingImport)return;const p=pendingImport.progress;
  if(mode==="replace"){state.visited=p.visited||{};state.read=p.read||{};state.attempts=p.attempts.slice(-5000);state.errors=p.errors.slice(-2000);state.reviews=p.reviews||{};state.notes=p.notes||"";}
  else {state.visited={...p.visited,...state.visited};state.read={...p.read,...state.read};const known=new Set(state.attempts.map(a=>`${a.questionId}|${a.date}`));state.attempts.push(...p.attempts.filter(a=>!known.has(`${a.questionId}|${a.date}`)));state.errors.push(...p.errors.filter(e=>!state.errors.some(x=>x.questionId===e.questionId&&x.date===e.date)));state.reviews={...p.reviews,...state.reviews};if(!state.notes)state.notes=p.notes||"";}
  saveState();pendingImport=null;toast(mode==="replace"?"Caderno substituído.":"Dados mesclados.");renderView();
}

function bindGlobalSearch() {
  const input=document.getElementById("global-query"),results=document.getElementById("search-results"),form=document.getElementById("global-search");
  input.addEventListener("input",()=>{const q=normalize(input.value.trim());if(q.length<2){results.hidden=true;return;}const foundNotes=data.notes.filter(n=>normalize(`${n.title} ${n.content}`).includes(q)).slice(0,4);const foundArticles=data.articles.filter(a=>normalize(`${a.heading} ${a.content}`).includes(q)).slice(0,5);const html=[...foundNotes.map(n=>`<a class="search-hit" href="#aula/${n.id}"><b>${esc(n.title)}</b><small>Aula · nota importada</small></a>`),...foundArticles.map(a=>`<a class="search-hit" href="#artigo/${a.id}"><b>${esc(a.heading)}</b><small>Lei por artigo · ${esc(a.group)}</small></a>`)].join("");results.innerHTML=html||`<div class="empty-state">Sem resultados</div>`;results.hidden=false;});
  form.addEventListener("submit",event=>{event.preventDefault();const q=input.value.trim();if(q)setRoute(`busca/${encodeURIComponent(q)}`);results.hidden=true;});
  document.addEventListener("click",event=>{if(!form.contains(event.target))results.hidden=true;});
  document.addEventListener("keydown",event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();input.focus();}});
}

async function init() {
  try { const response=await fetch(DATA_URL); if(!response.ok)throw new Error("Falha ao carregar conteúdo"); data=await response.json(); window.sessionAnswers={}; bindGlobalSearch(); window.addEventListener("hashchange",renderView); document.addEventListener("click",event=>{const a=event.target.closest('a[href^="#"]');if(!a)return;const href=a.getAttribute("href");const match=href.match(/^#aula\/([^?]+)\?secao=(.+)$/);if(match){event.preventDefault();setRoute(`aula/${match[1]}`);requestAnimationFrame(()=>document.getElementById(decodeURIComponent(match[2]))?.scrollIntoView());}}); if(!location.hash)location.hash="#inicio"; renderView(); }
  catch(error) { app.innerHTML=`<div class="callout red"><b>Não foi possível carregar o material.</b><p>${esc(error.message)}. Atualize a página ou consulte a configuração de publicação.</p></div>`; }
}
init();
