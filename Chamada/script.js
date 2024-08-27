import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js';
import { getFirestore, collection, onSnapshot, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js';

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

// Referências às coleções
const senhasCollection = collection(db, 'senhas');
const vendedoresCollection = collection(db, 'vendedores');

// Elementos da interface
const senhaElement = document.getElementById('senha');
const nomeVendedorElement = document.getElementById('nomeVendedor');
const ultimasChamadasContainer = document.querySelector('.ultimas-chamadas');

// Áudio para tocar quando uma nova senha for chamada
const audioElement = new Audio('/assets/sound/chamada.mp3');

// Variável de controle para logs
const DEBUG_MODE = false; // Defina como true para habilitar logs e false para desabilitar

// Função para exibir logs se o DEBUG_MODE estiver habilitado
function debugLog(message) {
    if (DEBUG_MODE) {
        console.log(message);
    }
}

// Função para capitalizar a primeira letra de cada palavra
function capitalizeFirstLetter(string) {
    return string.replace(/\b\w/g, char => char.toUpperCase());
}

// Função para sintetizar a fala
function falarTexto(texto) {
    const synth = window.speechSynthesis;

    // Verifica se a síntese de fala está disponível
    if (!synth) {
        debugLog('A síntese de fala não é suportada pelo navegador.');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(texto);

    // Configurações de voz (opcional)
    const vozes = synth.getVoices();
    if (vozes.length === 0) {
        debugLog('Nenhuma voz disponível. As vozes podem estar carregando.');
    } else {
        utterance.voice = vozes.find(voice => voice.lang === 'pt-BR'); // Altere o idioma se necessário
    }

    // Log para debug
    debugLog(`Fala: ${texto}`);

    // Fala o texto
    synth.speak(utterance);
}

// Armazena a última senha chamada para comparação
let ultimaSenhaChamada = null;
let ultimaFala = null;

// Função para atualizar a interface com a senha chamada
async function atualizarInterface(senha) {
    if (senha) {
        senhaElement.textContent = senha.id;

        // Log para debug: dados da senha chamada
        debugLog('Dados da Senha Chamada:', senha);

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
                    debugLog(`Nome do Vendedor: ${capitalizeFirstLetter(senha.vendedor)}`);
                    debugLog(`Senha: ${senha.id}`);
                    debugLog(`Estação: ${estacao}`);

                    // Síntese de fala com atraso
                    const texto = `Senha ${senha.id}, ${capitalizeFirstLetter(senha.vendedor)}`;
                    if (texto !== ultimaFala) {
                        // Toca o áudio e aguarda 3 segundos antes de falar o texto
                        audioElement.play().then(() => {
                            setTimeout(() => {
                                falarTexto(texto);
                                ultimaFala = texto;
                            }, 3000);
                        }).catch(error => {
                            debugLog('Erro ao tentar reproduzir o áudio:', error);
                        });
                    }

                } else {
                    nomeVendedorElement.innerHTML = `${capitalizeFirstLetter(senha.vendedor) || 'Não disponível'} <span id="numero-estacao">${senha.estacao || 'Não disponível'}</span>`;

                    // Log para debug
                    debugLog(`Nome do Vendedor: ${capitalizeFirstLetter(senha.vendedor)}`);
                    debugLog(`Senha: ${senha.id}`);
                    debugLog(`Estação: ${senha.estacao || 'Não disponível'}`);

                    // Síntese de fala com atraso
                    const texto = `Senha ${senha.id}`;
                    if (texto !== ultimaFala) {
                        // Toca o áudio e aguarda 3 segundos antes de falar o texto
                        audioElement.play().then(() => {
                            setTimeout(() => {
                                falarTexto(texto);
                                ultimaFala = texto;
                            }, 3000);
                        }).catch(error => {
                            debugLog('Erro ao tentar reproduzir o áudio:', error);
                        });
                    }
                }
            } catch (error) {
                console.error('Erro ao buscar dados do vendedor:', error);
                nomeVendedorElement.innerHTML = `${capitalizeFirstLetter(senha.vendedor) || 'Não disponível'} <span id="numero-estacao">${senha.estacao || 'Não disponível'}</span>`;

                // Log para debug
                debugLog(`Nome do Vendedor: ${capitalizeFirstLetter(senha.vendedor)}`);
                debugLog(`Senha: ${senha.id}`);
                debugLog(`Estação: ${senha.estacao || 'Não disponível'}`);

                // Síntese de fala com atraso
                const texto = `Senha ${senha.id}`;
                if (texto !== ultimaFala) {
                    // Toca o áudio e aguarda 3 segundos antes de falar o texto
                    audioElement.play().then(() => {
                        setTimeout(() => {
                            falarTexto(texto);
                            ultimaFala = texto;
                        }, 3000);
                    }).catch(error => {
                        debugLog('Erro ao tentar reproduzir o áudio:', error);
                    });
                }
            }
        } else {
            // Atualiza o número da estação diretamente da coleção senhas
            const estacao = senha.estacao || '';
            nomeVendedorElement.innerHTML = `Não disponível <span id="numero-estacao">${estacao}</span>`;

            // Log para debug
            debugLog('Nome do Vendedor: Não disponível');
            debugLog(`Senha: ${senha.id}`);
            debugLog(`Estação: ${estacao}`);

            // Síntese de fala com atraso
            const texto = `Senha ${senha.id}`;
            if (texto !== ultimaFala) {
                // Toca o áudio e aguarda 3 segundos antes de falar o texto
                audioElement.play().then(() => {
                    setTimeout(() => {
                        falarTexto(texto);
                        ultimaFala = texto;
                    }, 3000);
                }).catch(error => {
                    debugLog('Erro ao tentar reproduzir o áudio:', error);
                });
            }
        }
    } else {
        senhaElement.textContent = '';
        nomeVendedorElement.innerHTML = 'Não disponível <span id="numero-estacao"></span>';

        // Log para debug
        debugLog('Nenhuma senha chamada atualmente.');
    }
}

