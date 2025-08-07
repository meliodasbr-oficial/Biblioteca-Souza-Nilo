import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

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

// Verifica se o usuário está logado
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  }
});

// Botão de logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  }).catch((error) => {
    alert("Erro ao deslogar. Tente novamente.");
    console.error(error);
  });
});
