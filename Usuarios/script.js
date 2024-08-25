// Importa os módulos Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js';
import { getFirestore, collection, query, where, onSnapshot, addDoc, orderBy } from 'https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js';

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
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos do HTML
const userListElement = document.getElementById('user-list');
const chatContainer = document.getElementById('chat-container');
const messagesElement = document.getElementById('messages');
const messageInputElement = document.getElementById('message-input');
const sendMessageButton = document.getElementById('send-message');

// Função para listar usuários
function listarUsuarios() {
    onSnapshot(collection(db, 'vendedores'), (querySnapshot) => {
        userListElement.innerHTML = ''; // Limpa a lista de usuários

        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            const userElement = document.createElement('div');
            userElement.textContent = userData.nome;
            userElement.addEventListener('click', () => {
                iniciarConversa(userData.uid);
            });
            userListElement.appendChild(userElement);
        });
    });
}

// Função para iniciar uma conversa
function iniciarConversa(uid) {
    chatContainer.style.display = 'block'; // Exibe o container de chat
    exibirMensagens(uid);
}

// Função para exibir mensagens
function exibirMensagens(uid) {
    onSnapshot(query(collection(db, 'mensagens'), where('uid', '==', uid), orderBy('timestamp')), (querySnapshot) => {
        messagesElement.innerHTML = ''; // Limpa mensagens existentes

        querySnapshot.forEach((doc) => {
            const messageData = doc.data();
            const messageElement = document.createElement('div');
            messageElement.textContent = `${messageData.uid}: ${messageData.mensagem}`;
            messagesElement.appendChild(messageElement);
        });
    });
}

// Função para enviar uma mensagem
sendMessageButton.addEventListener('click', async () => {
    const message = messageInputElement.value;
    const user = auth.currentUser;

    if (user && message.trim()) {
        try {
            await addDoc(collection(db, 'mensagens'), {
                uid: user.uid,
                mensagem: message,
                timestamp: new Date()
            });
            messageInputElement.value = ''; // Limpar o campo de entrada
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    }
});

// Verifica o estado de autenticação do usuário
onAuthStateChanged(auth, (user) => {
    if (user) {
        listarUsuarios();
    }
});
