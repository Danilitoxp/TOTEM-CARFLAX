// Importando Firebase e funções de autenticação
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

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
const db = getFirestore(app);

// Seleção dos elementos do DOM
const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');
const signUpForm = document.querySelector('.sign-up form');
const signInForm = document.querySelector('.sign-in form');

if (!container || !registerBtn || !loginBtn || !signUpForm || !signInForm) {
    console.error('Um ou mais elementos do DOM não foram encontrados.');
}

// Adiciona eventos aos botões de alternância de formulário
registerBtn?.addEventListener('click', () => {
    container?.classList.add("active");
    console.log("Trocado para o formulário de Inscrição");
});

loginBtn?.addEventListener('click', () => {
    container?.classList.remove("active");
    console.log("Trocado para o formulário de Login");
});

// Manipulador de Inscrição
signUpForm?.addEventListener('submit', async (event) => {
    event.preventDefault(); // Impede o envio tradicional do formulário

    const name = signUpForm.querySelector('input[placeholder="Name"]')?.value;
    const email = signUpForm.querySelector('input[placeholder="Email"]')?.value;
    const password = signUpForm.querySelector('input[placeholder="Password"]')?.value;

    if (!name || !email || !password) {
        alert('Todos os campos são obrigatórios.');
        return;
    }

    console.log('Tentando se inscrever com:', { name, email, password });

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Usuário cadastrado com sucesso:', user);

        // Salvar dados adicionais do vendedor no Firestore
        await setDoc(doc(db, "vendedores", user.uid), {
            name: name,
            email: email
        });

        console.log('Dados do vendedor salvos com sucesso');
    } catch (error) {
        console.error('Erro ao se inscrever:', error.message);
        alert('Erro ao se inscrever: ' + error.message);
    }
});

// Manipulador de Login
signInForm?.addEventListener('submit', async (event) => {
    event.preventDefault(); // Impede o envio tradicional do formulário

    const email = signInForm.querySelector('input[placeholder="Email"]')?.value;
    const password = signInForm.querySelector('input[placeholder="Password"]')?.value;

    if (!email || !password) {
        alert('Todos os campos são obrigatórios.');
        return;
    }

    console.log('Tentando fazer login com:', { email, password });

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Usuário autenticado com sucesso:', user);

        // Verificar se o usuário já possui dados de vendedor
        const vendedorDocRef = doc(db, "vendedores", user.uid);
        const vendedorDoc = await getDoc(vendedorDocRef);
        
        if (vendedorDoc.exists()) {
            console.log('Dados do vendedor encontrados:', vendedorDoc.data());
            // Redirecionar para a página do vendedor
            window.location.href = './Tela Vendedor/index.html';
        } else {
            console.log('Dados do vendedor não encontrados. Redirecionando para a página de dados do vendedor.');
            window.location.href = './Tela Vendedor/index.html';
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert('Erro ao fazer login: ' + error.message);
    }
});
