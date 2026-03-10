import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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

let cacheLeitores = [];
let cacheLivros = [];
let cacheEmprestimos = [];
let dialogCallback = null;
let callbackConfirmacao = null;
let generosCadastrados = [];
let emprestimoEditandoDias = null;

const turmasPorTurno = {
  "Manhã": [
    "1º Ano A","1º Ano B","1º Ano C","1º Ano D","1º Ano E",
    "2º Ano A","2º Ano B","2º Ano C","2º Ano D","2º Ano E",
    "3º Ano A","3º Ano B","3º Ano C","3º Ano D","3º Ano E",
    "Cidadão"
  ],
  "Tarde": [
    "6º Ano A","6º Ano B","6º Ano C","6º Ano D","6º Ano E",
    "7º Ano A","7º Ano B","7º Ano C","7º Ano D","7º Ano E",
    "8º Ano A","8º Ano B","8º Ano C","8º Ano D","8º Ano E",
    "9º Ano A","9º Ano B","9º Ano C","9º Ano D","9º Ano E",
    "Cidadão"
  ],
  "Noite": [
    "EJA 1","EJA 2","Cursos"
  ]
};

const botoes = {
  "card-registrar": "secao-registrar-livro",
  "card-leitores": "secao-registrar-leitor",
  "card-emprestimo": "secao-registrar-emprestimo",
  "card-criar": "secao-criar-genero",
  "card-livros": "secao-livros-registrados",
  "card-lista-leitores": "secao-lista-leitores",
  "card-lista-emprestimos": "secao-lista-emprestimos",
  "card-notificacoes": "secao-notificacoes"
};

const toastContainer = document.getElementById("toast-container");
const dialogoConfirmacao = document.getElementById("dialogoConfirmacao");
const dialogoMensagem = document.getElementById("dialogoMensagem");
const btnSimDialog = document.getElementById("btnSimDialog");
const btnCancelarDialog = document.getElementById("btnCancelarDialog");

const dialogSelecionar = document.getElementById("dialogSelecionar");
const dialogTitulo = document.getElementById("dialogTitulo");
const btnFecharDialog = document.getElementById("btnFecharDialog");
const pesquisaDialog = document.getElementById("pesquisaDialog");
const listaDialog = document.getElementById("listaDialog");

const inputGeneroLivro = document.getElementById("generoLivro");

const secRegistrarLeitor = document.getElementById("secao-registrar-leitor");
const nomeLeitorEl = secRegistrarLeitor.querySelector("#nomeLeitor");
const turnoLeitorEl = secRegistrarLeitor.querySelector("#turnoLeitor");
const turmaLeitorEl = secRegistrarLeitor.querySelector("#turmaLeitor");
const nascimentoLeitorEl = secRegistrarLeitor.querySelector("#nascimentoLeitor");

const secListaLeitores = document.getElementById("secao-lista-leitores");
const inputPesquisarLeitor = secListaLeitores.querySelector(".leitores-pesquisa");
const selectTurnoFiltro = secListaLeitores.querySelector("#turnoLeitorFiltro");
const selectTurmaFiltro = secListaLeitores.querySelector("#turmaLeitorFiltro");

const secRegistrarEmp = document.getElementById("secao-registrar-emprestimo");
const turnoEmprestimoEl = secRegistrarEmp.querySelector("#turnoEmprestimo");
const turmaEmprestimoEl = secRegistrarEmp.querySelector("#turmaEmprestimo");
const nomeEmprestimoEl = secRegistrarEmp.querySelector("#nomeEmprestimo");
const livroEmprestimoEl = secRegistrarEmp.querySelector("#livroEmprestimo");
const diasEntregaEl = secRegistrarEmp.querySelector("#diasEntrega");

const secListaEmp = document.getElementById("secao-lista-emprestimos");
const pesquisaEmprestimosEl = secListaEmp.querySelector("#pesquisaEmprestimos");
const turnoEmprestimoFiltroEl = secListaEmp.querySelector("#turnoEmprestimoFiltro");
const turmaEmprestimoFiltroEl = secListaEmp.querySelector("#turmaEmprestimoFiltro");

const dialogSenhaAno = document.getElementById("dialogSenhaAno");
const senhaAno = document.getElementById("senhaAno");
const mostrarSenha = document.getElementById("mostrarSenha");
const confirmarAno = document.getElementById("confirmarAno");

const dialogAdicionarDias = document.getElementById("dialogAdicionarDias");
const formAdicionarDias = document.getElementById("formAdicionarDias");
const btnFecharAdicionarDias = document.getElementById("btnFecharAdicionarDias");
const btnCancelarAdicionarDias = document.getElementById("btnCancelarAdicionarDias");

const addDiasNome = document.getElementById("addDiasNome");
const addDiasLivro = document.getElementById("addDiasLivro");
const addDiasAutor = document.getElementById("addDiasAutor");
const addDiasGenero = document.getElementById("addDiasGenero");
const addDiasVolume = document.getElementById("addDiasVolume");
const addDiasPrateleira = document.getElementById("addDiasPrateleira");
const addDiasEntregaAtual = document.getElementById("addDiasEntregaAtual");
const addDiasQuantidade = document.getElementById("addDiasQuantidade");
const addDiasNovaEntrega = document.getElementById("addDiasNovaEntrega");

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

function normalizarTexto(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseDataBR(dataStr) {
  if (!dataStr) return null;
  const [dia, mes, ano] = dataStr.split("/").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatarDataBRDate(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function calcularDiasRestantes(dataEntrega) {
  if (!(dataEntrega instanceof Date)) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const entrega = new Date(dataEntrega.getTime());
  entrega.setHours(0, 0, 0, 0);
  const diff = (entrega - hoje) / (1000 * 60 * 60 * 24);
  return Math.ceil(diff);
}

function criarBotao(texto, classe, onClick) {
  const btn = document.createElement("button");
  btn.textContent = texto;
  btn.className = classe;
  btn.style.marginLeft = "10px";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick(e);
  });
  return btn;
}

function aplicarEfeitoHoverELinha(tr) {
  tr.style.transition = "background-color 0.3s";
  tr.addEventListener("mouseenter", () => {
    tr.style.backgroundColor = "#0603a366";
    tr.style.cursor = "pointer";
  });
  tr.addEventListener("mouseleave", () => {
    if (!tr.classList.contains("selecionado")) tr.style.backgroundColor = "transparent";
  });
}

function showToast(message, type = "success", duration = 5000, reload = false) {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let emoji = "ℹ️";
  if (type === "success") emoji = "✅";
  else if (type === "error") emoji = "❌";
  else if (type === "warning") emoji = "⚠️";

  toast.innerHTML = `
    <span class="emoji">${emoji}</span>
    <span class="message">${message}</span>
    ${reload ? `<div class="reload-info">🔄 Recarregando em <span class="reload-count">${Math.ceil(duration / 1000)}</span>s...</div>` : ""}
    <div class="duration-bar"></div>
  `;

  const innerBar = toast.querySelector(".duration-bar");
  if (innerBar) innerBar.style.animationDuration = `${duration}ms`;

  toastContainer.appendChild(toast);

  if (reload) {
    const countEl = toast.querySelector(".reload-count");
    let restante = Math.ceil(duration / 1000);

    const intervalo = setInterval(() => {
      restante--;
      if (countEl && restante >= 0) countEl.textContent = restante;
      if (restante <= 0) clearInterval(intervalo);
    }, 1000);

    setTimeout(() => {
      toast.classList.add("hide");
      setTimeout(() => {
        toast.remove();
        location.reload();
      }, 500);
    }, duration);

    return;
  }

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 500);
  }, duration);
}

