/* =======================================================
   ARQUIVO: script.js (COMUNICADOS)
   Lógica de Interface, Integração com Apps Script e Quill
   ======================================================= */

// ==========================================
// COLE SUA URL DO GOOGLE APPS SCRIPT AQUI 👇
// ==========================================
const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbzmTFdVGtg3bEGevNcRiguYx2MV6bslEMe9RT_R-pWt3b9DolS0c6mApLr_a-0ccim9aQ/exec"; 

let idParaExcluir = null;
let cardAtivo = 1;
let idEmEdicao = null;

let filtroAtualPrincipal = 'Dedetizacao';
let filtroAtualHistorico = 'Dedetizacao';
let currentPage = 1;
const itemsPerPage = 10;
let totalPagesCache = 1; 

let tipoImportacaoAtual = '';
let listaUnicaParaImportacao = [];

const memoriaPragas = { 1: [], 2: [], 3: [] };
const memoriaPragasOutrosTxt = { 1: "", 2: "", 3: "" };

// Template de loading para usar dentro das tabelas
const loaderHTML = '<tr><td colspan="4" style="text-align: center; color: #6b7280; padding: 25px;"><div style="display: flex; align-items: center; justify-content: center; gap: 10px; white-space: nowrap;"><span>Carregando dados...</span><div class="spinner" style="width: 18px; height: 18px; border-width: 3px; margin: 0; flex-shrink: 0;"></div></div></td></tr>';

window.addEventListener('DOMContentLoaded', () => {
    aplicarFiltroPrincipal();
    
    // Inicia a verificação de cor de fundo para o modo escuro
    verificarTemaFundo();
});

// ==========================================
// DETEÇÃO DE TEMA (CLARO/ESCURO) NO IFRAME
// ==========================================
function verificarTemaFundo() {
    const titulos = document.querySelectorAll('.titulo-tela, .form-header h2, .form-header p, .modal-box h3, .modal-box p');

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        titulos.forEach(t => t.classList.add('tema-escuro-texto'));
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (event.matches) titulos.forEach(t => t.classList.add('tema-escuro-texto'));
        else titulos.forEach(t => t.classList.remove('tema-escuro-texto'));
    });

    window.addEventListener('message', function(event) {
        if (event.data === 'temaEscuro') titulos.forEach(t => t.classList.add('tema-escuro-texto'));
        else if (event.data === 'temaClaro') titulos.forEach(t => t.classList.remove('tema-escuro-texto'));
    });
    
    const bodyStyle = window.getComputedStyle(document.body);
    let bg = bodyStyle.backgroundColor;
    let rgb = bg.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
        let r = parseInt(rgb[0]), g = parseInt(rgb[1]), b = parseInt(rgb[2]);
        let luminosidade = (r * 299 + g * 587 + b * 114) / 1000;
        if (luminosidade < 128 && bg !== 'rgba(0, 0, 0, 0)') {
            titulos.forEach(t => t.classList.add('tema-escuro-texto'));
        } else if (bg !== 'rgba(0, 0, 0, 0)') {
            titulos.forEach(t => t.classList.remove('tema-escuro-texto'));
        }
    }
}

// ================================
// NAVEGAÇÃO SPA (VIEWS)
// ================================
function mostrarView(viewId) {
    document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    window.scrollTo(0, 0);
}

function abrirViewHistorico() {
    mostrarView('view-historico');
    dispararBuscaHistorico();
}

function fecharHistorico() {
    mostrarView('view-dashboard');
}

function fecharFormulario() {
    mostrarView('view-dashboard');
    idEmEdicao = null;
    aplicarFiltroPrincipal();
}

// ==========================================
// LOADERS E MODAIS
// ==========================================
function showLoader(txt = "Aguarde...") { 
    document.getElementById("global-loader-text").innerText = txt; 
    document.getElementById("global-loader").classList.remove("hidden"); 
}
function hideLoader() { 
    document.getElementById("global-loader").classList.add("hidden"); 
}

