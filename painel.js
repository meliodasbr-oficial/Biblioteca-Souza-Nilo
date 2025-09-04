// ======= IMPORTS FIREBASE =======
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ======= CONFIG FIREBASE =======
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
  if (!user) location.replace("login.html");
  else console.log("Usuário autenticado:", user.email);
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

function showToast(message, type = "success", duration = 6000) {
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

  // Animar barra de duração
  const durationBar = toast.querySelector(".duration-bar");
  durationBar.style.animation = `durationBarAnim ${duration}ms linear forwards`;

  // Manter toast visível pelo tempo definido e depois iniciar saída
  setTimeout(() => {
    toast.style.animation = "slideOut 0.5s forwards";

    // Remover toast após a animação de saída
    setTimeout(() => {
      toast.remove();
    }, 120);
  }, duration);
}


// ======= DADOS ESTÁTICOS =======
const turmasPorTurno = {
  "Manhã": [
    "1º Ano A","1º Ano B","1º Ano C","1º Ano D","1º Ano E",
    "2º Ano A","2º Ano B","2º Ano C","2º Ano D","2º Ano E",
    "3º Ano A","3º Ano B","3º Ano C","3º Ano D","3º Ano E",
    "Outros"
  ],
  "Tarde": [
    "6º Ano A","6º Ano B","6º Ano C","6º Ano D","6º Ano E",
    "7º Ano A","7º Ano B","7º Ano C","7º Ano D","7º Ano E",
    "8º Ano A","8º Ano B","8º Ano C","8º Ano D","8º Ano E",
    "9º Ano A","9º Ano B","9º Ano C","9º Ano D","9º Ano E",
    "Outros"
  ],
  "Noite": [
    "EJA 1","EJA 2","Cursos"
  ]
};

// ======= UTILITÁRIOS =======
function normalizarTexto(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .trim();
}

async function gerarProximoIdSequencial(nomeColecao) {
  const snapshot = await getDocs(collection(db, nomeColecao));
  if (snapshot.empty) return "01";
  const numeros = snapshot.docs
    .map(d => parseInt(d.id))
    .filter(n => !isNaN(n))
    .sort((a,b) => a - b);
  let prox = 1;
  for (const n of numeros) { if (n === prox) prox++; else break; }
  return String(prox).padStart(2, "0");
}

