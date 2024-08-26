// Importa os módulos Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js';
import { getFirestore, collection, doc, updateDoc, deleteDoc, query, where, orderBy, limit, getDocs, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.18.0/firebase-auth.js';

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
const seletorEstacao = document.getElementById('seletorEstacao');

// Armazenar os cronômetros para cada senha
const cronometros = {};

// Função para criar um card de senha
function criarCard(senha) {
    console.log('Criando card para:', senha); // Verifique se a função é chamada

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

// Função para obter a estação selecionada
function obterEstacaoSelecionada() {
    return seletorEstacao.value;
}

// Função para carregar a estação salva no Firebase
async function carregarEstacaoSalva() {
    const usuario = auth.currentUser;
    if (!usuario) return;

    const vendedorDocRef = doc(db, 'vendedores', usuario.uid);
    const docSnap = await getDoc(vendedorDocRef);

    if (docSnap.exists()) {
        const dados = docSnap.data();
        if (dados.estacao) {
            seletorEstacao.value = dados.estacao;
        }
    }
}

// Função para salvar a estação selecionada no Firebase
async function salvarEstacaoSelecionada() {
    const usuario = auth.currentUser;
    if (!usuario) return;

    const vendedorDocRef = doc(db, 'vendedores', usuario.uid);
    const estacaoSelecionada = obterEstacaoSelecionada();

    try {
        await updateDoc(vendedorDocRef, { estacao: estacaoSelecionada });
    } catch (error) {
        console.error('Erro ao salvar a estação no Firestore:', error);
    }
}

// Evento de mudança no seletor de estação
seletorEstacao.addEventListener('change', salvarEstacaoSelecionada);

// Adiciona um listener para mudanças de estado de autenticação
onAuthStateChanged(auth, (usuario) => {
    const imagemUsuario = document.getElementById('imagemUsuario');

    if (usuario) {
        const nomeUsuario = usuario.email.split('@')[0];
        const nomeFormatado = nomeUsuario.charAt(0).toUpperCase() + nomeUsuario.slice(1).toLowerCase();
        imagemUsuario.src = `/assets/img/Usuarios/${nomeFormatado}.jpg`;
        imagemUsuario.alt = `Imagem de ${nomeFormatado}`;

        // Carregar a estação salva quando o usuário está autenticado
        carregarEstacaoSalva();
    } else {
        imagemUsuario.src = `/assets/img/Usuarios/default.jpg`;
        imagemUsuario.alt = `Imagem padrão de usuário`;
    }
});

// Função para chamar uma senha
async function chamarSenha(id) {
    const usuario = auth.currentUser;
    const nomeVendedor = usuario ? usuario.email.split('@')[0] : 'Desconhecido';
    const estacao = obterEstacaoSelecionada(); // Obtém a estação selecionada

    clearInterval(cronometros[id]);
    delete cronometros[id];

    try {
        await updateDoc(doc(db, 'senhas', id), {
            status: 'Sendo atendida',
            vendedor: nomeVendedor,
            estacao: estacao // Adiciona a estação ao documento da senha
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
        const estacao = obterEstacaoSelecionada(); // Obtém a estação selecionada
        const queryFiltro = estacao ? where('estacao', '==', estacao) : null;
        const filtroQuery = query(senhasCollection, queryFiltro || orderBy('timestamp', 'desc'));

        const querySnapshot = await getDocs(filtroQuery);
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
        const senha = { id: doc.id, ...doc.data() };

        if (!idsAtuais.includes(senha.id)) {
            criarCard(senha);
        }
    });

    idsAtuais.forEach((id) => {
        if (!querySnapshot.docs.some(doc => doc.id === id)) {
            removerCard(id);
        }
    });
});