function mostrarSecao(idSecao) {
  Object.values(botoes).forEach((sec) => {
    const el = document.getElementById(sec);
    if (el) el.style.display = "none";
  });

  const alvo = document.getElementById(idSecao);
  if (alvo) alvo.style.display = "flex";
}

Object.keys(botoes).forEach((cardId) => {
  const el = document.getElementById(cardId);
  el.addEventListener("click", async () => {
    mostrarSecao(botoes[cardId]);

    document.querySelectorAll(".card").forEach((c) => c.classList.remove("ativo"));
    el.classList.add("ativo");

    if (cardId === "card-criar") await carregarGeneros();
    if (cardId === "card-livros") await carregarLivros();
    if (cardId === "card-lista-leitores") await carregarLeitores();
    if (cardId === "card-lista-emprestimos") await carregarEmprestimos();
    if (cardId === "card-notificacoes") await carregarNotificacoes();
  });
});

function abrirDialogoConfirmacao(mensagem, onConfirm) {
  dialogoMensagem.textContent = mensagem;
  callbackConfirmacao = onConfirm;
  dialogoConfirmacao.showModal();
}

btnSimDialog.addEventListener("click", () => {
  if (callbackConfirmacao) callbackConfirmacao();
  dialogoConfirmacao.close();
  callbackConfirmacao = null;
});

btnCancelarDialog.addEventListener("click", () => {
  dialogoConfirmacao.close();
  callbackConfirmacao = null;
});

btnFecharDialog.addEventListener("click", () => {
  dialogSelecionar.close();
});

pesquisaDialog.addEventListener("input", () => {
  if (typeof dialogCallback === "function") dialogCallback(pesquisaDialog.value);
});

dialogSelecionar.addEventListener("click", (e) => {
  const rect = dialogSelecionar.getBoundingClientRect();
  const dentro =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  if (!dentro) dialogSelecionar.close();
});

function abrirDialogoSelecionar(titulo, gerarListaCallback) {
  dialogTitulo.textContent = titulo;
  pesquisaDialog.value = "";
  listaDialog.innerHTML = "";
  dialogCallback = (filtro = "") => gerarListaCallback(filtro);
  dialogSelecionar.showModal();
  gerarListaCallback("");
  setTimeout(() => pesquisaDialog.focus(), 30);
}

function abrirDialogoGenero(inputDestino, titulo = "Selecionar Gênero") {
  abrirDialogoSelecionar(titulo, (filtro) => {
    const termo = normalizarTexto(filtro);

    const generosFiltrados = generosCadastrados.filter((g) =>
      normalizarTexto(g).includes(termo)
    );

    listaDialog.innerHTML = "";

    if (!generosFiltrados.length) {
      listaDialog.innerHTML = "<li class='dialog-item'>Nenhum gênero encontrado.</li>";
      return;
    }

    generosFiltrados.forEach((genero) => {
      const li = document.createElement("li");
      li.className = "dialog-item";

      li.innerHTML = `
        <div class="dialog-item-info">
          <div class="dialog-item-title">${genero}</div>
          <div class="dialog-item-subtitle">Gênero cadastrado no sistema</div>
        </div>
        <button class="btn-selecionar">Selecionar</button>
      `;

      li.querySelector(".btn-selecionar").onclick = () => {
        inputDestino.value = genero;
        dialogSelecionar.close();
      };

      listaDialog.appendChild(li);
    });
  });
}

inputGeneroLivro.addEventListener("click", () => {
  abrirDialogoGenero(inputGeneroLivro, "Selecionar Gênero");
});

async function carregarGeneros() {
  const snapshot = await getDocs(collection(db, "generos"));
  const generos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  generosCadastrados = generos
    .map((g) => g.nome)
    .sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));

  const container = document.getElementById("lista-generos");
  container.innerHTML = "";

  if (generos.length === 0) {
    container.innerHTML = '<li class="sem-livros">Nenhum gênero registrado.</li>';
    return;
  }

  generosCadastrados.forEach((nome) => {
    const item = document.createElement("div");
    item.className = "genero-item";
    item.style.display = "flex";
    item.style.justifyContent = "space-between";
    item.style.alignItems = "center";
    item.style.padding = "6px 10px";
    item.style.borderBottom = "1px solid #ffffffff";
    item.style.cursor = "pointer";

    const span = document.createElement("span");
    span.textContent = nome;

    const btnExcluir = criarBotao("Excluir", "btn-remover", () => {
      abrirDialogoConfirmacao(
        `Deseja excluir o gênero "${nome}"? Isso removerá todos os livros associados.`,
        async () => {
          try {
            const generoRef = collection(db, nome);
            const livrosDoGenero = await getDocs(generoRef);
            await Promise.all(livrosDoGenero.docs.map((d) => deleteDoc(d.ref)));

            const qLivros = query(collection(db, "livros"), where("genero", "==", nome));
            const snapLivros = await getDocs(qLivros);
            await Promise.all(snapLivros.docs.map((d) => deleteDoc(d.ref)));

            const gSnap = await getDocs(collection(db, "generos"));
            const gDoc = gSnap.docs.find((dd) => dd.data().nome === nome);
            if (gDoc) await deleteDoc(gDoc.ref);

            showToast(`Gênero "${nome}" removido com sucesso!`, "success", 5000, true);
            await carregarGeneros();
            await carregarLivros();
          } catch (err) {
            showToast("Erro ao excluir gênero: " + err.message, "error");
          }
        }
      );
    });

    btnExcluir.style.display = "none";

    item.addEventListener("click", () => {
      const ativo = item.classList.contains("selecionado");

      container.querySelectorAll(".genero-item").forEach((i) => {
        i.classList.remove("selecionado");
        const b = i.querySelector("button");
        if (b) b.style.display = "none";
        i.style.backgroundColor = "transparent";
      });

      if (!ativo) {
        item.classList.add("selecionado");
        btnExcluir.style.display = "inline-block";
        item.style.backgroundColor = "#008b0777";
      }
    });

    item.appendChild(span);
    item.appendChild(btnExcluir);
    container.appendChild(item);
  });
}

