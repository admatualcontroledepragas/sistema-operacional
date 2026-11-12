/* =======================================================
   ARQUIVO: script.js (Portal Principal)
   (Lógica de Login, Abas, Tema Personalizado e Iframe)
   ======================================================= */

// A SUA URL DA API DE LOGIN
const URL_API_LOGIN = "https://script.google.com/macros/s/AKfycbwxCNM7-XWJm2btht000tgZ343KsmCfwFG4gXmCCp8e-48nPDdS3Qw9gfvkJGWGu6ym/exec";

// ==========================================
// INICIALIZAÇÃO
// ==========================================
window.onload = function() {
    carregarTema(); 
    
    if (sessionStorage.getItem("sessaoAtiva") === "true") {
        liberarPortal(sessionStorage.getItem("nomeUsuario"));
    }
};

// ==========================================
// LÓGICA DE LOGIN E SEGURANÇA
// ==========================================
function toggleSenha() {
    const inputSenha = document.getElementById('loginPass');
    const iconeOlho = document.getElementById('icone-olho');
    
    if (inputSenha.type === 'password') {
        inputSenha.type = 'text';
        iconeOlho.innerText = 'visibility_off'; 
    } else {
        inputSenha.type = 'password';
        iconeOlho.innerText = 'visibility'; 
    }
}

async function fazerLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('btnLogin');
    const err = document.getElementById('login-error');
    
    btn.innerHTML = "Verificando..."; 
    btn.disabled = true;
    err.style.display = "none";

    const payload = {
        acao: "login",
        usuario: document.getElementById('loginUser').value.trim().toLowerCase(),
        senha: document.getElementById('loginPass').value.trim()
    };

    try {
        const req = await fetch(URL_API_LOGIN, { method: 'POST', body: JSON.stringify(payload) });
        const res = await req.json();

        if (res.sucesso) {
            sessionStorage.setItem("sessaoAtiva", "true");
            sessionStorage.setItem("nomeUsuario", res.nome);
            liberarPortal(res.nome);
        } else {
            err.innerText = "⚠️ " + res.mensagem;
            err.style.display = "block";
        }
    } catch (erro) {
        err.innerText = "⚠️ Erro de conexão com o servidor de acessos.";
        err.style.display = "block";
    }
    
    btn.innerHTML = "Entrar"; 
    btn.disabled = false;
}

function liberarPortal(nome) {
    document.getElementById('login-wrapper').style.display = 'none';
    document.getElementById('portal-wrapper').style.display = 'flex';
    document.getElementById('nomeUsuarioDisplay').innerText = nome;
    
    mudarAba('dashboard');
}

function sair() {
    sessionStorage.clear();
    
    document.getElementById('portal-wrapper').style.display = 'none';
    document.getElementById('login-wrapper').style.display = 'flex';
    
    document.getElementById('loginPass').value = "";
    document.getElementById('loginPass').type = "password";
    document.getElementById('icone-olho').innerText = 'visibility';
}

// ==========================================
// LÓGICA DE NAVEGAÇÃO DE ABAS E IFRAME
// ==========================================

function limparAtivos() {
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });
    document.querySelectorAll('.menu-item').forEach(el => {
        el.classList.remove('active');
    });
}

function mudarAba(abaId) {
    limparAtivos();

    if (abaId === 'dashboard') {
        const view = document.getElementById('view-dashboard');
        view.style.display = 'block';
        setTimeout(() => view.classList.add('active'), 10);
        
        document.getElementById('topbar-title').innerText = "Dashboard";
        document.querySelector('.menu-item:nth-child(1)').classList.add('active');
        
        // Limpa o Iframe caso volte para a Home
        document.getElementById('frame-sistema').src = "";
        
    } else if (abaId === 'configuracoes') {
        const view = document.getElementById('view-configuracoes');
        view.style.display = 'block';
        setTimeout(() => view.classList.add('active'), 10);
        
        document.getElementById('topbar-title').innerText = "Configurações";
        document.querySelector('.menu-item:last-child').classList.add('active');
        
        document.getElementById('frame-sistema').src = "";
    }
}

// NOVO: Função Inteligente de Roteamento (Desktop vs Mobile)
function abrirModulo(urlDestino, titulo, elementoClicado) {
    // Verifica a largura da tela (Se é telemóvel ou Desktop)
    const ehMobile = window.innerWidth <= 1024;

    if (ehMobile) {
        // MOBILE: Comportamento Clássico (Recarrega a página toda)
        window.location.href = urlDestino;
    } else {
        // DESKTOP: Usa o Iframe e mantém a barra lateral
        limparAtivos();
        
        // Ativa o botão clicado
        elementoClicado.classList.add('active');
        document.getElementById('topbar-title').innerText = titulo;
        
        // Mostra o Iframe e carrega a URL
        const viewIframe = document.getElementById('view-iframe');
        viewIframe.style.display = 'block';
        setTimeout(() => viewIframe.classList.add('active'), 10);
        
        // CORREÇÃO: Garante que o GitHub Pages resolve o caminho corretamente
        const baseUrl = window.location.href.split('index.html')[0];
        document.getElementById('frame-sistema').src = baseUrl + urlDestino;
    }
}

// ==========================================
// SISTEMA DE TEMAS E PERSONALIZAÇÃO
// ==========================================
function alterarTema(tema) {
    document.body.setAttribute('data-tema', tema);
    localStorage.setItem('temaPortalAtual', tema);
}

function carregarTema() {
    const temaSalvo = localStorage.getItem('temaPortalAtual');
    if (temaSalvo) {
        document.body.setAttribute('data-tema', temaSalvo);
    } else {
        document.body.setAttribute('data-tema', 'azul');
    }
}

// ==========================================
// SERVICE WORKER
// ==========================================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
