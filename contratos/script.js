/* =======================================================
   ARQUIVO: script.js (CONTRATOS)
   Atualizado com separação de Dashboard (5 itens) e Histórico
   ======================================================= */

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxbse_e4yHrjEQgPDT1qNn-ig58Vm1c6t31RMhVu887-6kbvd7BD_2Oys3GV0sKnnMM/exec"; // <<<<<<<< COLOQUE SUA URL AQUI

let todosContratos = [];
let contratosFiltrados = [];
let paginaAtual = 1;
const itensPorPagina = 10;
let idContratoEditando = null;
let idContratoExcluindo = null;
let vistaAtual = 'dashboard'; // Controla onde o usuário está ('dashboard', 'historico' ou 'form')

// =========================================================================
// INICIALIZAÇÃO GERAL E LOADERS
// =========================================================================
document.addEventListener("DOMContentLoaded", function () {
    definirDataHoje();
    atualizarPreviewServicos();
    atualizarPreviewPagamento();
    // Ao iniciar, carrega apenas o Dashboard (os 5 últimos)
    carregarDashboard();
});

function showLoader(txt = "Aguarde...") {
    document.getElementById("loader-text").innerText = txt;
    document.getElementById("loader").style.display = "flex";
}
function hideLoader() {
    document.getElementById("loader").style.display = "none";
}

function mostrarAlertaForm(msg) {
    const a = document.getElementById('alertBox');
    a.innerHTML = `<span>⚠️ <b>Aviso:</b> ${msg}</span>`;
    a.style.display = 'flex';
    a.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// =========================================================================
// NAVEGAÇÃO ENTRE ABAS (SPA)
// =========================================================================
function abrirHistorico() {
    vistaAtual = 'historico';
    document.getElementById('dashboardView').classList.remove('active');
    document.getElementById('formView').classList.remove('active');
    document.getElementById('historicoView').classList.add('active');
    carregarHistorico();
}

function voltarParaPainel(recarregar = false) {
    idContratoEditando = null;
    document.getElementById('formView').classList.remove('active');

    // Volta para a aba que estava antes de abrir o formulário
    if (vistaAtual === 'historico') {
        document.getElementById('historicoView').classList.add('active');
        if (recarregar) carregarHistorico();
    } else {
        document.getElementById('dashboardView').classList.add('active');
        vistaAtual = 'dashboard'; // Garante que o estado seja dashboard
        if (recarregar) carregarDashboard();
    }

    resetaFormularioGeral();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fecharHistorico() {
    vistaAtual = 'dashboard';
    document.getElementById('historicoView').classList.remove('active');
    document.getElementById('dashboardView').classList.add('active');
    carregarDashboard();
}

// =========================================================================
// CARREGAR DADOS DO BACKEND
// =========================================================================

// Busca apenas os 5 últimos para a página inicial
function carregarDashboard() {
    showLoader("A carregar últimos contratos...");

    fetch(WEB_APP_URL, {
        method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: "buscar_dashboard" })
    })
        .then(r => r.json()).then(res => {
            if (res.status === 'success') {
                renderizarLinhasTabela(res.dados || [], 'tabelaDashboardBody');

                // Opcional: Atualiza métricas baseadas apenas nos 5 mais recentes, se desejar
                // (Para métricas globais, precisaremos de um endpoint separado no futuro)
                atualizarMetricas(res.dados || []);
            } else {
                document.getElementById('tabelaDashboardBody').innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#ef4444;">Erro: ${res.message}</td></tr>`;
            }
        })
        .catch(e => {
            document.getElementById('tabelaDashboardBody').innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#ef4444;">Erro de conexão ao buscar os dados.</td></tr>';
        })
        .finally(() => { hideLoader(); });
}

// Busca toda a base de dados para o histórico e filtros
function carregarHistorico() {
    showLoader("A carregar histórico completo...");

    fetch(WEB_APP_URL, {
        method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: "buscar_historico" })
    })
        .then(r => r.json()).then(res => {
            if (res.status === 'success') {
                todosContratos = res.dados || [];
                aplicarFiltros();
            } else {
                document.getElementById('tabelaHistoricoBody').innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#ef4444;">Erro: ${res.message}</td></tr>`;
            }
        })
        .catch(e => {
            document.getElementById('tabelaHistoricoBody').innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#ef4444;">Erro de conexão ao buscar os dados.</td></tr>';
        })
        .finally(() => { hideLoader(); });
}

