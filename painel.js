// ======= IMPORTS FIREBASE =======
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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

onAuthStateChanged(auth, (user) => {
  if (user) {
    const email = user.email;
    const emailCurto = email.length > 14 ? email.slice(0, 14) + "..." : email;
    document.getElementById("user-email").textContent = `Logado como: ${emailCurto}`;
  } else {
    window.location.href = "login.html";
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
  const durationBar = toast.querySelector(".duration-bar");
  durationBar.style.animation = `durationBarAnim ${duration}ms linear forwards`;
  setTimeout(() => {
    toast.style.animation = "slideOutToast 0.5s forwards";
    toast.addEventListener("animationend", () => toast.remove());
  }, duration);
}

// ======= TURMAS =======
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

// ======= CONTROLE DE SEÇÕES =======
const botoes = {
  "card-livros": "secao-livros-registrados",
  "card-registrar": "secao-registrar-livro",
  "card-criar": "secao-criar-genero",
  "card-leitores": "secao-registrar-leitor",
  "card-lista-leitores": "secao-lista-leitores",
  "card-emprestimo": "secao-registrar-emprestimo",
  "card-lista-emprestimos": "secao-lista-emprestimos",
  "card-notificacoes": "secao-notificacoes",
  "card-ranking": "secao-ranking"
};

Object.keys(botoes).forEach(id => {
  const botao = document.getElementById(id);
  botao.addEventListener("click", () => {
    Object.values(botoes).forEach(secao => {
      document.getElementById(secao).style.display = "none";
    });
    document.getElementById(botoes[id]).style.display = "block";

    if (id === "card-criar") carregarGeneros();
    if (id === "card-livros") carregarLivros();
  });
});

document.getElementById("btn-cancelar-registrar").addEventListener("click", () => {
  document.getElementById("secao-registrar-livro").style.display = "none";
});

let generosCadastrados = [];

async function gerarProximoIdSequencial(nomeColecao) {
  const snapshot = await getDocs(collection(db, nomeColecao));
  if (snapshot.empty) return "01";
  const numeros = snapshot.docs.map(doc => parseInt(doc.id)).filter(num => !isNaN(num)).sort((a,b)=>a-b);
  let prox = 1;
  for (const num of numeros) { if (num === prox) prox++; else break; }
  return prox.toString().padStart(2,"0");
}

function normalizarTexto(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}

async function livroExiste(nome, autor, volume) {
  const nomeNormalizado = normalizarTexto(nome);
  const autorNormalizado = normalizarTexto(autor);
  const volumeNormalizado = volume.trim();
  const livrosSnap = await getDocs(collection(db, "livros"));
  return livrosSnap.docs.some(doc=>{
    const data=doc.data();
    const nomeDoc=normalizarTexto(data.nome);
    const autorDoc=normalizarTexto(data.autor);
    const volumeDoc=data.volume?data.volume.trim():"1";
    return nomeDoc===nomeNormalizado && autorDoc===autorNormalizado && volumeDoc===volumeNormalizado;
  });
}

async function salvarLivro(livroData) {
  const dataHora = new Date().toISOString();
  const proxIdLivros = await gerarProximoIdSequencial("livros");
  await setDoc(doc(db, "livros", proxIdLivros), { ...livroData, registradoEm: dataHora });
  const proxIdGenero = await gerarProximoIdSequencial(livroData.genero);
  await setDoc(doc(db, livroData.genero, proxIdGenero), { ...livroData, registradoEm: dataHora });
}

const dialogoConfirmacao = document.getElementById("dialogoConfirmacao");
const dialogoMensagem = document.getElementById("dialogoMensagem");
const btnSimDialog = document.getElementById("btnSimDialog");
const btnCancelarDialog = document.getElementById("btnCancelarDialog");

let callbackConfirmacao = null;

function abrirDialogo(mensagem, onConfirm) {
  dialogoMensagem.textContent = mensagem;
  callbackConfirmacao = onConfirm;
  dialogoConfirmacao.showModal();
}

btnSimDialog.addEventListener("click", () => {
  if (callbackConfirmacao) callbackConfirmacao();
  dialogoConfirmacao.close();
});

btnCancelarDialog.addEventListener("click", () => {
  dialogoConfirmacao.close();
  callbackConfirmacao = null;
});

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
  tr.addEventListener("mouseenter",()=>{tr.style.backgroundColor="#333";tr.style.cursor="pointer";});
  tr.addEventListener("mouseleave",()=>{if(!tr.classList.contains("selecionado")) tr.style.backgroundColor="transparent";});
}

function criarTabelaLivros(livros, tipoCard) {
  const tabela=document.createElement("table");
  tabela.style.width="100%";
  tabela.style.borderCollapse="collapse";

  const thead=document.createElement("thead");
  const trHead=document.createElement("tr");
  ["Nome","Autor","Gênero","Quantidade","Volume","Prateleira",""].forEach(texto=>{
    const th=document.createElement("th");
    th.textContent=texto;
    th.style.borderBottom="2px solid #ff4444";
    th.style.padding="8px";
    th.style.textAlign="left";
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  tabela.appendChild(thead);

  const tbody=document.createElement("tbody");

  livros.forEach(livro=>{
    const tr=document.createElement("tr");
    tr.style.borderBottom="1px solid #444";

    ["nome","autor","genero","quantidade","volume","prateleira"].forEach(campo=>{
      const td=document.createElement("td");
      td.textContent=livro[campo]||(campo==="volume"?"1":"");
      td.style.padding="8px";
      tr.appendChild(td);
    });

    const tdBtn=document.createElement("td");
    tdBtn.style.padding="8px";

let botao = criarBotao("Remover", "btn-remover", () => {
  abrirDialogo(`Deseja realmente remover o livro "${livro.nome}" volume ${livro.volume || "1"}?`, async () => {
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
      if (docGenero) await deleteDoc(doc(db, livro.genero, docGenero.id));

      showToast(`Livro "${livro.nome}" volume ${livro.volume || "1"} removido!`, "success");
      carregarLivros();
    } catch (err) {
      showToast("Erro ao remover livro: " + err.message, "error");
    }
  });
});

    botao.style.display="none";
    tdBtn.appendChild(botao);
    tr.appendChild(tdBtn);

    aplicarEfeitoHoverELinha(tr);

    tr.addEventListener("click",()=>{
      const estaSelecionado = tr.classList.contains("selecionado");
      tbody.querySelectorAll("tr").forEach(linha=>{
        linha.classList.remove("selecionado");
        linha.querySelectorAll("button").forEach(b=>b.style.display="none");
        linha.style.backgroundColor="transparent";
      });
      if(!estaSelecionado){
        tr.classList.add("selecionado");
        botao.style.display="inline-block";
        tr.style.backgroundColor="#555";
      }
    });

    tbody.appendChild(tr);
  });

  tabela.appendChild(tbody);
  return tabela;
}

async function carregarLivros(){
  const snapshot = await getDocs(collection(db,"livros"));
  const livros = snapshot.docs.map(doc=>({...doc.data(), id: doc.id}));
  livros.sort((a,b)=>a.nome.localeCompare(b.nome,'pt',{sensitivity:'base'}));
  exibirLivrosRegistrados(livros);
}

function exibirLivrosRegistrados(livros){
  const container = document.getElementById("lista-livros-registrados");
  container.innerHTML="";
  if(livros.length===0){
    container.innerHTML='<p class="sem-livros">Nenhum livro registrado.</p>';
    return;
  }
  const tabela = criarTabelaLivros(livros,"registrados");
  container.appendChild(tabela);
}

async function carregarGeneros(){
  const snapshot = await getDocs(collection(db,"generos"));
  const generos = snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
  generosCadastrados = generos.map(g=>g.nome);

  const container = document.getElementById("lista-generos");
  container.innerHTML="";

  if(generos.length===0){
    container.innerHTML='<p class="sem-livros">Nenhum gênero cadastrado.</p>';
    return;
  }

  generos.forEach(genero=>{
    const div=document.createElement("div");
    div.className="genero-item";
    div.style.display="flex";
    div.style.justifyContent="space-between";
    div.style.alignItems="center";
    div.style.padding="6px 10px";
    div.style.borderBottom="1px solid #444";
    div.style.cursor="pointer";

    const spanNome=document.createElement("span");
    spanNome.textContent=genero.nome;

    const btnExcluir=criarBotao("Excluir","btn-remover",()=>{ 
      abrirDialogo(`Deseja excluir o gênero "${genero.nome}"? Isso removerá todos os livros associados.`, async ()=>{
        try{
          const generoRef=collection(db,genero.nome);
          const livrosSnap=await getDocs(generoRef);
          await Promise.all(livrosSnap.docs.map(doc=>deleteDoc(doc.ref)));

          const livrosRef=collection(db,"livros");
          const q=query(livrosRef,where("genero","==",genero.nome));
          const snapLivros=await getDocs(q);
          await Promise.all(snapLivros.docs.map(doc=>deleteDoc(doc.ref)));

          await deleteDoc(doc(db,"generos",genero.id));

          showToast(`Gênero "${genero.nome}" e livros relacionados foram removidos!`,"success");
          carregarGeneros();
          carregarLivros();
        }catch(err){showToast("Erro: "+err.message,"error");}
      });
    });

    btnExcluir.style.display="none";

    div.appendChild(spanNome);
    div.appendChild(btnExcluir);

    div.addEventListener("click",()=>{
      const selecionado = div.classList.contains("selecionado");
      document.querySelectorAll(".genero-item").forEach(item=>{
        item.classList.remove("selecionado");
        item.querySelector("button").style.display="none";
      });
      if(!selecionado){
        div.classList.add("selecionado");
        btnExcluir.style.display="inline-block";
      }
    });

    container.appendChild(div);
  });
}

const inputGeneroLivro = document.getElementById("generoLivro");
const modalGenero = document.getElementById("modalGenero");
const listaGenerosModal = document.getElementById("listaGenerosModal");
const btnFecharModalGenero = document.getElementById("fecharModalGenero");

inputGeneroLivro.addEventListener("click", ()=>{
  preencherListaGenerosNoModal();
  modalGenero.style.display="flex";
});

btnFecharModalGenero.addEventListener("click",()=>{modalGenero.style.display="none";});
modalGenero.addEventListener("click",(e)=>{if(e.target===modalGenero) modalGenero.style.display="none";});

function preencherListaGenerosNoModal(){
  listaGenerosModal.innerHTML="";
  if(generosCadastrados.length===0){listaGenerosModal.innerHTML="<li>Nenhum gênero cadastrado.</li>"; return;}
  generosCadastrados.forEach(g=>{
    const li=document.createElement("li");
    li.textContent=g;
    li.style.cursor="pointer";
    li.style.padding="8px 12px";
    li.style.borderRadius="4px";

    li.addEventListener("mouseenter",()=>{li.style.backgroundColor="";});
    li.addEventListener("mouseleave",()=>{li.style.backgroundColor="transparent";});
    li.addEventListener("click",()=>{
      inputGeneroLivro.value=g;
      modalGenero.style.display="none";
    });
    listaGenerosModal.appendChild(li);
  });
}

document.getElementById("form-registrar-livro").addEventListener("submit", async(e)=>{
  e.preventDefault();

  const nome=document.getElementById("nomeLivro").value.trim();
  const autor=document.getElementById("autorLivro").value.trim();
  const genero=inputGeneroLivro.value.trim();
  const quantidade=Number(document.getElementById("quantidadeLivro").value);
  const volume=document.getElementById("volumeLivro")?.value.trim()||"1";
  const prateleira=document.getElementById("prateleiraLivro").value.trim();

  if(!nome || !autor || !genero || quantidade<=0){showToast("Preencha todos os campos corretamente.","warning"); return;}
  if(!generosCadastrados.includes(genero)){showToast("Gênero inválido. Escolha um gênero existente.","warning"); return;}
  if(await livroExiste(nome,autor,volume)){showToast(`Livro "${nome}" volume ${volume} já cadastrado.`,"warning"); return;}

  const livroData={nome,autor,genero,quantidade,volume,prateleira};

  try{
    await salvarLivro(livroData);
    showToast(`"${nome}" volume ${volume} foi adicionado com sucesso!`,"success");
    document.getElementById("form-registrar-livro").reset();
    carregarLivros();
  }catch(err){showToast("Erro ao registrar livro: "+err.message,"error");}
});

document.getElementById("form-criar-genero").addEventListener("submit", async(e)=>{
  e.preventDefault();
  const nomeGenero=document.getElementById("inputNovoGenero").value.trim();
  if(!nomeGenero){showToast("Informe o nome do gênero.","warning"); return;}
  if(generosCadastrados.includes(nomeGenero)){showToast(`Gênero ("${nomeGenero}") já existe.`,"warning"); return;}

  try{
    const proxIdGenero = await gerarProximoIdSequencial("generos");
    await setDoc(doc(db,"generos",proxIdGenero),{nome:nomeGenero});
    showToast(`Gênero "${nomeGenero}" foi criado com sucesso!`,"success");
    document.getElementById("form-criar-genero").reset();
    carregarGeneros();
  }catch(err){showToast("Erro ao criar gênero: "+err.message,"error");}
});

document.querySelectorAll(".livros-pesquisa").forEach(input=>{
  input.addEventListener("input", async(e)=>{
    const termo = normalizarTexto(e.target.value);
    const snapshot = await getDocs(collection(db,"livros"));
    const livros = snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));
    const filtrados = livros.filter(livro=>{
      return ["nome","autor","genero","prateleira","volume"].some(campo=>{
        const valor = normalizarTexto(livro[campo]||"");
        return valor.includes(termo);
      });
    });

    const parentSection=e.target.closest(".livros-section");
    if(parentSection.id==="secao-livros-registrados") exibirLivrosRegistrados(filtrados);
  });
});

