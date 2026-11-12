/* =======================================================
   ARQUIVO: script-api.js (RECIBOS)
   Comunicação com o Backend, CRUD e Inicialização
   ======================================================= */

document.addEventListener("DOMContentLoaded", function() {
    const formImovel = document.getElementById('reciboForm');
    if (formImovel) {
        formImovel.addEventListener('input', salvarRascunhoAutomatico);
        formImovel.addEventListener('change', salvarRascunhoAutomatico);
    }
    const formVeiculo = document.getElementById('reciboVeiculoForm');
    if (formVeiculo) {
        formVeiculo.addEventListener('input', salvarRascunhoAutomatico);
        formVeiculo.addEventListener('change', salvarRascunhoAutomatico);
    }

    const d = new Date().toISOString().split("T")[0];
    document.getElementById("data_recibo").value = d; 
    document.getElementById("data_recibo_v").value = d;
    
    verificarTemaFundo();
    const observer = new MutationObserver(verificarTemaFundo);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });

    carregarDadosBackend();
});

// ==========================================
// DASHBOARD DINÂMICO
// ==========================================
function carregarDadosBackend() {
    document.querySelector("#tabela-ultimos-dashboard tbody").innerHTML = loaderHTML;
    document.querySelector("#tabela-historico tbody").innerHTML = loaderHTML;

    fetch(URL_APPS_SCRIPT, { method: "POST", body: JSON.stringify({ acao: "dashboard" }), headers: { "Content-Type": "text/plain;charset=utf-8" } })
    .then(r => r.json()).then(d => {
        if(d.status === "sucesso") {
            historicoImoveis = d.historico_imoveis; historicoVeiculos = d.historico_veiculos;
            window.ultimosImoveis = d.ultimos_5_imoveis;
            window.ultimosVeiculos = d.ultimos_5_veiculos;
            
            alternarDashboard(dashState);
            paginaAtual = 1; renderizarHistoricoPaginado();
        }
    }).catch(e => {
        console.error(e);
        const erroMsg = `<tr><td colspan="5" style="text-align:center; padding:25px; color:var(--error-color);">Erro de conexão.</td></tr>`;
        document.querySelector("#tabela-ultimos-dashboard tbody").innerHTML = erroMsg;
        document.querySelector("#tabela-historico tbody").innerHTML = erroMsg;
    });
}

function alternarDashboard(tipo) {
    dashState = tipo;
    const tabI = document.getElementById("tab-dash-imovel");
    const tabV = document.getElementById("tab-dash-veiculo");
    const displayTotal = document.getElementById("dash-total-display");
    
    tabI.classList.remove("active"); tabV.classList.remove("active");
    
    if(tipo === 'imovel') {
        tabI.classList.add("active"); displayTotal.innerText = historicoImoveis.length;
        renderizarTabelaComIcones("tabela-ultimos-dashboard", window.ultimosImoveis || []);
    } else {
        tabV.classList.add("active"); displayTotal.innerText = historicoVeiculos.length;
        renderizarTabelaComIcones("tabela-ultimos-dashboard", window.ultimosVeiculos || []);
    }
}

