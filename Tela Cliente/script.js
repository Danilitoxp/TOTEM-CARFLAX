// Importa os módulos necessários do Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getFirestore, doc, setDoc, getDocs, collection, updateDoc } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

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

// Função para mostrar a tela de senha e esconder a tela de opções
function mostrarSenhaComLoading() {
    console.log("Mostrar tela de loading...");
    document.querySelector('.opcoes').style.display = 'none';
    document.querySelector('.loading').style.display = 'flex';

    // Use setTimeout para garantir que a transição seja visível
    setTimeout(() => {
        console.log("Ocultar tela de loading e mostrar senha...");
        document.querySelector('.loading').style.display = 'none';
        document.querySelector('.senha').style.display = 'flex';
    }, 500); // Ajuste o tempo conforme necessário
}

function voltarOpcoes() {
    console.log("Voltando à tela de opções...");
    document.querySelector('.senha').style.display = 'none';
    document.querySelector('.opcoes').style.display = 'flex';
}

// Desativa os botões para evitar múltiplas chamadas
function desativarBotoes() {
    const btnComum = document.getElementById('btn-comum');
    const btnPreferencial = document.getElementById('btn-preferencial');
    btnComum.disabled = true;
    btnPreferencial.disabled = true;
}

// Reativa os botões após a operação
function reativarBotoes() {
    const btnComum = document.getElementById('btn-comum');
    const btnPreferencial = document.getElementById('btn-preferencial');
    btnComum.disabled = false;
    btnPreferencial.disabled = false;
}

// Mostrar a senha gerada na tela do cliente
async function gerarSenha(tipo) {
    console.log(`Gerando senha para tipo: ${tipo}`);
    desativarBotoes();
    mostrarSenhaComLoading(); // Mostra a tela de loading e depois a tela de senha

    try {
        const novaSenha = gerarId(tipo);
        console.log(`Nova senha gerada: ${novaSenha}`);

        // Verifica se a senha já existe antes de adicionar
        const querySnapshot = await getDocs(collection(db, 'senhas'));
        const existingIds = querySnapshot.docs.map(doc => doc.data().id);

        if (existingIds.includes(novaSenha)) {
            console.log("A senha já existe. Gerando uma nova.");
            // Aguarda um pouco antes de tentar gerar uma nova senha
            setTimeout(() => gerarSenha(tipo), 1000);
            return;
        }

        // Usa setDoc para definir o documento com o ID gerado
        await setDoc(doc(db, 'senhas', novaSenha), {
            id: novaSenha,
            status: 'Aguardando',
            tipo: tipo,
            tempo: 0 // Adiciona o campo tempo inicializado como 0
        });

        console.log("Senha salva no Firestore com sucesso!");
        const senhaElement = document.querySelector('.senha h1');
        if (senhaElement) {
            senhaElement.textContent = `Sua senha: ${novaSenha}`;
        } else {
            console.error('Elemento .senha h1 não encontrado.');
        }

        iniciarCronometro(novaSenha); // Inicia o cronômetro com o tempo inicial
    } catch (error) {
        console.error("Erro ao salvar senha no Firestore:", error);
    } finally {
        reativarBotoes();
    }
}

// Gerar um ID de senha único e sequencial
let contador = 1;

function gerarId(tipo) {
    const prefix = tipo === 'Comum' ? 'CX' : 'PX';
    const numero = contador.toString().padStart(3, '0');
    contador++;
    console.log(`ID gerado: ${prefix}${numero}`);
    return `${prefix}${numero}`;
}

// Iniciar o cronômetro e atualizar o Firestore
async function iniciarCronometro(id) {
    let tempo = 0; // Tempo inicial

    const tempoElement = document.querySelector('.senha p'); // Atualiza para o seletor correto na tela do cliente
    if (!tempoElement) {
        console.error('Elemento .senha p não encontrado.');
        return;
    }

    const cronometro = setInterval(async () => {
        tempo++;
        tempoElement.textContent = formatarTempo(tempo);
        console.log(`Atualizando tempo para ${formatarTempo(tempo)}`);

        try {
            await updateDoc(doc(db, 'senhas', id), { tempo: tempo });
            console.log(`Tempo atualizado no Firestore: ${tempo}`);
        } catch (error) {
            console.error('Erro ao atualizar o tempo no Firestore:', error);
        }

        // Exemplo: Parar após 30 segundos
        if (tempo >= 30) {
            clearInterval(cronometro);
            console.log('O tempo acabou!');
        }
    }, 1000);
}

// Função para formatar o tempo no formato mm:ss
function formatarTempo(segundos) {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundosRestantes).padStart(2, '0')}`;
}

// Adiciona event listeners aos botões apenas uma vez
document.getElementById('btn-comum').addEventListener('click', () => gerarSenha('Comum'));
document.getElementById('btn-preferencial').addEventListener('click', () => gerarSenha('Preferencial'));
document.getElementById('btn-ok').addEventListener('click', voltarOpcoes);
