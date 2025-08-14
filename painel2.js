// ======= painel2.js =======
// Este arquivo assume que o Firebase já foi inicializado em painel.js.
// Se não estiver, ele tenta inicializar com o mesmo config de forma segura.

import {
  initializeApp, getApps
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, setDoc, doc, deleteDoc, updateDoc,
  query, where, orderBy
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ----- Inicialização segura -----
let app;
if (!getApps().length) {
  const firebaseConfig = {
    apiKey: "AIzaSyDsDQ8AzInwgdA8gO9XOTIiqVUtOH5FYNQ",
    authDomain: "biblioteca-souza-nilo.firebaseapp.com",
    projectId: "biblioteca-souza-nilo",
    storageBucket: "biblioteca-souza-nilo.firebasestorage.app",
    messagingSenderId: "927105626349",
    appId: "1:927105626349:web:58b89b3fc32438bdde1ce4",
    measurementId: "G-HYC39S6B8W"
  };
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}
const auth = getAuth(app);
const db = getFirestore(app);

// ===== Utils =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showToast(message, type = "success", duration = 5000) {
  // Reaproveita o mesmo container do painel principal, se existir
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  let emoji = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" }[type] || "ℹ️";
  toast.innerHTML = `
    <span class="emoji">${emoji}</span>
    <span class="message">${message}</span>
    <div class="duration-bar"></div>
  `;
  toastContainer.appendChild(toast);
  const durationBar = toast.querySelector(".duration-bar");
  if (durationBar) durationBar.style.animation = `durationBarAnim ${duration}ms linear forwards`;
  setTimeout(() => {
    toast.style.animation = "slideOutToast 0.5s forwards";
    toast.addEventListener("animationend", () => toast.remove());
  }, duration);
}

const TURMAS_PREDEFINIDAS = {
  "Manhã": [
    "1 Ano A","1 Ano B","1 Ano C","1 Ano D","1 Ano E",
    "2 Ano A","2 Ano B","2 Ano C","2 Ano D","2 Ano E",
    "3 Ano A","3 Ano B","3 Ano C","3 Ano D","3 Ano E"
  ],
  "Tarde": [
    "6 Ano A","6 Ano B","6 Ano C","6 Ano D","6 Ano E",
    "7 Ano A","7 Ano B","7 Ano C","7 Ano D","7 Ano E",
    "8 Ano A","8 Ano B","8 Ano C","8 Ano D","8 Ano E",
    "9 Ano A","9 Ano B","9 Ano C","9 Ano D","9 Ano E"
  ],
  "Noite": ["Eja 1","Eja 2"]
};

