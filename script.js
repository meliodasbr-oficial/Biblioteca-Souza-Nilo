import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const divGeneros = document.getElementById("generos");
const divBotoes = document.getElementById("botoes-generos");
const inputPesquisa = document.getElementById("pesquisa");
document.getElementById("btn-login").addEventListener("click", () => {
  window.location.href = "login.html";
});
document.getElementById("btn-login-leitor").addEventListener("click", () => {
  window.location.href = "login-leitor.html";
});

const livrosPorGenero = {};
let generoSelecionado = "Todos";

async function carregarLivros() {
  const snapshot = await getDocs(collection(db, "livros"));

  snapshot.forEach(doc => {
    const livro = doc.data();
    const genero = livro.genero || "Sem Gênero";

    if (!livrosPorGenero[genero]) livrosPorGenero[genero] = [];
    livrosPorGenero[genero].push(livro);
  });

  criarBotoesGeneros();
  renderizarLivros();
}

function criarBotoesGeneros() {
  divBotoes.innerHTML = "";

  const todosBtn = document.createElement("button");
  todosBtn.textContent = "Todos";
  todosBtn.classList.add("botao-genero", "ativo");
  todosBtn.addEventListener("click", () => filtrarPorGenero("Todos"));
  divBotoes.appendChild(todosBtn);

  for (const genero in livrosPorGenero) {
    const btn = document.createElement("button");
    btn.textContent = genero;
    btn.classList.add("botao-genero");
    btn.addEventListener("click", () => filtrarPorGenero(genero));
    divBotoes.appendChild(btn);
  }
}

function filtrarPorGenero(genero) {
  generoSelecionado = genero;

  document.querySelectorAll(".botao-genero").forEach(b => {
    b.classList.toggle("ativo", b.textContent === genero);
  });

  renderizarLivros();
}

function renderizarLivros() {
  divGeneros.innerHTML = "";

  const generos = generoSelecionado === "Todos"
    ? Object.keys(livrosPorGenero)
    : [generoSelecionado];

  generos.forEach(genero => {
    const livros = livrosPorGenero[genero];
    if (!livros || livros.length === 0) return;

    const divGenero = document.createElement("div");
    divGenero.classList.add("genero");

    const tituloGenero = document.createElement("h2");
    tituloGenero.classList.add("titulo-genero");
    tituloGenero.textContent = genero;
    divGenero.appendChild(tituloGenero);

    const divLivros = document.createElement("div");
    divLivros.classList.add("livros");

    livros.forEach(livro => {
      const card = document.createElement("div");
      card.classList.add("livro-card");
      card.innerHTML = `
        <h3>${livro.nome}</h3>
        <p><strong>Autor:</strong> ${livro.autor}</p>
        <p><strong>Volume:</strong> ${livro.volume || "-"}</p>
        <p><strong>Prateleira:</strong> ${livro.prateleira || "-"}</p>
        <p><strong>Disponível:</strong> ${livro.disponivel ?? 0}</p>
      `;
      divLivros.appendChild(card);
    });

    divGenero.appendChild(divLivros);
    divGeneros.appendChild(divGenero);
  });

  aplicarFiltroPesquisa();
}

// ======= PESQUISA POR TEXTO =======
inputPesquisa.addEventListener("input", aplicarFiltroPesquisa);

function aplicarFiltroPesquisa() {
  const termo = inputPesquisa.value.toLowerCase();
  const generos = document.querySelectorAll(".genero");

  generos.forEach(genero => {
    let tem = false;
    const tituloGenero = genero.querySelector(".titulo-genero");
    const livros = genero.querySelectorAll(".livro-card");

    livros.forEach(livro => {
      const texto = livro.textContent.toLowerCase();
      const visivel = texto.includes(termo);
      livro.style.display = visivel ? "block" : "none";
      if (visivel) tem = true;
    });

    tituloGenero.style.display = tem ? "block" : "none";
  });
}

// ======= INICIAR =======
carregarLivros();