// =========================================================================
// FILTROS E PAGINAÇÃO (Apenas no Histórico)
// =========================================================================
function aplicarFiltros() {
    const termo = document.getElementById('inputBusca') ? document.getElementById('inputBusca').value.toLowerCase() : "";
    const checkAtivo = document.getElementById('checkAtivo') ? document.getElementById('checkAtivo').checked : false;
    const checkAvencer = document.getElementById('checkAvencer') ? document.getElementById('checkAvencer').checked : false;
    const checkExpirado = document.getElementById('checkExpirado') ? document.getElementById('checkExpirado').checked : false;
    const dataIni = document.getElementById('filtroDataIni') ? document.getElementById('filtroDataIni').value : "";
    const dataFim = document.getElementById('filtroDataFim') ? document.getElementById('filtroDataFim').value : "";

    contratosFiltrados = todosContratos.filter(c => {
        if (termo && !(c.cliente + " " + c.endereco).toLowerCase().includes(termo)) return false;
        if (checkAtivo || checkAvencer || checkExpirado) {
            if (c.status === 'Ativo' && !checkAtivo) return false;
            if (c.status === 'A vencer' && !checkAvencer) return false;
            if (c.status === 'Expirado' && !checkExpirado) return false;
        }
        if (dataIni || dataFim) {
            const p = c.emissao.split('/');
            if (p.length === 3) {
                const iso = `${p[2]}-${p[1]}-${p[0]}`;
                if (dataIni && iso < dataIni) return false;
                if (dataFim && iso > dataFim) return false;
            }
        }
        return true;
    });

    atualizarMetricas(contratosFiltrados);
    paginaAtual = 1;
    renderizarPaginacaoHistorico();
}

function atualizarMetricas(arrayDados) {
    if (document.getElementById('cardTotal')) {
        document.getElementById('cardTotal').textContent = arrayDados.length;
        document.getElementById('cardAtivos').textContent = arrayDados.filter(c => c.status === 'Ativo').length;
        document.getElementById('cardAVencer').textContent = arrayDados.filter(c => c.status === 'A vencer').length;
        document.getElementById('cardExpirados').textContent = arrayDados.filter(c => c.status === 'Expirado').length;
    }
}

function renderizarPaginacaoHistorico() {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const itensPagina = contratosFiltrados.slice(inicio, fim);

    renderizarLinhasTabela(itensPagina, 'tabelaHistoricoBody');
    atualizarControlesPaginacao();
}

function atualizarControlesPaginacao() {
    const totalPaginas = Math.ceil(contratosFiltrados.length / itensPorPagina) || 1;
    if (document.getElementById('info-page')) {
        document.getElementById('info-page').innerText = `Página ${paginaAtual} de ${totalPaginas}`;
        document.getElementById('btn-prev-page').disabled = paginaAtual === 1;
        document.getElementById('btn-next-page').disabled = paginaAtual === totalPaginas;
    }
}

function mudarPagina(direcao) {
    const totalPaginas = Math.ceil(contratosFiltrados.length / itensPorPagina) || 1;
    if (direcao === 'prev' && paginaAtual > 1) paginaAtual--;
    else if (direcao === 'next' && paginaAtual < totalPaginas) paginaAtual++;
    renderizarPaginacaoHistorico();
}

function limparFiltrosData() {
    if (document.getElementById('filtroDataIni')) document.getElementById('filtroDataIni').value = "";
    if (document.getElementById('filtroDataFim')) document.getElementById('filtroDataFim').value = "";
    aplicarFiltros();
}

