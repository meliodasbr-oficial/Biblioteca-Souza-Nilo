import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

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

let autorizado = false;
let conteudoOriginal = document.body.innerHTML;

const overlayDiv = document.createElement("div");
overlayDiv.id = "overlayLogin";
overlayDiv.style.cssText = `
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.7);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const modalDiv = document.createElement("div");
modalDiv.style.cssText = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(to bottom right, #00173f, #b00000);
  padding: 30px 40px;
  border-radius: 16px;
  text-align: center;
  width: min(400px, 90vw);
  color: #f5f5f5;
  box-shadow: 0 10px 30px rgba(255,255,255,0.2);
  opacity: 0;
  animation: dialogEnter 0.4s ease-out forwards;
`;

modalDiv.innerHTML = `
  <h2 style="margin-bottom:15px;">⚠️ Acesso ao console</h2>
  <p style="margin-bottom:20px; font-size:14px; color:#f5f5f5;">
    Apenas desenvolvedores autorizados podem usar o console.<br>
    Insira seu email e senha para continuar.
  </p>
  <input type="text" id="emailLogin" placeholder="Email" style="width:100%; padding:10px; margin-bottom:12px; border-radius:8px; border:none;"><br>
  <input type="password" id="senhaLogin" placeholder="Senha" style="width:100%; padding:10px; margin-bottom:20px; border-radius:8px; border:none;"><br>
  <button id="btnLogin" style="
    width:100%; padding:12px; 
    border-radius:10px; border:none; 
    background-color:#ff4e4e; 
    color:#fff; font-weight:bold;
    cursor:pointer;
    transition: 0.3s;
  ">Entrar</button>
`;

overlayDiv.appendChild(modalDiv);
document.body.appendChild(overlayDiv);

const styleSheet = document.createElement("style");
styleSheet.textContent = `
@keyframes dialogEnter {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
`;
document.head.appendChild(styleSheet);

async function loginConsole(email, senha) {
  if (!email.endsWith("@console.admin.com")) {
    alert("❌ Email inválido! Apenas desenvolvedores são permitidos.");
    bloquearTudo();
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, senha);
    autorizado = true;
    overlayDiv.style.display = "none";
    document.body.innerHTML = conteudoOriginal;
    document.body.style.visibility = "visible";
    alert("✅ Console desbloqueado! O sistema foi restaurado ao estado original.");
  } catch (err) {
    alert("❌ Email ou senha incorretos! O acesso será bloqueado.");
    bloquearTudo();
  }
}

document.getElementById("btnLogin").addEventListener("click", () => {
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;
  loginConsole(email, senha);
});

const bloquearTudo = () => {
  if (autorizado) return;
  console.clear();
  document.body.style.visibility = "hidden";
  document.body.innerHTML = "";
  overlayDiv.style.display = "flex";
  modalDiv.innerHTML = `
    <h2 style="margin-bottom:15px;">🚫 Acesso Negado 🚫</h2>
    <p style="font-size:14px; color:#f5f5f5;">Manipular o console compromete o funcionamento do sistema.</p>
  `;
};

const detectConsole = () => {
  if (autorizado) return;
  const element = new Image();
  Object.defineProperty(element, 'id', { get: bloquearTudo });
};
setInterval(detectConsole, 1000);

document.addEventListener('keydown', function(e) {
  if (autorizado) return;

  if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
    bloquearTudo();
    e.preventDefault();
  } else if (e.ctrlKey && e.key === "J") {
    overlayDiv.style.display = "flex";
    modalDiv.style.transform = "translate(-50%, -50%) scale(0.9)";
    modalDiv.style.opacity = "0";
    modalDiv.innerHTML = `
      <h2 style="margin-bottom:15px;">⚠️ Acesso ao console</h2>
      <p style="margin-bottom:20px; font-size:14px; color:#f5f5f5;">
        Apenas desenvolvedores autorizados podem usar o console.<br>
        Insira seu email e senha para continuar.
      </p>
      <input type="text" id="emailLogin" placeholder="Email" style="width:100%; padding:10px; margin-bottom:12px; border-radius:8px; border:none;"><br>
      <input type="password" id="senhaLogin" placeholder="Senha" style="width:100%; padding:10px; margin-bottom:20px; border-radius:8px; border:none;"><br>
      <button id="btnLogin" style="
        width:100%; padding:12px; 
        border-radius:10px; border:none; 
        background-color:#ff4e4e; 
        color:#fff; font-weight:bold;
        cursor:pointer;
        transition: 0.3s;
      ">Entrar</button>
    `;
    document.getElementById("btnLogin").addEventListener("click", () => {
      const email = document.getElementById("emailLogin").value;
      const senha = document.getElementById("senhaLogin").value;
      loginConsole(email, senha);
    });
    e.preventDefault();
  }
});