document.getElementById("form-criar-genero").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("inputNovoGenero").value.trim();

  if (!nome) return showToast("Informe o nome do gênero.", "warning");
  if (generosCadastrados.includes(nome)) {
    return showToast(`Gênero "${nome}" já existe.`, "warning");
  }

  try {
    await addDoc(collection(db, "generos"), { nome });
    showToast(`Gênero "${nome}" criado com sucesso!`, "success", 5000, true);
    e.target.reset();
    await carregarGeneros();
  } catch (err) {
    showToast("Erro ao criar gênero: " + err.message, "error");
  }
});

function livroExiste(nome, autor, volume) {
  const n = normalizarTexto(nome);
  const a = normalizarTexto(autor);
  const v = (volume || "1").trim();

  return cacheLivros.some(
    (l) =>
      normalizarTexto(l.nome) === n &&
      normalizarTexto(l.autor) === a &&
      String(l.volume || "1").trim() === v
  );
}

async function salvarLivro(livroData) {
  const dataHora = new Date().toISOString();

  const docRef = await addDoc(collection(db, "livros"), {
    ...livroData,
    registradoEm: dataHora
  });

  cacheLivros.push({
    id: docRef.id,
    ...livroData,
    registradoEm: dataHora
  });
}

function criarTabelaLivros(livros) {
  const tabela = document.createElement("table");
  tabela.style.width = "100%";
  tabela.style.borderCollapse = "collapse";

  const thead = document.createElement("thead");
  const trh = document.createElement("tr");

  ["Nome", "Autor", "Gênero", "Quantidade", "Volume", "Prateleira", ""].forEach((t) => {
    const th = document.createElement("th");
    th.textContent = t;
    th.style.borderBottom = "2px solid rgb(255, 68, 68)";
    th.style.borderLeft = "1px solid #fff";
    th.style.borderRight = "1px solid #fff";
    th.style.borderTop = "1px solid #fff";
    th.style.padding = "8px";
    th.style.textAlign = "left";
    trh.appendChild(th);
  });

  thead.appendChild(trh);
  tabela.appendChild(thead);

  const tbody = document.createElement("tbody");

  livros.forEach((livro) => {
    const tr = document.createElement("tr");

    ["nome", "autor", "genero", "quantidade", "volume", "prateleira"].forEach((c) => {
      const td = document.createElement("td");
      td.textContent = livro[c] || (c === "volume" ? "1" : "");
      td.style.padding = "8px";
      td.style.border = "1px solid #fff";
      tr.appendChild(td);
    });

    const tdAcoes = document.createElement("td");
    tdAcoes.style.padding = "8px";
    tdAcoes.style.border = "1px solid #fff";

    const btnRemover = criarBotao("Remover", "btn-remover", () => {
      abrirDialogoConfirmacao(
        `Deseja realmente remover o livro "${livro.nome}" volume ${livro.volume || "1"}?`,
        async () => {
          try {
            await deleteDoc(doc(db, "livros", livro.id));

            const generoRef = collection(db, livro.genero);
            const generoSnap = await getDocs(generoRef);

            const docGenero = generoSnap.docs.find((d) => {
              const data = d.data();
              return (
                data.nome === livro.nome &&
                data.autor === livro.autor &&
                (data.volume || "1") === (livro.volume || "1")
              );
            });

            if (docGenero) await deleteDoc(docGenero.ref);

            showToast(`Livro "${livro.nome}" removido!`, "success", 5000, true);
            cacheLivros = cacheLivros.filter((l) => l.id !== livro.id);
            await carregarLivros();
          } catch (err) {
            showToast("Erro ao remover livro: " + err.message, "error");
          }
        }
      );
    });

    btnRemover.style.display = "none";

    const btnEditar = criarBotao("Editar", "btn-editar", () => {
      abrirDialogEditarLivro(livro);
    });

    btnEditar.style.display = "none";
    btnEditar.style.backgroundColor = "#FFA500";

    tdAcoes.appendChild(btnEditar);
    tdAcoes.appendChild(btnRemover);
    tr.appendChild(tdAcoes);

    aplicarEfeitoHoverELinha(tr);

    tr.addEventListener("click", () => {
      const selecionado = tr.classList.contains("selecionado");

      tbody.querySelectorAll("tr").forEach((l) => {
        l.classList.remove("selecionado");
        l.querySelectorAll("button").forEach((b) => (b.style.display = "none"));
        l.style.backgroundColor = "transparent";
      });

      if (!selecionado) {
        tr.classList.add("selecionado");
        btnRemover.style.display = "inline-block";
        btnEditar.style.display = "inline-block";
        tr.style.backgroundColor = "#008b0777";
      }
    });

    tbody.appendChild(tr);
  });

  tabela.appendChild(tbody);
  return tabela;
}

function abrirDialogEditarLivro(livro) {
  const dialog = document.getElementById("dialogEditarLivro");
  dialog.showModal();

  document.getElementById("editarNomeLivro").value = livro.nome;
  document.getElementById("editarAutorLivro").value = livro.autor;
  document.getElementById("editarGeneroLivro").value = livro.genero;
  document.getElementById("editarQuantidadeLivro").value = livro.quantidade;
  document.getElementById("editarPrateleiraLivro").value = livro.prateleira;
  document.getElementById("editarVolumeLivro").value = livro.volume || "1";

  const form = document.getElementById("form-editar-livro");
  const inputGeneroLivroEditar = document.getElementById("editarGeneroLivro");

  inputGeneroLivroEditar.onclick = () => {
    abrirDialogoGenero(inputGeneroLivroEditar, "Selecionar Gênero");
  };

  form.onsubmit = null;
  form.onsubmit = async (e) => {
    e.preventDefault();

    const novoLivro = {
      nome: document.getElementById("editarNomeLivro").value,
      autor: document.getElementById("editarAutorLivro").value,
      genero: document.getElementById("editarGeneroLivro").value,
      quantidade: document.getElementById("editarQuantidadeLivro").value,
      prateleira: document.getElementById("editarPrateleiraLivro").value,
      volume: document.getElementById("editarVolumeLivro").value.trim() || "1"
    };

    try {
      await setDoc(doc(db, "livros", livro.id), novoLivro);

      const generoRef = collection(db, novoLivro.genero);
      const q = query(generoRef, where("idLivro", "==", livro.id));
      const snap = await getDocs(q);

      const idx = cacheLivros.findIndex((l) => l.id === livro.id);
      if (idx !== -1) cacheLivros[idx] = { id: livro.id, ...novoLivro };

      if (!snap.empty) {
        const docGenero = snap.docs[0];
        await setDoc(docGenero.ref, {
          ...novoLivro,
          idLivro: livro.id
        });
      }

      showToast(`Livro "${novoLivro.nome}" atualizado!`, "success");
      dialog.close();
      await carregarLivros();
    } catch (err) {
      showToast("Erro ao editar livro: " + err.message, "error");
    }
  };

  document.getElementById("btnCancelarEditarLivro").onclick = () => dialog.close();
  document.getElementById("btnFecharEditarLivro").onclick = () => dialog.close();
}

