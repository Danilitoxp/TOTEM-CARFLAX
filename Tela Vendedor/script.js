// Importa os módulos Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js';
import { getFirestore, collection, onSnapshot, doc, updateDoc, deleteDoc, query, where, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js';
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
const botaoProximo = document.getElementById('proximo');

// Armazenar os cronômetros para cada senha
const cronometros = {};

// Função para criar um card de senha
function criarCard(senha) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = senha.id; // Armazena o ID da senha como um atributo de dados

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

    cardContainer.appendChild(card);

    iniciarCronometro(senha.id, senha.tempo || 0);

    card.querySelector(`.chamar[data-id="${senha.id}"]`).addEventListener('click', () => chamarSenha(senha.id));
    card.querySelector(`.cancelar[data-id="${senha.id}"]`).addEventListener('click', () => cancelarSenha(senha.id));
}

// Função para iniciar um cronômetro
function iniciarCronometro(id, tempoInicial) {
    const tempoElement = document.querySelector(`#tempo-${id}`);
    let tempo = tempoInicial;

    const cronometro = setInterval(() => {
        tempo++;
        tempoElement.textContent = formatarTempo(tempo);
        atualizarTempoNoFirestore(id, tempo);
    }, 1000);

    cronometros[id] = cronometro;
}

// Função para atualizar o tempo no Firestore
async function atualizarTempoNoFirestore(id, tempo) {
    try {
        await updateDoc(doc(db, 'senhas', id), { tempo });
    } catch (error) {
        console.error('Erro ao atualizar o tempo no Firestore:', error);
    }
}

// Função para formatar o tempo no formato mm:ss
function formatarTempo(segundos) {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundosRestantes).padStart(2, '0')}`;
}

// Função para remover um card
function removerCard(id) {
    const card = cardContainer.querySelector(`.card[data-id="${id}"]`);
    if (card) {
        cardContainer.removeChild(card);
        clearInterval(cronometros[id]);
        delete cronometros[id];
    }
}

// Função para chamar uma senha
async function chamarSenha(id) {
    const usuario = auth.currentUser;
    const nomeVendedor = usuario ? usuario.email.split('@')[0] : 'Desconhecido';

    clearInterval(cronometros[id]);
    delete cronometros[id];

    try {
        await updateDoc(doc(db, 'senhas', id), {
            status: 'Sendo atendida',
            vendedor: nomeVendedor
        });

        const statusElement = document.querySelector(`#status-${id}`);
        if (statusElement) {
            statusElement.textContent = 'Status: Sendo atendida';
        }
    } catch (error) {
        console.error('Erro ao chamar a senha:', error);
    }
}

// Função para cancelar uma senha
async function cancelarSenha(id) {
    clearInterval(cronometros[id]);
    delete cronometros[id];

    try {
        await deleteDoc(doc(db, 'senhas', id));
        removerCard(id);
    } catch (error) {
        console.error('Erro ao excluir a senha:', error);
    }
}

// Função para chamar a próxima senha
async function chamarProximaSenha() {
    try {
        const prioridadeQuery = query(
            senhasCollection,
            orderBy('prioridade', 'desc'),
            limit(1)
        );

        const querySnapshot = await getDocs(prioridadeQuery);
        const senhaDoc = querySnapshot.docs[0];
        const senha = senhaDoc?.data();
        const senhaId = senhaDoc?.id;

        if (senha) {
            clearInterval(cronometros[senhaId]);
            delete cronometros[senhaId];

            const nomeVendedor = auth.currentUser ? auth.currentUser.email.split('@')[0] : 'Desconhecido';
            await updateDoc(doc(db, 'senhas', senhaId), {
                status: 'Sendo atendida',
                vendedor: nomeVendedor
            });

            const card = document.querySelector(`.card[data-id="${senhaId}"]`);
            if (card) {
                const statusElement = card.querySelector(`#status-${senhaId}`);
                statusElement.textContent = 'Status: Sendo atendida';
            }
        } else {
            console.log('Nenhuma senha disponível para chamar.');
        }
    } catch (error) {
        console.error('Erro ao chamar a próxima senha:', error);
    }
}

// Adiciona o event listener ao botão 'próximo'
botaoProximo.addEventListener('click', chamarProximaSenha);

// Atualiza os cards ao receber as senhas da coleção
onSnapshot(senhasCollection, (querySnapshot) => {
    const idsAtuais = Array.from(cardContainer.querySelectorAll('.card')).map(card => card.dataset.id);

    querySnapshot.forEach((doc) => {
        const senha = doc.data();
        senha.id = doc.id;

        if (!idsAtuais.includes(senha.id)) {
            criarCard(senha);
        } else {
            const statusElement = document.querySelector(`#status-${senha.id}`);
            if (statusElement && senha.status) {
                statusElement.textContent = `Status: ${senha.status}`;
            }
        }
    });

    Array.from(cardContainer.querySelectorAll('.card')).forEach(card => {
        const id = card.dataset.id;
        if (!Array.from(querySnapshot.docs).some(doc => doc.id === id)) {
            removerCard(id);
        }
    });
});