function abrirModal(id) { document.getElementById(id).style.display = 'flex'; }
function fecharModal(id) { document.getElementById(id).style.display = 'none'; }

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container'); const toast = document.createElement('div');
    toast.className = `toast ${type}`; toast.innerHTML = `<span>${message}</span>`; container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10); 
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function mostrarModal(mensagem, tipo = 'alerta', callbackConfirmacao = null) {
    const modal = document.getElementById('modal-sistema');
    const texto = document.getElementById('modal-texto');
    const botoes = document.getElementById('modal-botoes');
    
    texto.innerText = mensagem;
    botoes.innerHTML = ''; 
    
    if (tipo === 'alerta') {
        const btnOk = document.createElement('button');
        btnOk.className = 'btn-action btn-novo';
        btnOk.style.width = '100%';
        btnOk.innerText = 'OK';
        btnOk.onclick = () => { modal.style.display = 'none'; if (callbackConfirmacao) callbackConfirmacao(); };
        botoes.appendChild(btnOk);
    } 
    else if (tipo === 'confirmacao') {
        const btnCancelar = document.createElement('button');
        btnCancelar.className = 'btn-cancel';
        btnCancelar.innerText = 'Cancelar';
        btnCancelar.onclick = () => { modal.style.display = 'none'; };
        
        const btnConfirmar = document.createElement('button');
        btnConfirmar.className = 'btn-danger';
        btnConfirmar.innerText = 'Sim, Excluir';
        btnConfirmar.onclick = () => { modal.style.display = 'none'; if (callbackConfirmacao) callbackConfirmacao(); };
        
        botoes.appendChild(btnCancelar);
        botoes.appendChild(btnConfirmar);
    }
    modal.style.display = 'flex';
}

async function fetchAPI(action, dados = {}, mensagemLoader = null) {
    try {
        if(mensagemLoader) showLoader(mensagemLoader); 
        const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), 45000);
        const response = await fetch(URL_SCRIPT, { method: 'POST', body: JSON.stringify({ action: action, dados: dados }), signal: controller.signal });
        clearTimeout(timeoutId); const result = await response.json(); 
        if(mensagemLoader) hideLoader(); 
        return result;
    } catch (error) { 
        if(mensagemLoader) hideLoader(); 
        if (error.name === 'AbortError') showToast("O Servidor demorou muito a responder.", "error"); else showToast("Falha na ligação.", "error"); 
        return { sucesso: false }; 
    }
}

// ================================
// LÓGICA DE DADOS (DASHBOARD/HISTÓRICO)
// ================================
function abrirModalSelecaoNovo() { 
    idEmEdicao = null; 
    abrirModal('modal-selecao'); 
}

function prepararFormularioNovo(tipo) {
    fecharModal('modal-selecao');
    idEmEdicao = null;
    
    document.getElementById('form-dedetizacao').style.display = 'none';
    document.getElementById('form-limpeza').style.display = 'none';
    document.getElementById('form-termo').style.display = 'none';

    document.getElementById('form-dedetizacao').reset();
    document.getElementById('form-limpeza').reset();
    document.getElementById('form-termo').reset();
    document.getElementById('obs-limp').innerHTML = '';
    
    if (tipo === 'Dedetizacao') {
        document.getElementById('form-dedetizacao').style.display = 'block';
        document.getElementById('titulo-formulario').innerText = 'Novo Comunicado - Dedetização';
        document.getElementById('btn-salvar-dedetizacao').innerHTML = '<span class="material-icons" style="font-size: 18px;">save</span> Salvar Comunicado';
        ativarCard(1);
    } else if (tipo === 'Limpeza') {
        document.getElementById('form-limpeza').style.display = 'block';
        document.getElementById('titulo-formulario').innerText = 'Novo Comunicado - Limpeza';
        document.getElementById('btn-salvar-limpeza').innerHTML = '<span class="material-icons" style="font-size: 18px;">save</span> Salvar Comunicado';
    } else if (tipo === 'Termo') {
        document.getElementById('form-termo').style.display = 'block';
        document.getElementById('titulo-formulario').innerText = 'Novo Comunicado - Fumacê';
        document.getElementById('btn-salvar-termo').innerHTML = '<span class="material-icons" style="font-size: 18px;">save</span> Salvar Comunicado';
    }
    
    servGeralOutrasOpcoes.forEach(cb => cb.disabled = false); document.getElementById('serv-geral-outro-txt').classList.add('hidden');
    [1, 2, 3].forEach(id => { memoriaPragas[id] = []; memoriaPragasOutrosTxt[id] = ""; document.getElementById(`serv-outro-txt-${id}`).classList.add('hidden'); document.getElementById(`imovel-outro-txt-${id}`).classList.add('hidden'); });
    document.getElementById('praga-outros-txt').classList.add('hidden');
    document.getElementById('display-pragas-1').innerText = "Nenhuma praga selecionada."; document.getElementById('display-pragas-2').innerText = "Nenhuma praga selecionada."; document.getElementById('display-pragas-3').innerText = "Nenhuma praga selecionada.";
    
    mostrarView('view-formulario');
}