const turnoLeitorEl = document.getElementById("turnoLeitor");
const turmaLeitorEl = document.getElementById("turmaLeitor");

function atualizarTurmas() {
  const turno = turnoLeitorEl.value;
  turmaLeitorEl.innerHTML = "<option value=''>Selecione...</option>";
  if (turmasPorTurno[turno]) {
    turmasPorTurno[turno].forEach(turma => {
      const option = document.createElement("option");
      option.value = turma;
      option.textContent = turma;
      turmaLeitorEl.appendChild(option);
    });
  }
}

turnoLeitorEl.addEventListener("change", atualizarTurmas);

document.getElementById("card-leitores").addEventListener("click", () => {
  turnoLeitorEl.value = ""; // limpa turno
  turmaLeitorEl.innerHTML = "<option value=''>Selecione...</option>"; // limpa turmas
  Object.values(botoes).forEach(secao => document.getElementById(secao).style.display = "none");
  document.getElementById("secao-registrar-leitor").style.display = "block";
});

async function leitorExiste(nome, turno, turma, nascimento) {
  const snapshot = await getDocs(collection(db, "leitores"));
  return snapshot.docs.some(doc => {
    const data = doc.data();
    return data.nome === nome &&
           data.turno === turno &&
           data.turma === turma &&
           data.nascimento === nascimento; // compara também a data
  });
}

