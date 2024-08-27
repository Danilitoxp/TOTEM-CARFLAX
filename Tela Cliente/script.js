// Importa os módulos necessários do Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getFirestore, doc, setDoc, updateDoc, getDocs, collection } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDe-nIaiqlyRaI8HdNOD91e4YrMhF_GD3Q",
    authDomain: "carflax-77065.firebaseapp.com",
    projectId: "carflax-77065",
    storageBucket: "carflax-77065.appspot.com",
    messagingSenderId: "557009908515",
    appId: "1:557009908515:web:b7814e7feded69d4461296"
  };

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Função para mostrar a tela de senha e esconder a tela de opções
function mostrarSenhaComLoading() {
    document.querySelector('.opcoes').style.display = 'none';
    document.querySelector('.loading').style.display = 'flex';

    // Use setTimeout para garantir que a transição seja visível
    setTimeout(() => {
        document.querySelector('.loading').style.display = 'none';
        document.querySelector('.senha').style.display = 'flex';
    }, 500); // Ajuste o tempo conforme necessário
}

function voltarOpcoes() {
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
            vendedor: '', // Deixa o campo vendedor em branco ao criar a senha
            estacao: '',  // Deixa o campo estacao em branco ao criar a senha
            tipo: tipo,
            prioridade: tipo === 'Preferencial' ? 2 : 1, // Define a prioridade com base no tipo
            tempo: 4      // Define o tempo padrão como 4
        });

        console.log("Senha salva no Firestore com sucesso!");
        const senhaElement = document.querySelector('.senha h1');
        if (senhaElement) {
            senhaElement.textContent = `Sua senha: ${novaSenha}`;
        } else {
            console.error('Elemento .senha h1 não encontrado.');
        }
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

// Adiciona event listeners aos botões apenas uma vez
document.getElementById('btn-comum').addEventListener('click', () => gerarSenha('Comum'));
document.getElementById('btn-preferencial').addEventListener('click', () => gerarSenha('Preferencial'));
document.getElementById('btn-ok').addEventListener('click', voltarOpcoes);

// Função para obter o nome do vendedor autenticado
async function obterNomeVendedor() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, (usuario) => {
            if (usuario) {
                const email = usuario.email;
                const primeiroNome = extrairPrimeiroNome(email);
                resolve(primeiroNome);
            } else {
                reject('Nenhum usuário autenticado');
            }
        });
    });
}

// Função para extrair o primeiro nome do e-mail
function extrairPrimeiroNome(email) {
    const nomeCompleto = email.split('@')[0];
    return nomeCompleto.charAt(0).toUpperCase() + nomeCompleto.slice(1); // Capitaliza a primeira letra
}

// Atualiza o campo 'vendedor' da senha com o nome do vendedor que a chamou
async function atualizarVendedorDaSenha(id) {
    try {
        const vendedorNome = await obterNomeVendedor();
        await updateDoc(doc(db, 'senhas', id), { vendedor: vendedorNome });
        console.log(`Campo 'vendedor' atualizado para: ${vendedorNome}`);
    } catch (error) {
        console.error('Erro ao atualizar o campo "vendedor" no Firestore:', error);
    }
}

// Atualiza o campo 'estacao' da senha com a estação que a chamou
async function atualizarEstacaoDaSenha(id, estacao) {
    try {
        await updateDoc(doc(db, 'senhas', id), { estacao: estacao });
        console.log(`Campo 'estacao' atualizado para: ${estacao}`);
    } catch (error) {
        console.error('Erro ao atualizar o campo "estacao" no Firestore:', error);
    }
}

// Função para chamar a próxima senha
async function chamarProximaSenha() {
    try {
        const estacao = obterEstacaoSelecionada();
        const querySnapshot = await getDocs(collection(db, 'senhas'));
        const senhas = querySnapshot.docs.map(doc => doc.data()).filter(s => s.status === 'Aguardando');
        const senha = senhas.sort((a, b) => a.prioridade - b.prioridade)[0];

        if (senha) {
            await updateDoc(doc(db, 'senhas', senha.id), { status: 'Em Atendimento' });
            console.log(`Próxima senha: ${senha.id}`);
            const senhaElement = document.querySelector('.senha h1');
            if (senhaElement) {
                senhaElement.textContent = `Sua senha: ${senha.id}`;
            } else {
                console.error('Elemento .senha h1 não encontrado.');
            }
            await atualizarEstacaoDaSenha(senha.id, estacao);
            await atualizarVendedorDaSenha(senha.id);
        } else {
            console.log('Nenhuma senha aguardando.');
        }
    } catch (error) {
        console.error('Erro ao chamar a próxima senha:', error);
    }
}

// Função para obter a estação selecionada
function obterEstacaoSelecionada() {
    return document.querySelector('input[name="estacao"]:checked')?.value || 'Desconhecida';
}

