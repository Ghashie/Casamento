import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6kNsEwXkWi2r0XKcNchgizW0MtIfYH08",
  authDomain: "casamento-63fd7.firebaseapp.com",
  projectId: "casamento-63fd7",
  storageBucket: "casamento-63fd7.firebasestorage.app",
  messagingSenderId: "19575274284",
  appId: "1:19575274284:web:21d7d0ca0ba646ffc98a89"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById('btnLogin').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    localStorage.setItem('noivoLogado', 'true');
    window.location.href = 'lista.html';
  } catch (error) {
    document.getElementById('erroLogin').textContent = 'Usuário ou senha inválidos';
  }
});