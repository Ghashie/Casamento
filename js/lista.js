// Firebase 
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6kNsEwXkWi2r0XKcNchgizW0MtIfYH08",
  authDomain: "casamento-63fd7.firebaseapp.com",
  projectId: "casamento-63fd7",
  storageBucket: "casamento-63fd7.firebasestorage.app",
  messagingSenderId: "19575274284",
  appId: "1:19575274284:web:21d7d0ca0ba646ffc98a89"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const areaNoivo = document.getElementById('areaNoivo');
const form = document.getElementById('formCadastro');
const container = document.getElementById('presentesContainer');

const usuarioLogado = localStorage.getItem('noivoLogado') === 'true';
if (usuarioLogado) areaNoivo.style.display = 'block';

// Logout
const btnLogout = document.getElementById('logoutBtn');
if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('noivoLogado');
    window.location.href = 'login.html';
  });
}

// Cadastrar presente
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    const link = document.getElementById('link').value;
    const preco = parseFloat(document.getElementById('preco').value);
    const cotas = parseInt(document.getElementById('cotas').value || 1);
    const preco_por_cota = preco / cotas;

    await addDoc(collection(db, 'presentes'), {
      nome, link, preco_total: preco, cotas, preco_por_cota,
      contribuicoes: [], status: 'disponivel'
    });

    form.reset();
  });
}

// Mostrar presentes
function renderizarPresente(presente, id) {
  const valorContribuido = presente.contribuicoes.reduce((acc, c) => acc + c.valor, 0);
  const comprado = valorContribuido >= presente.preco_total;
  const precoPorCota = presente.preco_por_cota || (presente.preco_total / (presente.cotas || 1));

  const card = document.createElement('div');
  card.className = 'col-md-4 mb-4';
  card.innerHTML = `
    <div class="card h-100">
      <div class="card-body">
        <h5 class="card-title">${presente.nome}</h5>
        <p class="card-text">Valor total: R$ ${presente.preco_total.toFixed(2)}</p>
        <p class="card-text">Cotas disponíveis: ${presente.cotas || 1}</p>
        <p class="card-text">Valor por cota: R$ ${precoPorCota.toFixed(2)}</p>
        <p class="card-text">Status: ${comprado ? '🎁 Comprado' : valorContribuido > 0 ? '🧾 Parcial' : 'Disponível'}</p>

        ${!comprado ? `
        <form class="formContribuir" data-id="${id}">
          <input class="form-control mb-2" name="nome" placeholder="Seu nome" required>
          <input class="form-control mb-2" name="cotas" type="number" min="1" max="${presente.cotas}" placeholder="Número de cotas" required>
          <p class="form-text mb-2">Você irá contribuir com: <span class="valor-contribuicao">R$ 0,00</span></p>
          <button class="btn btn-success w-100">Confirmar contribuição</button>
        </form>` : ''}

        ${usuarioLogado ? `
        <hr><h6>Contribuições:</h6>
        <ul>${presente.contribuicoes.map(c => `<li>${c.nome} - R$ ${c.valor.toFixed(2)}</li>`).join('') || '<li>Ninguém ainda</li>'}</ul>
        <div class="mt-2">
          <button class="btn btn-warning btn-sm me-2 btn-editar" data-id="${id}">Editar</button>
          <button class="btn btn-danger btn-sm btn-excluir" data-id="${id}">Excluir</button>
        </div>` : ''}
      </div>
    </div>
  `;

  container.appendChild(card);

  const form = card.querySelector('.formContribuir');
  if (form) {
    const inputCotas = form.querySelector('[name="cotas"]');
    const displayValor = form.querySelector('.valor-contribuicao');
    inputCotas.addEventListener('input', () => {
      const total = (parseInt(inputCotas.value) || 0) * precoPorCota;
      displayValor.textContent = `R$ ${total.toFixed(2)}`;
    });
  }

  // Eventos de editar/excluir
  if (usuarioLogado) {
    card.querySelector('.btn-excluir').addEventListener('click', async () => {
      if (confirm('Tem certeza que deseja excluir este presente?')) {
        await deleteDoc(doc(db, 'presentes', id));
      }
    });

    card.querySelector('.btn-editar').addEventListener('click', async () => {
      const novoNome = prompt('Novo nome do presente:', presente.nome);
      const novoPreco = parseFloat(prompt('Novo preço total:', presente.preco_total));
      const novasCotas = parseInt(prompt('Nova quantidade de cotas:', presente.cotas));
      const novoLink = prompt('Novo link:', presente.link);

      if (novoNome && !isNaN(novoPreco) && !isNaN(novasCotas)) {
        await updateDoc(doc(db, 'presentes', id), {
          nome: novoNome,
          preco_total: novoPreco,
          cotas: novasCotas,
          preco_por_cota: novoPreco / novasCotas,
          link: novoLink
        });
      }
    });
  }
}

onSnapshot(collection(db, 'presentes'), (snapshot) => {
  container.innerHTML = '';
  snapshot.forEach(docSnap => {
    renderizarPresente(docSnap.data(), docSnap.id);
  });
});

// Contribuir
container.addEventListener('submit', async (e) => {
  if (e.target.classList.contains('formContribuir')) {
    e.preventDefault();
    const id = e.target.dataset.id;
    const nome = e.target.nome.value;
    const cotas = parseInt(e.target.cotas.value);

    const ref = doc(db, 'presentes', id);
    const snap = await getDoc(ref);
    const data = snap.data();

    const valor = cotas * (data.preco_por_cota || data.preco_total / (data.cotas || 1));
    const novaLista = [...data.contribuicoes, { nome, valor }];
    const total = novaLista.reduce((acc, c) => acc + c.valor, 0);

    await updateDoc(ref, {
      contribuicoes: novaLista,
      status: total >= data.preco_total ? 'comprado' : 'parcial'
    });
  }
});