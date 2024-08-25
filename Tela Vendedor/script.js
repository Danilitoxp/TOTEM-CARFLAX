// Importa os módulos Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js';
import { getFirestore, collection, onSnapshot, doc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js';

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
const auth = getAuth(app);

// Referência à coleção de senhas
const senhasCollection = collection(db, 'senhas');

// Elementos da interface
const cardContainer = document.getElementById('card-container');

// Armazenar os cronômetros para cada senha
const cronometros = {};

// Função para criar um card de senha
function criarCard(senha) {
    // Cria o card
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = senha.id; // Armazena o ID da senha como um atributo de dados

    // Adiciona conteúdo ao card
    card.innerHTML = `
        <div id="senha-${senha.id}">
            <div id="idsenha-${senha.id}">
                <h3>${senha.id || 'Não disponível'}</h3>
                <p id="status-${senha.id}">Status: ${senha.status || 'Não disponível'}</p>
                <span><p id="tempo-${senha.id}">${formatarTempo(senha.tempo) || '00:00'}</p></span>
                <p>Tipo: ${senha.tipo || 'Não disponível'}</p>
            </div>
        </div>
        <div class="botoes">
            <button class="chamar" data-id="${senha.id}">Chamar</button>
            <button class="cancelar" data-id="${senha.id}">Cancelar</button>
        </div>
    `;

    // Adiciona o card ao container
    cardContainer.appendChild(card);

    // Função para atualizar o tempo no Firestore
    async function atualizarTempoNoFirestore(id, tempo) {
        try {
            await updateDoc(doc(db, 'senhas', id), {
                tempo: tempo // Atualiza o campo 'tempo' no Firestore
            });
        } catch (error) {
            console.error('Erro ao atualizar o tempo no Firestore:', error);
        }
    }

    // Iniciar o cronômetro específico para a senha
    const tempoElement = card.querySelector(`#tempo-${senha.id}`);
    let tempo = senha.tempo || 0; // Usa o tempo existente ou inicia com 0

    // Atualiza o tempo a cada segundo
    const cronometro = setInterval(() => {
        tempo++;
        tempoElement.textContent = formatarTempo(tempo);
        atualizarTempoNoFirestore(senha.id, tempo); // Atualiza o Firestore com o tempo atual
    }, 1000);

    // Armazena o cronômetro
    cronometros[senha.id] = cronometro;

    // Adiciona os event listeners aos botões
    const chamarBtn = card.querySelector(`.chamar[data-id="${senha.id}"]`);
    const cancelarBtn = card.querySelector(`.cancelar[data-id="${senha.id}"]`);

    // Função para chamar uma nova senha
    chamarBtn.addEventListener('click', async () => {
        const usuario = auth.currentUser;
        const nomeVendedor = usuario ? usuario.email.split('@')[0] : 'Desconhecido'; // Nome do vendedor a partir do e-mail

        // Pausa o cronômetro do cliente
        clearInterval(cronometros[senha.id]);
        delete cronometros[senha.id];

        try {
            // Atualiza o Firestore
            await updateDoc(doc(db, 'senhas', senha.id), {
                status: 'Sendo atendida',
                tempo: tempo, // Pausa o tempo no Firestore
                vendedor: nomeVendedor // Adiciona o nome do vendedor
            });

            // Atualiza o status na interface
            const statusElement = card.querySelector(`#status-${senha.id}`);
            statusElement.textContent = 'Status: Sendo atendida';
        } catch (error) {
            console.error('Erro ao chamar a senha:', error);
        }
    });

    // Função para cancelar a senha (excluir o documento)
    cancelarBtn.addEventListener('click', async () => {
        // Pausa o cronômetro do card atual
        clearInterval(cronometros[senha.id]);
        delete cronometros[senha.id];

        try {
            await deleteDoc(doc(db, 'senhas', senha.id));
            // Remover o card da interface
            removerCard(senha.id);
        } catch (error) {
            console.error('Erro ao excluir a senha:', error);
        }
    });
}

// Função para formatar o tempo no formato mm:ss
function formatarTempo(segundos) {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundosRestantes).padStart(2, '0')}`;
}

// Função para remover um card de forma segura
function removerCard(id) {
    const card = cardContainer.querySelector(`.card[data-id="${id}"]`);
    if (card) {
        cardContainer.removeChild(card);
        clearInterval(cronometros[id]);
        delete cronometros[id];
    }
}

// Atualiza os cards ao receber as senhas da coleção
onSnapshot(senhasCollection, (querySnapshot) => {
    // Obtém IDs dos cards atualmente exibidos
    const idsAtuais = Array.from(cardContainer.querySelectorAll('.card')).map(card => card.dataset.id);

    querySnapshot.forEach((doc) => {
        const senha = doc.data();
        senha.id = doc.id; // Adiciona o ID da senha ao objeto

        if (!idsAtuais.includes(senha.id)) {
            criarCard(senha);
        } else {
            // Atualiza o status do card existente se a senha já estiver na interface
            const statusElement = document.querySelector(`#status-${senha.id}`);
            if (statusElement && senha.status) {
                statusElement.textContent = `Status: ${senha.status}`;
            }
        }
    });

    // Remove cards que não estão mais presentes na coleção
    Array.from(cardContainer.querySelectorAll('.card')).forEach(card => {
        const id = card.dataset.id;
        if (!Array.from(querySnapshot.docs).some(doc => doc.id === id)) {
            removerCard(id);
        }
    });
});
