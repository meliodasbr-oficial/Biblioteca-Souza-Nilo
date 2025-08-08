// ======= IMPORTS FIREBASE =======
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs,
  doc, setDoc, updateDoc, deleteDoc, query, where
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ======= CONFIGURAÇÃO FIREBASE =======
const firebaseConfig = {
  apiKey: "AIzaSyDsDQ8AzInwgdA8gO9XOTIiqVUtOH5FYNQ",
  authDomain: "biblioteca-souza-nilo.firebaseapp.com",
  projectId: "biblioteca-souza-nilo",
  storageBucket: "biblioteca-souza-nilo.firebasestorage.app",
  messagingSenderId: "927105626349",
  appId: "1:927105626349:web:58b89b3fc32438bdde1ce4",
  measurementId: "G-HYC39S6B8W"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ======= LOGIN E LOGOUT =======
onAuthStateChanged(auth, (user) => {
  if (!user) {
    location.replace("login.html");
  } else {
    console.log("Usuário autenticado:", user.email);
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth)
    .then(() => location.replace("login.html"))
    .catch((error) => {
      alert("Erro ao sair. Tente novamente.");
      console.error(error);
    });
});

// ======= TOASTS =======
const toastContainer = document.getElementById("toast-container");
function showToast(message, type = "success", duration = 5000) {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let emoji = "ℹ️";
  if (type === "success") emoji = "✅";
  else if (type === "error") emoji = "❌";
  else if (type === "warning") emoji = "⚠️";

  toast.innerHTML = `
    <span class="emoji">${emoji}</span>
    <span class="message">${message}</span>
    <div class="duration-bar"></div>
  `;

  toastContainer.appendChild(toast);

  // Animação da barra de duração
  const durationBar = toast.querySelector(".duration-bar");
  durationBar.style.animation = `durationBarAnim ${duration}ms linear forwards`;

  // Após o tempo, anima saída e remove toast
  setTimeout(() => {
    toast.style.animation = "slideOutToast 0.5s forwards";
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, duration);
}

// ======= CONTROLE DE SEÇÕES =======
const botoes = {
  "card-livros": "secao-livros-registrados",
  "card-remover": "secao-remover-livros",
  "card-registrar": "secao-registrar-livro",
  "card-criar": "secao-criar-genero"
};

Object.keys(botoes).forEach(id => {
  const botao = document.getElementById(id);
  botao.addEventListener("click", () => {
    Object.values(botoes).forEach(secao => {
      document.getElementById(secao).style.display = "none";
    });
    document.getElementById(botoes[id]).style.display = "block";

    if (id === "card-criar") carregarGeneros();
    if (id === "card-livros" || id === "card-remover") carregarLivros();
  });
});

document.getElementById("btn-cancelar-registrar").addEventListener("click", () => {
  document.getElementById("secao-registrar-livro").style.display = "none";
});

document.getElementById("btn-cancelar-genero").addEventListener("click", () => {
  document.getElementById("secao-criar-genero").style.display = "none";
});

// ======= VARIÁVEL GLOBAL DOS GÊNEROS CADASTRADOS =======
let generosCadastrados = [];

// ======= GERAR PRÓXIMO ID SEQUENCIAL =======
async function gerarProximoIdSequencial(nomeColecao) {
  const snapshot = await getDocs(collection(db, nomeColecao));
  if (snapshot.empty) return "01";

  const numeros = snapshot.docs
    .map(doc => parseInt(doc.id))
    .filter(num => !isNaN(num))
    .sort((a, b) => a - b);

  let prox = 1;
  for (const num of numeros) {
    if (num === prox) prox++;
    else break;
  }

  return prox.toString().padStart(2, "0");
}

// ======= Função de normalização de texto =======
function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// ======= VERIFICAR DUPLICIDADE DE LIVRO =======
async function livroExiste(nome, autor, volume) {
  const nomeNormalizado = normalizarTexto(nome);
  const autorNormalizado = normalizarTexto(autor);
  const volumeNormalizado = volume.trim();

  const livrosSnap = await getDocs(collection(db, "livros"));
  return livrosSnap.docs.some(doc => {
    const data = doc.data();
    const nomeDoc = normalizarTexto(data.nome);
    const autorDoc = normalizarTexto(data.autor);
    const volumeDoc = data.volume ? data.volume.trim() : "1";

    return nomeDoc === nomeNormalizado && autorDoc === autorNormalizado && volumeDoc === volumeNormalizado;
  });
}

// ======= SALVAR LIVRO =======
async function salvarLivro(livroData) {
  const { nome, autor, genero } = livroData;
  const dataHora = new Date().toISOString();

  // Salva na coleção "livros"
  const proxIdLivros = await gerarProximoIdSequencial("livros");
  await setDoc(doc(db, "livros", proxIdLivros), { ...livroData, registradoEm: dataHora });

  // Salva na coleção do gênero
  const proxIdGenero = await gerarProximoIdSequencial(genero);
  await setDoc(doc(db, genero, proxIdGenero), { ...livroData, registradoEm: dataHora });
}

// ======= FUNÇÕES PARA CRIAR TABELA E EFEITOS =======
function criarBotao(texto, classe, onClick) {
  const btn = document.createElement("button");
  btn.textContent = texto;
  btn.className = classe;
  btn.style.marginLeft = "10px";
  btn.addEventListener("click", onClick);
  return btn;
}

function aplicarEfeitoHoverELinha(tr) {
  tr.style.transition = "background-color 0.3s";
  tr.addEventListener("mouseenter", () => {
    tr.style.backgroundColor = "#333";
    tr.style.cursor = "pointer";
  });
  tr.addEventListener("mouseleave", () => {
    if (!tr.classList.contains("selecionado")) {
      tr.style.backgroundColor = "transparent";
    }
  });
}

function criarTabelaLivros(livros, tipoCard) {
  const tabela = document.createElement("table");
  tabela.style.width = "100%";
  tabela.style.borderCollapse = "collapse";

  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  ["Nome", "Autor", "Gênero", "Quantidade", "Volume", "Prateleira", ""].forEach(texto => {
    const th = document.createElement("th");
    th.textContent = texto;
    th.style.borderBottom = "2px solid #ff4444";
    th.style.padding = "8px";
    th.style.textAlign = "left";
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  tabela.appendChild(thead);

  const tbody = document.createElement("tbody");

  livros.forEach(livro => {
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid #444";

    ["nome", "autor", "genero", "quantidade", "volume", "prateleira"].forEach(campo => {
      const td = document.createElement("td");
      td.textContent = livro[campo] || (campo === "volume" ? "1" : "");
      td.style.padding = "8px";
      tr.appendChild(td);
    });

    const tdBtn = document.createElement("td");
    tdBtn.style.padding = "8px";

    let botao;
    if (tipoCard === "remover") {
      botao = criarBotao("Remover", "btn-remover", async () => {
        const confirmar = confirm(`Deseja realmente remover o livro "${livro.nome}" volume ${livro.volume || "1"}?`);
        if (!confirmar) return;

        try {
          await deleteDoc(doc(db, "livros", livro.id));
          showToast(`Livro "${livro.nome}" volume ${livro.volume || "1"} foi removido com sucesso!`, "success");
          carregarLivros();
        } catch (err) {
          showToast("Erro ao remover livro: " + err.message, "error");
        }
      });
    }

    if (botao) {
      botao.style.display = "none";
      tdBtn.appendChild(botao);
    }

    tr.appendChild(tdBtn);

    aplicarEfeitoHoverELinha(tr);

    tr.addEventListener("click", () => {
      const tbody = tr.parentNode;
      const linhaSelecionada = tbody.querySelector("tr.selecionado");

      if (linhaSelecionada === tr) {
        tr.classList.remove("selecionado");
        if (botao) botao.style.display = "none";
        tr.style.backgroundColor = "transparent";
      } else {
        tbody.querySelectorAll("tr").forEach(linha => {
          linha.classList.remove("selecionado");
          const btns = linha.querySelectorAll("button");
          btns.forEach(b => (b.style.display = "none"));
          linha.style.backgroundColor = "transparent";
        });
        tr.classList.add("selecionado");
        if (botao) botao.style.display = "inline-block";
        tr.style.backgroundColor = "#555";
      }
    });

    tbody.appendChild(tr);
  });

  tabela.appendChild(tbody);
  return tabela;
}

// ======= CARREGAR LIVROS =======
async function carregarLivros() {
  const snapshot = await getDocs(collection(db, "livros"));
  const livros = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

  exibirLivrosRegistrados(livros);
  exibirLivrosRemover(livros);
}

function exibirLivrosRegistrados(livros) {
  const container = document.getElementById("lista-livros-registrados");
  container.innerHTML = "";
  if (livros.length === 0) {
    container.innerHTML = `<p class="sem-livros">Nenhum livro registrado.</p>`;
    return;
  }
  // Aqui não mostra botão editar, só lista
  const tabela = criarTabelaLivros(livros, "registrados");
  container.appendChild(tabela);
}

function exibirLivrosRemover(livros) {
  const container = document.getElementById("lista-livros-remover");
  container.innerHTML = "";
  if (livros.length === 0) {
    container.innerHTML = `<p class="sem-livros">Nenhum livro disponível para remoção.</p>`;
    return;
  }
  const tabela = criarTabelaLivros(livros, "remover");
  container.appendChild(tabela);
}

// ======= CARREGAR GÊNEROS =======
async function carregarGeneros() {
  const snapshot = await getDocs(collection(db, "generos"));
  const generos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  generosCadastrados = generos.map(g => g.nome);

  const container = document.getElementById("lista-generos");
  container.innerHTML = "";

  if (generos.length === 0) {
    container.innerHTML = `<p class="sem-livros">Nenhum gênero cadastrado.</p>`;
    return;
  }

  generos.forEach(genero => {
    const div = document.createElement("div");
    div.className = "genero-item";
    div.style.display = "flex";
    div.style.justifyContent = "space-between";
    div.style.alignItems = "center";
    div.style.padding = "6px 10px";
    div.style.borderBottom = "1px solid #444";
    div.style.cursor = "pointer";

    const spanNome = document.createElement("span");
    spanNome.textContent = genero.nome;

    const btnExcluir = document.createElement("button");
    btnExcluir.textContent = "Excluir";
    btnExcluir.className = "btn-remover";
    btnExcluir.style.marginLeft = "10px";
    btnExcluir.style.display = "none";

    btnExcluir.addEventListener("click", async (e) => {
  e.stopPropagation();
  const confirmar = confirm(`Deseja excluir o gênero "${genero.nome}"? Isso também removerá todos os livros associados.`);
  if (!confirmar) return;

  try {
    // Remove os livros da subcoleção do gênero
    const generoRef = collection(db, genero.nome);
    const livrosSnap = await getDocs(generoRef);
    const promGen = livrosSnap.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(promGen);

    // Remove os livros da coleção principal "livros"
    const livrosRef = collection(db, "livros");
    const q = query(livrosRef, where("genero", "==", genero.nome));
    const snapLivros = await getDocs(q);
    const promLivros = snapLivros.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(promLivros);

    // Por fim, remove o documento do gênero
    await deleteDoc(doc(db, "generos", genero.id));

    showToast(`Gênero "${genero.nome}" e livros relacionados foram removidos!`, "success");
    carregarGeneros();
    carregarLivros();
  } catch (err) {
    showToast("Erro ao remover gênero e livros: " + err.message, "error");
  }
});


    div.appendChild(spanNome);
    div.appendChild(btnExcluir);

    div.addEventListener("click", () => {
      const selecionado = div.classList.contains("selecionado");
      const todosItens = document.querySelectorAll(".genero-item");
      todosItens.forEach(item => {
        item.classList.remove("selecionado");
        item.querySelector("button").style.display = "none";
      });

      if (!selecionado) {
        div.classList.add("selecionado");
        btnExcluir.style.display = "inline-block";
      }
    });

    container.appendChild(div);
  });
}

// ======= MODAL DE GÊNEROS =======
const inputGeneroLivro = document.getElementById("generoLivro");
const modalGenero = document.getElementById("modalGenero");
const listaGenerosModal = document.getElementById("listaGenerosModal");
const btnFecharModalGenero = document.getElementById("fecharModalGenero");

inputGeneroLivro.addEventListener("click", () => {
  preencherListaGenerosNoModal();
  modalGenero.style.display = "flex";
});

btnFecharModalGenero.addEventListener("click", () => {
  modalGenero.style.display = "none";
});

modalGenero.addEventListener("click", (e) => {
  if (e.target === modalGenero) {
    modalGenero.style.display = "none";
  }
});

function preencherListaGenerosNoModal() {
  listaGenerosModal.innerHTML = "";

  if (generosCadastrados.length === 0) {
    listaGenerosModal.innerHTML = "<li>Nenhum gênero cadastrado.</li>";
    return;
  }

  generosCadastrados.forEach(genero => {
    const li = document.createElement("li");
    li.textContent = genero;
    li.style.cursor = "pointer";
    li.style.padding = "8px 12px";
    li.style.borderRadius = "4px";

    li.addEventListener("mouseenter", () => {
      li.style.backgroundColor = "";
    });
    li.addEventListener("mouseleave", () => {
      li.style.backgroundColor = "transparent";
    });

    li.addEventListener("click", () => {
      inputGeneroLivro.value = genero;
      modalGenero.style.display = "none";
    });

    listaGenerosModal.appendChild(li);
  });
}

// ======= FORMULÁRIO REGISTRAR LIVRO =======
document.getElementById("form-registrar-livro").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nomeLivro").value.trim();
  const autor = document.getElementById("autorLivro").value.trim();
  const genero = inputGeneroLivro.value.trim();
  const quantidade = Number(document.getElementById("quantidadeLivro").value);
  const volume = document.getElementById("volumeLivro")?.value.trim() || "1";
  const prateleira = document.getElementById("numeroPrateleira").value.trim();


  if (!nome || !autor || !genero || quantidade <= 0) {
    showToast("Preencha todos os campos corretamente.", "warning");
    return;
  }

  if (!generosCadastrados.includes(genero)) {
    showToast("Gênero inválido. Escolha um gênero existente.", "warning");
    return;
  }

  if (await livroExiste(nome, autor, volume)) {
    showToast(`Livro "${nome}" volume ${volume} já cadastrado.`, "warning");
    return;
  }

  const livroData = { nome, autor, genero, quantidade, volume, prateleira };

  try {
    await salvarLivro(livroData);
    showToast(`"${nome}" volume ${volume} foi adicionado com sucesso!`, "success");
    document.getElementById("form-registrar-livro").reset();
    carregarLivros();
  } catch (err) {
    showToast("Erro ao registrar livro: " + err.message, "error");
  }
});

// ======= FORMULÁRIO CRIAR GÊNERO =======
document.getElementById("form-criar-genero").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nomeGenero = document.getElementById("inputNovoGenero").value.trim();

  if (!nomeGenero) {
    showToast("Informe o nome do gênero.", "warning");
    return;
  }

  if (generosCadastrados.includes(nomeGenero)) {
    showToast(`Gênero ("${nomeGenero}") já existe.`, "warning");
    return;
  }

  try {
    const proxIdGenero = await gerarProximoIdSequencial("generos");
    await setDoc(doc(db, "generos", proxIdGenero), { nome: nomeGenero });
    showToast(`Gênero "${nomeGenero}" foi criado com sucesso!`, "success");
    document.getElementById("form-criar-genero").reset();
    carregarGeneros();
  } catch (err) {
    showToast("Erro ao criar gênero: " + err.message, "error");
  }
});

// ======= FILTRO DE PESQUISA DE LIVROS =======
document.querySelectorAll(".livros-pesquisa").forEach(input => {
  input.addEventListener("input", async (e) => {
    const termo = normalizarTexto(e.target.value);

    const snapshot = await getDocs(collection(db, "livros"));
    const livros = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    const filtrados = livros.filter(livro => {
      const nome = normalizarTexto(livro.nome);
      const autor = normalizarTexto(livro.autor);
      const genero = normalizarTexto(livro.genero);
      const prateleira = normalizarTexto(livro.prateleira || "");
      const volume = normalizarTexto(livro.volume || "1");

      return (
        nome.includes(termo) ||
        autor.includes(termo) ||
        genero.includes(termo) ||
        prateleira.includes(termo) ||
        volume.includes(termo)
      );
    });

    const parentSection = e.target.closest(".livros-section");
    if (parentSection.id === "secao-livros-registrados") {
      exibirLivrosRegistrados(filtrados);
    } else if (parentSection.id === "secao-remover-livros") {
      exibirLivrosRemover(filtrados);
    }
  });
});


// ======= CARREGAMENTO INICIAL =======
carregarGeneros();
carregarLivros();