// Função para atualizar as últimas chamadas
function atualizarUltimasChamadas(senhas) {
    // Limpa o container atual
    ultimasChamadasContainer.innerHTML = '';

    // Adiciona no máximo 4 senhas ao container
    const ultimasSenhas = senhas.slice(-4);
    ultimasSenhas.forEach((senha) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = senha.id;

        card.innerHTML = `
            <div class="senha">
                <h3>${senha.vendedor || 'Não disponível'}</h3>
                <p>${senha.id || 'Não disponível'}</p>
            </div>
        `;
        ultimasChamadasContainer.appendChild(card);
    });
}

// Função para solicitar permissão para notificações
function pedirPermissaoParaNotificacoes() {
    // Verifica se o navegador suporta notificações
    if ('Notification' in window) {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                debugLog('Permissão para notificações concedida.');
            } else {
                debugLog('Permissão para notificações negada.');
            }
        }).catch((error) => {
            console.error('Erro ao solicitar permissão para notificações:', error);
        });
    } else {
        debugLog('Navegador não suporta notificações.');
    }
}

// Solicita permissão ao carregar a página
window.onload = function() {
    pedirPermissaoParaNotificacoes();
    // Adiciona um evento de clique para desbloquear a reprodução automática de áudio
    document.addEventListener('click', () => {
        audioElement.play().catch(error => {
            debugLog('Erro ao tentar reproduzir o áudio:', error);
        });
    });
};

// Escuta mudanças na coleção de senhas
onSnapshot(senhasCollection, (querySnapshot) => {
    let senhaChamada = null;
    const senhas = [];

    querySnapshot.forEach((doc) => {
        const senha = { id: doc.id, ...doc.data() };

        if (senha.status === 'Sendo atendida') {
            senhaChamada = senha;
        }
        senhas.push(senha);
    });

    // Atualiza a interface apenas se houver uma senha chamada e se for diferente da última
    if (senhaChamada && JSON.stringify(senhaChamada) !== JSON.stringify(ultimaSenhaChamada)) {
        atualizarInterface(senhaChamada);
        ultimaSenhaChamada = senhaChamada;
    }

    // Atualiza as últimas chamadas
    atualizarUltimasChamadas(senhas);
});
