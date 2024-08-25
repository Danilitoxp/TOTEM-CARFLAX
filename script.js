// Importando Firebase e funções de autenticação
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDjmhBmT27rrpJOXan9hioKlQwcByOOevY",
    authDomain: "atendimento-carflax.firebaseapp.com",
    projectId: "atendimento-carflax",
    storageBucket: "atendimento-carflax.appspot.com",
    messagingSenderId: "903055029867",
    appId: "1:903055029867:web:ef06b4492c4bfe98fee32e"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Seleção dos elementos do DOM
const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

// Adiciona eventos aos botões de alternância de formulário
registerBtn.addEventListener('click', () => {
    container.classList.add("active");
    console.log("Trocado para o formulário de Inscrição");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
    console.log("Trocado para o formulário de Login");
});

// Seleção dos formulários
const signUpForm = document.querySelector('.sign-up form');
const signInForm = document.querySelector('.sign-in form');

// Manipulador de Inscrição
signUpForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Impede o envio tradicional do formulário

    const name = signUpForm.querySelector('input[placeholder="Name"]').value;
    const email = signUpForm.querySelector('input[placeholder="Email"]').value;
    const password = signUpForm.querySelector('input[placeholder="Password"]').value;

    console.log('Tentando se inscrever com:', { name, email, password });

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Usuário cadastrado com sucesso
            const user = userCredential.user;
            console.log('Usuário cadastrado com sucesso:', user);
            // Opcional: Salvar dados adicionais do usuário no Firestore
        })
        .catch((error) => {
            console.error('Erro ao se inscrever:', error);
            alert(error.message);
        });
});

// Manipulador de Login
signInForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Impede o envio tradicional do formulário

    const email = signInForm.querySelector('input[placeholder="Email"]').value;
    const password = signInForm.querySelector('input[placeholder="Password"]').value;

    console.log('Tentando fazer login com:', { email, password });

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Usuário autenticado com sucesso
            const user = userCredential.user;
            console.log('Usuário autenticado com sucesso:', user);

            // Redirecionar para a página do vendedor
            window.location.href = './Tela Vendedor/index.html';
        })
        .catch((error) => {
            console.error('Erro ao fazer login:', error);
            alert(error.message);
        });
});