// Listeners de filtro
document.addEventListener("DOMContentLoaded", function () {
    const b = document.getElementById('inputBusca'); if (b) b.addEventListener('input', aplicarFiltros);
    const di = document.getElementById('filtroDataIni'); if (di) di.addEventListener('change', aplicarFiltros);
    const df = document.getElementById('filtroDataFim'); if (df) df.addEventListener('change', aplicarFiltros);
    document.querySelectorAll('.filtro-status').forEach(cb => cb.addEventListener('change', aplicarFiltros));
});

// =========================================================================
// RENDERIZAÇÃO GENÉRICA DE TABELAS
// =========================================================================
function renderizarLinhasTabela(dados, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = '';

    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#6b7280; font-style:italic;">Nenhum contrato encontrado.</td></tr>';
        return;
    }

    dados.forEach(c => {
        let bColor = c.status === 'Ativo' ? '#10b981' : (c.status === 'A vencer' ? '#f59e0b' : '#ef4444');
        let bBg = c.status === 'Ativo' ? '#d1fae5' : (c.status === 'A vencer' ? '#fef3c7' : '#fee2e2');
        let linkDown = c.link ? c.link.replace(/\/file\/d\/(.*?)\/view.*/, '/uc?export=download&id=$1') : "#";

        let acoesHtml = `
            <div class="actions">
                <button type="button" class="icon-btn" onclick="window.open('${c.link || '#'}', '_blank')" title="Abrir" ${!c.link ? 'disabled' : ''}><span class="material-icons">visibility</span></button>
                <button type="button" class="icon-btn icon-share" onclick="window.open('${linkDown}', '_blank')" title="Baixar PDF" ${!c.link ? 'disabled' : ''}><span class="material-icons">download</span></button>
                <button type="button" class="icon-btn icon-edit" onclick="editarContrato('${c.id}')" title="Editar"><span class="material-icons">edit</span></button>
                <button type="button" class="icon-btn icon-del" onclick="abrirModalExcluir('${c.id}')" title="Excluir"><span class="material-icons">delete</span></button>
            </div>
        `;

        tbody.innerHTML += `
            <tr>
                <td style="white-space:nowrap;">${c.emissao}</td>
                <td style="font-weight:bold; color:#111827; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${c.cliente}">${c.cliente}</td>
                <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${c.endereco}">${c.endereco}</td>
                <td style="white-space:nowrap;">${c.vencimento}</td>
                <td style="text-align:center;"><span style="background-color:${bBg}; color:${bColor}; padding:6px 12px; border-radius:20px; font-size:12px; font-weight:bold;">${c.status}</span></td>
                <td>${acoesHtml}</td>
            </tr>`;
    });
}

// =========================================================================
// AÇÕES: EDITAR E EXCLUIR
// =========================================================================
function editarContrato(id) {
    showLoader("A buscar dados do contrato...");
    fetch(WEB_APP_URL, {
        method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: "buscar_contrato_completo", id: id })
    })
        .then(r => r.json()).then(res => {
            if (res.status === 'success') { preencherFormParaEdicao(res.dados); }
            else { alert("Erro: " + res.message); }
        }).catch(e => { alert("Erro de conexão ao buscar detalhes."); })
        .finally(() => { hideLoader(); });
}