function formatDateBR(date) {
  const d = new Date(date);
  if (isNaN(d)) return "-";
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
function todayISO() {
  const d = new Date();
  return new Date(Date.UTC(
    d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0
  )).toISOString();
}
function addDaysISO(baseISO, dias) {
  const d = new Date(baseISO);
  d.setDate(d.getDate() + Number(dias || 0));
  return d.toISOString();
}
function lastDayOfMonth(year, monthIndex0) {
  return new Date(year, monthIndex0 + 1, 0);
}
function diffDays(fromISO, toISO) {
  const a = new Date(fromISO);
  const b = new Date(toISO);
  const ms = (b - a);
  return Math.ceil(ms / (1000*60*60*24));
}
function normalizarTexto(s) {
  return (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

async function gerarProximoIdSequencial(nomeColecao) {
  const snapshot = await getDocs(collection(db, nomeColecao));
  if (snapshot.empty) return "01";
  const nums = snapshot.docs
    .map(d => parseInt(d.id))
    .filter(n => !isNaN(n))
    .sort((a,b)=>a-b);
  let p = 1;
  for (const n of nums) { if (n === p) p++; else break; }
  return String(p).padStart(2,"0");
}

// ====== Seleção visual dos novos cards ======
// ATENÇÃO: use IDs únicos no HTML:
// #card-leitor, #card-cadastrar-emprestimo, #card-emprestados, #card-ranking
const CARD_IDS = ["card-leitor","card-cadastrar-emprestimo","card-emprestados","card-ranking"];
CARD_IDS.forEach(id=>{
  const el = document.getElementById(id);
  if (!el) return;
  el.style.transition = "background-color .2s, color .2s";
  el.addEventListener("click", ()=>{
    CARD_IDS.forEach(i=>{
      const c = document.getElementById(i);
      if (c) {
        c.classList.remove("card--selecionado");
        c.style.backgroundColor = "transparent";
        c.style.color = "";
      }
    });
    el.classList.add("card--selecionado");
    el.style.backgroundColor = "#0a2a5e"; // azul-marinho
    el.style.color = "#fff";
  });
});

// ====== SEÇÕES (HTML patch no final) ======
const secCadastrarLeitor = document.getElementById("secao-cadastrar-leitor");
const secCadastrarEmp = document.getElementById("secao-cadastrar-emprestimo");
const secEmprestados   = document.getElementById("secao-emprestados");
const secRanking       = document.getElementById("secao-ranking");
const secNotifs        = document.getElementById("secao-notificacoes");

// Mostrar/ocultar seções ao clicar
const mapaCardsSecoes = {
  "card-leitor": secCadastrarLeitor,
  "card-cadastrar-emprestimo": secCadastrarEmp,
  "card-emprestados": secEmprestados,
  "card-ranking": secRanking,
};
Object.keys(mapaCardsSecoes).forEach(cardId=>{
  const card = document.getElementById(cardId);
  if (!card) return;
  card.addEventListener("click", ()=>{
    [secCadastrarLeitor,secCadastrarEmp,secEmprestados,secRanking,secNotifs].forEach(s=>{
      if (s) s.style.display = "none";
    });
    const alvo = mapaCardsSecoes[cardId];
    if (alvo) alvo.style.display = "block";
    // Carregamentos sob demanda
    if (alvo === secEmprestados) carregarEmprestimos();
    if (alvo === secRanking) carregarRanking();
  });
});

// ====== CADASTRAR LEITOR ======
const formLeitor = document.getElementById("form-cadastrar-leitor");
const inpNomeLeitor = document.getElementById("leitor-nome");
const inpSerieLeitor = document.getElementById("leitor-serie");
const selTurmaLeitor = document.getElementById("leitor-turma");
const selTurnoLeitor = document.getElementById("leitor-turno");
const inpNascLeitor = document.getElementById("leitor-nascimento");
const outEmailLeitor = document.getElementById("leitor-email");
const inpSenhaLeitor = document.getElementById("leitor-senha");

// Gera email automático ao digitar nome
if (inpNomeLeitor && outEmailLeitor) {
  inpNomeLeitor.addEventListener("input", ()=>{
    const base = normalizarTexto(inpNomeLeitor.value).replace(/[^a-z0-9]+/g,".");
    outEmailLeitor.value = (base ? base.replace(/^\.+|\.+$/g,"") : "leitor") + "@leitor.souzanilo.com";
  });
}

// Preenche turmas com base no turno
function preencherTurmasSelect(selectEl, turno) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  const list = TURMAS_PREDEFINIDAS[turno] || [];
  list.forEach(t=>{
    const o = document.createElement("option");
    o.value = t; o.textContent = t;
    selectEl.appendChild(o);
  });
  // opção para digitar nova
  const oOutro = document.createElement("option");
  oOutro.value = "_outra_"; oOutro.textContent = "Outra (digitar)";
  selectEl.appendChild(oOutro);
}
if (selTurnoLeitor && selTurmaLeitor) {
  selTurnoLeitor.addEventListener("change", ()=>{
    preencherTurmasSelect(selTurmaLeitor, selTurnoLeitor.value);
  });
}

if (formLeitor) {
  formLeitor.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const nome = inpNomeLeitor.value.trim();
    const serie = (inpSerieLeitor.value || "").trim();
    let turma  = selTurmaLeitor.value;
    const turno = selTurnoLeitor.value;
    const nasc = inpNascLeitor.value;
    const email = outEmailLeitor.value.trim();
    const senha = inpSenhaLeitor.value;

    if (!nome || !serie || !turno || !nasc || !email || !senha) {
      showToast("Preencha todos os campos do leitor.", "warning");
      return;
    }

    if (turma === "_outra_") {
      turma = prompt("Digite a turma:");
      if (!turma) return showToast("Informe a turma.", "warning");
    }

    try {
      const id = await gerarProximoIdSequencial("leitores");
      await setDoc(doc(db, "leitores", id), {
        nome, serie, turma, turno, dataNascimento: nasc, email, senha,
        criadoEm: new Date().toISOString()
      });
      showToast(`Leitor(a) "${nome}" cadastrado(a)!`, "success");
      formLeitor.reset();
      outEmailLeitor.value = "";
    } catch(err) {
      showToast("Erro ao cadastrar leitor: " + err.message, "error");
    }
  });
}