document.getElementById("form-registrar-leitor").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nomeLeitor").value.trim();
  const turno = turnoLeitorEl.value;
  const turma = turmaLeitorEl.value;
  const nascimento = document.getElementById("nascimentoLeitor").value;

  if (!nome || !turno || !turma || !nascimento) {
    showToast("Preencha todos os campos corretamente.", "warning");
    return;
  }

  if (await leitorExiste(nome, turno, turma, nascimento)) {
    showToast(`Leitor "${nome}" já está registrado no Sistema.`, "warning");
    return;
  }

  try {
    const proxIdLeitor = await gerarProximoIdSequencial("leitores");
    await setDoc(doc(db, "leitores", proxIdLeitor), {
      nome, turno, turma, nascimento, registradoEm: new Date().toISOString()
    });

    showToast(`Leitor "${nome}" registrado com sucesso!`, "success");
    document.getElementById("form-registrar-leitor").reset();
    turmaLeitorEl.innerHTML = "<option value=''>Selecione...</option>";
  } catch (err) {
    showToast("Erro ao registrar leitor: " + err.message, "error");
  }
});

document.querySelectorAll("#secao-registrar-leitor .btn-cancelar").forEach(btn => {
  btn.addEventListener("click", () => {
    document.getElementById("form-registrar-leitor").reset();
    turmaLeitorEl.innerHTML = "<option value=''>Selecione...</option>";
    document.getElementById("secao-registrar-leitor").style.display = "none";
  });
});