function preencherFormParaEdicao(dados) {
    idContratoEditando = dados.id;
    document.getElementById('formTitle').textContent = "Editar Contrato";
    resetaFormularioGeral();

    // Cria os alertas de edição caso existam no HTML
    const alerta = document.getElementById('alertaEdicao');
    if (alerta) alerta.style.display = 'flex';
    const idSpan = document.getElementById('spanIdEdicao');
    if (idSpan) idSpan.innerText = dados.id;

    document.getElementById('empresa').value = dados.empresa || "";
    document.getElementById('nomeFantasia').value = dados.nomeFantasia || "";
    document.getElementById('cnpj').value = dados.cnpj || "";
    document.getElementById('endereco').value = dados.endereco || "";
    document.getElementById('dataContrato').value = dados.dataContrato || "";
    document.getElementById('qtdVisitas').value = dados.qtdVisitas || 1;
    document.getElementById('periodoVisitas').value = dados.periodoVisitas || "";

    document.getElementById('comodato').checked = dados.comodato;
    document.getElementById('qtdArandelas').disabled = !dados.comodato;
    document.getElementById('qtdArandelas').value = dados.qtdArandelas || "";

    if (dados.servicos) { document.querySelectorAll('.servico-check').forEach(cb => { cb.checked = dados.servicos.includes(cb.value); }); }

    document.getElementById('modoManualServicos').checked = true;
    document.getElementById('caixaPreviewServicos').style.display = 'none';
    document.getElementById('blocoServicosManual').style.display = 'block';
    document.getElementById('textoServicosManual').required = true;
    document.getElementById('textoServicosManual').value = dados.textoServicosFinal || "";

    document.getElementById('modoManualPagamento').checked = true;
    document.getElementById('blocoPagamentoAuto').style.display = 'none';
    document.getElementById('blocoPagamentoManual').style.display = 'block';
    document.getElementById('caixaPreviewPagamento').style.display = 'none';
    document.getElementById('textoPagamentoManual').required = true;
    document.getElementById('textoPagamentoManual').value = dados.textoPagamentoFinal || "";
    document.querySelectorAll('.auto-req').forEach(el => el.required = false);

    document.getElementById('dashboardView').classList.remove('active');
    if (document.getElementById('historicoView')) document.getElementById('historicoView').classList.remove('active');
    document.getElementById('formView').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Lógica de Exclusão (Modal)
function abrirModalExcluir(id) {
    idContratoExcluindo = id;
    document.getElementById('modalExcluir').style.display = 'flex';
}

function fecharModalExcluir() {
    idContratoExcluindo = null;
    document.getElementById('modalExcluir').style.display = 'none';
}

document.getElementById('btnConfirmarExclusao').addEventListener('click', function () {
    fecharModalExcluir();
    if (!idContratoExcluindo) return;

    showLoader("A excluir contrato e ficheiros...");
    fetch(WEB_APP_URL, {
        method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: "excluir_contrato", id: idContratoExcluindo })
    })
        .then(r => r.json()).then(res => {
            if (vistaAtual === 'historico') carregarHistorico();
            else carregarDashboard();
        })
        .catch(e => {
            alert("Erro de conexão ao excluir.");
            if (vistaAtual === 'historico') carregarHistorico();
            else carregarDashboard();
        })
        .finally(() => { hideLoader(); });
});

// =========================================================================
// NAVEGAÇÃO SEGURA E FORMULÁRIO
// =========================================================================
function resetaFormularioGeral() {
    document.getElementById('contractForm').reset();
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('formWrapper').style.display = 'block';
    document.getElementById('alertBox').style.display = 'none';
    if (document.getElementById('alertaEdicao')) document.getElementById('alertaEdicao').style.display = 'none';

    document.getElementById('modoManualServicos').checked = false;
    document.getElementById('caixaPreviewServicos').style.display = 'block';
    document.getElementById('blocoServicosManual').style.display = 'none';
    document.getElementById('textoServicosManual').required = false;

    document.getElementById('modoManualPagamento').checked = false;
    document.getElementById('blocoPagamentoAuto').style.display = 'block';
    document.getElementById('blocoPagamentoManual').style.display = 'none';
    document.getElementById('caixaPreviewPagamento').style.display = 'block';
    document.getElementById('textoPagamentoManual').required = false;
    document.querySelectorAll('.auto-req').forEach(el => el.required = true);

    document.getElementById('blocoLimpezaSeparada').style.display = 'none';
    document.getElementById('valorLimpeza').required = false;
    document.getElementById('pagamentoLimpeza').required = false;

    document.getElementById('qtdArandelas').disabled = true;
    document.getElementById('pragasOutrosTexto').disabled = true;
    document.getElementById('spanVisitaTexto').textContent = 'visita';
}

function abrirNovoContrato() {
    idContratoEditando = null;
    document.getElementById('formTitle').textContent = "Novo Contrato";
    resetaFormularioGeral();
    definirDataHoje();
    atualizarPreviewServicos();
    atualizarPreviewPagamento();

    document.getElementById('dashboardView').classList.remove('active');
    if (document.getElementById('historicoView')) document.getElementById('historicoView').classList.remove('active');
    document.getElementById('formView').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
    voltarParaPainel(false);
}