function parseDataBR(dataStr) {
  if (!dataStr) return null;
  const [dia, mes, ano] = dataStr.split("/").map(Number);
  return new Date(ano, mes - 1, dia);
}
function formatarDataBRDate(date) {
  const d = String(date.getDate()).padStart(2,'0');
  const m = String(date.getMonth()+1).padStart(2,'0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}
function calcularDiasRestantes(dataEntrega) {
  if (!(dataEntrega instanceof Date)) return null;
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  const entrega = new Date(dataEntrega.getTime());
  entrega.setHours(0,0,0,0);
  const diff = (entrega - hoje) / (1000 * 60 * 60 * 24);
  return Math.ceil(diff);
}

function criarBotao(texto, classe, onClick) {
  const btn = document.createElement("button");
  btn.textContent = texto;
  btn.className = classe;
  btn.style.marginLeft = "10px";
  btn.addEventListener("click", onClick);
  return btn;
}

function aplicarEfeitoHoverELinha(tr) {
  tr.style.transition="background-color 0.3s";
  tr.addEventListener("mouseenter",()=>{ tr.style.backgroundColor="#0603a366"; tr.style.cursor="pointer"; });
  tr.addEventListener("mouseleave",()=>{ if(!tr.classList.contains("selecionado")) tr.style.backgroundColor="transparent"; });
}

// ======= CONTROLE DE SEÇÕES =======
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

function mostrarSecao(idSecao) {
  Object.values(botoes).forEach(sec => {
    const el = document.getElementById(sec);
    if (el) el.style.display = "none";
  });
  const alvo = document.getElementById(idSecao);
  if (alvo) alvo.style.display = "flex";
}

Object.keys(botoes).forEach(cardId => {
  const el = document.getElementById(cardId);
  el.addEventListener("click", async () => {
    mostrarSecao(botoes[cardId]);

        document.querySelectorAll(".card").forEach(c => c.classList.remove("ativo"));

    // aplicar destaque no card atual
    el.classList.add("ativo");
    
    // carregamentos sob demanda
    if (cardId === "card-criar") await carregarGeneros();
    if (cardId === "card-livros") await carregarLivros();
    if (cardId === "card-lista-leitores") await carregarLeitores();
    if (cardId === "card-lista-emprestimos") await carregarEmprestimos();
    if (cardId === "card-notificacoes") await carregarNotificacoes();
  });
});

// ======= DIALOG DE CONFIRMAÇÃO =======
const dialogoConfirmacao = document.getElementById("dialogoConfirmacao");
const dialogoMensagem = document.getElementById("dialogoMensagem");
const btnSimDialog = document.getElementById("btnSimDialog");
const btnCancelarDialog = document.getElementById("btnCancelarDialog");
let callbackConfirmacao = null;

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

// ======= MODAL DE GÊNERO (SELEÇÃO) =======
let generosCadastrados = [];
const inputGeneroLivro = document.getElementById("generoLivro");
const modalGenero = document.getElementById("modalGenero");
const listaGenerosModal = document.getElementById("listaGenerosModal");
const btnFecharModalGenero = document.getElementById("fecharModalGenero");

inputGeneroLivro.addEventListener("click", () => {
  preencherListaGenerosNoModal();
  modalGenero.style.display = "flex";
});
btnFecharModalGenero.addEventListener("click", () => modalGenero.style.display = "none");
modalGenero.addEventListener("click", (e) => { if (e.target === modalGenero) modalGenero.style.display = "none"; });

function preencherListaGenerosNoModal() {
  listaGenerosModal.innerHTML = "";
  if (generosCadastrados.length === 0) {
    listaGenerosModal.innerHTML = "<li>Nenhum gênero cadastrado.</li>";
    return;
  }
  generosCadastrados.forEach(g => {
    const li = document.createElement("li");
    li.textContent = g;
    li.style.cursor = "pointer";
    li.style.padding = "8px 12px";
    li.style.borderRadius = "4px";
    li.addEventListener("click", () => {
      inputGeneroLivro.value = g;
      modalGenero.style.display = "none";
    });
    listaGenerosModal.appendChild(li);
  });
}

// ======= CRUD GÊNEROS =======
async function carregarGeneros() {
  const snapshot = await getDocs(collection(db, "generos"));
  const generos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  generosCadastrados = generos.map(g => g.nome).sort((a,b) => a.localeCompare(b, 'pt', {sensitivity:'base'}));

  const container = document.getElementById("lista-generos");
  container.innerHTML = "";

  if (generos.length === 0) {
    container.innerHTML = '<li class="sem-livros">Nenhum gênero registrado.</li>';
    return;
  }

  generosCadastrados.forEach(nome => {
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
            // apaga subcoleção com o nome do gênero (espelhada)
            const generoRef = collection(db, nome);
            const livrosDoGenero = await getDocs(generoRef);
            await Promise.all(livrosDoGenero.docs.map(d => deleteDoc(d.ref)));
            // apaga livros em "livros" com esse gênero
            const qLivros = query(collection(db, "livros"), where("genero", "==", nome));
            const snapLivros = await getDocs(qLivros);
            await Promise.all(snapLivros.docs.map(d => deleteDoc(d.ref)));
            // apaga registro do gênero
            const gSnap = await getDocs(collection(db,"generos"));
            const gDoc = gSnap.docs.find(dd => dd.data().nome === nome);
            if (gDoc) await deleteDoc(gDoc.ref);

            showToast(`Gênero "${nome}" removido com sucesso!`, "success");
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
      container.querySelectorAll(".genero-item").forEach(i => {
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
  if (generosCadastrados.includes(nome)) return showToast(`Gênero "${nome}" já existe.`, "warning");

  try {
    const proxId = await gerarProximoIdSequencial("generos");
    await setDoc(doc(db, "generos", proxId), { nome });
    showToast(`Gênero "${nome}" criado com sucesso!`, "success");
    e.target.reset();
    await carregarGeneros();
  } catch (err) {
    showToast("Erro ao criar gênero: " + err.message, "error");
  }
});

// ======= CRUD LIVROS =======
async function livroExiste(nome, autor, volume) {
  const n = normalizarTexto(nome);
  const a = normalizarTexto(autor);
  const v = (volume || "1").trim();
  const snap = await getDocs(collection(db, "livros"));
  return snap.docs.some(d => {
    const data = d.data();
    return normalizarTexto(data.nome) === n &&
           normalizarTexto(data.autor) === a &&
           (data.volume ? String(data.volume).trim() : "1") === v;
  });
}

async function salvarLivro(livroData) {
  const dataHora = new Date().toISOString();
  const proxId = await gerarProximoIdSequencial("livros");
  await setDoc(doc(db, "livros", proxId), { ...livroData, registradoEm: dataHora });

  // espelhar por coleção do gênero (nome da coleção = gênero)
  const proxIdGenero = await gerarProximoIdSequencial(livroData.genero);
  await setDoc(doc(db, livroData.genero, proxIdGenero), { ...livroData, registradoEm: dataHora });
}

function criarTabelaLivros(livros) {
  const tabela = document.createElement("table");
  tabela.style.width = "100%";
  tabela.style.borderCollapse = "collapse";

  const thead = document.createElement("thead");
  const trh = document.createElement("tr");
  ["Nome","Autor","Gênero","Quantidade","Volume","Prateleira",""].forEach(t => {
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

  livros.forEach(livro => {
    const tr = document.createElement("tr");

    ["nome","autor","genero","quantidade","volume","prateleira"].forEach(c => {
      const td = document.createElement("td");
      td.textContent = livro[c] || (c === "volume" ? "1" : "");
      td.style.padding = "8px";
      td.style.border = "1px solid #fff";
      tr.appendChild(td);
    });

    const tdAcoes = document.createElement("td");
    tdAcoes.style.padding = "8px";
    tdAcoes.style.border = "1px solid #fff";

    // Botão REMOVER
    const btnRemover = criarBotao("Remover", "btn-remover", () => {
      abrirDialogoConfirmacao(
        `Deseja realmente remover o livro "${livro.nome}" volume ${livro.volume || "1"}?`,
        async () => {
          try {
            await deleteDoc(doc(db, "livros", livro.id));
            const generoRef = collection(db, livro.genero);
            const generoSnap = await getDocs(generoRef);
            const docGenero = generoSnap.docs.find(d => {
              const data = d.data();
              return data.nome === livro.nome &&
                     data.autor === livro.autor &&
                     (data.volume || "1") === (livro.volume || "1");
            });
            if (docGenero) await deleteDoc(docGenero.ref);
            showToast(`Livro "${livro.nome}" removido!`, "success");
            await carregarLivros();
          } catch (err) {
            showToast("Erro ao remover livro: " + err.message, "error");
          }
        }
      );
    });
    btnRemover.style.display = "none";

    // Botão EDITAR
    const btnEditar = criarBotao("Editar", "btn-editar", () => {
      abrirDialogEditarLivro(livro);
    });
    btnEditar.style.display = "none";
    btnEditar.style.backgroundColor = "#FFA500"; // cor diferente para destacar

    tdAcoes.appendChild(btnEditar);
    tdAcoes.appendChild(btnRemover);
    tr.appendChild(tdAcoes);

    aplicarEfeitoHoverELinha(tr);
    tr.addEventListener("click", () => {
      const selecionado = tr.classList.contains("selecionado");
      tbody.querySelectorAll("tr").forEach(l => {
        l.classList.remove("selecionado");
        l.querySelectorAll("button").forEach(b => b.style.display="none");
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

// Função para abrir o dialog e preencher os dados
function abrirDialogEditarLivro(livro) {
  const dialog = document.getElementById("dialogEditarLivro");
  dialog.showModal();

  document.getElementById("editarNomeLivro").value = livro.nome;
  document.getElementById("editarAutorLivro").value = livro.autor;
  document.getElementById("editarGeneroLivro").value = livro.genero;
  document.getElementById("editarQuantidadeLivro").value = livro.quantidade;
  document.getElementById("editarPrateleiraLivro").value = livro.prateleira;

  const form = document.getElementById("form-editar-livro");
  form.onsubmit = async (e) => {
    e.preventDefault();

    const novoLivro = {
      nome: document.getElementById("editarNomeLivro").value,
      autor: document.getElementById("editarAutorLivro").value,
      genero: document.getElementById("editarGeneroLivro").value,
      quantidade: document.getElementById("editarQuantidadeLivro").value,
      prateleira: document.getElementById("editarPrateleiraLivro").value,
      volume: livro.volume || "1"
    };

    try {
      // Atualiza livro principal
      await setDoc(doc(db, "livros", livro.id), novoLivro);

      // Se gênero mudou, mover documento para novo gênero
      if (livro.genero !== novoLivro.genero) {
        // Deleta no gênero antigo
        const generoRef = collection(db, livro.genero);
        const generoSnap = await getDocs(generoRef);
        const docGenero = generoSnap.docs.find(d => {
          const data = d.data();
          return data.nome === livro.nome && data.autor === livro.autor && (data.volume || "1") === (livro.volume || "1");
        });
        if (docGenero) await deleteDoc(docGenero.ref);

        // Adiciona no novo gênero
        await addDoc(collection(db, novoLivro.genero), novoLivro);
      } else {
        // Se gênero não mudou, atualiza os dados no mesmo
        const generoRef = collection(db, novoLivro.genero);
        const generoSnap = await getDocs(generoRef);
        const docGenero = generoSnap.docs.find(d => {
          const data = d.data();
          return data.nome === livro.nome && data.autor === livro.autor && (data.volume || "1") === (livro.volume || "1");
        });
        if (docGenero) await setDoc(docGenero.ref, novoLivro);
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
  const snap = await getDocs(collection(db, "livros"));
  const livros = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  livros.sort((a,b) => a.nome.localeCompare(b.nome, 'pt', {sensitivity:'base'}));

  const container = document.getElementById("lista-livros-registrados");
  container.innerHTML = "";
  if (livros.length === 0) {
    container.innerHTML = '<p class="sem-livros">Nenhum livro registrado.</p>';
    return;
  }
  container.appendChild(criarTabelaLivros(livros));
}

// Submit livro
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
  if (await livroExiste(nome, autor, volume)) {
    return showToast(`Livro "${nome}" volume ${volume} já cadastrado.`, "warning");
  }

  try {
    await salvarLivro({ nome, autor, genero, prateleira, volume, quantidade });
    showToast(`"${nome}" (Vol ${volume}) adicionado!`, "success");
    e.target.reset();
    await carregarLivros();
  } catch (err) {
    showToast("Erro ao salvar livro: " + err.message, "error");
  }
});

// Pesquisa livros (na lista)
const inputPesquisaLivros = document.querySelector("#secao-livros-registrados .livros-pesquisa");
if (inputPesquisaLivros) {
  inputPesquisaLivros.addEventListener("input", async (e) => {
    const termo = normalizarTexto(e.target.value);
    const snap = await getDocs(collection(db, "livros"));
    let livros = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    livros = livros.filter(l =>
      ["nome","autor","genero","prateleira","volume"].some(c =>
        normalizarTexto(l[c]).includes(termo)
      )
    );
    const container = document.getElementById("lista-livros-registrados");
    container.innerHTML = "";
    if (livros.length === 0) {
      container.innerHTML = '<p class="sem-livros">Nenhum livro encontrado.</p>';
      return;
    }
    container.appendChild(criarTabelaLivros(livros));
  });
}

// ======= CRUD LEITORES =======
// (IDs duplicados no HTML; vamos escopar por seção)
const secRegistrarLeitor = document.getElementById("secao-registrar-leitor");
const nomeLeitorEl = secRegistrarLeitor.querySelector("#nomeLeitor");
const turnoLeitorEl = secRegistrarLeitor.querySelector("#turnoLeitor");
const turmaLeitorEl = secRegistrarLeitor.querySelector("#turmaLeitor");
const nascimentoLeitorEl = secRegistrarLeitor.querySelector("#nascimentoLeitor");

function preencherTurmasSelect(select, turno, primeiraOpc = "Selecione...") {
  select.innerHTML = `<option value="">${primeiraOpc}</option>`;
  if (turmasPorTurno[turno]) {
    turmasPorTurno[turno].forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      select.appendChild(opt);
    });
  }
}
turnoLeitorEl.addEventListener("change", () => preencherTurmasSelect(turmaLeitorEl, turnoLeitorEl.value));

async function leitorExiste(nome, turno, turma, nascimento) {
  const snap = await getDocs(collection(db, "leitores"));
  return snap.docs.some(d => {
    const L = d.data();
    return L.nome === nome && L.turno === turno && L.turma === turma && L.nascimento === nascimento;
  });
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
  if (await leitorExiste(nome, turno, turma, nascimento)) {
    return showToast(`Leitor "${nome}" já está registrado.`, "warning");
  }

  try {
    const proxId = await gerarProximoIdSequencial("leitores");
    await setDoc(doc(db, "leitores", proxId), {
      nome, turno, turma, nascimento, registradoEm: new Date().toISOString()
    });
    showToast(`Leitor "${nome}" registrado!`, "success");
    e.target.reset();
    turmaLeitorEl.innerHTML = "<option value=''>Selecione...</option>";
  } catch (err) {
    showToast("Erro ao registrar leitor: " + err.message, "error");
  }
});

secRegistrarLeitor.querySelectorAll(".btn-cancelar").forEach(btn => {
  btn.addEventListener("click", () => {
    secRegistrarLeitor.querySelector("#form-registrar-leitor").reset();
    turmaLeitorEl.innerHTML = "<option value=''>Selecione...</option>";
    secRegistrarLeitor.style.display = "none";
  });
});

// Lista de leitores (seção com IDs duplicados, escopar aqui também)
const secListaLeitores = document.getElementById("secao-lista-leitores");
const inputPesquisarLeitor = secListaLeitores.querySelector(".leitores-pesquisa");
const selectTurnoFiltro = secListaLeitores.querySelector("#turnoLeitor");
const selectTurmaFiltro = secListaLeitores.querySelector("#turmaLeitor");

function atualizarTurmasFiltroLeitores() {
  preencherTurmasSelect(selectTurmaFiltro, selectTurnoFiltro.value, "Selecione...");
}

async function carregarLeitores() {
  const snap = await getDocs(collection(db, "leitores"));
  let leitores = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  leitores.sort((a,b) => a.nome.localeCompare(b.nome, 'pt', {sensitivity:'base'}));
  exibirLeitoresRegistrados(leitores);
}

function criarTabelaLeitores(leitores) {
  const tabela = document.createElement("table");
  tabela.style.width = "100%";
  tabela.style.borderCollapse = "collapse";

  const thead = document.createElement("thead");
  const trh = document.createElement("tr");

  ["Nome","Turno","Turma","Nascimento",""].forEach(t => {
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
  leitores.forEach(L => {
    const tr = document.createElement("tr");

    const nascBR = (() => {
      if (!L.nascimento) return "";
      const [y, m, d] = L.nascimento.split("-");
      return `${d}/${m}/${y}`;
    })();

    [["nome", L.nome],["turno", L.turno],["turma", L.turma],["nascimento", nascBR]].forEach(([_, val]) => {
      const td = document.createElement("td");
      td.textContent = val || "";
      td.style.padding = "8px";
      td.style.border = "1px solid #fff";
      tr.appendChild(td);
    });

    const tdAcoes = document.createElement("td");
    tdAcoes.style.padding = "8px";
    tdAcoes.style.border = "1px solid #fff";

    const btnRemover = criarBotao("Remover", "btn-remover", async () => {
      abrirDialogoConfirmacao(`Deseja remover o leitor "${L.nome}"?`, async () => {
        try {
          await deleteDoc(doc(db, "leitores", L.id));
          showToast(`Leitor "${L.nome}" removido!`, "success");
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
      tbody.querySelectorAll("tr").forEach(l => {
        l.classList.remove("selecionado");
        l.querySelectorAll("button").forEach(b => b.style.display = "none");
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

async function filtrarLeitores() {
  const termo = normalizarTexto(inputPesquisarLeitor.value);
  const turno = selectTurnoFiltro.value;
  const turma = selectTurmaFiltro.value;

  const snap = await getDocs(collection(db, "leitores"));
  let leitores = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (turno) leitores = leitores.filter(l => l.turno === turno);
  if (turma) leitores = leitores.filter(l => l.turma === turma);
  if (termo) {
    leitores = leitores.filter(l =>
      ["nome","turno","turma"].some(c => normalizarTexto(l[c]).includes(termo))
    );
  }

  leitores.sort((a,b) => a.nome.localeCompare(b.nome, 'pt', {sensitivity:'base'}));
  exibirLeitoresRegistrados(leitores);
}

inputPesquisarLeitor.addEventListener("input", filtrarLeitores);
selectTurnoFiltro.addEventListener("change", () => { atualizarTurmasFiltroLeitores(); filtrarLeitores(); });
selectTurmaFiltro.addEventListener("change", filtrarLeitores);

// Ao abrir a seção de lista de leitores
document.getElementById("card-lista-leitores").addEventListener("click", () => {
  selectTurnoFiltro.value = "";
  selectTurmaFiltro.innerHTML = "<option value=''>Selecione...</option>";
});

// ======= DIALOGO DE SELEÇÃO (LEITOR / LIVRO) =======
const dialogSelecionar = document.getElementById("dialogSelecionar");
const dialogTitulo = document.getElementById("dialogTitulo");
const btnFecharDialog = document.getElementById("btnFecharDialog");
const pesquisaDialog = document.getElementById("pesquisaDialog");
const listaDialog = document.getElementById("listaDialog");
let dialogCallback = null;

btnFecharDialog.addEventListener("click", () => {
  dialogSelecionar.close();
  dialogCallback = null;
});
pesquisaDialog.addEventListener("input", () => {
  if (typeof dialogCallback === "function") dialogCallback(pesquisaDialog.value);
});
function abrirDialogoSelecionar(titulo, gerarListaCallback) {
  dialogTitulo.textContent = titulo;
  pesquisaDialog.value = "";
  listaDialog.innerHTML = "";
  dialogSelecionar.showModal();
  dialogCallback = (filtro = "") => gerarListaCallback(filtro);
  gerarListaCallback("");
}

// ======= EMPRÉSTIMOS =======
const secRegistrarEmp = document.getElementById("secao-registrar-emprestimo");
const turnoEmprestimoEl = secRegistrarEmp.querySelector("#turnoEmprestimo");
const turmaEmprestimoEl = secRegistrarEmp.querySelector("#turmaEmprestimo");
const nomeEmprestimoEl = secRegistrarEmp.querySelector("#nomeEmprestimo");
const livroEmprestimoEl = secRegistrarEmp.querySelector("#livroEmprestimo");
const diasEntregaEl = secRegistrarEmp.querySelector("#diasEntrega");

turnoEmprestimoEl.addEventListener("change", () => {
  preencherTurmasSelect(turmaEmprestimoEl, turnoEmprestimoEl.value);
});

nomeEmprestimoEl.addEventListener("click", async () => {
  const turno = turnoEmprestimoEl.value;
  const turma = turmaEmprestimoEl.value;
  if (!turno || !turma) return showToast("Selecione primeiro Turno e Turma.", "warning");

  abrirDialogoSelecionar("Selecionar Leitor", async (filtro) => {
    const snap = await getDocs(collection(db, "leitores"));
    const leitores = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(l => l.turno === turno && l.turma === turma)
      .filter(l => {
        const f = normalizarTexto(filtro);
        return normalizarTexto(l.nome).includes(f) || (l.nascimento || "").includes(filtro);
      });

    listaDialog.innerHTML = "";
    if (!leitores.length) {
      listaDialog.innerHTML = "<li>Nenhum leitor encontrado.</li>";
      return;
    }

    leitores.forEach(l => {
      const li = document.createElement("li");
      li.className = "dialog-item";
      const nascBR = l.nascimento ? (() => {
        const [y,m,d] = l.nascimento.split("-");
        return `${d}/${m}/${y}`;
      })() : "";
      li.innerHTML = `
        <div class="dialog-item-info">
          <div class="dialog-item-title">${l.nome}</div>
          <div class="dialog-item-subtitle">${l.turno} • Turma: ${l.turma} • ${nascBR}</div>
        </div>
        <button class="btn-selecionar">Selecionar</button>
      `;
      li.querySelector(".btn-selecionar").addEventListener("click", () => {
        nomeEmprestimoEl.value = l.nome;
        dialogSelecionar.close();
      });
      listaDialog.appendChild(li);
    });
  });
});

livroEmprestimoEl.addEventListener("click", async () => {
  abrirDialogoSelecionar("Selecionar Livro", async (filtro) => {
    const snap = await getDocs(collection(db, "livros"));
    const livros = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(l => {
        const f = normalizarTexto(filtro);
        return [l.nome, l.autor, l.genero, l.prateleira].some(x => normalizarTexto(x).includes(f));
      });

    listaDialog.innerHTML = "";
    if (!livros.length) {
      listaDialog.innerHTML = "<li>Nenhum livro encontrado.</li>";
      return;
    }

    livros.forEach(l => {
      const li = document.createElement("li");
      li.className = "dialog-item";
      li.innerHTML = `
        <div class="dialog-item-info">
          <div class="dialog-item-title">${l.nome}</div>
          <div class="dialog-item-subtitle">Autor: ${l.autor} • Prateleira: ${l.prateleira || ''} • ${l.genero} • Vol: ${l.volume || 1}</div>
        </div>
        <button class="btn-selecionar">Selecionar</button>
      `;
      li.querySelector(".btn-selecionar").addEventListener("click", () => {
        livroEmprestimoEl.value = `${l.nome} (Vol ${l.volume || 1})`;
        dialogSelecionar.close();
      });
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
    turno, turma,
    livro: livroSelecionado,
    diasEntrega,
    dataEmprestimo: formatarDataBRDate(hoje),
    dataEntrega: formatarDataBRDate(entrega),
    registradoEm: new Date().toISOString()
  };

  try {
    const proxId = await gerarProximoIdSequencial("emprestimos");
    await setDoc(doc(db, "emprestimos", proxId), emprestimoData);
    showToast(`Empréstimo de "${livroSelecionado}" registrado!`, "success");
    e.target.reset();
    turmaEmprestimoEl.innerHTML = "<option value=''>Selecione...</option>";
    await carregarEmprestimos();
    await carregarNotificacoes();
  } catch (err) {
    showToast("Erro ao registrar empréstimo: " + err.message, "error");
  }
});

// ======= LISTA DE EMPRÉSTIMOS + FILTROS =======
const secListaEmp = document.getElementById("secao-lista-emprestimos");
const pesquisaEmprestimosEl = secListaEmp.querySelector("#pesquisaEmprestimos");
const turnoEmprestimoFiltroEl = secListaEmp.querySelector("#turnoEmprestimoFiltro");
const turmaEmprestimoFiltroEl = secListaEmp.querySelector("#turmaEmprestimoFiltro");

function atualizarTurmasFiltroEmprestimo(turno) {
  turmaEmprestimoFiltroEl.innerHTML = "<option value=''>Todos</option>";
  if (turmasPorTurno[turno]) {
    turmasPorTurno[turno].forEach(t => {
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

function criarTabelaEmprestimos(emprestimos) {
  const tabela = document.createElement("table");
  tabela.style.width = "100%";
  tabela.style.borderCollapse = "collapse";

  const thead = document.createElement("thead");
  const trh = document.createElement("tr");
  ["Nome Leitor","Nome Livro","Turno • Turma","Data Pego","Data Entrega","Dias","Ações"].forEach(t => {
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

  emprestimos.forEach(e => {
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid #ffffffff";

    const dataEntregaObj = parseDataBR(e.dataEntrega);
    const diasRestantes = calcularDiasRestantes(dataEntregaObj);
    const diasTexto = diasRestantes == null ? "" : (diasRestantes < 0 ? "Atrasado" : `${diasRestantes} dias`);

    const cells = [
      e.nome,
      e.livro,
      `${e.turno} • ${e.turma}`,
      e.dataEmprestimo || "",
      e.dataEntrega || "",
      diasTexto
    ];
    cells.forEach(val => {
      const td = document.createElement("td");
      td.textContent = val;
      td.style.padding = "8px";
      td.style.border = "1px solid #fff";
      tr.appendChild(td);
    });

    const tdAcoes = document.createElement("td");
    tdAcoes.style.padding = "8px";
    tdAcoes.style.border = "1px solid #fff";
    const btnEntregue = criarBotao("Entregue", "btn-entregue", async () => {
      try {
        await deleteDoc(doc(db, "emprestimos", e.id));
        showToast(`Empréstimo de "${e.livro}" entregue!`, "success");
        await carregarEmprestimos();
        await carregarNotificacoes();
      } catch (err) { showToast("Erro: " + err.message, "error"); }
    });
    btnEntregue.style.display = "none";
    tdAcoes.appendChild(btnEntregue);
    tr.appendChild(tdAcoes);

    aplicarEfeitoHoverELinha(tr);
    tr.addEventListener("click", () => {
      const s = tr.classList.contains("selecionado");
      tbody.querySelectorAll("tr").forEach(l => {
        l.classList.remove("selecionado");
        l.querySelectorAll("button").forEach(b => b.style.display="none");
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

async function carregarEmprestimos() {
  const turno = turnoEmprestimoFiltroEl.value;
  const turma = turmaEmprestimoFiltroEl.value;
  const termo = normalizarTexto(pesquisaEmprestimosEl.value);

  const snap = await getDocs(collection(db, "emprestimos"));
  let emprestimos = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (turno) emprestimos = emprestimos.filter(e => e.turno === turno);
  if (turma) emprestimos = emprestimos.filter(e => e.turma === turma);
  if (termo) {
    emprestimos = emprestimos.filter(e =>
      [e.nome, e.livro, e.turno, e.turma].some(v => normalizarTexto(v).includes(termo))
    );
  }

  // Ordena por data de empréstimo
  emprestimos.sort((a,b) => parseDataBR(a.dataEmprestimo) - parseDataBR(b.dataEmprestimo));

  const container = document.getElementById("lista-emprestimos");
  container.innerHTML = "";
  if (!emprestimos.length) {
    container.innerHTML = '<p class="sem-emprestimos">Nenhum empréstimo registrado.</p>';
    return;
  }
  container.appendChild(criarTabelaEmprestimos(emprestimos));
}

// ======= NOTIFICAÇÕES =======
function criarTabelaNotificacoes(emprestimos) {
  const tabela = document.createElement("table");
  tabela.style.width = "100%";
  tabela.style.borderCollapse = "collapse";

  const thead = document.createElement("thead");
  const trh = document.createElement("tr");

  ["Nome Leitor","Nome Livro","Turno • Turma","Data Entrega","Status","Ações"].forEach(t => {
    const th = document.createElement("th");
    th.textContent = t;

    // bordas do cabeçalho
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
  const hoje = new Date(); hoje.setHours(0,0,0,0);

  emprestimos.forEach(emp => {
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

    const btnEntregue = criarBotao("Entregue","btn-entregue", async () => {
      try {
        await deleteDoc(doc(db, "emprestimos", emp.id));
        showToast(`Empréstimo de "${emp.livro}" por "${emp.nome}" finalizado!`, "success");
        await carregarEmprestimos();
        await carregarNotificacoes();
      } catch (err) { showToast("Erro: " + err.message, "error"); }
    });
    btnEntregue.style.display = "none";
    tdAcoes.appendChild(btnEntregue);
    tr.appendChild(tdAcoes);

    aplicarEfeitoHoverELinha(tr);
    tr.addEventListener("click", () => {
      const s = tr.classList.contains("selecionado");
      tbody.querySelectorAll("tr").forEach(l => {
        l.classList.remove("selecionado");
        l.querySelectorAll("button").forEach(b => b.style.display="none");
        l.style.backgroundColor="transparent";
      });
      if (!s) {
        tr.classList.add("selecionado");
        btnEntregue.style.display="inline-block";
        tr.style.backgroundColor="#008b0777";
      }
    });

    tbody.appendChild(tr);
  });

  tabela.appendChild(tbody);
  return tabela;
}

async function carregarNotificacoes() {
  const snap = await getDocs(collection(db, "emprestimos"));
  let emprestimos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const notificaveis = emprestimos.filter(e => {
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

// ======= AÇÕES INICIAIS =======
// Esconde todas as seções no load
window.addEventListener("load", async () => {
  Object.values(botoes).forEach(sec => { const el = document.getElementById(sec); if (el) el.style.display = "none"; });
  // Pré-carrega listas base para modais/pesquisas
  await carregarGeneros();
  await carregarLivros();
  await carregarLeitores();
  await carregarEmprestimos();
  await carregarNotificacoes();
});

