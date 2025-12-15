// ======= IMPORTS FIREBASE =======
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ======= CONFIG FIREBASE =======
const firebaseConfig = {
  apiKey: "AIzaSyDsDQ8AzInwgdA8gO9XOTIiqVUtOHFYNQ",
  authDomain: "biblioteca-souza-nilo.firebaseapp.com",
  projectId: "biblioteca-souza-nilo",
  storageBucket: "biblioteca-souza-nilo.appspot.com",
  messagingSenderId: "927105626349",
  appId: "1:927105626349:web:58b89b3fc32438bdde1ce4",
  measurementId: "G-HYC39S6B8W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ======= CACHE CONFIG =======
const CACHE_LIVROS = "livros_cache";
const CACHE_ATUALIZACAO = "livros_cache_ultima_atualizacao";
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 horas

// ======= REFERÊNCIAS =======
const divGeneros = document.getElementById("generos");
const divBotoes = document.getElementById("botoes-generos");
const inputPesquisa = document.getElementById("pesquisa");
const btnTema = document.getElementById("btn-tema");

document.getElementById("btn-login").addEventListener("click", () => {
  window.location.href = "login.html";
});

const livrosPorGenero = {};
let generoSelecionado = "Todos";

// ======= LIMPAR CACHE ANTIGO =======
function limparCacheAntigo() {
  const ultima = localStorage.getItem(CACHE_ATUALIZACAO);
  if (!ultima) return;

  const tempo = Date.now() - new Date(ultima).getTime();
  if (tempo > CACHE_TTL) {
    localStorage.removeItem(CACHE_LIVROS);
    localStorage.removeItem(CACHE_ATUALIZACAO);
    location.reload();
  }
}
function converterParaDate(valor) {
  if (!valor) return null;

  if (typeof valor.toDate === "function") {
    return valor.toDate();
  }

  if (valor instanceof Date) {
    return valor;
  }

  return new Date(valor);
}

// ======= CARREGAMENTO INTELIGENTE =======
async function carregarLivros() {
  const cache = localStorage.getItem(CACHE_LIVROS);
  const ultimaAtualizacao = localStorage.getItem(CACHE_ATUALIZACAO);

  // Usa cache imediatamente
  if (cache) {
    Object.assign(livrosPorGenero, JSON.parse(cache));
    criarBotoesGeneros();
    renderizarLivros();
  }

  // Busca apenas livros novos
  await buscarLivrosNovos(ultimaAtualizacao);

  criarBotoesGeneros();
  renderizarLivros();
}

// ======= BUSCAR LIVROS NOVOS (registradoEm) =======
async function buscarLivrosNovos(ultimaAtualizacao) {
  let snap;

  if (!ultimaAtualizacao) {
    snap = await getDocs(collection(db, "livros"));
  } else {
    const q = query(
      collection(db, "livros"),
      where("registradoEm", ">", new Date(ultimaAtualizacao)),
      orderBy("registradoEm", "asc")
    );
    snap = await getDocs(q);
  }

  if (snap.empty) return;

  let ultimaData = ultimaAtualizacao;

  snap.forEach(doc => {
    const livro = { id: doc.id, ...doc.data() };
    const genero = livro.genero || "Sem Gênero";

    if (!livrosPorGenero[genero]) livrosPorGenero[genero] = [];
    const jaExiste = livrosPorGenero[genero]
  .some(l => l.id === livro.id);

if (!jaExiste) {
  livrosPorGenero[genero].push(livro);
}

    const data = converterParaDate(livro.registradoEm);
    if (data) {
      ultimaData = data.toISOString();
    }
  });

  if (ultimaData) {
    localStorage.setItem(CACHE_ATUALIZACAO, ultimaData);
  }

  localStorage.setItem(CACHE_LIVROS, JSON.stringify(livrosPorGenero));
}

// ======= BOTÕES DE GÊNERO =======
function criarBotoesGeneros() {
  divBotoes.innerHTML = "";

  const todosBtn = document.createElement("button");
  todosBtn.textContent = "Todos";
  todosBtn.className = "botao-genero ativo";
  todosBtn.onclick = () => filtrarPorGenero("Todos");
  divBotoes.appendChild(todosBtn);

  for (const genero in livrosPorGenero) {
    const btn = document.createElement("button");
    btn.textContent = genero;
    btn.className = "botao-genero";
    btn.onclick = () => filtrarPorGenero(genero);
    divBotoes.appendChild(btn);
  }
}

// ======= FILTRO DE GÊNERO =======
function filtrarPorGenero(genero) {
  generoSelecionado = genero;

  document.querySelectorAll(".botao-genero").forEach(b => {
    b.classList.toggle("ativo", b.textContent === genero);
  });

  renderizarLivros();
}

// ======= RENDERIZAR LIVROS =======
function renderizarLivros() {
  divGeneros.innerHTML = "";

  const generos = generoSelecionado === "Todos"
    ? Object.keys(livrosPorGenero)
    : [generoSelecionado];

  generos.forEach(genero => {
    const livros = livrosPorGenero[genero];
    if (!livros || livros.length === 0) return;

    const divGenero = document.createElement("div");
    divGenero.className = "genero";

    const titulo = document.createElement("h2");
    titulo.className = "titulo-genero";
    titulo.textContent = genero;
    divGenero.appendChild(titulo);

    const divLivros = document.createElement("div");
    divLivros.className = "livros";

    livros.forEach(livro => {
      const card = document.createElement("div");
      card.className = "livro-card";
      card.innerHTML = `
        <h3>${livro.nome}</h3>
        <p><strong>Autor:</strong> ${livro.autor}</p>
        <p><strong>Volume:</strong> ${livro.volume || "-"}</p>
        <p><strong>Prateleira:</strong> ${livro.prateleira || "-"}</p>
        <p><strong>Disponível:</strong> ${livro.quantidade ?? 0}</p>
      `;
      divLivros.appendChild(card);
    });

    divGenero.appendChild(divLivros);
    divGeneros.appendChild(divGenero);
  });

  aplicarFiltroPesquisa();
}

// ======= PESQUISA =======
inputPesquisa.addEventListener("input", aplicarFiltroPesquisa);

function aplicarFiltroPesquisa() {
  const termo = inputPesquisa.value.toLowerCase();
  document.querySelectorAll(".livro-card").forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(termo)
      ? "block"
      : "none";
  });
}

// ======= TEMA =======
if (localStorage.getItem("tema") === "escuro") {
  document.body.classList.add("tema-escuro");
  btnTema.textContent = "☀️";
}

btnTema.onclick = () => {
  document.body.classList.toggle("tema-escuro");
  const escuro = document.body.classList.contains("tema-escuro");
  btnTema.textContent = escuro ? "☀️" : "🌙";
  localStorage.setItem("tema", escuro ? "escuro" : "claro");
};

// ======= INICIAR =======
limparCacheAntigo();
carregarLivros();