// =========================================================================
// FUNÇÕES AUXILIARES (Máscaras, Previews, Extenso)
// =========================================================================
document.getElementById('cnpj').addEventListener('input', function (e) {
    let v = e.target.value.replace(/\D/g, ''); if (v.length > 14) v = v.slice(0, 14);
    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, '$1.$2'); if (v.length > 5) v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    if (v.length > 8) v = v.replace(/\.(\d{3})(\d)/, '.$1/$2'); if (v.length > 12) v = v.replace(/(\d{4})(\d)/, '$1-$2');
    e.target.value = v;
});

document.getElementById('qtdVisitas').addEventListener('input', function () { document.getElementById('spanVisitaTexto').textContent = (parseInt(this.value) || 1) > 1 ? 'visitas' : 'visita'; });

function formatarLista(a) { if (a.length === 0) return ""; if (a.length === 1) return a[0]; return a.slice(0, -1).join(", ") + " e " + a[a.length - 1]; }
function definirArtigoImovelJS(im) {
    if (!im) return "[do local]"; let l = im.trim().toLowerCase(); const f = ['lanchonete', 'creche', 'escola', 'oficina', 'mansão', 'instituição'], m = ['cinema', 'sistema', 'programa'];
    for (let x of f) if (l.includes(x)) return "da " + im.trim(); for (let x of m) if (l.includes(x)) return "do " + im.trim();
    return (l.slice(-1) === 'a' || l.slice(-1) === 'ã') ? "da " + im.trim() : "do " + im.trim();
}

function getTextoAutoServicos() {
    const s = Array.from(document.querySelectorAll('.servico-check:checked')).map(cb => cb.value);
    let tS = "[do(s) serviço(s) de]", nS = "[nome dos serviços]", tR = "[a ser(em) realizado(s)]", tL = "";
    if (s.length > 0) {
        nS = formatarLista(s).toLowerCase(); tS = s.length === 1 ? "do serviço de" : "dos serviços de"; tR = s.length === 1 ? "a ser realizado" : "a serem realizados";
        if (s.includes('Limpeza dos reservatórios de água')) tL = " Fica igualmente pactuada a realização dos serviços de limpeza e higienização dos reservatórios de água, com periodicidade semestral (a cada 06 meses) mediante disponibilidade da CONTRATADA e solicitação formal da CONTRATANTE.";
    }
    const iI = document.getElementById('areaInterna').checked, iE = document.getElementById('areaExterna').checked, aD = document.getElementById('areaDefinidaDetalhe').value.trim();
    let aF = "[área definida]", aB = iI && iE ? "área interna e externa" : (iI ? "área interna" : (iE ? "área externa" : ""));
    if (aB && aD !== '') aF = `${aB} (${aD})`; else if (aB) aF = aB; else if (aD !== '') aF = aD;
    let p = Array.from(document.querySelectorAll('.praga-check:checked')).map(cb => cb.value);
    if (document.getElementById('pragaOutros').checked && document.getElementById('pragasOutrosTexto').value.trim()) p.push(document.getElementById('pragasOutrosTexto').value.trim().toLowerCase());
    return `Constitui objeto do presente contrato a prestação, pela CONTRATADA, ${tS} ${nS}, ${tR} na ${aF} ${definirArtigoImovelJS(document.getElementById('imovelArtigo').value)}, onde serão combatidas, tão somente, as seguintes pragas: ${p.length > 0 ? formatarLista(p) : "[pragas selecionadas]"}.${tL} Fica excluído o controle de quaisquer outras pragas ou parasitas não especificados neste documento, podendo as partes, de comum acordo, alterar o escopo para aperfeiçoamento das atividades e adequação às necessidades.`;
}

function atualizarPreviewServicos() { document.getElementById('previewServicosTexto').textContent = getTextoAutoServicos(); }

