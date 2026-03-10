// ======= IMPORTS FIREBASE =======
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  getDocs
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
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// ======= CACHE CONFIG =======
const CACHE_LIVROS = "livros_cache_v2";
const CACHE_ATUALIZACAO = "livros_cache_ultima_atualizacao_v2";
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 horas

// ======= REFERÊNCIAS =======
const divGeneros = document.getElementById("generos");
const divBotoes = document.getElementById("botoes-generos");
const inputPesquisa = document.getElementById("pesquisa");
const btnTema = document.getElementById("btn-tema");
const btnLogin = document.getElementById("btn-login");

// ======= ESTADO =======
let livrosCache = [];
let generoSelecionado = "Todos";

// ======= LOGIN =======
btnLogin.addEventListener("click", () => {
  window.location.href = "login.html";
});

// ======= HELPERS =======
function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function obterGenerosUnicos(livros) {
  return [...new Set(
    livros
      .map(l => l.genero || "Sem Gênero")
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));
}

function agruparPorGenero(livros) {
  const grupos = {};
  livros.forEach((livro) => {
    const genero = livro.genero || "Sem Gênero";
    if (!grupos[genero]) grupos[genero] = [];
    grupos[genero].push(livro);
  });

  Object.keys(grupos).forEach((genero) => {
    grupos[genero].sort((a, b) =>
      String(a.nome || "").localeCompare(String(b.nome || ""), "pt", { sensitivity: "base" })
    );
  });

  return grupos;
}

function cacheExpirado() {
  const ultima = localStorage.getItem(CACHE_ATUALIZACAO);
  if (!ultima) return true;

  const tempo = Date.now() - Number(ultima);
  return tempo > CACHE_TTL;
}

function salvarCacheLocal(livros) {
  localStorage.setItem(CACHE_LIVROS, JSON.stringify(livros));
  localStorage.setItem(CACHE_ATUALIZACAO, String(Date.now()));
}

function carregarCacheLocal() {
  const cache = localStorage.getItem(CACHE_LIVROS);
  if (!cache) return [];

  try {
    const dados = JSON.parse(cache);
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

// ======= FIRESTORE =======
async function buscarTodosLivros() {
  const snap = await getDocs(collection(db, "livros"));
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
}

// ======= BOTÕES DE GÊNERO =======
function criarBotoesGeneros() {
  const termo = normalizarTexto(inputPesquisa.value);

  if (termo) {
    divBotoes.style.display = "none";
    divBotoes.innerHTML = "";
    return;
  }

  divBotoes.style.display = "flex";
  divBotoes.innerHTML = "";

  const generos = obterGenerosUnicos(livrosCache);

  const todosBtn = document.createElement("button");
  todosBtn.textContent = "Todos";
  todosBtn.className = "botao-genero";
  if (generoSelecionado === "Todos") todosBtn.classList.add("ativo");
  todosBtn.onclick = () => filtrarPorGenero("Todos");
  divBotoes.appendChild(todosBtn);

  generos.forEach((genero) => {
    const btn = document.createElement("button");
    btn.textContent = genero;
    btn.className = "botao-genero";
    if (generoSelecionado === genero) btn.classList.add("ativo");
    btn.onclick = () => filtrarPorGenero(genero);
    divBotoes.appendChild(btn);
  });
}

function filtrarPorGenero(genero) {
  generoSelecionado = genero;
  criarBotoesGeneros();
  renderizarLivros();
}

// ======= RENDER =======
function criarCardLivro(livro) {
  const card = document.createElement("div");
  card.className = "livro-card";
  card.innerHTML = `
    <h3>${livro.nome || "-"}</h3>
    <p><strong>Autor:</strong> ${livro.autor || "-"}</p>
    <p><strong>Volume:</strong> ${livro.volume || "-"}</p>
    <p><strong>Prateleira:</strong> ${livro.prateleira || "-"}</p>
    <p><strong>Disponível:</strong> ${livro.quantidade ?? 0}</p>
  `;
  return card;
}

function renderizarLivros() {
  divGeneros.innerHTML = "";

  const termo = normalizarTexto(inputPesquisa.value);
  const pesquisaAtiva = termo.length > 0;

  let livrosFiltrados = [...livrosCache];

  if (!pesquisaAtiva && generoSelecionado !== "Todos") {
    livrosFiltrados = livrosFiltrados.filter(
      (livro) => (livro.genero || "Sem Gênero") === generoSelecionado
    );
  }

  if (pesquisaAtiva) {
    livrosFiltrados = livrosFiltrados.filter((livro) => {
      const textoLivro = [
        livro.nome,
        livro.autor,
        livro.genero,
        livro.volume,
        livro.prateleira
      ].map(normalizarTexto).join(" ");

      return textoLivro.includes(termo);
    });
  }

  if (!livrosFiltrados.length) {
    divGeneros.innerHTML = `<p class="sem-livros">Nenhum livro encontrado.</p>`;
    return;
  }

  if (pesquisaAtiva) {
    const divResultado = document.createElement("div");
    divResultado.className = "genero";

    const titulo = document.createElement("h2");
    titulo.className = "titulo-genero";
    titulo.textContent = "Resultado da pesquisa";
    divResultado.appendChild(titulo);

    const divLivros = document.createElement("div");
    divLivros.className = "livros";

    livrosFiltrados
      .sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt", { sensitivity: "base" }))
      .forEach((livro) => {
        divLivros.appendChild(criarCardLivro(livro));
      });

    divResultado.appendChild(divLivros);
    divGeneros.appendChild(divResultado);
    return;
  }

  const grupos = agruparPorGenero(livrosFiltrados);
  const generos = Object.keys(grupos).sort((a, b) =>
    a.localeCompare(b, "pt", { sensitivity: "base" })
  );

  generos.forEach((genero) => {
    const livros = grupos[genero];
    if (!livros || !livros.length) return;

    const divGenero = document.createElement("div");
    divGenero.className = "genero";

    const titulo = document.createElement("h2");
    titulo.className = "titulo-genero";
    titulo.textContent = genero;
    divGenero.appendChild(titulo);

    const divLivros = document.createElement("div");
    divLivros.className = "livros";

    livros.forEach((livro) => {
      divLivros.appendChild(criarCardLivro(livro));
    });

    divGenero.appendChild(divLivros);
    divGeneros.appendChild(divGenero);
  });
}

// ======= PESQUISA =======
inputPesquisa.addEventListener("input", () => {
  criarBotoesGeneros();
  renderizarLivros();
});

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

// ======= CARREGAMENTO ANTI-QUOTA =======
async function carregarLivros() {
  const cacheLocal = carregarCacheLocal();

  if (cacheLocal.length) {
    livrosCache = cacheLocal;
    criarBotoesGeneros();
    renderizarLivros();
  }

  const precisaAtualizar = cacheLocal.length === 0 || cacheExpirado();

  if (!precisaAtualizar) return;

  try {
    const livrosServidor = await buscarTodosLivros();
    livrosCache = livrosServidor;
    salvarCacheLocal(livrosServidor);
    criarBotoesGeneros();
    renderizarLivros();
  } catch (error) {
    console.error("Erro ao buscar livros:", error);
    if (!cacheLocal.length) {
      divGeneros.innerHTML = `<p class="sem-livros">Não foi possível carregar os livros.</p>`;
    }
  }
}

// ======= INICIAR =======
carregarLivros();