async function aplicarFiltroPrincipal() { 
    const tbody = document.getElementById('tabela-corpo-ultimos');
    tbody.innerHTML = loaderHTML;
    
    const res = await fetchAPI('listar', { aba: filtroAtualPrincipal, limite: 5 }); // Sem loader bloqueante
    
    if (res.sucesso) { 
        const dashTotal = document.getElementById('dashTotal');
        if (dashTotal) dashTotal.innerText = res.total || res.registros.length;
        desenharLinhas(res.registros, 'tabela-corpo-ultimos'); 
    } else {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 25px; color:var(--error-color);">Erro ao carregar dados.</td></tr>';
    }
}

function setFiltroPrincipal(filtro, btnElement) {
    filtroAtualPrincipal = filtro; const container = btnElement.parentElement;
    container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); btnElement.classList.add('active');
    
    let tituloMetrica = filtro;
    if (filtro === "Dedetizacao") tituloMetrica = "Dedetização";
    if (filtro === "Limpeza") tituloMetrica = "Limpeza";
    if (filtro === "Termo") tituloMetrica = "Fumacê";

    const lblTotal = document.getElementById('lblTotal');
    if (lblTotal) lblTotal.innerText = "Total de " + tituloMetrica;
    
    aplicarFiltroPrincipal();
}

function setFiltroHistorico(filtro, btnElement) {
    filtroAtualHistorico = filtro; const container = btnElement.parentElement;
    container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); btnElement.classList.add('active');
    dispararBuscaHistorico();
}

function limparFiltrosHistorico() {
    document.getElementById('filtro-cliente').value = '';
    document.getElementById('filtro-data-inicio').value = '';
    document.getElementById('filtro-data-fim').value = '';
    dispararBuscaHistorico();
}

function dispararBuscaHistorico() {
    currentPage = 1; 
    aplicarFiltrosEBusca();
}

async function aplicarFiltrosEBusca() {
    const tbody = document.getElementById('tabela-corpo-historico');
    tbody.innerHTML = loaderHTML;
    
    const searchCliente = document.getElementById('filtro-cliente').value;
    const dataInicioStr = document.getElementById('filtro-data-inicio').value;
    const dataFimStr = document.getElementById('filtro-data-fim').value;

    const res = await fetchAPI('listar', { 
        aba: filtroAtualHistorico, limite: itemsPerPage, pagina: currentPage,
        busca: searchCliente, dataInicio: dataInicioStr, dataFim: dataFimStr
    });
    
    if (res.sucesso) {
        desenharLinhas(res.registros, 'tabela-corpo-historico');
        totalPagesCache = Math.ceil(res.total / itemsPerPage) || 1;
        document.getElementById('page-info').innerText = `Página ${currentPage} de ${totalPagesCache}`;
        document.getElementById('btn-prev-page').disabled = (currentPage === 1);
        document.getElementById('btn-next-page').disabled = (currentPage >= totalPagesCache);
    } else {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 25px; color:var(--error-color);">Erro ao carregar dados.</td></tr>';
    }
}

function mudarPagina(direcao) {
    currentPage += direcao;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPagesCache) currentPage = totalPagesCache;
    aplicarFiltrosEBusca(); 
}

