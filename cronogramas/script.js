/* =======================================================
   ARQUIVO: script.js (CRONOGRAMAS)
   Totalmente Padronizado (Material Icons e UI Unificada)
   ======================================================= */

// ==========================================
// COLE A URL DO SEU WEB APP ABAIXO
// ==========================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwBVvkfChPlsbVuHTFus47F4z-0dQCRZ4GSKWMirkiF4Ds4fM1oowZuhbVNavo3WlwBVQ/exec"; // <<<<<<<< COLOQUE SUA URL AQUI

let modoEdicaoFormulario = false;
let linhaEdicaoAtual = null;
let registroParaExcluir = null; 
let dadosCompletos = []; 
let dadosFiltrados = []; 
let paginaAtual = 1; 
const itensPorPagina = 10; 

let datasPrincipal = []; 
let datasDesratizacao = []; 
let modoAtual = 'principal'; 
const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];

// =========================================================================
// INICIALIZAÇÃO, LOADERS E TOASTS
// =========================================================================
document.addEventListener('DOMContentLoaded', () => { 
    carregarHistorico(); 
    verificarServico();
});

document.getElementById('mesAnoInicio').addEventListener('change', () => gerarCalendarios(true));

function showLoader(txt = "Aguarde...") { 
    document.getElementById("loader-text").innerHTML = txt; 
    document.getElementById("loader").style.display = "flex"; 
}
function hideLoader() { 
    document.getElementById("loader").style.display = "none"; 
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.style.minWidth = "250px";
    toast.style.padding = "16px";
    toast.style.borderRadius = "8px";
    toast.style.color = "white";
    toast.style.fontWeight = "600";
    toast.style.fontSize = "14px";
    toast.style.textAlign = "center";
    toast.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
    toast.style.opacity = "0";
    toast.style.transition = "all 0.5s ease-in-out";
    toast.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
    toast.innerHTML = `<span>${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => toast.style.opacity = "1", 10);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// =========================================================================
// NAVEGAÇÃO DE ECRÃS
// =========================================================================
function mostrarFormulario() {
    document.getElementById('area-painel').classList.remove('active');
    document.getElementById('area-formulario').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function mostrarPainel() {
    document.getElementById('area-formulario').classList.remove('active');
    document.getElementById('area-painel').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetarFormularioEVoltar() {
    travarInterface(false); 
    modoEdicaoFormulario = false; 
    linhaEdicaoAtual = null;
    
    document.getElementById('titulo-formulario').innerText = "NOVO CRONOGRAMA";
    document.getElementById('btn-salvar').innerText = "GERAR CRONOGRAMA EM PDF";
    document.getElementById('cliente').value = ''; 
    document.getElementById('endereco').value = '';
    document.getElementById('horarioEntrada').value = ''; 
    document.getElementById('horarioSaida').value = ''; 
    document.getElementById('mesAnoInicio').value = '';
    
    datasPrincipal = []; 
    datasDesratizacao = [];
    
    document.getElementById('calendario-container').innerHTML = ''; 
    document.getElementById('info-selecao').style.display = 'none'; 
    document.getElementById('btn-salvar').style.display = 'none';
    
    atualizarContadores(); 
    document.getElementById('check-desratizacao').checked = false; 
    verificarDesratizacao();
    
    document.getElementById('success-content').style.display = 'none';
    document.getElementById('formWrapper').style.display = 'block';
    
    mostrarPainel(); 
    carregarHistorico();
}

// =========================================================================
// LÓGICA DO FORMULÁRIO E CALENDÁRIO
// =========================================================================
function verificarServico() {
    const servico = document.getElementById('servico').value.toUpperCase();
    const blocoDesrat = document.getElementById('bloco-desratizacao');
    
    document.getElementById('lbl-entrada-principal').innerText = `Horário entrada (${servico}) *`;
    document.getElementById('lbl-saida-principal').innerText = `Horário saída (${servico}) *`;
    document.getElementById('lbl-visitas-principal').innerText = `Nº Visitas (${servico})`;
    document.getElementById('lbl-datas-principal').innerText = `DATAS DE ${servico} SELECIONADAS:`;
    document.getElementById('btn-principal').innerText = `📍 Marcando: ${servico}`;
    document.getElementById('legenda-texto-principal').innerText = servico;
    
    if (servico === 'DESINSETIZAÇÃO') { 
        blocoDesrat.style.display = 'block'; 
    } else { 
        blocoDesrat.style.display = 'none'; 
        document.getElementById('check-desratizacao').checked = false; 
        verificarDesratizacao(); 
    }
}

function verificarDesratizacao() {
    const checado = document.getElementById('check-desratizacao').checked;
    document.getElementById('campos-desratizacao').style.display = checado ? 'block' : 'none';
    document.getElementById('toggle-calendario').style.display = checado ? 'flex' : 'none';
    document.getElementById('info-desrat').style.display = checado ? 'block' : 'none';
    document.getElementById('legenda-container').style.display = checado ? 'flex' : 'none';
    
    if (!checado) { 
        setModoCalendario('principal'); 
        datasDesratizacao = []; 
        atualizarVisualCalendario(); 
        atualizarContadores(); 
    }
}

function setModoCalendario(modo) {
    modoAtual = modo;
    const btnPrin = document.getElementById('btn-principal'); 
    const btnDesr = document.getElementById('btn-desratizacao');
    
    if (modo === 'principal') { 
        btnPrin.className = 'btn-action btn-novo'; 
        btnDesr.className = 'btn-action btn-historico'; 
    } else { 
        btnPrin.className = 'btn-action btn-historico'; 
        btnDesr.className = 'btn-action btn-novo'; 
        btnDesr.style.backgroundColor = '#2563eb'; 
        btnDesr.style.color = 'white'; 
        btnPrin.style.backgroundColor = ''; 
    }
}

function atualizarContadores() {
    document.getElementById('visitas').value = datasPrincipal.length || '';
    document.getElementById('visitas-desrat').value = datasDesratizacao.length || '';
    document.getElementById('cont-principal').innerText = datasPrincipal.length;
    document.getElementById('cont-desrat').innerText = datasDesratizacao.length;
}

function gerarCalendarios(limparDatas = true) {
    const mesAno = document.getElementById('mesAnoInicio').value;
    if(!mesAno) { showToast("Selecione o Mês/Ano de Início primeiro.", "error"); return; }
    
    document.getElementById('info-selecao').style.display = 'block';
    document.getElementById('btn-salvar').style.display = 'block';
    
    if(limparDatas) { datasPrincipal = []; datasDesratizacao = []; }
    atualizarContadores();
    
    const container = document.getElementById('calendario-container');
    container.innerHTML = ''; 
    
    const [anoStr, mesStr] = mesAno.split('-');
    const anoBase = parseInt(anoStr); 
    const mesBase = parseInt(mesStr) - 1; 
    
    for (let i = 0; i < 12; i++) {
        let dataAtual = new Date(anoBase, mesBase + i, 1);
        container.appendChild(criarCaixaMes(dataAtual));
    }
    atualizarVisualCalendario();
}

function criarCaixaMes(dataBase) {
    const ano = dataBase.getFullYear(); 
    const mes = dataBase.getMonth();
    
    const divMes = document.createElement('div'); 
    divMes.className = 'mes-box';
    
    const titulo = document.createElement('div'); 
    titulo.className = 'mes-titulo'; 
    titulo.innerText = `${nomesMeses[mes]} ${ano}`; 
    divMes.appendChild(titulo);
    
    const grid = document.createElement('div'); 
    grid.className = 'dias-grid';
    
    diasSemana.forEach(d => { 
        const diaH = document.createElement('div'); 
        diaH.className = 'dia-semana'; 
        diaH.innerText = d; 
        grid.appendChild(diaH); 
    });
    
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); 
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    
    for (let i = 0; i < primeiroDiaSemana; i++) { 
        const vazio = document.createElement('div'); 
        vazio.className = 'dia vazio'; 
        grid.appendChild(vazio); 
    }
    
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const divDia = document.createElement('div'); 
        divDia.className = 'dia';
        const dataFormatada = `${String(dia).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}/${ano}`;
        
        divDia.id = `dia-${dia}-${mes + 1}-${ano}`; 
        divDia.innerText = dia;
        divDia.onclick = () => alternarSelecao(divDia, dataFormatada); 
        grid.appendChild(divDia);
    }
    divMes.appendChild(grid); 
    return divMes;
}

function alternarSelecao(elemento, dataStr) {
    let arrayAlvo = modoAtual === 'principal' ? datasPrincipal : datasDesratizacao;
    const index = arrayAlvo.indexOf(dataStr);
    
    if (index > -1) { 
        arrayAlvo.splice(index, 1); 
    } else { 
        arrayAlvo.push(dataStr); 
    }
    
    arrayAlvo.sort((a, b) => {
        const [diaA, mesA, anoA] = a.split('/'); 
        const [diaB, mesB, anoB] = b.split('/');
        return new Date(anoA, mesA - 1, diaA) - new Date(anoB, mesB - 1, diaB);
    });
    
    atualizarContadores(); 
    atualizarVisualCalendario();
}

function atualizarVisualCalendario() {
    const todosDias = document.querySelectorAll('.dia:not(.vazio)');
    todosDias.forEach(dia => {
        dia.className = 'dia'; 
        const dataStr = formatarDataDoId(dia.id);
        const isPrincipal = datasPrincipal.includes(dataStr); 
        const isDesrat = datasDesratizacao.includes(dataStr);
        
        if (isPrincipal && isDesrat) { dia.classList.add('selecionado-ambos'); } 
        else if (isPrincipal) { dia.classList.add('selecionado-principal'); } 
        else if (isDesrat) { dia.classList.add('selecionado-desratizacao'); }
    });
}

function formatarDataDoId(idStr) { 
    const partes = idStr.split('-'); 
    return `${String(partes[1]).padStart(2, '0')}/${String(partes[2]).padStart(2, '0')}/${partes[3]}`; 
}

function travarInterface(travar) {
    const elementos = document.querySelectorAll('#area-formulario input, #area-formulario select, #area-formulario button');
    elementos.forEach(el => el.disabled = travar);
}

// =========================================================================
// ENVIO E GERAÇÃO DE PDF (HTML2CANVAS)
// =========================================================================
function enviarDados() {
    const cliente = document.getElementById('cliente').value; 
    const endereco = document.getElementById('endereco').value; 
    const servico = document.getElementById('servico').value;
    const visitas = parseInt(document.getElementById('visitas').value) || 0; 
    const entrada = document.getElementById('horarioEntrada').value; 
    const saida = document.getElementById('horarioSaida').value;
    const mesAnoInicio = document.getElementById('mesAnoInicio').value; 
    const desratizacaoAtiva = document.getElementById('check-desratizacao').checked;
    
    if (!cliente || !endereco || !entrada || !saida || datasPrincipal.length === 0) { 
        showToast("Preencha os campos obrigatórios e marque ao menos uma data.", "error"); 
        return; 
    }

    let visitasDesrat = 0, entradaDesrat = "", saidaDesrat = "";
    if (desratizacaoAtiva) {
        visitasDesrat = parseInt(document.getElementById('visitas-desrat').value) || 0; 
        entradaDesrat = document.getElementById('horarioEntradaDesrat').value; 
        saidaDesrat = document.getElementById('horarioSaidaDesrat').value;
        if (!entradaDesrat || !saidaDesrat || datasDesratizacao.length === 0) { 
            showToast("Preencha os horários e marque as datas de desratização.", "error"); 
            return; 
        }
    }

    travarInterface(true);
    showLoader(modoEdicaoFormulario ? "A atualizar cronograma e gerar novo PDF..." : "A capturar calendário e gerar PDF...");

    const areaCaptura = document.getElementById('area-print'); 
    const larguraOriginal = areaCaptura.style.width; 
    
    // Força a largura para 900px para garantir um PDF sempre perfeito
    areaCaptura.style.width = '900px';

    html2canvas(areaCaptura, { backgroundColor: "#ffffff", scale: 2 }).then(canvas => {
        areaCaptura.style.width = larguraOriginal; 
        const imagemBase64 = canvas.toDataURL('image/png');

        const dados = {
            acao: modoEdicaoFormulario ? "editar" : "salvar",
            linhaPlanilha: linhaEdicaoAtual, cliente: cliente, endereco: endereco, servico: servico, mesAnoInicio: mesAnoInicio, numeroVisitas: visitas,
            horarioFormatado: `${entrada} às ${saida}`, datasSelecionadas: datasPrincipal, visitasDesratizacao: desratizacaoAtiva ? visitasDesrat : null,
            horarioDesratizacao: desratizacaoAtiva ? `${entradaDesrat} às ${saidaDesrat}` : null, datasDesratizacao: desratizacaoAtiva ? datasDesratizacao : null, imagemBase64: imagemBase64
        };

        fetch(WEB_APP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(dados) })
        .then(response => response.json())
        .then(resposta => {
            hideLoader();
            if(resposta.sucesso) {
                document.getElementById('formWrapper').style.display = 'none'; 
                document.getElementById('success-content').style.display = 'block';
                document.getElementById('texto-sucesso-titulo').innerText = modoEdicaoFormulario ? "Atualizado com sucesso!" : "Concluído com sucesso!";
                document.getElementById('texto-sucesso').innerText = "O cronograma foi processado e salvo no Drive.";
                document.getElementById('btn-abrir-pdf').href = resposta.linkPDF;
                showToast("Cronograma gerado com sucesso!", "success");
            } else { 
                showToast("Erro: " + resposta.mensagem, "error"); 
                travarInterface(false); 
            }
        })
        .catch(erro => { 
            showToast("Erro de ligação com o servidor.", "error"); 
            travarInterface(false); 
            hideLoader(); 
        });

    }).catch(erro => { 
        showToast("Erro ao processar imagem do calendário.", "error"); 
        areaCaptura.style.width = larguraOriginal; 
        travarInterface(false); 
        hideLoader(); 
    });
}

// =========================================================================
// PAINEL DE CONTROLE (DASHBOARD)
// =========================================================================
function atualizarDashboard() {
    let total = dadosCompletos.length;
    let ativos = 0; let vencer = 0; let expirados = 0;

    dadosCompletos.forEach(registro => {
        if (registro.statusCalculado === "Ativo") ativos++;
        else if (registro.statusCalculado === "A vencer") vencer++;
        else if (registro.statusCalculado === "Expirado") expirados++;
    });

    document.getElementById('count-total').innerText = total;
    document.getElementById('count-ativos').innerText = ativos;
    document.getElementById('count-vencer').innerText = vencer;
    document.getElementById('count-expirados').innerText = expirados;
}

function carregarHistorico() {
    if (WEB_APP_URL === "COLE_A_SUA_URL_DO_WEB_APP_AQUI") return;
    
    showLoader("A carregar histórico...");
    const containerTabela = document.getElementById('containerTabela');
    const paginacaoArea = document.getElementById('paginacaoArea'); 
    const mensagem = document.getElementById('mensagem');
    
    containerTabela.style.display = 'none'; 
    paginacaoArea.style.display = 'none'; 
    mensagem.style.display = 'none';

    fetch(WEB_APP_URL + "?acao=listarHistorico")
    .then(response => response.json())
    .then(resposta => {
        hideLoader();
        if (resposta.sucesso && resposta.dados.length > 0) {
            const dataHoje = new Date(); const anoAtual = dataHoje.getFullYear(); const mesAtual = dataHoje.getMonth() + 1;
            
            dadosCompletos = resposta.dados.map((registro, index) => {
                let abertura = registro.mesInicio || "-"; 
                let encerramento = "-"; 
                let statusCalculado = "Ativo"; 
                let classeTag = "background:#d1fae5; color:#065f46;";
                
                if (registro.mesInicio && registro.mesInicio.includes('-')) {
                    const partes = registro.mesInicio.split('-');
                    if (partes.length === 2) {
                        const anoAbertura = parseInt(partes[0], 10); 
                        const mesAberturaNum = parseInt(partes[1], 10); 
                        const mesStr = partes[1];
                        
                        abertura = `${mesStr}/${anoAbertura}`; 
                        const anoEncerramento = anoAbertura + 1; 
                        encerramento = `${mesStr}/${anoEncerramento}`;
                        
                        if (anoAtual > anoEncerramento || (anoAtual === anoEncerramento && mesAtual > mesAberturaNum)) { 
                            statusCalculado = "Expirado"; 
                            classeTag = "background:#fee2e2; color:#991b1b;"; 
                        } else if (anoAtual === anoEncerramento && mesAtual === mesAberturaNum) { 
                            statusCalculado = "A vencer"; 
                            classeTag = "background:#fef3c7; color:#92400e;"; 
                        } else { 
                            statusCalculado = "Ativo"; 
                            classeTag = "background:#d1fae5; color:#065f46;"; 
                        }
                    }
                }
                return { ...registro, idTemporario: index, aberturaCalculada: abertura, encerramentoCalculado: encerramento, statusCalculado: statusCalculado, classeTag: classeTag };
            });

            atualizarDashboard();
            
            document.getElementById('inputBusca').value = ""; document.getElementById('dataInicio').value = ""; document.getElementById('dataFim').value = "";
            document.querySelectorAll('.chk-servico').forEach(chk => chk.checked = false); 
            document.querySelectorAll('.chk-status').forEach(chk => chk.checked = false);
            
            dadosFiltrados = [...dadosCompletos]; 
            paginaAtual = 1; 
            
            containerTabela.style.display = 'block'; 
            paginacaoArea.style.display = 'block'; 
            renderizarTabelaEPaginacao();
        } else if (resposta.sucesso && resposta.dados.length === 0) { 
            mensagem.style.display = 'block'; 
            mensagem.innerText = "Nenhum cronograma registrado ainda."; 
            dadosCompletos = []; 
            atualizarDashboard();
        } else { 
            mensagem.style.display = 'block'; 
            mensagem.innerText = "Erro ao carregar: " + resposta.mensagem; 
        }
    })
    .catch(erro => { 
        hideLoader();
        mensagem.style.display = 'block'; 
        mensagem.innerText = "Erro de conexão com o servidor."; 
    });
}

function renderizarTabelaEPaginacao() {
    const corpoTabela = document.getElementById('corpoTabela'); 
    corpoTabela.innerHTML = '';
    const indiceInicio = (paginaAtual - 1) * itensPorPagina; 
    const indiceFim = indiceInicio + itensPorPagina; 
    const itensDaPagina = dadosFiltrados.slice(indiceInicio, indiceFim);

    if (itensDaPagina.length === 0) {
        document.getElementById('mensagem').style.display = 'block';
        document.getElementById('mensagem').innerText = "Nenhum resultado encontrado.";
        document.getElementById('containerTabela').style.display = 'none';
        return;
    }

    itensDaPagina.forEach(registro => {
        let dataStr = registro.dataRegistro;
        try { 
            if(dataStr.includes('T')) { 
                let d = new Date(dataStr); 
                dataStr = d.toLocaleDateString('pt-BR'); 
            } 
        } catch(e) {}

        const btnPdf = registro.linkPDF && registro.linkPDF.includes("http") 
            ? `<button type="button" class="icon-btn icon-pdf" onclick="window.open('${registro.linkPDF}', '_blank')" title="Ver PDF"><span class="material-icons">picture_as_pdf</span></button>` 
            : `<button type="button" class="icon-btn" disabled title="Sem PDF" style="opacity:0.4; cursor:not-allowed;"><span class="material-icons">picture_as_pdf</span></button>`;
            
        const btnEditar = `<button type="button" class="icon-btn icon-edit" onclick="prepararEdicao(${registro.idTemporario})" title="Editar"><span class="material-icons">edit</span></button>`;
        const btnExcluir = `<button type="button" class="icon-btn icon-del" onclick="abrirModalExclusao(${registro.idTemporario})" title="Excluir"><span class="material-icons">delete</span></button>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dataStr}</td>
            <td style="font-weight: bold; color: #111827;">${registro.cliente}</td>
            <td>${registro.servico}</td>
            <td style="text-align:center;">${registro.aberturaCalculada}</td>
            <td style="text-align:center;">${registro.encerramentoCalculado}</td>
            <td style="text-align:center;"><span style="padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600; ${registro.classeTag}">${registro.statusCalculado}</span></td>
            <td><div class="actions">${btnPdf}${btnEditar}${btnExcluir}</div></td>
        `;
        corpoTabela.appendChild(tr);
    });
    renderizarControlesPaginacao();
}

function renderizarControlesPaginacao() {
    const containerBotoes = document.getElementById('botoesPaginacao'); 
    const infoPaginacao = document.getElementById('infoPaginacao'); 
    containerBotoes.innerHTML = '';
    
    const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina);
    if (totalPaginas === 0) return;
    
    infoPaginacao.innerText = `Página ${paginaAtual} de ${totalPaginas} (Total: ${dadosFiltrados.length})`;
    
    const btnAnterior = document.createElement('button'); 
    btnAnterior.className = 'btn-action btn-historico'; 
    btnAnterior.innerText = 'Anterior'; 
    btnAnterior.disabled = (paginaAtual === 1); 
    btnAnterior.onclick = () => { paginaAtual--; renderizarTabelaEPaginacao(); }; 
    containerBotoes.appendChild(btnAnterior);
    
    const btnProximo = document.createElement('button'); 
    btnProximo.className = 'btn-action btn-historico'; 
    btnProximo.innerText = 'Próxima'; 
    btnProximo.disabled = (paginaAtual === totalPaginas); 
    btnProximo.onclick = () => { paginaAtual++; renderizarTabelaEPaginacao(); }; 
    containerBotoes.appendChild(btnProximo);
}

function limparDatas() { 
    document.getElementById('dataInicio').value = ""; 
    document.getElementById('dataFim').value = ""; 
    filtrarTabela(); 
}

function filtrarTabela() {
    const termo = document.getElementById('inputBusca').value.toUpperCase();
    const servicosMarcados = Array.from(document.querySelectorAll('.chk-servico:checked')).map(chk => chk.value.toUpperCase());
    const statusMarcados = Array.from(document.querySelectorAll('.chk-status:checked')).map(chk => chk.value.toUpperCase());
    const strInicio = document.getElementById('dataInicio').value; 
    const strFim = document.getElementById('dataFim').value;       
    let dInicio = strInicio ? new Date(strInicio + 'T00:00:00') : null; 
    let dFim = strFim ? new Date(strFim + 'T23:59:59') : null;

    dadosFiltrados = dadosCompletos.filter(registro => {
        const cliente = (registro.cliente || '').toUpperCase(); 
        const endereco = (registro.endereco || '').toUpperCase();
        const servico = (registro.servico || '').toUpperCase(); 
        const status = (registro.statusCalculado || '').toUpperCase();
        
        let pData = true;
        if (dInicio || dFim) {
            let dReg = null; 
            try { 
                if (registro.dataRegistro.includes('T') || registro.dataRegistro.includes('-')) {
                    dReg = new Date(registro.dataRegistro); 
                } else { 
                    const p = registro.dataRegistro.split(' ')[0].split('/'); 
                    dReg = new Date(p[2], p[1]-1, p[0]); 
                } 
            } catch(e){}
            
            if (dReg) { 
                if (dInicio && dReg < dInicio) pData = false; 
                if (dFim && dReg > dFim) pData = false; 
            }
        }
        return (cliente.includes(termo) || endereco.includes(termo)) && 
               (servicosMarcados.length===0 || servicosMarcados.includes(servico)) && 
               (statusMarcados.length===0 || statusMarcados.includes(status)) && 
               pData;
    });
    
    document.getElementById('mensagem').style.display = 'none';
    document.getElementById('containerTabela').style.display = 'block';
    
    paginaAtual = 1; 
    renderizarTabelaEPaginacao();
}

// =========================================================================
// MÓDULO EXCLUSÃO E EDIÇÃO
// =========================================================================
function abrirModalExclusao(idTemp) {
    registroParaExcluir = dadosCompletos.find(r => r.idTemporario === idTemp);
    if(!registroParaExcluir) return;
    document.getElementById('nome-cliente-exclusao').innerText = registroParaExcluir.cliente;
    document.getElementById('modal-exclusao').style.display = 'flex';
}

function fecharModalExclusao() {
    document.getElementById('modal-exclusao').style.display = 'none';
}

function executarExclusao() {
    if(!registroParaExcluir) return;
    const linhaParaExcluir = registroParaExcluir.linhaPlanilha;
    document.getElementById('modal-exclusao').style.display = 'none';
    registroParaExcluir = null; 

    showLoader("A excluir cronograma e ficheiros no Drive...");

    const dados = { acao: "excluir", linhaPlanilha: linhaParaExcluir }; 

    fetch(WEB_APP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(dados) })
    .then(response => response.json())
    .then(resposta => {
        hideLoader();
        if(resposta.sucesso) {
            showToast("Registro excluído com sucesso.", "success");
            carregarHistorico();
        } else {
            showToast("Erro ao excluir: " + resposta.mensagem, "error");
        }
    })
    .catch(erro => {
        hideLoader();
        showToast("Erro de comunicação com o servidor.", "error");
    });
}

function prepararEdicao(idTemp) {
    const registro = dadosCompletos.find(r => r.idTemporario === idTemp);
    if(!registro) return;
    
    modoEdicaoFormulario = true; 
    linhaEdicaoAtual = registro.linhaPlanilha; 
    
    document.getElementById('titulo-formulario').innerHTML = `<span class="material-icons" style="font-size: 20px;">edit</span> EDITAR CRONOGRAMA`; 
    document.getElementById('btn-salvar').innerText = "SALVAR ALTERAÇÕES";
    document.getElementById('cliente').value = registro.cliente || ""; 
    document.getElementById('endereco').value = registro.endereco || "";
    
    const selectServico = document.getElementById('servico'); 
    if (registro.servico) selectServico.value = registro.servico; 
    verificarServico(); 
    
    if (registro.horarioFormatado) { 
        const partes = registro.horarioFormatado.split(' às '); 
        if (partes.length === 2) { 
            document.getElementById('horarioEntrada').value = partes[0].trim(); 
            document.getElementById('horarioSaida').value = partes[1].trim(); 
        } 
    }
    
    document.getElementById('mesAnoInicio').value = registro.mesInicio || "";
    const checkDesrat = document.getElementById('check-desratizacao');
    
    if (registro.datasDesratizacao && registro.datasDesratizacao.trim() !== "") {
        checkDesrat.checked = true; 
        verificarDesratizacao();
        if (registro.horarioDesratizacao) { 
            const partesD = registro.horarioDesratizacao.split(' às '); 
            if (partesD.length === 2) { 
                document.getElementById('horarioEntradaDesrat').value = partesD[0].trim(); 
                document.getElementById('horarioSaidaDesrat').value = partesD[1].trim(); 
            } 
        }
        datasDesratizacao = registro.datasDesratizacao.split(',').map(d => d.trim()).filter(d => d);
    } else { 
        checkDesrat.checked = false; 
        verificarDesratizacao(); 
        datasDesratizacao = []; 
    }
    
    if (registro.datasSelecionadas) { 
        datasPrincipal = registro.datasSelecionadas.split(',').map(d => d.trim()).filter(d => d); 
    } else { 
        datasPrincipal = []; 
    }
    
    if (registro.mesInicio) { gerarCalendarios(false); }
    mostrarFormulario();
}