// ====== CADASTRAR LIVROS EMPRESTADOS ======
const formEmp = document.getElementById("form-cadastrar-emprestimo");
const empNome = document.getElementById("emp-nome");
const empSerie = document.getElementById("emp-serie");
const empTurma = document.getElementById("emp-turma");
const empTurno = document.getElementById("emp-turno");
const empLivro = document.getElementById("emp-livro");
const empDias  = document.getElementById("emp-dias");
const empAteMes = document.getElementById("emp-ate-mes"); // opcional: 1..12

function preencherTurmasEmp() {
  if (!empTurma || !empTurno) return;
  empTurno.addEventListener("change", ()=>{
    preencherTurmasSelect(empTurma, empTurno.value);
  });
}
preencherTurmasEmp();

if (formEmp) {
  formEmp.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const nomeLeitor = empNome.value.trim();
    const serie = (empSerie.value||"").trim();
    let turma = empTurma.value;
    const turno = empTurno.value;
    const nomeLivro = empLivro.value.trim();
    const dias = Number(empDias.value || 0);
    const mesAlvo = empAteMes.value ? Number(empAteMes.value) : null;

    if (!nomeLeitor || !serie || !turno || !nomeLivro || (!dias && !mesAlvo)) {
      showToast("Preencha todos os campos exigidos do empréstimo.", "warning");
      return;
    }
    if (turma === "_outra_") {
      turma = prompt("Digite a turma:");
      if (!turma) return showToast("Informe a turma.", "warning");
    }

    const agoraISO = todayISO();
    let dataDevolucao = addDaysISO(agoraISO, dias || 0);
    if (mesAlvo) {
      const d = new Date(agoraISO);
      const ld = lastDayOfMonth(d.getFullYear(), mesAlvo - 1);
      // se último dia do mês alvo for maior que a data calculada por dias, usa o maior
      const isoMes = new Date(Date.UTC(ld.getFullYear(), ld.getMonth(), ld.getDate(), 0,0,0)).toISOString();
      if (new Date(isoMes) > new Date(dataDevolucao)) dataDevolucao = isoMes;
    }

    try {
      // Cria registro do empréstimo ativo
      const id = await gerarProximoIdSequencial("livrosEmprestados");
      await setDoc(doc(db, "livrosEmprestados", id), {
        nomeLeitor, serie, turma, turno, nomeLivro,
        dataEmprestimo: agoraISO,
        dataDevolucao,
        status: "ativo"
      });

      // Log para ranking
      await addDoc(collection(db, "emprestimosLogs"), {
        nomeLeitor, serie, turma, turno, nomeLivro,
        dataEmprestimo: agoraISO
      });

      showToast(`Empréstimo de "${nomeLivro}" para ${nomeLeitor} registrado!`, "success");
      formEmp.reset();
      carregarEmprestimos(); // atualiza lista
    } catch(err) {
      showToast("Erro ao cadastrar empréstimo: " + err.message, "error");
    }
  });
}

// ====== LISTA DE EMPRESTADOS + FILTROS + AÇÕES ======
const buscaEmp = document.getElementById("emp-busca");
const filtroTurno = document.getElementById("emp-filtro-turno");
const filtroTurma = document.getElementById("emp-filtro-turma");
const tabelaEmpBody = document.getElementById("emp-tbody");

if (filtroTurno && filtroTurma) {
  filtroTurno.addEventListener("change", ()=>{
    preencherTurmasSelect(filtroTurma, filtroTurno.value);
    renderEmprestados(); // re-filtra
  });
  filtroTurma.addEventListener("change", renderEmprestados);
}
if (buscaEmp) buscaEmp.addEventListener("input", renderEmprestados);

