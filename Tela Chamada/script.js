import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js';
import { getFirestore, collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDjmhBmT27rrpJOXan9hioKlQwcByOOevY",
    authDomain: "atendimento-carflax.firebaseapp.com",
    projectId: "atendimento-carflax",
    storageBucket: "atendimento-carflax.appspot.com",
    messagingSenderId: "903055029867",
    appId: "1:903055029867:web:ef06b4492c4bfe98fee32e"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referência à coleção de senhas
const senhasCollection = collection(db, 'senhas');

// Elementos da interface
const senhaElement = document.getElementById('senha');
const nomeVendedorElement = document.getElementById('nomeVendedor');
const ultimasChamadasContainer = document.querySelector('.ultimas-chamadas');

// Função para atualizar a interface com a senha chamada
function atualizarInterface(senha) {
    if (senha) {
        senhaElement.textContent = senha.id;
        nomeVendedorElement.textContent = senha.vendedor;
    } else {
        senhaElement.textContent = 'Nenhuma senha disponível';
        nomeVendedorElement.textContent = 'Nenhum vendedor';
    }
}

// Função para formatar o tempo no formato mm:ss
function formatarTempo(segundos) {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundosRestantes).padStart(2, '0')}`;
}

// Escuta mudanças na coleção de senhas
onSnapshot(senhasCollection, (querySnapshot) => {
    let senhaChamada = null;
    const ultimasSenhas = [];

    querySnapshot.forEach((doc) => {
        const senha = { id: doc.id, ...doc.data() };
        
        if (senha.status === 'Sendo atendida') {
            senhaChamada = senha;
        }
        
        ultimasSenhas.push(senha);
    });

    // Atualiza a interface apenas se houver uma senha chamada
    atualizarInterface(senhaChamada);

    // Atualiza a lista de últimas chamadas
    ultimasChamadasContainer.innerHTML = ''; // Limpa o conteúdo atual

    ultimasSenhas.forEach(senha => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
        <p>Vendedor: ${senha.vendedor || 'Não disponível'}</p>
        senha: ${senha.id || 'Não disponível'}
        `;
        ultimasChamadasContainer.appendChild(card);
    });
});