document.getElementById('modoManualServicos').addEventListener('change', function () {
    if (this.checked) {
        document.getElementById('caixaPreviewServicos').style.display = 'none';
        document.getElementById('blocoServicosManual').style.display = 'block';
        document.getElementById('textoServicosManual').required = true;
        document.getElementById('textoServicosManual').value = getTextoAutoServicos();
    } else {
        document.getElementById('caixaPreviewServicos').style.display = 'block';
        document.getElementById('blocoServicosManual').style.display = 'none';
        document.getElementById('textoServicosManual').required = false;
    }
});
document.querySelectorAll('.preview-servico-trigger').forEach(c => { c.addEventListener('input', atualizarPreviewServicos); c.addEventListener('change', atualizarPreviewServicos); });
document.getElementById('pragaOutros').addEventListener('change', function () { document.getElementById('pragasOutrosTexto').disabled = !this.checked; if (!this.checked) document.getElementById('pragasOutrosTexto').value = ''; atualizarPreviewServicos(); });

function numP(v) {
    if (!v || isNaN(v)) return "(valor inválido)"; const un = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"], dz = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"], es = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"], ct = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
    function cG(n) { let r = [], c = Math.floor(n / 100), d = Math.floor((n % 100) / 10), u = n % 10; if (c === 1 && d === 0 && u === 0) return "cem"; if (c > 0) r.push(ct[c]); if (d === 1) r.push(es[u]); else { if (d > 1) r.push(dz[d]); if (u > 0) r.push(un[u]); } return r.join(" e "); }
    let r = Math.floor(v), c = Math.round((v - r) * 100), ex = [];
    if (r === 0) ex.push("zero reais"); else { let mi = Math.floor(r / 1000000), ml = Math.floor((r % 1000000) / 1000), re = r % 1000, p = []; if (mi > 0) p.push(cG(mi) + (mi === 1 ? " milhão" : " milhões")); if (ml > 0) p.push(ml === 1 ? "um mil" : cG(ml) + " mil"); if (re > 0) { let tr = cG(re); if ((mi > 0 || ml > 0) && (re < 100 || re % 100 === 0)) p.push("e " + tr); else p.push(tr); } let tx = p.join(" "); tx += r === 1 ? " real" : " reais"; ex.push(tx); }
    if (c > 0) { let tc = cG(c); tc += (c === 1 ? " centavo" : " centavos"); if (r > 0) ex.push("e " + tc); else ex = [tc]; } return ex.join(" ");
}

function getTextoAutoPagamento() {
    const vI = document.getElementById('valorTotal').value, isA = document.getElementById('pagamentoAto').checked, cD = document.getElementById('previsaoPagamento').value.trim() || "[Previsão de pagamento]", mD = document.getElementById('primeiroPagamento').value.trim() || "[Método de pagamento]";
    let vF = "[Valor]", vP = "(valor por extenso)"; if (vI) { const vN = parseFloat(vI); vF = vN.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); vP = numP(vN); }
    let tF = `A CONTRATANTE pagará à CONTRATADA, pela execução dos serviços prestados objeto deste contrato, o valor de ${vF} (${vP}). O pagamento será efetuado ${cD}. Caso o vencimento ocorra em finais de semana ou feriados, a data de pagamento ficará para o próximo dia útil. ` + (isA ? `O primeiro pagamento será efetuado no ato da assinatura deste contrato, via ${mD}.` : `O primeiro pagamento será efetuado via ${mD}.`);
    if (document.getElementById('habilitarLimpezaSeparada').checked) { let vl = document.getElementById('valorLimpeza').value ? parseFloat(document.getElementById('valorLimpeza').value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "[Valor da Limpeza]"; tF += ` Adicionalmente, a Limpeza dos Reservatórios de Água será cobrada à parte sob demanda, no valor de ${vl} por execução, com pagamento efetuado: ${document.getElementById('pagamentoLimpeza').value || "[Condição da limpeza]"}.`; }
    return tF;
}

function atualizarPreviewPagamento() { document.getElementById('previewPagamentoTexto').textContent = getTextoAutoPagamento(); }