let EMP_CACHE = []; // cache local carregado de Firestore

async function carregarEmprestimos() {
  const snap = await getDocs(collection(db, "livrosEmprestados"));
  EMP_CACHE = snap.docs.map(d=>({id:d.id, ...d.data()}))
    .sort((a,b)=> (a.nomeLeitor||"").localeCompare(b.nomeLeitor||"", "pt", {sensitivity:"base"}));
  // Gera/atualiza notificações
  await gerarNotificacoesParaEmprestimos(EMP_CACHE);
  renderEmprestados();
  carregarNotificacoes();
}

function statusEmprestimo(e) {
  const hojeISO = todayISO();
  const dias = diffDays(hojeISO, e.dataDevolucao);
  if (dias < 0) {
    const atras = Math.abs(dias);
    return { texto: `Devolução não atendida há ${atras} dia(s)`, tipo: "atrasado", diasRestantes: dias };
  } else if (dias <= 3) {
    return { texto: `Faltam ${dias} dia(s)`, tipo: "alerta", diasRestantes: dias };
  }
  return { texto: `Faltam ${dias} dia(s)`, tipo: "ok", diasRestantes: dias };
}

function passaFiltros(e) {
  const termo = normalizarTexto(buscaEmp?.value || "");
  const turno = filtroTurno?.value || "";
  const turma = filtroTurma?.value || "";
  const nome = normalizarTexto(e.nomeLeitor);
  const livro = normalizarTexto(e.nomeLivro);
  const okBusca = !termo || nome.includes(termo) || livro.includes(termo);
  const okTurno = !turno || e.turno === turno;
  const okTurma = !turma || turma === "_outra_" || e.turma === turma;
  return okBusca && okTurno && okTurma;
}

function btn(text, cls, handler) {
  const b = document.createElement("button");
  b.textContent = text;
  b.className = cls;
  b.style.marginRight = "6px";
  b.addEventListener("click", handler);
  return b;
}

async function acaoEntregue(id) {
  if (!confirm("Confirmar: marcar como ENTREGUE e remover da lista?")) return;
  try {
    await deleteDoc(doc(db, "livrosEmprestados", id));
    // remove notificações vinculadas
    const qn = query(collection(db, "notificacoes"), where("emprestimoId", "==", id));
    const ns = await getDocs(qn);
    await Promise.all(ns.docs.map(d=>deleteDoc(d.ref)));
    showToast("Livro marcado como entregue!", "success");
    carregarEmprestimos();
  } catch(err) {
    showToast("Erro ao marcar como entregue: " + err.message, "error");
  }
}

async function acaoProrrogar(e) {
  // Usuário escolhe: número e mês (opcional)
  const extraDias = Number(prompt("Dias a acrescentar (ex.: 7):", "7") || 0);
  let mesAlvo = prompt("Mês para manter até o final (1-12) (opcional):", "");
  mesAlvo = mesAlvo ? Number(mesAlvo) : null;

  if (!extraDias && !mesAlvo) return showToast("Nenhuma prorrogação aplicada.", "info");

  let nova = addDaysISO(e.dataDevolucao, extraDias || 0);
  if (mesAlvo) {
    const d = new Date(nova);
    const ld = lastDayOfMonth(d.getFullYear(), mesAlvo - 1);
    const isoMes = new Date(Date.UTC(ld.getFullYear(), ld.getMonth(), ld.getDate(), 0,0,0)).toISOString();
    if (new Date(isoMes) > new Date(nova)) nova = isoMes;
  }
  try {
    await updateDoc(doc(db, "livrosEmprestados", e.id), { dataDevolucao: nova });
    showToast("Prazo prorrogado!", "success");
    carregarEmprestimos();
  } catch(err) {
    showToast("Erro ao prorrogar: " + err.message, "error");
  }
}