function renderizarTabelaComIcones(idTabela, arr) {
    const tbody = document.querySelector(`#${idTabela} tbody`); tbody.innerHTML = "";
    if(arr.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:25px; color:#6b7280;">Nenhum recibo registrado.</td></tr>`; return; }
    
    arr.forEach(rec => {
        const tr = document.createElement("tr");
        let linkDownload = rec.url_pdf ? rec.url_pdf.replace(/\/view.*$/, "/export?format=pdf") : '#';
        const obj64 = btoa(unescape(encodeURIComponent(JSON.stringify(rec))));
        
        tr.innerHTML = `
            <td class="td-cliente" title="${rec.cliente}"><strong>${rec.cliente}</strong></td>
            <td>${rec.data_extenso}</td>
            <td>R$ ${rec.valor_numerico}</td>
            <td style="text-align: center; color:#1f2937;">${rec.id_recibo}</td>
            <td style="text-align: center;">
                <div class="actions">
                    <button type="button" class="icon-btn icon-pdf" onclick="window.open('${rec.url_pdf}', '_blank')" title="Ver PDF"><span class="material-icons">visibility</span></button>
                    <button type="button" class="icon-btn icon-share" onclick="window.open('${linkDownload}', '_blank')" title="Baixar PDF"><span class="material-icons">download</span></button>
                    <button type="button" class="icon-btn icon-edit" onclick="iniciarEdicao('${obj64}')" title="Editar"><span class="material-icons">edit</span></button>
                    <button type="button" class="icon-btn icon-del" onclick="excluirRecibo('${rec.id_recibo}')" title="Apagar"><span class="material-icons">delete</span></button>
                </div>
            </td>`;
        tbody.appendChild(tr);
    });
}

function mudarFiltroHistorico(tipo) {
    filtroHistoricoAtual = tipo;
    document.getElementById("btn-hist-imoveis").classList.remove("active"); document.getElementById("btn-hist-veiculos").classList.remove("active");
    document.getElementById("btn-hist-" + tipo).classList.add("active");
    paginaAtual = 1; renderizarHistoricoPaginado();
}

function renderizarHistoricoPaginado() {
    let listaAtiva = (filtroHistoricoAtual === 'imoveis') ? historicoImoveis : historicoVeiculos;
    const t = Math.ceil(listaAtiva.length / itensPorPagina) || 1;
    document.getElementById("info-page").innerText = `Página ${paginaAtual} de ${t}`;
    document.getElementById("btn-prev-page").disabled = (paginaAtual === 1); document.getElementById("btn-next-page").disabled = (paginaAtual === t);
    const i = (paginaAtual - 1) * itensPorPagina, f = i + itensPorPagina;
    renderizarTabelaComIcones("tabela-historico", listaAtiva.slice(i, f));
}
function mudarPagina(d) { let listaAtiva = (filtroHistoricoAtual === 'imoveis') ? historicoImoveis : historicoVeiculos; const t = Math.ceil(listaAtiva.length / itensPorPagina); paginaAtual += d; if(paginaAtual<1) paginaAtual=1; if(paginaAtual>t) paginaAtual=t; renderizarHistoricoPaginado(); }

function excluirRecibo(id) {
    mostrarConfirmacao(`Apagar definitivamente o recibo ${id}?`, () => {
        showLoader("Apagando arquivo...");
        fetch(URL_APPS_SCRIPT, { method: "POST", body: JSON.stringify({ acao: "excluir", id_recibo: id }), headers: { "Content-Type": "text/plain;charset=utf-8" } })
        .then(r => r.json()).then(d => { if(d.status === "sucesso") { mostrarAlerta("Recibo apagado com sucesso!"); carregarDadosBackend(); } else mostrarAlerta("Erro: " + d.mensagem); }).catch(e => console.error(e)).finally(() => hideLoader());
    });
}

// ==========================================
// MODO DE EDIÇÃO
// ==========================================
function iniciarEdicao(obj64) {
    const rec = JSON.parse(decodeURIComponent(escape(atob(obj64))));
    idReciboEmEdicao = rec.id_recibo;
    
    if (rec.tipo_recibo === 'veiculo') {
        tipoReciboEdicao = 'veiculo'; resetarFormularioVeiculo();
        document.getElementById("spanIdEdicaoVeiculo").innerText = rec.id_recibo; document.getElementById("alertaEdicaoVeiculo").style.display = "flex";
        document.getElementById("titulo-form-veiculo").innerHTML = "Editando Recibo de Veículos"; 
        document.getElementById("btnSubmitVeiculo").innerHTML = '<span class="material-icons" style="font-size: 18px;">save</span> Salvar Alterações';
        document.getElementById("cliente_v").value = rec.cliente; document.getElementById("valor_numerico_v").value = rec.valor_numerico; document.getElementById("valor_por_extenso_v").value = rec.valor_numerico ? numeroParaExtenso(rec.valor_numerico) : "";
        
        if(rec.cpf_cnpj_puro.length > 11) { document.querySelectorAll('input[name="tipo_pessoa_v"]')[1].checked = true; document.getElementById('docLabel_v').innerText = 'CNPJ'; } else { document.querySelectorAll('input[name="tipo_pessoa_v"]')[0].checked = true; document.getElementById('docLabel_v').innerText = 'CPF'; }
        document.getElementById("cpf_cnpj_v").value = rec.cpf_cnpj_puro; document.getElementById("cpf_cnpj_v").dispatchEvent(new Event('input')); 
        const dataP = reverterDataExtensoParaIso(rec.data_extenso); if(dataP) document.getElementById("data_recibo_v").value = dataP;

        document.getElementById("servico_v").value = rec.item_01 || ""; 
        document.getElementById("placa_v").value = rec.item_02 || "";   
        
        if (rec.item_03) {
            const dBr = rec.item_03.split("/"); 
            if (dBr.length === 3) document.getElementById("data_execucao_v").value = `${dBr[2]}-${dBr[1]}-${dBr[0]}`; 
            else document.getElementById("data_execucao_v").value = rec.item_03; 
        }
        
        if (rec.item_04) {
            const garSel = document.getElementById("garantia_select_v"); 
            if (Array.from(garSel.options).map(o=>o.value).includes(rec.item_04)) garSel.value = rec.item_04; 
            else { garSel.value = "Outro"; document.getElementById("garantia_outro_v").value = rec.item_04; } 
            toggleOutroV();
        }
        mudarAba('form-veiculo');
    } 
    else {
        tipoReciboEdicao = 'geral'; resetarFormularioBase();
        document.getElementById("spanIdEdicao").innerText = rec.id_recibo; document.getElementById("alertaEdicao").style.display = "flex";
        document.getElementById("titulo-form").innerHTML = "Editando Recibo de Imóveis"; 
        document.getElementById("btnSubmit").innerHTML = '<span class="material-icons" style="font-size: 18px;">save</span> Salvar Alterações';
        document.getElementById("cliente").value = rec.cliente; document.getElementById("valor_numerico").value = rec.valor_numerico; document.getElementById("valor_por_extenso").value = rec.valor_numerico ? numeroParaExtenso(rec.valor_numerico) : "";
        
        if(rec.cpf_cnpj_puro.length > 11) { document.querySelectorAll('input[name="tipo_pessoa"]')[1].checked = true; document.getElementById('docLabel').innerText = 'CNPJ'; } else { document.querySelectorAll('input[name="tipo_pessoa"]')[0].checked = true; document.getElementById('docLabel').innerText = 'CPF'; }
        document.getElementById("cpf_cnpj").value = rec.cpf_cnpj_puro; document.getElementById("cpf_cnpj").dispatchEvent(new Event('input')); 
        const dataP = reverterDataExtensoParaIso(rec.data_extenso); if(dataP) document.getElementById("data_recibo").value = dataP;

        [rec.item_01, rec.item_02, rec.item_03, rec.item_04, rec.item_05].forEach((txt, i) => {
            let n = i + 1; if(!txt) return; let srv="", loc="", dIso="", gar="", val="";
            txt.split('\n').forEach(l => { if(l.startsWith("Serviço: ")) srv = l.replace("Serviço: ", ""); if(l.startsWith("Local: ")) loc = l.replace("Local: ", ""); if(l.startsWith("Executado: ")) dIso = reverterDataExtensoParaIso(l.replace("Executado: ", "")); if(l.startsWith("Garantia: ")) gar = l.replace("Garantia: ", ""); if(l.startsWith("Valor: ")) val = l.replace("Valor: ", ""); });
            if(srv) {
                document.getElementById("bloco_item_"+n).style.display="block"; document.getElementById('item_'+n+'_local').value=loc; document.getElementById('item_'+n+'_data').value=dIso; document.getElementById('item_'+n+'_valor').value=val;
                const ss=document.getElementById('item_'+n+'_servico_select'); if(Array.from(ss.options).map(o=>o.value).includes(srv)) ss.value=srv; else {ss.value="Outro"; document.getElementById('item_'+n+'_servico_outro').value=srv;} toggleOutro('item_'+n+'_servico');
                const gs=document.getElementById('item_'+n+'_garantia_select'); if(Array.from(gs.options).map(o=>o.value).includes(gar)) gs.value=gar; else if(gar) {gs.value="Outro"; document.getElementById('item_'+n+'_garantia_outro').value=gar;} toggleOutro('item_'+n+'_garantia');
            }
        }); 
        mudarAba('form');
    } 
}

function cancelarEdicao() { 
    resetarFormularioBase(); resetarFormularioVeiculo(); mudarAba('dashboard'); 
}

function resetarFormularioBase() { 
    document.getElementById("reciboForm").reset(); 
    for(let i=1; i<=5; i++) { 
        if(i>1) document.getElementById("bloco_item_"+i).style.display="none"; 
        document.getElementById('item_'+i+'_servico_select').value=""; document.getElementById('item_'+i+'_servico_outro').value=""; document.getElementById('item_'+i+'_servico_outro').style.display="none"; document.getElementById('item_'+i+'_data').value=""; document.getElementById('item_'+i+'_local').value=""; document.getElementById('item_'+i+'_garantia_select').value=""; document.getElementById('item_'+i+'_garantia_outro').value=""; document.getElementById('item_'+i+'_garantia_outro').style.display="none"; document.getElementById('item_'+i+'_valor').value=""; 
    } 
    idReciboEmEdicao = null; tipoReciboEdicao = null; document.getElementById("alertaEdicao").style.display = "none"; document.getElementById("titulo-form").innerHTML = "Novo Recibo de Imóveis"; document.getElementById("btnSubmit").innerHTML = '<span class="material-icons" style="font-size: 18px;">receipt_long</span> Salvar e Gerar Recibo'; document.getElementById('docLabel').innerText = 'CPF'; document.getElementById("data_recibo").value = new Date().toISOString().split("T")[0]; document.getElementById("btnAddItem").style.display = "block"; 
    document.getElementById("incluir_dados_bancarios").checked = false;
}

function resetarFormularioVeiculo() { 
    document.getElementById("reciboVeiculoForm").reset(); 
    idReciboEmEdicao = null; tipoReciboEdicao = null; document.getElementById("alertaEdicaoVeiculo").style.display = "none"; document.getElementById("titulo-form-veiculo").innerHTML = "Novo Recibo de Veículos"; document.getElementById("btnSubmitVeiculo").innerHTML = '<span class="material-icons" style="font-size: 18px;">directions_car</span> Salvar Recibo Veículo'; document.getElementById('docLabel_v').innerText = 'CPF'; document.getElementById("data_recibo_v").value = new Date().toISOString().split("T")[0]; document.getElementById("garantia_outro_v").style.display = "none"; 
    document.getElementById("incluir_dados_bancarios_v").checked = false;
}

// ==========================================
// ENVIOS PARA O BACKEND
// ==========================================
document.getElementById("reciboForm").addEventListener("submit", function(event) {
    event.preventDefault(); const btn = this.querySelector("button[type=submit]"); btn.innerHTML = "Processando..."; btn.disabled = true;
    let doc = document.getElementById("cpf_cnpj").value.trim();
    let t = document.querySelector('input[name="tipo_pessoa"]:checked').value;
    let p = doc.replace(/\D/g, '');
    let fmt = doc ? ((t === 'F') ? "inscrito no CPF sob o nº " + doc : "inscrito no CNPJ sob o nº " + doc) : "";
    
    const dados = { 
        acao: idReciboEmEdicao ? "editar" : "gerar", tipo_recibo: "geral", id_recibo: idReciboEmEdicao, 
        cliente: document.getElementById("cliente").value, cpf_cnpj_formatado: fmt, cpf_cnpj_puro: p, 
        data_recibo_extenso: dataParaExtenso(document.getElementById("data_recibo").value), 
        valor_numerico: document.getElementById("valor_numerico").value, valor_por_extenso: document.getElementById("valor_por_extenso").value, 
        item_01: montarTextoItem(1), item_02: montarTextoItem(2), item_03: montarTextoItem(3), item_04: montarTextoItem(4), item_05: montarTextoItem(5),
        incluir_dados_bancarios: document.getElementById("incluir_dados_bancarios").checked 
    };
    enviarBackend(dados, btn, resetarFormularioBase, idReciboEmEdicao ? '<span class="material-icons" style="font-size: 18px;">save</span> Salvar Alterações' : '<span class="material-icons" style="font-size: 18px;">receipt_long</span> Salvar e Gerar Recibo');
});

document.getElementById("reciboVeiculoForm").addEventListener("submit", function(event) {
    event.preventDefault(); const btn = this.querySelector("button[type=submit]"); btn.innerHTML = "Processando..."; btn.disabled = true;
    let doc = document.getElementById("cpf_cnpj_v").value.trim();
    let t = document.querySelector('input[name="tipo_pessoa_v"]:checked').value;
    let p = doc.replace(/\D/g, '');
    let fmt = doc ? ((t === 'F') ? "inscrito no CPF sob o nº " + doc : "inscrito no CNPJ sob o nº " + doc) : "";

    const dados = { 
        acao: idReciboEmEdicao ? "editar" : "gerar", tipo_recibo: "veiculo", id_recibo: idReciboEmEdicao, 
        cliente: document.getElementById("cliente_v").value, cpf_cnpj_formatado: fmt, cpf_cnpj_puro: p, 
        data_recibo_extenso: dataParaExtenso(document.getElementById("data_recibo_v").value), 
        valor_numerico: document.getElementById("valor_numerico_v").value, valor_por_extenso: document.getElementById("valor_por_extenso_v").value, 
        servico: document.getElementById("servico_v").value, placa: document.getElementById("placa_v").value.toUpperCase(), 
        data_execucao: formatarDataPadrao(document.getElementById("data_execucao_v").value), 
        garantia: document.getElementById("garantia_select_v").value === "Outro" ? document.getElementById("garantia_outro_v").value : document.getElementById("garantia_select_v").value,
        incluir_dados_bancarios: document.getElementById("incluir_dados_bancarios_v").checked 
    };
    enviarBackend(dados, btn, resetarFormularioVeiculo, idReciboEmEdicao ? '<span class="material-icons" style="font-size: 18px;">save</span> Salvar Alterações' : '<span class="material-icons" style="font-size: 18px;">directions_car</span> Salvar Recibo Veículo');
});

function enviarBackend(dados, btn, fReset, txtBotaoBase) {
    showLoader("Gerando recibo..."); 
    fetch(URL_APPS_SCRIPT, { method: "POST", body: JSON.stringify(dados), headers: { "Content-Type": "text/plain;charset=utf-8" } })
    .then(r => r.json())
    .then(data => { 
        if(data.status === "sucesso") { 
            limparRascunho(dados.tipo_recibo === 'veiculo' ? 'form-veiculo' : 'form'); 
            mostrarAlerta(`Sucesso! Recibo ${data.acao_realizada === 'editar'?'atualizado':'gerado'}:\n${data.id_recibo}`); 
            fReset(); carregarDadosBackend(); mudarAba('dashboard'); 
        } else { mostrarAlerta("Erro: " + data.mensagem); }
    }).catch(() => mostrarAlerta("Erro de conexão."))
    .finally(() => { btn.innerHTML = txtBotaoBase; btn.disabled = false; hideLoader(); });
}

// ==========================================
// SISTEMA DE IMPORTAÇÃO
// ==========================================
document.getElementById("btnAbrirImportacao").addEventListener("click", function() { 
    modalImportacaoContext = 'imovel'; document.getElementById("thServicoPlaca").innerText = "Serviço";
    const btn = this; btn.innerHTML = "Buscando..."; btn.disabled = true; 
    fetch(URL_APPS_SCRIPT, { method: "POST", body: JSON.stringify({ acao: "importar", tipo_recibo: "geral" }) })
    .then(r=>r.json()).then(d=>{ if (d.status === "sucesso") { baseServicosGeral = d.dados; document.getElementById("modalImportacao").style.display = "flex"; document.getElementById("buscaModal").value = ""; renderizarTabelaModal(baseServicosGeral.slice(0, 10)); atualizarContadorModal(); } else mostrarAlerta("Erro: " + d.mensagem); }).finally(() => { btn.innerHTML = `<span class="material-icons" style="font-size:18px;">cloud_download</span> Importar`; btn.disabled = false; }); 
});

document.getElementById("btnAbrirImportacaoVeiculo").addEventListener("click", function() { 
    modalImportacaoContext = 'veiculo'; document.getElementById("thServicoPlaca").innerText = "Placa";
    const btn = this; btn.innerHTML = "Buscando..."; btn.disabled = true; 
    fetch(URL_APPS_SCRIPT, { method: "POST", body: JSON.stringify({ acao: "importar", tipo_recibo: "veiculo" }) })
    .then(r=>r.json()).then(d=>{ if (d.status === "sucesso") { baseServicosGeral = d.dados; document.getElementById("modalImportacao").style.display = "flex"; document.getElementById("buscaModal").value = ""; renderizarTabelaModal(baseServicosGeral.slice(0, 10)); atualizarContadorModal(); } else mostrarAlerta("Erro: " + d.mensagem); }).finally(() => { btn.innerHTML = `<span class="material-icons" style="font-size:18px;">cloud_download</span> Importar`; btn.disabled = false; }); 
});

function fecharModalImportacao() { document.getElementById("modalImportacao").style.display = "none"; } 
document.getElementById("btnCancelarModal").addEventListener("click", fecharModalImportacao); 

document.getElementById("buscaModal").addEventListener("input", function(e) { 
    const t = e.target.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); 
    if (t === "") renderizarTabelaModal(baseServicosGeral.slice(0, 10)); 
    else { renderizarTabelaModal(baseServicosGeral.filter(s => s.cliente.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(t))); } 
});

