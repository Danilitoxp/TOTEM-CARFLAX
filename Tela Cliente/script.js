// script.js

// Função para mostrar a tela de senha e esconder a tela de opções
function mostrarSenhaComLoading() {
    document.querySelector('.opcoes').style.display = 'none';
    document.querySelector('.loading').style.display = 'flex';

    // Simula o tempo de carregamento com setTimeout (2 segundos)
    setTimeout(function() {
        document.querySelector('.loading').style.display = 'none';
        document.querySelector('.senha').style.display = 'flex';
    }, 500);
}

// Função para voltar à tela de opções
function voltarOpcoes() {
    document.querySelector('.senha').style.display = 'none';
    document.querySelector('.opcoes').style.display = 'flex';
}

// Adiciona event listeners aos botões
document.getElementById('btn-comum').addEventListener('click', mostrarSenhaComLoading);
document.getElementById('btn-preferencial').addEventListener('click', mostrarSenhaComLoading);
document.getElementById('btn-ok').addEventListener('click', voltarOpcoes);