async function carregarLivros() {
  if (!cacheLivros.length) {
    const snap = await getDocs(collection(db, "livros"));
    cacheLivros = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const livros = [...cacheLivros].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt", { sensitivity: "base" })
  );

  const container = document.getElementById("lista-livros-registrados");
  container.innerHTML = "";

  if (!livros.length) {
    container.innerHTML = '<p class="sem-livros">Nenhum livro registrado.</p>';
    return;
  }

  container.appendChild(criarTabelaLivros(livros));
}

document.getElementById("form-registrar-livro").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nomeLivro").value.trim();
  const autor = document.getElementById("autorLivro").value.trim();
  const genero = document.getElementById("generoLivro").value.trim();
  const prateleira = document.getElementById("prateleiraLivro").value.trim();
  const volume = (document.getElementById("volumeLivro").value || "1").trim();
  const quantidade = Number(document.getElementById("quantidadeLivro").value);

  if (!nome || !autor || !genero || quantidade <= 0) {
    return showToast("Preencha todos os campos corretamente.", "warning");
  }

  if (!generosCadastrados.includes(genero)) {
    return showToast("Gênero inválido. Selecione um gênero existente.", "warning");
  }

  if (livroExiste(nome, autor, volume)) {
    return showToast(`Livro "${nome}" volume ${volume} já cadastrado.`, "warning");
  }

  try {
    await salvarLivro({ nome, autor, genero, prateleira, volume, quantidade });
    showToast(`"${nome}" (Vol ${volume}) adicionado!`, "success", 5000, true);
    e.target.reset();
    await carregarLivros();
  } catch (err) {
    showToast("Erro ao salvar livro: " + err.message, "error");
  }
});

const inputPesquisaLivros = document.querySelector("#secao-livros-registrados .livros-pesquisa");
if (inputPesquisaLivros) {
  inputPesquisaLivros.addEventListener("input", (e) => {
    const termo = normalizarTexto(e.target.value);

    let livros = cacheLivros.filter((l) =>
      ["nome", "autor", "genero", "prateleira", "volume"].some((c) =>
        normalizarTexto(l[c]).includes(termo)
      )
    );

    const container = document.getElementById("lista-livros-registrados");
    container.innerHTML = "";

    if (!livros.length) {
      container.innerHTML = '<p class="sem-livros">Nenhum livro encontrado.</p>';
      return;
    }

    container.appendChild(criarTabelaLivros(livros));
  });
}

function preencherTurmasSelect(select, turno, primeiraOpc = "Selecione...") {
  select.innerHTML = `<option value="">${primeiraOpc}</option>`;
  if (turmasPorTurno[turno]) {
    turmasPorTurno[turno].forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      select.appendChild(opt);
    });
  }
}

turnoLeitorEl.addEventListener("change", () => {
  preencherTurmasSelect(turmaLeitorEl, turnoLeitorEl.value);
});

function leitorExiste(nome, turno, turma, nascimento) {
  return cacheLeitores.some(
    (l) =>
      normalizarTexto(l.nome) === normalizarTexto(nome) &&
      l.turno === turno &&
      l.turma === turma &&
      l.nascimento === nascimento
  );
}

document.getElementById("form-registrar-leitor").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = nomeLeitorEl.value.trim();
  const turno = turnoLeitorEl.value;
  const turma = turmaLeitorEl.value;
  const nascimento = nascimentoLeitorEl.value;

  if (!nome || !turno || !turma || !nascimento) {
    return showToast("Preencha todos os campos corretamente.", "warning");
  }

  if (leitorExiste(nome, turno, turma, nascimento)) {
    return showToast(`Leitor "${nome}" já está registrado.`, "warning");
  }

  try {
    const docRef = await addDoc(collection(db, "leitores"), {
      nome,
      turno,
      turma,
      nascimento,
      registradoEm: new Date().toISOString()
    });

    cacheLeitores.push({
      id: docRef.id,
      nome,
      turno,
      turma,
      nascimento
    });

    showToast(`Leitor "${nome}" registrado!`, "success");
    e.target.reset();
    turmaLeitorEl.innerHTML = "<option value=''>Selecione...</option>";
  } catch (err) {
    showToast("Erro ao registrar leitor: " + err.message, "error");
  }
});

secRegistrarLeitor.querySelectorAll(".btn-cancelar").forEach((btn) => {
  btn.addEventListener("click", () => {
    secRegistrarLeitor.querySelector("#form-registrar-leitor").reset();
    turmaLeitorEl.innerHTML = "<option value=''>Selecione...</option>";
    secRegistrarLeitor.style.display = "none";
  });
});

function atualizarTurmasFiltroLeitores() {
  preencherTurmasSelect(selectTurmaFiltro, selectTurnoFiltro.value, "Selecione...");
}

async function carregarLeitores() {
  if (!cacheLeitores.length) {
    const snap = await getDocs(collection(db, "leitores"));
    cacheLeitores = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const leitores = [...cacheLeitores].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt", { sensitivity: "base" })
  );

  exibirLeitoresRegistrados(leitores);
}

function criarTabelaLeitores(leitores) {
  const tabela = document.createElement("table");
  tabela.style.width = "100%";
  tabela.style.borderCollapse = "collapse";

  const thead = document.createElement("thead");
  const trh = document.createElement("tr");

  ["Nome", "Turno", "Turma", "Nascimento", ""].forEach((t) => {
    const th = document.createElement("th");
    th.textContent = t;
    th.style.borderBottom = "2px solid #ff4444";
    th.style.borderLeft = "1px solid #fff";
    th.style.borderRight = "1px solid #fff";
    th.style.borderTop = "1px solid #fff";
    th.style.padding = "8px";
    th.style.textAlign = "left";
    trh.appendChild(th);
  });

  thead.appendChild(trh);
  tabela.appendChild(thead);

  const tbody = document.createElement("tbody");

  leitores.forEach((L) => {
    const tr = document.createElement("tr");

    const nascBR = (() => {
      if (!L.nascimento) return "";
      const [y, m, d] = L.nascimento.split("-");
      return `${d}/${m}/${y}`;
    })();

    [["nome", L.nome], ["turno", L.turno], ["turma", L.turma], ["nascimento", nascBR]].forEach(
      ([_, val]) => {
        const td = document.createElement("td");
        td.textContent = val || "";
        td.style.padding = "8px";
        td.style.border = "1px solid #fff";
        tr.appendChild(td);
      }
    );

    const tdAcoes = document.createElement("td");
    tdAcoes.style.padding = "8px";
    tdAcoes.style.border = "1px solid #fff";

    const btnRemover = criarBotao("Remover", "btn-remover", async () => {
      abrirDialogoConfirmacao(`Deseja remover o leitor "${L.nome}"?`, async () => {
        try {
          await deleteDoc(doc(db, "leitores", L.id));
          cacheLeitores = cacheLeitores.filter((l) => l.id !== L.id);
          showToast(`Leitor "${L.nome}" removido!`, "success", 5000, true);
          await carregarLeitores();
        } catch (err) {
          showToast("Erro: " + err.message, "error");
        }
      });
    });

    btnRemover.style.display = "none";
    tdAcoes.appendChild(btnRemover);
    tr.appendChild(tdAcoes);

    aplicarEfeitoHoverELinha(tr);

    tr.addEventListener("click", () => {
      const s = tr.classList.contains("selecionado");

      tbody.querySelectorAll("tr").forEach((l) => {
        l.classList.remove("selecionado");
        l.querySelectorAll("button").forEach((b) => (b.style.display = "none"));
        l.style.backgroundColor = "transparent";
      });

      if (!s) {
        tr.classList.add("selecionado");
        btnRemover.style.display = "inline-block";
        tr.style.backgroundColor = "#008b0777";
      }
    });

    tbody.appendChild(tr);
  });

  tabela.appendChild(tbody);
  return tabela;
}