function renderizarTabelaModal(lista) { 
    const tbody = document.querySelector("#tabelaServicos tbody"); tbody.innerHTML = ""; 
    if (lista.length === 0) { tbody.innerHTML = `<tr><td colspan="4" align="center" style="padding:15px; color:#6b7280;">Nenhum registo encontrado.</td></tr>`; return; } 
    lista.forEach(srv => { 
        const tr = document.createElement("tr"); 
        let infoEspecífica = modalImportacaoContext === 'veiculo' ? srv.placa : srv.servico;
        tr.innerHTML = `<td align="center"><input type="checkbox" class="chk-linha" style="width:16px; height:16px; accent-color:#004481; cursor:pointer;" value="${encodeURIComponent(JSON.stringify(srv))}" onchange="atualizarContadorModal()"></td><td class="td-cliente" title="${srv.cliente}"><strong>${srv.cliente}</strong></td><td>${infoEspecífica}</td><td>${formatarDataPadrao(srv.data)}</td>`; 
        tbody.appendChild(tr); 
    }); 
}

function atualizarContadorModal() { 
    const q = document.querySelectorAll(".chk-linha:checked").length; 
    const limite = modalImportacaoContext === 'veiculo' ? 1 : 5;
    const ctr = document.getElementById("contadorSelecao"); 
    ctr.innerText = `${q}/${limite} selecionados`; ctr.style.color = q > limite ? "red" : "#6b7280"; 
}