// ==========================================
// RENDERIZAÇÃO E AÇÕES NAS TABELAS
// ==========================================
function desenharLinhas(registros, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';
    if (registros.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 25px; color: #6b7280;">Nenhum comunicado encontrado.</td></tr>'; return; }

    registros.forEach(item => {
        const tr = document.createElement('tr');
        const codigoSeguro = item.id || item.codigo || "";
        let linkDownload = item.linkPdf ? item.linkPdf.replace(/\/view.*$/, "/export?format=pdf") : '#';

        tr.innerHTML = `
            <td class="td-cliente" title="${item.cliente || '-'}"><strong>${item.cliente || '-'}</strong></td>
            <td>${item.servico || '-'}</td>
            <td style="white-space: nowrap;">${item.data || '-'}</td>
            <td style="text-align: center;">
                <div class="actions">
                    <button type="button" class="icon-btn icon-pdf" onclick="window.open('${item.linkPdf}', '_blank')" title="Ver PDF"><span class="material-icons">visibility</span></button>
                    <button type="button" class="icon-btn icon-share" onclick="window.open('${linkDownload}', '_blank')" title="Baixar PDF"><span class="material-icons">download</span></button>
                    <button type="button" class="icon-btn icon-edit" onclick="editarRegistro('${codigoSeguro}', '${item.servico}')" title="Editar"><span class="material-icons">edit</span></button>
                    <button type="button" class="icon-btn icon-del" onclick="abrirModalExclusao('${codigoSeguro}')" title="Apagar"><span class="material-icons">delete</span></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function abrirModalExclusao(id) { 
    mostrarModal("Tem a certeza que deseja apagar definitivamente este comunicado?", "confirmacao", async () => {
        const res = await fetchAPI('excluir', { id: id }, "A apagar ficheiro...");
        if (res.sucesso) { 
            mostrarModal("Comunicado apagado com sucesso!", "alerta"); 
            aplicarFiltroPrincipal(); 
            if (document.getElementById('view-historico').classList.contains('active')) dispararBuscaHistorico();
        } else { 
            mostrarModal("Erro ao excluir: " + res.mensagem, "alerta"); 
        }
    });
}

// ==========================================
// IMPORTAÇÃO E ENGENHARIA REVERSA
// ==========================================
async function abrirModalImportacao(tipoServico) {
    tipoImportacaoAtual = tipoServico;
    document.getElementById('input-busca-importacao').value = '';
    
    let abaParaBackend = tipoServico;
    const res = await fetchAPI('listar', { aba: abaParaBackend, limite: 100 }, "A carregar clientes para importação..."); 
    
    if(res.sucesso) {
        let registrosDoTipo = res.registros;
        listaUnicaParaImportacao = [];
        let nomesVistos = new Set();
        
        registrosDoTipo.forEach(reg => {
            let nomeLower = (reg.cliente || '').trim().toLowerCase();
            if (nomeLower && !nomesVistos.has(nomeLower)) {
                nomesVistos.add(nomeLower);
                listaUnicaParaImportacao.push(reg);
            }
        });
        renderizarListaImportacao(listaUnicaParaImportacao);
        abrirModal('modal-importacao');
    }
}

function renderizarListaImportacao(lista) {
    const container = document.getElementById('lista-clientes-importacao');
    container.innerHTML = '';
    
    if(lista.length === 0) {
        container.innerHTML = '<div style="padding: 15px; text-align: center; color: #777;">Nenhum cliente encontrado no histórico para este serviço.</div>';
        return;
    }

    lista.forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-item-import';
        div.innerHTML = `
            <div>
                <strong>${item.cliente}</strong>
                <span>Último serviço: ${item.data || '-'}</span>
            </div>
            <button class="btn-select-import" onclick="executarImportacao('${item.id}')">Selecionar</button>
        `;
        container.appendChild(div);
    });
}

function filtrarListaImportacao() {
    const query = document.getElementById('input-busca-importacao').value.toLowerCase().trim();
    const filtrados = listaUnicaParaImportacao.filter(item => (item.cliente || '').toLowerCase().includes(query));
    renderizarListaImportacao(filtrados);
}

async function executarImportacao(id) {
    fecharModal('modal-importacao');
    let tipoStringNoBackend = '';
    if (tipoImportacaoAtual === 'Dedetizacao') tipoStringNoBackend = 'Dedetização';
    else if (tipoImportacaoAtual === 'Limpeza') tipoStringNoBackend = 'Limpeza de Reservatório';
    else if (tipoImportacaoAtual === 'Termo') tipoStringNoBackend = 'Termonebulização';
    await aplicarEngenhariaReversa(id, tipoStringNoBackend, true);
}

async function aplicarEngenhariaReversa(id, tipo, isImportacao = false) {
    const res = await fetchAPI('buscar_registro', { id: id, tipo: tipo }, "A extrair dados completos...");
    if (!res.sucesso) { mostrarModal(res.mensagem, 'alerta'); return; }
    
    const dados = res.dados;
    
    document.getElementById('form-dedetizacao').style.display = 'none';
    document.getElementById('form-limpeza').style.display = 'none';
    document.getElementById('form-termo').style.display = 'none';
    
    if (tipo === 'Dedetização' || tipo === 'Dedetizacao') {
        document.getElementById('form-dedetizacao').style.display = 'block';
        if(!isImportacao) {
            idEmEdicao = id;
            document.getElementById('titulo-formulario').innerText = 'Editando Comunicado - Dedetização';
            document.getElementById('btn-salvar-dedetizacao').innerHTML = '<span class="material-icons" style="font-size: 18px;">save</span> Atualizar Comunicado';
        } else {
            idEmEdicao = null; 
            document.getElementById('data').value = ''; 
        }
        
        document.getElementById('cliente').value = dados.cliente || '';
        if(!isImportacao) { document.getElementById('data').value = dados.data || ''; }
        
        if (dados.previsao) {
            const prev = dados.previsao.split(' às ');
            document.getElementById('hora-inicio').value = prev[0] ? prev[0].trim() : '';
            document.getElementById('hora-fim').value = prev[1] ? prev[1].trim() : '';
        }
        
        let radioVend = document.querySelector(`input[name="vendedor"][value="${dados.vendedor}"]`);
        if(radioVend) radioVend.checked = true;
        
        document.querySelectorAll('.servico-geral-cb').forEach(cb => { cb.checked = false; cb.disabled = false; });
        document.getElementById('serv-geral-outro-txt').classList.add('hidden');
        if (dados.servicoGeralStr) {
            let strGeral = dados.servicoGeralStr.replace('os serviços de ', '').replace('o serviço de ', '').trim();
            let itensGeral = strGeral.split(/ e |, /).map(x => x.trim().toLowerCase());
            let hasOutroGeral = false;
            itensGeral.forEach(item => {
                let cb = Array.from(document.querySelectorAll('.servico-geral-cb')).find(el => el.value.toLowerCase() === item);
                if(cb) cb.checked = true; else hasOutroGeral = item;
            });
            if(hasOutroGeral) {
                document.getElementById('serv-geral-outro-cb').checked = true;
                document.getElementById('serv-geral-outro-txt').value = hasOutroGeral;
                document.getElementById('serv-geral-outro-txt').classList.remove('hidden');
                document.querySelectorAll('.servico-geral-cb:not(#serv-geral-outro-cb)').forEach(cb => cb.disabled = true);
            }
        }
        
        function preencherPromoReversa(idCard, textoStr) {
            document.getElementById(`valor-${idCard}`).value = '';
            document.getElementById(`imovel-${idCard}`).value = 'Apartamento';
            document.getElementById(`imovel-outro-txt-${idCard}`).classList.add('hidden');
            document.querySelectorAll(`.servico-cb-${idCard}`).forEach(cb => cb.checked = false);
            memoriaPragas[idCard] = []; memoriaPragasOutrosTxt[idCard] = "";
            document.getElementById(`serv-outro-txt-${idCard}`).classList.add('hidden');
            document.getElementById(`serv-outro-cb-${idCard}`).checked = false;
            
            if(!textoStr) { atualizarVisorPragas(idCard); return; }
            
            const regex = /Valor promocional do serviço de (.*?) por (.*?) para (.*?): R\$ ([\d,]+)/;
            const match = textoStr.match(regex);
            if(match) {
                let servs = match[1]; let imovel = match[2]; let prags = match[3]; let val = match[4].replace(',', '.');
                document.getElementById(`valor-${idCard}`).value = val;
                
                let imovCap = imovel.charAt(0).toUpperCase() + imovel.slice(1);
                let imovSel = document.getElementById(`imovel-${idCard}`);
                if(imovCap === 'Apartamento' || imovCap === 'Casa') { imovSel.value = imovCap; } 
                else { imovSel.value = 'Outro'; document.getElementById(`imovel-outro-txt-${idCard}`).classList.remove('hidden'); document.getElementById(`imovel-outro-txt-${idCard}`).value = imovel; }
                
                let sItens = servs.split(/ e |, /).map(x => x.trim().toLowerCase());
                let hOutroS = false;
                sItens.forEach(item => {
                    let cb = Array.from(document.querySelectorAll(`.servico-cb-${idCard}`)).find(el => el.value.toLowerCase() === item);
                    if(cb) cb.checked = true; else hOutroS = item;
                });
                if(hOutroS) { document.getElementById(`serv-outro-cb-${idCard}`).checked = true; document.getElementById(`serv-outro-txt-${idCard}`).value = hOutroS; document.getElementById(`serv-outro-txt-${idCard}`).classList.remove('hidden'); }
                
                let pItens = prags.split(/ e |, /).map(x => x.trim().toUpperCase());
                let hOutraP = false;
                const pConhecidas = ["BARATAS","FORMIGAS","CUPINS","ROEDORES","MOSCAS","MOSQUITOS","CARRAPATOS","PULGAS","ESCORPIÕES","CARAMUJOS"];
                pItens.forEach(p => {
                    if(pConhecidas.includes(p)) { memoriaPragas[idCard].push(p); } 
                    else { memoriaPragas[idCard].push("OUTROS"); memoriaPragasOutrosTxt[idCard] = p; hOutraP = true; }
                });
                if(hOutraP) { document.getElementById('praga-outros-txt').classList.remove('hidden'); }
            }
            atualizarVisorPragas(idCard);
        }
        
        preencherPromoReversa(1, dados.promo1Str);
        preencherPromoReversa(2, dados.promo2Str);
        preencherPromoReversa(3, dados.promo3Str);
        
        if(!isImportacao) mostrarView('view-formulario');
        ativarCard(1);
        if(isImportacao) showToast("Dados preenchidos. Informe a Data.", "success");
    } 
    else if (tipo === 'Limpeza de Reservatório') {
        document.getElementById('form-limpeza').style.display = 'block';
        if(!isImportacao) {
            idEmEdicao = id;
            document.getElementById('titulo-formulario').innerText = 'Editando Comunicado - Limpeza';
            document.getElementById('btn-salvar-limpeza').innerHTML = '<span class="material-icons" style="font-size: 18px;">save</span> Atualizar Comunicado';
        } else {
            idEmEdicao = null;
            document.getElementById('data-limp').value = '';
        }
        
        document.getElementById('cliente-limp').value = dados.cliente || '';
        if(!isImportacao) document.getElementById('data-limp').value = dados.data || '';
        document.getElementById('obs-limp').innerHTML = dados.observacao || '';
        
        let radioVend = document.querySelector(`input[name="vendedor-limp"][value="${dados.vendedor}"]`);
        if(radioVend) radioVend.checked = true;
        
        if(!isImportacao) mostrarView('view-formulario');
        if(isImportacao) showToast("Dados preenchidos. Informe a Data.", "success");
    } 
    else if (tipo === 'Termonebulização') {
        document.getElementById('form-termo').style.display = 'block';
        if(!isImportacao) {
            idEmEdicao = id;
            document.getElementById('titulo-formulario').innerText = 'Editando Comunicado - Fumacê';
            document.getElementById('btn-salvar-termo').innerHTML = '<span class="material-icons" style="font-size: 18px;">save</span> Atualizar Comunicado';
        } else {
            idEmEdicao = null;
            document.getElementById('data-termo').value = '';
        }
        
        document.getElementById('cliente-termo').value = dados.cliente || '';
        if(!isImportacao) document.getElementById('data-termo').value = dados.data || '';
        
        if (dados.previsao) {
            const prev = dados.previsao.split(' às ');
            document.getElementById('hora-inicio-termo').value = prev[0] ? prev[0].trim() : '';
            document.getElementById('hora-fim-termo').value = prev[1] ? prev[1].trim() : '';
        }
        let radioVend = document.querySelector(`input[name="vendedor-termo"][value="${dados.vendedor}"]`);
        if(radioVend) radioVend.checked = true;
        
        if(!isImportacao) mostrarView('view-formulario');
        if(isImportacao) showToast("Dados preenchidos. Informe a Data.", "success");
    }
}

async function editarRegistro(id, tipo) {
    document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active')); // Oculta visualmente para evitar flash
    await aplicarEngenhariaReversa(id, tipo, false);
}

// ==========================================
// FORMULÁRIOS, OBSERVAÇÕES E SALVAMENTO
// ==========================================
function inserirModeloLimpeza() {
    const editor = document.getElementById('obs-limp');
    const textoPadrao = `Informamos que, no período das <strong>XX horas às XX horas</strong>, serão realizadas a limpeza e higienização das cisternas, sem comprometimento no fornecimento de água.<br><br>Posteriormente, das <strong>XX horas às XX horas</strong>, será executada a limpeza das caixas d’água, ocasião em que haverá interrupção temporária no abastecimento de água do condomínio por algumas horas.`;
    if (editor.innerHTML.trim() !== '' && editor.innerHTML.trim() !== '<br>') { if(!confirm("Atenção: A caixa de texto já possui conteúdo. Deseja substituí-lo pelo modelo padrão?")) return; }
    editor.innerHTML = textoPadrao; editor.focus();
}

const servGeralOutroCb = document.getElementById('serv-geral-outro-cb');
const servGeralOutroTxt = document.getElementById('serv-geral-outro-txt');
const servGeralOutrasOpcoes = document.querySelectorAll('.servico-geral-cb:not(#serv-geral-outro-cb)');

servGeralOutroCb.addEventListener('change', function() {
    if (this.checked) {
        servGeralOutrasOpcoes.forEach(cb => { cb.checked = false; cb.disabled = true; });
        servGeralOutroTxt.classList.remove('hidden'); servGeralOutroTxt.focus();
    } else {
        servGeralOutrasOpcoes.forEach(cb => { cb.disabled = false; });
        servGeralOutroTxt.classList.add('hidden'); servGeralOutroTxt.value = '';
    }
});

[1, 2, 3].forEach(id => {
    document.getElementById(`imovel-${id}`).addEventListener('change', function() {
        const txtInput = document.getElementById(`imovel-outro-txt-${id}`);
        if (this.value === "Outro") { txtInput.classList.remove('hidden'); txtInput.focus(); } else { txtInput.classList.add('hidden'); txtInput.value = ''; }
    });
    document.getElementById(`serv-outro-cb-${id}`).addEventListener('change', function() {
        const txtInput = document.getElementById(`serv-outro-txt-${id}`);
        if (this.checked) { txtInput.classList.remove('hidden'); txtInput.focus(); } else { txtInput.classList.add('hidden'); txtInput.value = ''; }
    });
});

document.querySelectorAll('.servico-cb-1, .servico-cb-2, .servico-cb-3').forEach(cb => {
    cb.addEventListener('change', function() {
        let idCard = this.classList.contains('servico-cb-1') ? 1 : (this.classList.contains('servico-cb-2') ? 2 : 3);
        const servico = this.value; const isChecked = this.checked; let pragasAfetadas = [];
        if (servico === 'Desratização') pragasAfetadas = ['ROEDORES'];
        else if (servico === 'Descupinização') pragasAfetadas = ['CUPINS'];
        else if (servico === 'Desinsetização') pragasAfetadas = ['BARATAS', 'FORMIGAS'];

        pragasAfetadas.forEach(praga => {
            if (isChecked) { if (!memoriaPragas[idCard].includes(praga)) memoriaPragas[idCard].push(praga); } 
            else { const index = memoriaPragas[idCard].indexOf(praga); if (index > -1) memoriaPragas[idCard].splice(index, 1); }
        });

        if (idCard === cardAtivo) { document.querySelectorAll('.praga-cb').forEach(pragaCb => { pragaCb.checked = memoriaPragas[idCard].includes(pragaCb.value); }); }
        atualizarVisorPragas(idCard);
    });
});

function ativarCard(idCard) {
    cardAtivo = idCard; document.querySelectorAll('.promo-card').forEach(card => card.classList.remove('active')); document.getElementById('card-' + idCard).classList.add('active');
    document.querySelectorAll('.praga-cb').forEach(cb => { cb.checked = memoriaPragas[idCard].includes(cb.value); });
    const txtOutrosPragas = document.getElementById('praga-outros-txt');
    if (memoriaPragas[idCard].includes("OUTROS")) { txtOutrosPragas.classList.remove('hidden'); txtOutrosPragas.value = memoriaPragasOutrosTxt[idCard]; } else { txtOutrosPragas.classList.add('hidden'); txtOutrosPragas.value = ""; }
}

document.querySelectorAll('.praga-cb').forEach(cb => {
    cb.addEventListener('change', function() {
        const pragaNome = this.value;
        if (this.checked) {
            if (!memoriaPragas[cardAtivo].includes(pragaNome)) memoriaPragas[cardAtivo].push(pragaNome);
            if (pragaNome === "OUTROS") { document.getElementById('praga-outros-txt').classList.remove('hidden'); document.getElementById('praga-outros-txt').focus(); }
        } else {
            const index = memoriaPragas[cardAtivo].indexOf(pragaNome);
            if (index > -1) memoriaPragas[cardAtivo].splice(index, 1);
            if (pragaNome === "OUTROS") { document.getElementById('praga-outros-txt').classList.add('hidden'); document.getElementById('praga-outros-txt').value = ""; memoriaPragasOutrosTxt[cardAtivo] = ""; }
        }
        atualizarVisorPragas(cardAtivo);
    });
});

document.getElementById('praga-outros-txt').addEventListener('input', function() { memoriaPragasOutrosTxt[cardAtivo] = this.value; atualizarVisorPragas(cardAtivo); });

function atualizarVisorPragas(idCard) {
    const display = document.getElementById('display-pragas-' + idCard); let pragasParaMostrar = [...memoriaPragas[idCard]];
    const indexOutros = pragasParaMostrar.indexOf("OUTROS");
    if (indexOutros > -1 && memoriaPragasOutrosTxt[idCard].trim() !== "") { pragasParaMostrar[indexOutros] = memoriaPragasOutrosTxt[idCard]; }
    display.innerText = pragasParaMostrar.length > 0 ? pragasParaMostrar.join(', ') : "Nenhuma praga selecionada.";
}

function obterServicosGerais() { return Array.from(document.querySelectorAll('.servico-geral-cb:checked')).map(cb => { if (cb.value === "Outro") return document.getElementById('serv-geral-outro-txt').value.trim() || "Outro"; return cb.value; }).join(', '); }
function obterImovelDoCard(idCard) { const select = document.getElementById(`imovel-${idCard}`); if (select.value === "Outro") return document.getElementById(`imovel-outro-txt-${idCard}`).value.trim() || "Outro"; return select.value; }
function obterServicosDoCard(idCard) { return Array.from(document.querySelectorAll(`.servico-cb-${idCard}:checked`)).map(cb => { if (cb.value === "Outro") return document.getElementById(`serv-outro-txt-${idCard}`).value.trim() || "Outro"; return cb.value; }).join(', '); }
function obterPragasDoCard(idCard) { let pragas = [...memoriaPragas[idCard]]; const indexOutros = pragas.indexOf("OUTROS"); if (indexOutros > -1) pragas[indexOutros] = memoriaPragasOutrosTxt[idCard].trim() || "OUTROS"; return pragas.join(', '); }

document.getElementById('form-dedetizacao').addEventListener('submit', async (e) => {
    e.preventDefault(); const btnSalvar = document.getElementById('btn-salvar-dedetizacao'); btnSalvar.disabled = true; btnSalvar.innerHTML = "A processar...";
    const dados = {
        id: idEmEdicao, cliente: document.getElementById('cliente').value, data: document.getElementById('data').value, previsao: `${document.getElementById('hora-inicio').value} às ${document.getElementById('hora-fim').value}`,
        servico: obterServicosGerais(), vendedor: document.querySelector('input[name="vendedor"]:checked').value,
        promo1: { valor: document.getElementById('valor-1').value, imovel: obterImovelDoCard(1), servicos: obterServicosDoCard(1), pragas: obterPragasDoCard(1) },
        promo2: { valor: document.getElementById('valor-2').value, imovel: obterImovelDoCard(2), servicos: obterServicosDoCard(2), pragas: obterPragasDoCard(2) },
        promo3: { valor: document.getElementById('valor-3').value, imovel: obterImovelDoCard(3), servicos: obterServicosDoCard(3), pragas: obterPragasDoCard(3) }
    };
    const res = await fetchAPI('salvar_dedetizacao', dados, "A gerar PDF do Comunicado..."); 
    if (res.sucesso) { mostrarModal("Comunicado guardado com sucesso!", 'alerta', () => { fecharFormulario(); }); } else { mostrarModal("Erro: " + res.mensagem, 'alerta'); }
    btnSalvar.disabled = false; btnSalvar.innerHTML = '<span class="material-icons" style="font-size: 18px;">save</span> Salvar Comunicado';
});

document.getElementById('form-limpeza').addEventListener('submit', async (e) => {
    e.preventDefault(); const btnSalvar = document.getElementById('btn-salvar-limpeza'); btnSalvar.disabled = true; btnSalvar.innerHTML = "A processar...";
    const dados = { id: idEmEdicao, cliente: document.getElementById('cliente-limp').value, data: document.getElementById('data-limp').value, vendedor: document.querySelector('input[name="vendedor-limp"]:checked').value, observacao: document.getElementById('obs-limp').innerHTML };
    const res = await fetchAPI('salvar_limpeza', dados, "A gerar PDF do Comunicado..."); 
    if (res.sucesso) { mostrarModal("Comunicado guardado com sucesso!", 'alerta', () => { fecharFormulario(); }); } else { mostrarModal("Erro: " + res.mensagem, 'alerta'); }
    btnSalvar.disabled = false; btnSalvar.innerHTML = '<span class="material-icons" style="font-size: 18px;">save</span> Salvar Comunicado';
});

document.getElementById('form-termo').addEventListener('submit', async (e) => {
    e.preventDefault(); const btnSalvar = document.getElementById('btn-salvar-termo'); btnSalvar.disabled = true; btnSalvar.innerHTML = "A processar...";
    const dados = { id: idEmEdicao, cliente: document.getElementById('cliente-termo').value, data: document.getElementById('data-termo').value, previsao: `${document.getElementById('hora-inicio-termo').value} às ${document.getElementById('hora-fim-termo').value}`, vendedor: document.querySelector('input[name="vendedor-termo"]:checked').value };
    const res = await fetchAPI('salvar_termo', dados, "A gerar PDF do Comunicado..."); 
    if (res.sucesso) { mostrarModal("Comunicado guardado com sucesso!", 'alerta', () => { fecharFormulario(); }); } else { mostrarModal("Erro: " + res.mensagem, 'alerta'); }
    btnSalvar.disabled = false; btnSalvar.innerHTML = '<span class="material-icons" style="font-size: 18px;">save</span> Salvar Comunicado';
});