function exibirLeitoresRegistrados(leitores) {
  const container = document.getElementById("lista-leitores");
  container.innerHTML = "";

  if (!leitores.length) {
    container.innerHTML = '<p class="sem-leitores">Nenhum leitor registrado.</p>';
    return;
  }

  container.appendChild(criarTabelaLeitores(leitores));
}

function filtrarLeitores() {
  const termo = normalizarTexto(inputPesquisarLeitor.value);
  const turno = selectTurnoFiltro.value;
  const turma = selectTurmaFiltro.value;

  let leitores = [...cacheLeitores];

  if (turno) leitores = leitores.filter((l) => l.turno === turno);
  if (turma) leitores = leitores.filter((l) => l.turma === turma);
  if (termo) {
    leitores = leitores.filter((l) =>
      ["nome", "turno", "turma"].some((c) => normalizarTexto(l[c]).includes(termo))
    );
  }

  leitores.sort((a, b) => a.nome.localeCompare(b.nome, "pt", { sensitivity: "base" }));
  exibirLeitoresRegistrados(leitores);
}

inputPesquisarLeitor.addEventListener("input", filtrarLeitores);
selectTurnoFiltro.addEventListener("change", () => {
  atualizarTurmasFiltroLeitores();
  filtrarLeitores();
});
selectTurmaFiltro.addEventListener("change", filtrarLeitores);

document.getElementById("card-lista-leitores").addEventListener("click", () => {
  selectTurnoFiltro.value = "";
  selectTurmaFiltro.innerHTML = "<option value=''>Selecione...</option>";
});

turnoEmprestimoEl.addEventListener("change", () => {
  preencherTurmasSelect(turmaEmprestimoEl, turnoEmprestimoEl.value);
});

nomeEmprestimoEl.addEventListener("click", async () => {
  const turno = turnoEmprestimoEl.value;
  const turma = turmaEmprestimoEl.value;

  if (!turno || !turma) return showToast("Selecione primeiro Turno e Turma.", "warning");

  abrirDialogoSelecionar("Selecionar Leitor", (filtro) => {
    const leitores = cacheLeitores
      .filter((l) => l.turno === turno && l.turma === turma)
      .filter((l) => {
        const f = normalizarTexto(filtro);
        return normalizarTexto(l.nome).includes(f) || (l.nascimento || "").includes(filtro);
      });

    listaDialog.innerHTML = "";

    if (!leitores.length) {
      listaDialog.innerHTML = "<li class='dialog-item'>Nenhum leitor encontrado.</li>";
      return;
    }

    leitores.forEach((l) => {
      const li = document.createElement("li");
      li.className = "dialog-item";

      const nascBR = l.nascimento
        ? (() => {
            const [y, m, d] = l.nascimento.split("-");
            return `${d}/${m}/${y}`;
          })()
        : "";

      li.innerHTML = `
        <div class="dialog-item-info">
          <div class="dialog-item-title">${l.nome}</div>
          <div class="dialog-item-subtitle">${l.turno} • ${l.turma} • ${nascBR}</div>
        </div>
        <button class="btn-selecionar">Selecionar</button>
      `;

      li.querySelector(".btn-selecionar").onclick = () => {
        nomeEmprestimoEl.value = l.nome;
        dialogSelecionar.close();
      };

      listaDialog.appendChild(li);
    });
  });
});

livroEmprestimoEl.addEventListener("click", async () => {
  abrirDialogoSelecionar("Selecionar Livro", (filtro) => {
    const livros = cacheLivros.filter((l) => {
      const f = normalizarTexto(filtro);
      return [l.nome, l.autor, l.genero, l.prateleira].some((x) =>
        normalizarTexto(x).includes(f)
      );
    });

    listaDialog.innerHTML = "";

    if (!livros.length) {
      listaDialog.innerHTML = "<li class='dialog-item'>Nenhum livro encontrado.</li>";
      return;
    }

    livros.forEach((l) => {
      const li = document.createElement("li");
      li.className = "dialog-item";
      li.innerHTML = `
        <div class="dialog-item-info">
          <div class="dialog-item-title">${l.nome}</div>
          <div class="dialog-item-subtitle">
            Autor: ${l.autor} • ${l.genero} • Vol: ${l.volume || 1}
          </div>
        </div>
        <button class="btn-selecionar">Selecionar</button>
      `;

      li.querySelector(".btn-selecionar").onclick = () => {
        livroEmprestimoEl.value = `${l.nome} (Vol ${l.volume || 1})`;
        dialogSelecionar.close();
      };

      listaDialog.appendChild(li);
    });
  });
});

document.getElementById("form-registrar-emprestimo").addEventListener("submit", async (e) => {
  e.preventDefault();

  const turno = turnoEmprestimoEl.value;
  const turma = turmaEmprestimoEl.value;
  const nomeLeitor = nomeEmprestimoEl.value.trim();
  const livroSelecionado = livroEmprestimoEl.value.trim();
  const diasEntrega = Number(diasEntregaEl.value);

  if (!turno || !turma || !nomeLeitor || !livroSelecionado || !diasEntrega) {
    return showToast("Preencha todos os campos corretamente.", "warning");
  }

  if (diasEntrega > 30) {
    return showToast("O máximo permitido é 30 dias para entrega.", "warning");
  }

  const hoje = new Date();
  const entrega = new Date();
  entrega.setDate(hoje.getDate() + diasEntrega);

  const emprestimoData = {
    nome: nomeLeitor,
    turno,
    turma,
    livro: livroSelecionado,
    diasEntrega,
    dataEmprestimo: formatarDataBRDate(hoje),
    dataEntrega: formatarDataBRDate(entrega),
    registradoEm: new Date().toISOString()
  };

  try {
    const docRef = await addDoc(collection(db, "emprestimos"), emprestimoData);

    cacheEmprestimos.push({
      id: docRef.id,
      ...emprestimoData
    });

    showToast(`Empréstimo de "${livroSelecionado}" registrado!`, "success");
    e.target.reset();
    turmaEmprestimoEl.innerHTML = "<option value=''>Selecione...</option>";
    await carregarEmprestimos();
    await carregarNotificacoes();
  } catch (err) {
    showToast("Erro ao registrar empréstimo: " + err.message, "error");
  }
});