function renderEmprestados() {
  if (!tabelaEmpBody) return;
  tabelaEmpBody.innerHTML = "";
  EMP_CACHE.filter(passaFiltros).forEach(e=>{
    const st = statusEmprestimo(e);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.nomeLeitor}</td>
      <td>${e.serie}</td>
      <td>${e.turma}</td>
      <td>${e.turno}</td>
      <td>${e.nomeLivro}</td>
      <td>${formatDateBR(e.dataEmprestimo)}</td>
      <td>${formatDateBR(e.dataDevolucao)}</td>
      <td>${st.texto}</td>
      <td></td>
    `;
    const tdAcoes = tr.lastElementChild;
    tdAcoes.appendChild(btn("Prorrogar","btn-acao", ()=>acaoProrrogar(e)));
    tdAcoes.appendChild(btn("Livro Entregue","btn-primario", ()=>acaoEntregue(e.id)));
    if (st.tipo === "atrasado") {
      tr.style.backgroundColor = "rgba(200,0,0,.08)";
    } else if (st.tipo === "alerta") {
      tr.style.backgroundColor = "rgba(255,193,7,.08)";
    }
    tabelaEmpBody.appendChild(tr);
  });
}

// ====== NOTIFICAÇÕES ======
const notifLista = document.getElementById("notif-lista");

async function gerarNotificacoesParaEmprestimos(lista) {
  // Cria "aviso" faltando <=3 dias e "atraso" quando passou
  const hojeISO = todayISO();

  for (const e of lista) {
    const dias = diffDays(hojeISO, e.dataDevolucao);

    // Aviso (<=3 e >=0)
    if (dias >= 0 && dias <= 3) {
      await registrarNotificacaoSeNaoExiste(e.id, "aviso",
        `Faltam ${dias} dia(s) para ${e.nomeLeitor} devolver "${e.nomeLivro}".`);
    }

    // Atraso (<0)
    if (dias < 0) {
      const atras = Math.abs(dias);
      await registrarNotificacaoSeNaoExiste(e.id, "atraso",
        `Devolução não atendida há ${atras} dia(s): ${e.nomeLeitor} - "${e.nomeLivro}".`);
    }
  }
}

async function registrarNotificacaoSeNaoExiste(emprestimoId, tipo, mensagem) {
  const qn = query(
    collection(db, "notificacoes"),
    where("emprestimoId","==", emprestimoId),
    where("tipo","==", tipo),
    where("lida","==", false)
  );
  const s = await getDocs(qn);
  if (!s.empty) return; // já existe uma não lida igual
  await addDoc(collection(db, "notificacoes"), {
    emprestimoId, tipo, mensagem, lida: false, criadoEm: new Date().toISOString()
  });
}

async function carregarNotificacoes() {
  if (!notifLista) return;
  notifLista.innerHTML = "";
  const snap = await getDocs(query(collection(db, "notificacoes"), orderBy("criadoEm","desc")));
  if (snap.empty) {
    notifLista.innerHTML = `<li class="notif-vazio">Sem notificações.</li>`;
    return;
  }
  snap.docs.forEach(d=>{
    const n = d.data();
    const li = document.createElement("li");
    li.className = "notif-item";
    li.innerHTML = `
      <span>${n.mensagem}</span>
      <div class="notif-acoes">
        <button class="btn-acao" data-id="${d.id}">Marcar como lida</button>
        <button class="btn-remover" data-id="${d.id}">Excluir</button>
      </div>
    `;
    notifLista.appendChild(li);
  });

  notifLista.querySelectorAll(".btn-acao").forEach(b=>{
    b.addEventListener("click", async ()=>{
      const id = b.getAttribute("data-id");
      await updateDoc(doc(db, "notificacoes", id), { lida: true });
      carregarNotificacoes();
    });
  });
  notifLista.querySelectorAll(".btn-remover").forEach(b=>{
    b.addEventListener("click", async ()=>{
      const id = b.getAttribute("data-id");
      await deleteDoc(doc(db, "notificacoes", id));
      carregarNotificacoes();
    });
  });
}

// ====== RANKING (Bimestre e Anual) ======
const rankTabelaBody = document.getElementById("rank-tbody");
const rankBimInicio = document.getElementById("rank-bim-inicio");
const rankBimFim = document.getElementById("rank-bim-fim");
const rankSalvarBim = document.getElementById("rank-salvar-bim");
const rankAnoAtivo = document.getElementById("rank-ano-ativo");
const rankSalvarAno = document.getElementById("rank-salvar-ano");

async function salvarConfigBimestre() {
  if (!rankBimInicio.value || !rankBimFim.value) {
    showToast("Informe início e fim do bimestre.", "warning"); return;
  }
  await setDoc(doc(db, "config", "bimestreAtual"), {
    inicio: new Date(rankBimInicio.value+"T00:00:00.000Z").toISOString(),
    fim: new Date(rankBimFim.value+"T00:00:00.000Z").toISOString()
  });
  showToast("Bimestre atualizado!", "success");
  carregarRanking();
}
if (rankSalvarBim) rankSalvarBim.addEventListener("click", salvarConfigBimestre);

async function salvarConfigAno() {
  const ano = Number(rankAnoAtivo.value);
  if (!ano) return showToast("Ano inválido.", "warning");
  await setDoc(doc(db, "config", "anoAtivo"), { ano });
  showToast("Ano ativo atualizado!", "success");
  carregarRanking();
}
if (rankSalvarAno) rankSalvarAno.addEventListener("click", salvarConfigAno);

async function getConfigBimestre() {
  const s = await getDocs(collection(db, "config"));
  let inicio=null, fim=null, anoAt=null;
  s.docs.forEach(d=>{
    if (d.id === "bimestreAtual") { inicio = d.data().inicio; fim = d.data().fim; }
    if (d.id === "anoAtivo") { anoAt = d.data().ano; }
  });
  return { inicio, fim, anoAtivo: anoAt || new Date().getFullYear() };
}

async function carregarRanking() {
  if (!rankTabelaBody) return;
  rankTabelaBody.innerHTML = "<tr><td colspan='5'>Carregando...</td></tr>";

  // Lê config
  const cfg = await getConfigBimestre();
  if (rankBimInicio) rankBimInicio.value = cfg.inicio ? cfg.inicio.slice(0,10) : "";
  if (rankBimFim)    rankBimFim.value    = cfg.fim ? cfg.fim.slice(0,10) : "";
  if (rankAnoAtivo)  rankAnoAtivo.value  = cfg.anoAtivo;

  // Carrega logs
  const logsSnap = await getDocs(collection(db, "emprestimosLogs"));
  const logs = logsSnap.docs.map(d=>d.data());

  // Filtros de período
  const dentroBimestre = (iso) => cfg.inicio && cfg.fim && (new Date(iso) >= new Date(cfg.inicio)) && (new Date(iso) <= new Date(cfg.fim));
  const dentroAno = (iso) => (new Date(iso).getFullYear() === Number(cfg.anoAtivo));

  // Agrupa
  const mapBim = new Map(); // nomeLeitor -> cont
  const mapAno = new Map();
  logs.forEach(l=>{
    if (cfg.inicio && cfg.fim && dentroBimestre(l.dataEmprestimo)) {
      mapBim.set(l.nomeLeitor, (mapBim.get(l.nomeLeitor)||0)+1);
    }
    if (dentroAno(l.dataEmprestimo)) {
      mapAno.set(l.nomeLeitor, (mapAno.get(l.nomeLeitor)||0)+1);
    }
  });

  function topArray(map) {
    return Array.from(map.entries())
      .map(([nome, total])=>({nome,total}))
      .sort((a,b)=> b.total - a.total);
  }

  const topBim = topArray(mapBim);
  const topAno = topArray(mapAno);

  // Render
  rankTabelaBody.innerHTML = "";
  const maxLen = Math.max(topBim.length, topAno.length);
  if (!maxLen) {
    rankTabelaBody.innerHTML = "<tr><td colspan='5'>Sem dados de ranking.</td></tr>";
    return;
  }

  for (let i=0;i<maxLen;i++){
    const b = topBim[i];
    const a = topAno[i];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${b ? b.nome : "-"}</td>
      <td>${b ? b.total : "-"}</td>
      <td>${a ? a.nome : "-"}</td>
      <td>${a ? a.total : "-"}</td>
    `;
    rankTabelaBody.appendChild(tr);
  }
}

// Carregamento inicial básico
carregarNotificacoes();
