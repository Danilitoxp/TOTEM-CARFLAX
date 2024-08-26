import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js';
import { getFirestore, collection, onSnapshot, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js';

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

// Referências às coleções
const senhasCollection = collection(db, 'senhas');
const vendedoresCollection = collection(db, 'vendedores');

// Elementos da interface
const senhaElement = document.getElementById('senha');
const nomeVendedorElement = document.getElementById('nomeVendedor');
const numeroEstacaoElement = document.getElementById('numero-estacao');

// Função para capitalizar a primeira letra de cada palavra
function capitalizeFirstLetter(string) {
    return string.replace(/\b\w/g, char => char.toUpperCase());
}

// Função para atualizar a interface com a senha chamada
async function atualizarInterface(senha) {
    if (senha) {
        senhaElement.textContent = senha.id;

        // Log para debug: dados da senha chamada
        console.log('Dados da Senha Chamda:', senha);

        // Atualiza o nome do vendedor e o número da estação
        if (senha.vendedor) {
            try {
                const vendedorDoc = doc(vendedoresCollection, senha.vendedor);
                const vendedorSnapshot = await getDoc(vendedorDoc);
                if (vendedorSnapshot.exists()) {
                    const vendedorData = vendedorSnapshot.data();
                    const estacao = vendedorData.estacao || '';

                    // Atualiza o nome do vendedor e o número da estação
                    nomeVendedorElement.innerHTML = `${capitalizeFirstLetter(senha.vendedor)} <span id="numero-estacao">${estacao}</span>`;

                    // Log para debug
                    console.log(`Nome do Vendedor: ${capitalizeFirstLetter(senha.vendedor)}`);
                    console.log(`Senha: ${senha.id}`);
                    console.log(`Estação: ${estacao}`);
                } else {
                    nomeVendedorElement.innerHTML = `${capitalizeFirstLetter(senha.vendedor) || 'Não disponível'} <span id="numero-estacao">${senha.estacao || 'Não disponível'}</span>`;

                    // Log para debug
                    console.log(`Nome do Vendedor: ${capitalizeFirstLetter(senha.vendedor)}`);
                    console.log(`Senha: ${senha.id}`);
                    console.log(`Estação: ${senha.estacao || 'Não disponível'}`);
                }
            } catch (error) {
                console.error('Erro ao buscar dados do vendedor:', error);
                nomeVendedorElement.innerHTML = `${capitalizeFirstLetter(senha.vendedor) || 'Não disponível'} <span id="numero-estacao">${senha.estacao || 'Não disponível'}</span>`;

                // Log para debug
                console.log(`Nome do Vendedor: ${capitalizeFirstLetter(senha.vendedor)}`);
                console.log(`Senha: ${senha.id}`);
                console.log(`Estação: ${senha.estacao || 'Não disponível'}`);
            }
        } else {
            // Atualiza o número da estação diretamente da coleção senhas
            const estacao = senha.estacao || '';
            nomeVendedorElement.innerHTML = `Não disponível <span id="numero-estacao">${estacao}</span>`;

            // Log para debug
            console.log('Nome do Vendedor: Não disponível');
            console.log(`Senha: ${senha.id}`);
            console.log(`Estação: ${estacao}`);
        }
    } else {
        senhaElement.textContent = '';
        nomeVendedorElement.innerHTML = 'Não disponível <span id="numero-estacao"></span>';

        // Log para debug
        console.log('Nenhuma senha chamada atualmente.');
    }
}



// Armazena a última senha chamada para comparação
let ultimaSenhaChamada = null;

// Escuta mudanças na coleção de senhas
onSnapshot(senhasCollection, (querySnapshot) => {
    let senhaChamada = null;

    querySnapshot.forEach((doc) => {
        const senha = { id: doc.id, ...doc.data() };
        
        if (senha.status === 'Sendo atendida') {
            senhaChamada = senha;
        }
    });

    // Atualiza a interface apenas se houver uma senha chamada e se for diferente da última
    if (senhaChamada && JSON.stringify(senhaChamada) !== JSON.stringify(ultimaSenhaChamada)) {
        atualizarInterface(senhaChamada);
        ultimaSenhaChamada = senhaChamada;
    }
});