function atualizarTurmasFiltroEmprestimo(turno) {
  turmaEmprestimoFiltroEl.innerHTML = "<option value=''>Todos</option>";

  if (turmasPorTurno[turno]) {
    turmasPorTurno[turno].forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      turmaEmprestimoFiltroEl.appendChild(opt);
    });
  }
}

turnoEmprestimoFiltroEl.addEventListener("change", () => {
  atualizarTurmasFiltroEmprestimo(turnoEmprestimoFiltroEl.value);
  carregarEmprestimos();
});

turmaEmprestimoFiltroEl.addEventListener("change", carregarEmprestimos);
pesquisaEmprestimosEl.addEventListener("input", carregarEmprestimos);

function extrairNomeEVolumeDoEmprestimo(textoLivro) {
  const texto = String(textoLivro || "").trim();
  const match = texto.match(/^(.*)\s+\(Vol\s+(.*)\)$/i);

  if (match) {
    return {
      nome: match[1].trim(),
      volume: match[2].trim()
    };
  }

  return {
    nome: texto,
    volume: "1"
  };
}

function buscarLivroCompletoDoEmprestimo(textoLivro) {
  const { nome, volume } = extrairNomeEVolumeDoEmprestimo(textoLivro);

  return cacheLivros.find((l) =>
    normalizarTexto(l.nome) === normalizarTexto(nome) &&
    String(l.volume || "1").trim() === String(volume || "1").trim()
  );
}

function somarDiasNaDataBR(dataBR, dias) {
  const data = parseDataBR(dataBR);
  if (!data) return "";
  data.setDate(data.getDate() + Number(dias));
  return formatarDataBRDate(data);
}

function abrirDialogAdicionarDias(emprestimo) {
  emprestimoEditandoDias = emprestimo;

  const livroCompleto = buscarLivroCompletoDoEmprestimo(emprestimo.livro);

  addDiasNome.value = emprestimo.nome || "";
  addDiasLivro.value = livroCompleto?.nome || extrairNomeEVolumeDoEmprestimo(emprestimo.livro).nome || "";
  addDiasAutor.value = livroCompleto?.autor || "";
  addDiasGenero.value = livroCompleto?.genero || "";
  addDiasVolume.value = livroCompleto?.volume || extrairNomeEVolumeDoEmprestimo(emprestimo.livro).volume || "1";
  addDiasPrateleira.value = livroCompleto?.prateleira || "";
  addDiasEntregaAtual.value = emprestimo.dataEntrega || "";
  addDiasQuantidade.value = "";
  addDiasNovaEntrega.value = emprestimo.dataEntrega || "";

  dialogAdicionarDias.showModal();
}

function fecharDialogAdicionarDias() {
  dialogAdicionarDias.close();
  emprestimoEditandoDias = null;
  formAdicionarDias.reset();
}

addDiasQuantidade.addEventListener("input", () => {
  const dias = Number(addDiasQuantidade.value);
  if (!dias || dias < 1) {
    addDiasNovaEntrega.value = addDiasEntregaAtual.value;
    return;
  }

  addDiasNovaEntrega.value = somarDiasNaDataBR(addDiasEntregaAtual.value, dias);
});

btnFecharAdicionarDias.addEventListener("click", fecharDialogAdicionarDias);
btnCancelarAdicionarDias.addEventListener("click", fecharDialogAdicionarDias);

formAdicionarDias.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!emprestimoEditandoDias) return;

  const diasAdicionar = Number(addDiasQuantidade.value);

  if (!diasAdicionar || diasAdicionar < 1) {
    return showToast("Informe quantos dias deseja adicionar.", "warning");
  }

  const novaEntrega = addDiasNovaEntrega.value;
  const novoTotalDias = Number(emprestimoEditandoDias.diasEntrega || 0) + diasAdicionar;

  try {
    await updateDoc(doc(db, "emprestimos", emprestimoEditandoDias.id), {
      diasEntrega: novoTotalDias,
      dataEntrega: novaEntrega
    });

    const idx = cacheEmprestimos.findIndex((x) => x.id === emprestimoEditandoDias.id);
    if (idx !== -1) {
      cacheEmprestimos[idx].diasEntrega = novoTotalDias;
      cacheEmprestimos[idx].dataEntrega = novaEntrega;
    }

    fecharDialogAdicionarDias();
    showToast(`Prazo atualizado com sucesso! Nova entrega: ${novaEntrega}`, "success");
    await carregarEmprestimos();
    await carregarNotificacoes();
  } catch (err) {
    showToast("Erro ao atualizar prazo: " + err.message, "error");
  }
});

function criarTabelaEmprestimos(emprestimos) {
  const tabela = document.createElement("table");
  tabela.style.width = "100%";
  tabela.style.borderCollapse = "collapse";

  const thead = document.createElement("thead");
  const trh = document.createElement("tr");

  ["Nome Leitor", "Nome Livro", "Turno • Turma", "Data Pego", "Data Entrega", "Dias", "Ações"].forEach((t) => {
    const th = document.createElement("th");
    th.textContent = t;
    th.style.borderBottom = "2px solid #ff4444";
    th.style.borderLeft = "1px solid #fff";
    th.style.borderRight = "1px solid #fff";
    th.style.borderTop = "1px solid #fff";
    th.style.padding = "8px";
    th.style.textAlign = "left";
    trh.appendChild(th);
  });

  thead.appendChild(trh);
  tabela.appendChild(thead);

  const tbody = document.createElement("tbody");

  emprestimos.forEach((e) => {
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid #ffffffff";

    const dataEntregaObj = parseDataBR(e.dataEntrega);
    const diasRestantes = calcularDiasRestantes(dataEntregaObj);
    const diasTexto =
      diasRestantes == null ? "" : diasRestantes < 0 ? "Atrasado" : `${diasRestantes} dias`;

    const cells = [
      e.nome,
      e.livro,
      `${e.turno} • ${e.turma}`,
      e.dataEmprestimo || "",
      e.dataEntrega || "",
      diasTexto
    ];

    cells.forEach((val) => {
      const td = document.createElement("td");
      td.textContent = val;
      td.style.padding = "8px";
      td.style.border = "1px solid #fff";
      tr.appendChild(td);
    });

    const tdAcoes = document.createElement("td");
    tdAcoes.style.padding = "8px";
    tdAcoes.style.border = "1px solid #fff";

    const btnAdicionarDias = criarBotao("Adicionar Dias", "btn-info", () => {
      abrirDialogAdicionarDias(e);
    });

    btnAdicionarDias.style.display = "none";
    btnAdicionarDias.style.backgroundColor = "#2196f3";

    const btnEntregue = criarBotao("Entregue", "btn-entregue", async () => {
      try {
        await deleteDoc(doc(db, "emprestimos", e.id));
        cacheEmprestimos = cacheEmprestimos.filter((x) => x.id !== e.id);
        showToast(`Empréstimo de "${e.livro}" entregue!`, "success", 5000, true);
        await carregarEmprestimos();
        await carregarNotificacoes();
      } catch (err) {
        showToast("Erro: " + err.message, "error");
      }
    });

    btnEntregue.style.display = "none";
    tdAcoes.appendChild(btnAdicionarDias);
    tdAcoes.appendChild(btnEntregue);
    tr.appendChild(tdAcoes);

    aplicarEfeitoHoverELinha(tr);

    tr.addEventListener("click", () => {
      const s = tr.classList.contains("selecionado");

      tbody.querySelectorAll("tr").forEach((l) => {
        l.classList.remove("selecionado");
        l.querySelectorAll("button").forEach((b) => (b.style.display = "none"));
        l.style.backgroundColor = "transparent";
      });

      if (!s) {
        tr.classList.add("selecionado");
        btnAdicionarDias.style.display = "inline-block";
        btnEntregue.style.display = "inline-block";
        tr.style.backgroundColor = "#008b0777";
      }
    });

    tbody.appendChild(tr);
  });

  tabela.appendChild(tbody);
  return tabela;
}