document.getElementById("card-leitores").addEventListener("click", () => {
  Object.values(botoes).forEach(secao => document.getElementById(secao).style.display = "none");
  document.getElementById("secao-registrar-leitor").style.display = "block";
});

async function carregarLeitores() {
  const snapshot = await getDocs(collection(db, "leitores"));
  let leitores = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  leitores.sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' }));

  exibirLeitoresRegistrados(leitores);
}

function criarTabelaLeitores(leitores) {
  const tabela = document.createElement("table");
  tabela.style.width = "100%";
  tabela.style.borderCollapse = "collapse";

  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  ["Nome", "Turno", "Turma", "Nascimento", ""].forEach(texto => {
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

  leitores.forEach(leitor => {
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid #444";

    function formatarDataDMY(dataStr) {
      if (!dataStr) return "";
      const [ano, mes, dia] = dataStr.split("-");
      return `${dia}/${mes}/${ano}`;
    }

    ["nome", "turno", "turma", "nascimento"].forEach(campo => {
      const td = document.createElement("td");
      if(campo === "nascimento") {
        td.textContent = formatarDataDMY(leitor[campo]);
      } else {
        td.textContent = leitor[campo] || "";
      }
      td.style.padding = "8px";
      tr.appendChild(td);
    });

    const tdBtn = document.createElement("td");
    tdBtn.style.padding = "8px";

    const botao = criarBotao("Remover", "btn-remover", () => {
      abrirDialogo(`Deseja realmente remover o leitor "${leitor.nome}"?`, async () => {
        try {
          await deleteDoc(doc(db, "leitores", leitor.id));
          showToast(`Leitor "${leitor.nome}" removido com sucesso!`, "success");
          carregarLeitores();
        } catch (err) {
          showToast("Erro ao remover leitor: " + err.message, "error");
        }
      });
    });

    botao.style.display = "none";
    tdBtn.appendChild(botao);
    tr.appendChild(tdBtn);

    aplicarEfeitoHoverELinha(tr);

    tr.addEventListener("click", () => {
      const estaSelecionado = tr.classList.contains("selecionado");
      tbody.querySelectorAll("tr").forEach(linha => {
        linha.classList.remove("selecionado");
        linha.querySelectorAll("button").forEach(b => b.style.display = "none");
        linha.style.backgroundColor = "transparent";
      });
      if (!estaSelecionado) {
        tr.classList.add("selecionado");
        botao.style.display = "inline-block";
        tr.style.backgroundColor = "#555";
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
  if (leitores.length === 0) {
    container.innerHTML = '<p class="sem-leitores">Nenhum leitor registrado.</p>';
    return;
  }
  const tabela = criarTabelaLeitores(leitores);
  container.appendChild(tabela);
}

const inputPesquisarLeitor = document.querySelector("#secao-lista-leitores .leitores-pesquisa");
const selectTurnoFiltro = document.getElementById("turnoLeitor");
const selectTurmaFiltro = document.getElementById("turmaLeitor");

async function filtrarLeitores() {
  const termo = normalizarTexto(inputPesquisarLeitor.value);
  const turno = selectTurnoFiltro.value;
  const turma = selectTurmaFiltro.value;

  const snapshot = await getDocs(collection(db, "leitores"));
  let leitores = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

  if (turno) leitores = leitores.filter(l => l.turno === turno);
  if (turma) leitores = leitores.filter(l => l.turma === turma);

  if (termo) {
    leitores = leitores.filter(l => {
      return ["nome", "turno", "turma"].some(campo => normalizarTexto(l[campo] || "").includes(termo));
    });
  }

  leitores.sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' }));

  exibirLeitoresRegistrados(leitores);
}

inputPesquisarLeitor.addEventListener("input", filtrarLeitores);
selectTurnoFiltro.addEventListener("change", () => {
  atualizarTurmas();
  filtrarLeitores();
});
selectTurmaFiltro.addEventListener("change", filtrarLeitores);

document.getElementById("card-lista-leitores").addEventListener("click", () => {
  Object.values(botoes).forEach(secao => document.getElementById(secao).style.display = "none");
  document.getElementById("secao-lista-leitores").style.display = "block";
  turnoLeitorEl.value = "";
  turmaLeitorEl.innerHTML = "<option value=''>Selecione...</option>";
  carregarLeitores();
});

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

const nomeEmprestimoEl = document.getElementById("nomeEmprestimo");
const turnoEmprestimoEl = document.getElementById("turnoEmprestimo");
const turmaEmprestimoEl = document.getElementById("turmaEmprestimo");
const livroEmprestimoEl = document.getElementById("livroEmprestimo");

turnoEmprestimoEl.addEventListener("change", () => {
  const turno = turnoEmprestimoEl.value;
  turmaEmprestimoEl.innerHTML = "<option value=''>Selecione...</option>";
  if (turmasPorTurno[turno]) {
    turmasPorTurno[turno].forEach(turma => {
      const option = document.createElement("option");
      option.value = turma;
      option.textContent = turma;
      turmaEmprestimoEl.appendChild(option);
    });
  }
});

nomeEmprestimoEl.addEventListener("click", async () => {
  const turno = turnoEmprestimoEl.value;
  const turma = turmaEmprestimoEl.value;

  if (!turno || !turma) {
    showToast("Selecione primeiro Turno e Turma.", "warning");
    return;
  }

  abrirDialogoSelecionar("Selecionar Leitor", async (filtro) => {
    const snapshot = await getDocs(collection(db, "leitores"));
    const leitores = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(l => l.turno === turno && l.turma === turma)
      .filter(l => {
        const termo = filtro.toLowerCase();
        return l.nome.toLowerCase().includes(termo) || l.nascimento.includes(termo);
      });

    listaDialog.innerHTML = "";

    if (!leitores.length) {
      listaDialog.innerHTML = "<li>Nenhum leitor encontrado.</li>";
      return;
    }

    leitores.forEach(l => {
  const li = document.createElement("li");
  li.className = "dialog-item";
  function formatarDataBR(dataStr) {
    if (!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  }
  const nascimentoBR = formatarDataBR(l.nascimento);
  li.innerHTML = `
    <div class="dialog-item-info">
      <div class="dialog-item-title">${l.nome}</div>
      <div class="dialog-item-subtitle">${l.turno} • Turma: ${l.turma} • ${nascimentoBR}</div>
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
    const snapshot = await getDocs(collection(db, "livros"));
    const livros = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(l => {
        const termo = filtro.toLowerCase();
        return l.nome.toLowerCase().includes(termo) ||
               l.autor.toLowerCase().includes(termo) ||
               l.genero.toLowerCase().includes(termo) ||
               (l.prateleira || "").toLowerCase().includes(termo);
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

// ======= FORMULÁRIO REGISTRAR EMPRÉSTIMO =======
document.getElementById("form-registrar-emprestimo").addEventListener("submit", async (e) => {
  e.preventDefault();

  const turno = turnoEmprestimoEl.value;
  const turma = turmaEmprestimoEl.value;
  const nomeLeitor = nomeEmprestimoEl.value.trim();
  const livroSelecionado = livroEmprestimoEl.value.trim();
  let diasEntrega = Number(document.getElementById("diasEntrega").value);

  if (!turno || !turma || !nomeLeitor || !livroSelecionado || !diasEntrega) {
    showToast("Preencha todos os campos corretamente.", "warning");
    return;
  }

  if (diasEntrega > 30) {
    showToast("O máximo permitido é 30 dias para entrega.", "warning");
    return;
  }

  // Data atual
  const dataEmprestimo = new Date();
  const dataEntrega = new Date();
  dataEntrega.setDate(dataEmprestimo.getDate() + diasEntrega);

  // Formatar datas no padrão BR DD/MM/AAAA
  function formatarDataBR(data) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  const emprestimoData = {
    nome: nomeLeitor,
    turno,
    turma,
    livro: livroSelecionado,
    diasEntrega,
    dataEmprestimo: formatarDataBR(dataEmprestimo),
    dataEntrega: formatarDataBR(dataEntrega),
    registradoEm: new Date().toISOString()
  };

  try {
  const proxIdEmprestimo = await gerarProximoIdSequencial("emprestimos");
  await setDoc(doc(db, "emprestimos", proxIdEmprestimo), emprestimoData);
  showToast(`Empréstimo do livro "${livroSelecionado}" registrado com sucesso!`, "success");

  // Resetar formulário
  document.getElementById("form-registrar-emprestimo").reset();
  turmaEmprestimoEl.innerHTML = "<option value=''>Selecione...</option>";

  // ✅ Atualizar tabela automaticamente
  carregarEmprestimos();
  carregarNotificacoes();

} catch (err) {
  showToast("Erro ao registrar empréstimo: " + err.message, "error");
}

});

// Seletores
const pesquisaEmprestimosEl = document.getElementById("pesquisaEmprestimos");
const turnoEmprestimoFiltroEl = document.getElementById("turnoEmprestimoFiltro");
const turmaEmprestimoFiltroEl = document.getElementById("turmaEmprestimoFiltro");

// Atualizar turmas filtro de empréstimos
function atualizarTurmasFiltro(turno) {
  turmaEmprestimoFiltroEl.innerHTML = "<option value=''>Todos</option>";
  if (turmasPorTurno[turno]) {
    turmasPorTurno[turno].forEach(turma => {
      const opt = document.createElement("option");
      opt.value = turma;
      opt.textContent = turma;
      turmaEmprestimoFiltroEl.appendChild(opt);
    });
  }
}

turnoEmprestimoFiltroEl.addEventListener("change", () => {
  atualizarTurmasFiltro(turnoEmprestimoFiltroEl.value);
  carregarEmprestimos();
});
turmaEmprestimoFiltroEl.addEventListener("change", carregarEmprestimos);
pesquisaEmprestimosEl.addEventListener("input", carregarEmprestimos);

// ======= UTILITÁRIOS =======
function parseDataBR(dataStr) {
  if (!dataStr) return null;
  const [dia, mes, ano] = dataStr.split("/").map(Number);
  return new Date(ano, mes - 1, dia);
}

function calcularDiasRestantes(dataEntrega) {
  const hoje = new Date();
  // Zerando horas/minutos/segundos
  hoje.setHours(0,0,0,0);
  dataEntrega.setHours(0,0,0,0);
  
  const diff = (dataEntrega - hoje) / (1000 * 60 * 60 * 24);
  return Math.ceil(diff);
}


// ======= CRIAR TABELA DE EMPRÉSTIMOS =======
function criarTabelaEmprestimos(emprestimos) {
  const tabela = document.createElement("table");
  tabela.style.width = "100%";
  tabela.style.borderCollapse = "collapse";

  const cabecalho = ["Nome Leitor", "Nome Livro", "Turno • Turma", "Data Pego", "Data Entrega", "Dias", "Ações"];
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  cabecalho.forEach(texto => {
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

  emprestimos.forEach(e => {
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid #444";

    const dataEntregaObj = parseDataBR(e.dataEntrega);
    const diasRestantes = calcularDiasRestantes(dataEntregaObj);

    // Preencher células
    const tdNome = document.createElement("td"); tdNome.textContent = e.nome; tdNome.style.padding="8px"; tr.appendChild(tdNome);
    const tdLivro = document.createElement("td"); tdLivro.textContent = e.livro; tdLivro.style.padding="8px"; tr.appendChild(tdLivro);
    const tdTurnoTurma = document.createElement("td"); tdTurnoTurma.textContent = `${e.turno} • ${e.turma}`; tdTurnoTurma.style.padding="8px"; tr.appendChild(tdTurnoTurma);
    const tdDataEmprestimo = document.createElement("td"); tdDataEmprestimo.textContent = e.dataEmprestimo || ""; tdDataEmprestimo.style.padding="8px"; tr.appendChild(tdDataEmprestimo);
    const tdDataEntrega = document.createElement("td"); tdDataEntrega.textContent = e.dataEntrega || ""; tdDataEntrega.style.padding="8px"; tr.appendChild(tdDataEntrega);
    const tdDias = document.createElement("td"); tdDias.textContent = diasRestantes < 0 ? "Atrasado" : `${diasRestantes} dias`; tdDias.style.padding="8px"; tr.appendChild(tdDias);

    // Botão Entregue
    const tdAcoes = document.createElement("td"); tdAcoes.style.padding="8px";
    const btnEntregue = criarBotao("Entregue", "btn-entregue", async () => {
      try {
        await deleteDoc(doc(db, "emprestimos", e.id));
        showToast(`Empréstimo de "${e.livro}" entregue!`, "success");
        carregarEmprestimos();
        carregarNotificacoes();
      } catch(err) { showToast("Erro: "+err.message, "error"); }
    });
    btnEntregue.style.display = "none";
    tdAcoes.appendChild(btnEntregue);
    tr.appendChild(tdAcoes);

    aplicarEfeitoHoverELinha(tr);
    tr.addEventListener("click", () => {
      const selecionado = tr.classList.contains("selecionado");
      tbody.querySelectorAll("tr").forEach(linha => {
        linha.classList.remove("selecionado");
        linha.querySelectorAll("button").forEach(b => b.style.display="none");
        linha.style.backgroundColor="transparent";
      });
      if (!selecionado) {
        tr.classList.add("selecionado");
        btnEntregue.style.display="inline-block";
        tr.style.backgroundColor="#555";
      }
    });

    tbody.appendChild(tr);
  });

  tabela.appendChild(tbody);
  return tabela;
}

// ======= CRIAR TABELA DE NOTIFICAÇÕES =======
function criarTabelaNotificacoes(emprestimos) {
  const tabela = document.createElement("table");
  tabela.style.width = "100%";
  tabela.style.borderCollapse = "collapse";

  const cabecalho = ["Nome Leitor", "Nome Livro", "Turno • Turma", "Data Entrega", "Status", "Ações"];
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  cabecalho.forEach(texto => {
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
  const hoje = new Date();

  emprestimos.forEach(emp => {
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid #444";

    ["nome","livro"].forEach(campo => {
      const td = document.createElement("td");
      td.textContent = emp[campo] || "";
      td.style.padding="8px";
      tr.appendChild(td);
    });

    const tdTurnoTurma = document.createElement("td");
    tdTurnoTurma.textContent = `${emp.turno} • ${emp.turma}`;
    tdTurnoTurma.style.padding="8px";
    tr.appendChild(tdTurnoTurma);

    const tdEntrega = document.createElement("td");
    tdEntrega.textContent = emp.dataEntrega || "";
    tdEntrega.style.padding="8px";
    tr.appendChild(tdEntrega);

    const tdStatus = document.createElement("td");
    const dataEntregaObj = parseDataBR(emp.dataEntrega);
    tdStatus.textContent = dataEntregaObj < hoje ? "Não Entregue" : "Perto de Entregar";
    if(dataEntregaObj < hoje) tdStatus.style.color = "red";
    tdStatus.style.padding="8px";
    tr.appendChild(tdStatus);

    const tdAcoes = document.createElement("td");
    tdAcoes.style.padding="8px";
    const btnEntregue = criarBotao("Entregue", "btn-entregue", async () => {
      try {
        await deleteDoc(doc(db,"emprestimos",emp.id));
        showToast(`Empréstimo de "${emp.livro}" por "${emp.nome}" finalizado!`, "success");
        carregarEmprestimos();
        carregarNotificacoes();
      } catch(err){ showToast("Erro: "+err.message,"error"); }
    });
    btnEntregue.style.display="none";
    tdAcoes.appendChild(btnEntregue);
    tr.appendChild(tdAcoes);

    aplicarEfeitoHoverELinha(tr);
    tr.addEventListener("click", () => {
      const estaSelecionado = tr.classList.contains("selecionado");
      tbody.querySelectorAll("tr").forEach(linha => {
        linha.classList.remove("selecionado");
        linha.querySelectorAll("button").forEach(b => b.style.display="none");
        linha.style.backgroundColor="transparent";
      });
      if(!estaSelecionado){
        tr.classList.add("selecionado");
        btnEntregue.style.display="inline-block";
        tr.style.backgroundColor="#555";
      }
    });

    tbody.appendChild(tr);
  });

  tabela.appendChild(tbody);
  return tabela;
}

// ======= CARREGAR EMPRÉSTIMOS =======
async function carregarEmprestimos() {
  const turno = turnoEmprestimoFiltroEl.value;
  const turma = turmaEmprestimoFiltroEl.value;
  const termo = pesquisaEmprestimosEl.value.trim().toLowerCase();

  const snapshot = await getDocs(collection(db, "emprestimos"));
  let emprestimos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Filtrar por turno e turma se selecionado
  if (turno) emprestimos = emprestimos.filter(e => e.turno === turno);
  if (turma) emprestimos = emprestimos.filter(e => e.turma === turma);

  // Filtrar por pesquisa
  if (termo) {
    emprestimos = emprestimos.filter(e => 
      e.nome.toLowerCase().includes(termo) ||
      e.livro.toLowerCase().includes(termo) ||
      e.turno.toLowerCase().includes(termo) ||
      e.turma.toLowerCase().includes(termo)
    );
  }

  // Ordenar por data de empréstimo (opcional)
  emprestimos.sort((a, b) => parseDataBR(a.dataEmprestimo) - parseDataBR(b.dataEmprestimo));

  // Exibir na tabela
  const container = document.getElementById("lista-emprestimos");
  container.innerHTML = "";
  if (emprestimos.length === 0) {
    container.innerHTML = '<p class="sem-emprestimos">Nenhum empréstimo registrado.</p>';
    return;
  }
  const tabela = criarTabelaEmprestimos(emprestimos);
  container.appendChild(tabela);
}

// ======= CARREGAR NOTIFICAÇÕES =======
async function carregarNotificacoes() {
  const snapshot = await getDocs(collection(db, "emprestimos"));
  let emprestimos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const hoje = new Date();

  // Filtrar apenas os empréstimos que faltam 3 dias ou menos
  const notificacoes = emprestimos.filter(e => {
    if (!e.dataEntrega) return false;
    const dataEntregaObj = parseDataBR(e.dataEntrega);
    const diasRestantes = calcularDiasRestantes(dataEntregaObj);
    return diasRestantes <= 3 && diasRestantes >= 0;
  });

  const container = document.getElementById("lista-notificacoes");
  container.innerHTML = "";

  if (notificacoes.length === 0) {
    container.innerHTML = '<p class="sem-notificacoes">Não há notificações ainda.</p>';
    return;
  }

  // ✅ agora usamos a função já criada
  const tabela = criarTabelaNotificacoes(notificacoes);
  container.appendChild(tabela);
}


// ======= CARREGAMENTO INICIAL =======
carregarGeneros();
carregarLivros();
carregarLeitores();
carregarEmprestimos();
carregarNotificacoes();