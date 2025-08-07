import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

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