document.getElementById("btnConfirmarModal").addEventListener("click", function() { 
    const chks = document.querySelectorAll(".chk-linha:checked"); 
    const limite = modalImportacaoContext === 'veiculo' ? 1 : 5;
    if (chks.length === 0) return mostrarAlerta("Selecione pelo menos um item."); 
    if (chks.length > limite) return mostrarAlerta(`Máximo de ${limite} item(ns) permitido(s).`); 
    
    const sel = Array.from(chks).map(c => JSON.parse(decodeURIComponent(c.value))); 
    if (modalImportacaoContext === 'veiculo') {
        document.getElementById("cliente_v").value = sel[0].cliente; document.getElementById("placa_v").value = sel[0].placa || ""; 
        if (sel[0].data) document.getElementById("data_execucao_v").value = sel[0].data;
        const gSelect = document.getElementById("garantia_select_v"); 
        if (Array.from(gSelect.options).map(o=>o.value).includes(sel[0].garantia)) { gSelect.value = sel[0].garantia; } else if (sel[0].garantia) { gSelect.value = "Outro"; document.getElementById("garantia_outro_v").value = sel[0].garantia; } 
        toggleOutroV();
    } else {
        document.getElementById("cliente").value = sel[0].cliente; 
        for(let i=1; i<=5; i++) { if(i>1) document.getElementById("bloco_item_"+i).style.display="none"; document.getElementById('item_'+i+'_servico_select').value=""; document.getElementById('item_'+i+'_servico_outro').value=""; document.getElementById('item_'+i+'_servico_outro').style.display="none"; document.getElementById('item_'+i+'_data').value=""; document.getElementById('item_'+i+'_local').value=""; document.getElementById('item_'+i+'_garantia_select').value=""; document.getElementById('item_'+i+'_garantia_outro').value=""; document.getElementById('item_'+i+'_garantia_outro').style.display="none"; document.getElementById('item_'+i+'_valor').value=""; } 
        sel.forEach((srv, idx) => { 
            const n = idx + 1; document.getElementById("bloco_item_" + n).style.display = "block"; document.getElementById('item_' + n + '_local').value = srv.local; document.getElementById('item_' + n + '_data').value = srv.data; const sSelect = document.getElementById('item_' + n + '_servico_select'); 
            if (Array.from(sSelect.options).map(o=>o.value).includes(srv.servico)) sSelect.value = srv.servico; else if (srv.servico) { sSelect.value = "Outro"; document.getElementById('item_' + n + '_servico_outro').value = srv.servico; } toggleOutro('item_' + n + '_servico'); const gSelect = document.getElementById('item_' + n + '_garantia_select'); 
            if (Array.from(gSelect.options).map(o=>o.value).includes(srv.garantia)) gSelect.value = srv.garantia; else if (srv.garantia) { gSelect.value = "Outro"; document.getElementById('item_' + n + '_garantia_outro').value = srv.garantia; } toggleOutro('item_' + n + '_garantia'); 
        }); document.getElementById("btnAddItem").style.display = sel.length >= 5 ? "none" : "block"; 
    } fecharModalImportacao(); 
});

// Ativação das máscaras após as lógicas estarem prontas
setupMascaraPessoa('tipo_pessoa', 'cpf_cnpj', 'docLabel'); 
setupMascaraPessoa('tipo_pessoa_v', 'cpf_cnpj_v', 'docLabel_v');
setupMascaraValor('valor_numerico', 'valor_por_extenso'); 
setupMascaraValor('valor_numerico_v', 'valor_por_extenso_v');
