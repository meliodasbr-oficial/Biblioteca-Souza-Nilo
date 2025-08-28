import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "painel-bibliotecario.html";
  }
});

document.getElementById("loginForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  signInWithEmailAndPassword(auth, email, senha)
    .then(() => {
      window.location.href = "painel-bibliotecario.html";
    })
    .catch((error) => {
      document.getElementById("mensagemErro").textContent = "Email ou senha incorretos.";
      console.error(error);
    });
});

const senhaInput = document.getElementById("senha");
const toggleSenhaBtn = document.getElementById("toggleSenha");

toggleSenhaBtn.addEventListener("click", () => {
  if (senhaInput.type === "password") {
    senhaInput.type = "text";
    toggleSenhaBtn.textContent = "Ocultar Senha";
  } else {
    senhaInput.type = "password";
    toggleSenhaBtn.textContent = "Mostrar Senha";
  }
});