async function carregarEmprestimos() {
  if (!cacheEmprestimos.length) {
    const snap = await getDocs(collection(db, "emprestimos"));
    cacheEmprestimos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const turno = turnoEmprestimoFiltroEl.value;
  const turma = turmaEmprestimoFiltroEl.value;
  const termo = normalizarTexto(pesquisaEmprestimosEl.value);

  let emprestimos = [...cacheEmprestimos];

  if (turno) emprestimos = emprestimos.filter((e) => e.turno === turno);
  if (turma) emprestimos = emprestimos.filter((e) => e.turma === turma);
  if (termo) {
    emprestimos = emprestimos.filter((e) =>
      [e.nome, e.livro, e.turno, e.turma].some((v) => normalizarTexto(v).includes(termo))
    );
  }

  emprestimos.sort((a, b) => parseDataBR(a.dataEmprestimo) - parseDataBR(b.dataEmprestimo));

  const container = document.getElementById("lista-emprestimos");
  container.innerHTML = "";

  if (!emprestimos.length) {
    container.innerHTML = '<p class="sem-emprestimos">Nenhum empréstimo registrado.</p>';
    return;
  }

  container.appendChild(criarTabelaEmprestimos(emprestimos));
}

function criarTabelaNotificacoes(emprestimos) {
  const tabela = document.createElement("table");
  tabela.style.width = "100%";
  tabela.style.borderCollapse = "collapse";

  const thead = document.createElement("thead");
  const trh = document.createElement("tr");

  ["Nome Leitor", "Nome Livro", "Turno • Turma", "Data Entrega", "Status", "Ações"].forEach((t) => {
    const th = document.createElement("th");
    th.textContent = t;
    th.style.borderBottom = "2px solid #ff4444";
    th.style.borderLeft = "1px solid #fff";
    th.style.borderRight = "1px solid #fff";
    th.style.borderTop = "1px solid #fff";
    th.style.padding = "8px";
    th.style.textAlign = "left";
    trh.appendChild(th);
  });

  thead.appendChild(trh);
  tabela.appendChild(thead);

  const tbody = document.createElement("tbody");

  emprestimos.forEach((emp) => {
    const tr = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = emp.nome || "";
    tdNome.style.padding = "8px";
    tdNome.style.border = "1px solid #fff";
    tr.appendChild(tdNome);

    const tdLivro = document.createElement("td");
    tdLivro.textContent = emp.livro || "";
    tdLivro.style.padding = "8px";
    tdLivro.style.border = "1px solid #fff";
    tr.appendChild(tdLivro);

    const tdTT = document.createElement("td");
    tdTT.textContent = `${emp.turno} • ${emp.turma}`;
    tdTT.style.padding = "8px";
    tdTT.style.border = "1px solid #fff";
    tr.appendChild(tdTT);

    const tdEntrega = document.createElement("td");
    tdEntrega.textContent = emp.dataEntrega || "";
    tdEntrega.style.padding = "8px";
    tdEntrega.style.border = "1px solid #fff";
    tr.appendChild(tdEntrega);

    const tdStatus = document.createElement("td");
    const dEntrega = parseDataBR(emp.dataEntrega);
    const dias = calcularDiasRestantes(dEntrega);

    let status = "—";
    if (dias != null) {
      if (dias < 0) status = "Não Entregue";
      else if (dias <= 3) status = "Perto de Entregar";
      else status = "No prazo";
    }

    tdStatus.textContent = status;
    if (status === "Não Entregue") tdStatus.style.color = "red";
    tdStatus.style.padding = "8px";
    tdStatus.style.border = "1px solid #fff";
    tr.appendChild(tdStatus);

    const tdAcoes = document.createElement("td");
    tdAcoes.style.padding = "8px";
    tdAcoes.style.border = "1px solid #fff";

    const btnEntregue = criarBotao("Entregue", "btn-entregue", async () => {
      try {
        await deleteDoc(doc(db, "emprestimos", emp.id));
        cacheEmprestimos = cacheEmprestimos.filter((e) => e.id !== emp.id);
        showToast(`Empréstimo de "${emp.livro}" por "${emp.nome}" finalizado!`, "success", 5000, true);
        await carregarEmprestimos();
        await carregarNotificacoes();
      } catch (err) {
        showToast("Erro: " + err.message, "error");
      }
    });

    btnEntregue.style.display = "none";
    tdAcoes.appendChild(btnEntregue);
    tr.appendChild(tdAcoes);

    aplicarEfeitoHoverELinha(tr);

    tr.addEventListener("click", () => {
      const s = tr.classList.contains("selecionado");

      tbody.querySelectorAll("tr").forEach((l) => {
        l.classList.remove("selecionado");
        l.querySelectorAll("button").forEach((b) => (b.style.display = "none"));
        l.style.backgroundColor = "transparent";
      });

      if (!s) {
        tr.classList.add("selecionado");
        btnEntregue.style.display = "inline-block";
        tr.style.backgroundColor = "#008b0777";
      }
    });

    tbody.appendChild(tr);
  });

  tabela.appendChild(tbody);
  return tabela;
}

async function carregarNotificacoes() {
  if (!cacheEmprestimos.length) {
    await carregarEmprestimos();
  }

  const notificaveis = cacheEmprestimos.filter((e) => {
    const d = parseDataBR(e.dataEntrega);
    if (!d) return false;
    const dias = calcularDiasRestantes(d);
    return dias <= 3 || dias < 0;
  });

  const container = document.getElementById("lista-notificacoes");
  container.innerHTML = "";

  if (!notificaveis.length) {
    container.innerHTML = '<p class="sem-notificacoes">Não há notificações ainda.</p>';
    return;
  }

  container.appendChild(criarTabelaNotificacoes(notificaveis));
}

const ADMINS = [
  "claudinea.pereira@biblioteca.souzanilo.com",
  "valdineia.biblioteca@biblioteca.souzanilo.com",
  "marluci.alvarenga@biblioteca.souzanilo.com",
  "richardaghamenon.dev@biblioteca.souzanilo.com",
  "aghamenontoberlock@console.admin.com"
];

function usuarioEhAdmin(user) {
  return user && ADMINS.includes(user.email);
}

function calcularNovaTurmaETurno(leitor) {
  let { turno, turma } = leitor;
  const troca = (de, para) => turma.replace(de, para);

  if (turno === "Manhã") {
    if (turma.startsWith("1º Ano")) turma = troca("1º Ano", "2º Ano");
    else if (turma.startsWith("2º Ano")) turma = troca("2º Ano", "3º Ano");
    else if (turma.startsWith("3º Ano")) turma = "Cidadão";
  } else if (turno === "Tarde") {
    if (turma.startsWith("6º Ano")) turma = troca("6º Ano", "7º Ano");
    else if (turma.startsWith("7º Ano")) turma = troca("7º Ano", "8º Ano");
    else if (turma.startsWith("8º Ano")) turma = troca("8º Ano", "9º Ano");
    else if (turma.startsWith("9º Ano")) {
      turma = troca("9º Ano", "1º Ano");
      turno = "Manhã";
    }
  }

  return { turno, turma };
}

async function criarBackupLeitores(leitores) {
  await addDoc(collection(db, "backup_leitores"), {
    criadoEm: new Date().toISOString(),
    leitores
  });
}

async function registrarLogAnoLetivo(total, alunosMovidos) {
  const agora = new Date();

  await addDoc(collection(db, "logs_ano_letivo"), {
    data: agora.toLocaleDateString("pt-BR"),
    hora: agora.toLocaleTimeString("pt-BR"),
    alunosMovidos: total,
    lista: alunosMovidos,
    criadoEm: agora.toISOString()
  });
}

async function virarAnoLetivo() {
  if (!usuarioEhAdmin(auth.currentUser)) {
    showToast("Acesso negado.", "error");
    return;
  }

  const snap = await getDocs(collection(db, "leitores"));
  const leitores = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  await criarBackupLeitores(leitores);

  let total = 0;
  let listaMovidos = [];

  for (const leitor of leitores) {
    const novo = calcularNovaTurmaETurno(leitor);

    if (novo.turma !== leitor.turma || novo.turno !== leitor.turno) {
      total++;

      listaMovidos.push({
        nome: leitor.nome,
        turnoAntes: leitor.turno,
        turmaAntes: leitor.turma,
        turnoDepois: novo.turno,
        turmaDepois: novo.turma
      });

      await updateDoc(doc(db, "leitores", leitor.id), novo);
    }
  }

  await registrarLogAnoLetivo(total, listaMovidos);
  await carregarLeitores();

  showToast(`🎓 Ano letivo atualizado! Alunos movidos: ${total}`, "success", 5000, true);
}

async function restaurarUltimoBackup() {
  if (!usuarioEhAdmin(auth.currentUser)) {
    showToast("Acesso negado.", "error");
    return;
  }

  const snap = await getDocs(
    query(collection(db, "backup_leitores"), orderBy("criadoEm", "desc"), limit(1))
  );

  if (snap.empty) {
    showToast("Nenhum backup encontrado.", "warning");
    return;
  }

  const backup = snap.docs[0].data().leitores;
  const atual = await getDocs(collection(db, "leitores"));

  await Promise.all(atual.docs.map((d) => deleteDoc(d.ref)));

  for (const leitor of backup) {
    await setDoc(doc(db, "leitores", leitor.id), leitor);
  }

  cacheLeitores = [];
  await carregarLeitores();
  showToast("♻️ Backup restaurado com sucesso!", "success", 5000, true);
}

async function gerarRelatorioPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const snap = await getDocs(
    query(collection(db, "logs_ano_letivo"), orderBy("criadoEm", "desc"), limit(1))
  );

  if (snap.empty) {
    showToast("Nenhum log encontrado.", "warning");
    return;
  }

  const log = snap.docs[0].data();

  let y = 20;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("ESCOLA ESTADUAL PROFESSOR SOUZA NILO", 105, y, { align: "center" });

  y += 8;
  pdf.setFontSize(12);
  pdf.text("Relatório de Virada do Ano Letivo", 105, y, { align: "center" });

  y += 6;
  pdf.setLineWidth(0.5);
  pdf.line(20, y, 190, y);

  y += 10;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  pdf.text(`Data: ${log.data}`, 20, y);
  y += 6;
  pdf.text(`Hora: ${log.hora}`, 20, y);
  y += 6;
  pdf.text(`Total de alunos movidos: ${log.alunosMovidos}`, 20, y);

  y += 10;

  pdf.setFont("helvetica", "bold");
  pdf.text("Lista de Alunos Atualizados", 20, y);
  y += 6;

  pdf.setFont("helvetica", "normal");
  pdf.line(20, y, 190, y);
  y += 6;

  log.lista.forEach((aluno, index) => {
    if (y > 270) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFont("helvetica", "bold");
    pdf.text(`${index + 1}. ${aluno.nome}`, 20, y);
    y += 5;

    pdf.setFont("helvetica", "normal");
    pdf.text(`De: ${aluno.turnoAntes} - ${aluno.turmaAntes}`, 25, y);
    y += 5;
    pdf.text(`Para: ${aluno.turnoDepois} - ${aluno.turmaDepois}`, 25, y);
    y += 8;
  });

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(120);
    pdf.text(
      `Gerado automaticamente pelo Sistema da Biblioteca • Página ${i} de ${totalPages}`,
      105,
      290,
      { align: "center" }
    );
  }

  pdf.save("relatorio_ano_letivo_souza_nilo.pdf");
}