document.getElementById('modoManualPagamento').addEventListener('change', function () {
    if (this.checked) {
        document.getElementById('blocoPagamentoAuto').style.display = 'none';
        document.getElementById('blocoPagamentoManual').style.display = 'block';
        document.getElementById('caixaPreviewPagamento').style.display = 'none';
        document.getElementById('textoPagamentoManual').required = true;
        document.getElementById('textoPagamentoManual').value = getTextoAutoPagamento();
        document.querySelectorAll('.auto-req').forEach(el => el.required = false);
    } else {
        document.getElementById('blocoPagamentoAuto').style.display = 'block';
        document.getElementById('blocoPagamentoManual').style.display = 'none';
        document.getElementById('caixaPreviewPagamento').style.display = 'block';
        document.getElementById('textoPagamentoManual').required = false;
        document.querySelectorAll('.auto-req').forEach(el => el.required = true);
    }
});

document.getElementById('habilitarLimpezaSeparada').addEventListener('change', function () {
    if (this.checked) {
        document.getElementById('blocoLimpezaSeparada').style.display = 'block';
        document.getElementById('valorLimpeza').required = true;
        document.getElementById('pagamentoLimpeza').required = true;
    } else {
        document.getElementById('blocoLimpezaSeparada').style.display = 'none';
        document.getElementById('valorLimpeza').required = false;
        document.getElementById('pagamentoLimpeza').required = false;
        document.getElementById('valorLimpeza').value = '';
        document.getElementById('pagamentoLimpeza').value = '';
    }
    atualizarPreviewPagamento();
});
document.querySelectorAll('.preview-trigger').forEach(c => { c.addEventListener('input', atualizarPreviewPagamento); c.addEventListener('change', atualizarPreviewPagamento); });

function definirDataHoje() { const d = new Date(); document.getElementById('dataContrato').value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

// =========================================================================
// SUBMIT DO FORMULÁRIO (NOVO OU EDIÇÃO)
// =========================================================================
document.getElementById('comodato').addEventListener('change', function () { document.getElementById('qtdArandelas').disabled = !this.checked; if (!this.checked) document.getElementById('qtdArandelas').value = ''; });

document.getElementById('contractForm').addEventListener('submit', function (e) {
    e.preventDefault();
    document.getElementById('alertBox').style.display = 'none';
    if (!WEB_APP_URL || WEB_APP_URL === "COLE_A_SUA_URL_DO_WEB_APP_AQUI") return mostrarAlertaForm("Faltou colocar a WEB_APP_URL no script.");

    const sv = Array.from(document.querySelectorAll('.servico-check:checked')).map(cb => cb.value);

    showLoader("A gerar e guardar PDF...");

    const payload = {
        action: "gerar_contrato",
        idContratoEdicao: idContratoEditando,
        empresa: document.getElementById('empresa').value,
        nomeFantasia: document.getElementById('nomeFantasia').value,
        cnpj: document.getElementById('cnpj').value,
        endereco: document.getElementById('endereco').value,
        imovelArtigo: document.getElementById('imovelArtigo').value,
        areaDefinida: "",
        servicos: sv,
        comodato: document.getElementById('comodato').checked,
        qtdArandelas: document.getElementById('comodato').checked ? Number(document.getElementById('qtdArandelas').value) : 0,
        qtdVisitas: Number(document.getElementById('qtdVisitas').value),
        periodoVisitas: document.getElementById('periodoVisitas').value,
        textoServicosFinal: document.getElementById('modoManualServicos').checked ? document.getElementById('textoServicosManual').value : getTextoAutoServicos(),
        textoPagamentoFinal: document.getElementById('modoManualPagamento').checked ? document.getElementById('textoPagamentoManual').value : getTextoAutoPagamento(),
        dataContrato: document.getElementById('dataContrato').value
    };

    fetch(WEB_APP_URL, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
        .then(r => r.json()).then(data => {
            if (data.status === 'success') {
                document.getElementById('formWrapper').style.display = 'none';
                document.getElementById('successMessage').style.display = 'block';
                document.getElementById('btnAbrirContrato').href = data.docUrl;
            }
            else { mostrarAlertaForm(data.message); }
        }).catch(() => mostrarAlertaForm("Erro de conexão com o sistema.")).finally(() => { hideLoader(); });
});