mostrarSenha.addEventListener("change", () => {
  senhaAno.type = mostrarSenha.checked ? "text" : "password";
});

confirmarAno.addEventListener("click", async () => {
  if (senhaAno.value !== "Anoletivosouzanilo") {
    showToast("Senha incorreta!", "error");
    return;
  }

  dialogSenhaAno.close();
  senhaAno.value = "";
  await virarAnoLetivo();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  if (dialogSelecionar.open) dialogSelecionar.close();
  if (dialogoConfirmacao.open) dialogoConfirmacao.close();

  const dialogEditarLivro = document.getElementById("dialogEditarLivro");
  if (dialogEditarLivro.open) dialogEditarLivro.close();

  if (dialogSenhaAno.open) dialogSenhaAno.close();
  if (dialogAdicionarDias.open) dialogAdicionarDias.close();
});

window.gerarRelatorioPDF = gerarRelatorioPDF;
window.virarAnoLetivo = virarAnoLetivo;
window.restaurarUltimoBackup = restaurarUltimoBackup;
window.dialogSenhaAno = dialogSenhaAno;

window.addEventListener("load", async () => {
  Object.values(botoes).forEach((sec) => {
    const el = document.getElementById(sec);
    if (el) el.style.display = "none";
  });

  await carregarGeneros();
  await carregarLivros();
  await carregarLeitores();
  await carregarEmprestimos();
  await carregarNotificacoes();
});