/* =======================================================
   ARQUIVO: script-ui.js (RECIBOS)
   Lógica de Interface, Navegação e Rascunhos
   ======================================================= */

// ==========================================
// GERADOR DE BLOCOS HTML (IMÓVEIS)
// ==========================================
const containerImoveis = document.getElementById("blocos-imoveis-container"); 
if (containerImoveis) {
    let htmlBlocos = "";
    for(let i=1; i<=5; i++) {
        htmlBlocos += `
        <div class="item-block" id="bloco_item_${i}" style="display: ${i===1?'block':'none'};">
            <div class="item-block-title">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="badge">${i}</span> Serviço 0${i}
                </div>
                ${i>1 ? `<button type="button" class="close-btn" onclick="fecharItem(${i})"><span class="material-icons" style="font-size:18px;">close</span></button>` : ''}
            </div>
            <div class="form-row">
                <div class="form-group" style="flex: 2;">
                    <label class="title-label">Serviço ${i===1?'*':''}</label>
                    <select id="item_${i}_servico_select" class="form-input" onchange="toggleOutro('item_${i}_servico')" ${i===1?'required':''}>
                        <option value="">Selecione...</option>
                        <option value="Desinsetização">Desinsetização</option>
                        <option value="Desinsetização e Desratização">Desinsetização e Desratização</option>
                        <option value="Descupinização">Descupinização</option>
                        <option value="Limpeza de Reservatórios">Limpeza de Reservatórios</option>
                        <option value="Outro">Outro...</option>
                    </select>
                    <input type="text" id="item_${i}_servico_outro" class="form-input" style="display:none; margin-top:8px;" placeholder="Digite o serviço">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label class="title-label">Data Execução</label>
                    <input type="date" id="item_${i}_data" class="form-input">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group" style="flex: 2;">
                    <label class="title-label">Local ${i===1?'*':''}</label>
                    <input type="text" id="item_${i}_local" class="form-input" ${i===1?'required':''} placeholder="Onde foi executado?">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label class="title-label">Garantia</label>
                    <select id="item_${i}_garantia_select" class="form-input" onchange="toggleOutro('item_${i}_garantia')">
                        <option value="">Nenhuma</option>
                        <option value="30 dias">30 dias</option>
                        <option value="60 dias">60 dias</option>
                        <option value="90 dias">90 dias</option>
                        <option value="180 dias">180 dias</option>
                        <option value="Outro">Outro...</option>
                    </select>
                    <input type="text" id="item_${i}_garantia_outro" class="form-input" style="display:none; margin-top:8px;" placeholder="Digite a garantia">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group" style="width:100%;">
                    <label class="title-label">Valor Discriminado</label>
                    <input type="text" id="item_${i}_valor" class="form-input" placeholder="Opcional">
                </div>
            </div>
        </div>`;
    }
    containerImoveis.innerHTML = htmlBlocos;
}

// ==========================================
// RASCUNHO AUTOMÁTICO
// ==========================================
function salvarRascunhoAutomatico() {
    if (idReciboEmEdicao) return; 
    const abaAtiva = document.querySelector('.view-section.active').id;
    
    if (abaAtiva === 'view-form') {
        const rascunho = {
            cliente: document.getElementById('cliente').value,
            cpf_cnpj: document.getElementById('cpf_cnpj').value,
            valor_numerico: document.getElementById('valor_numerico').value,
            incluir_dados_bancarios: document.getElementById('incluir_dados_bancarios').checked
        };
        localStorage.setItem('rascunho_recibo_imovel', JSON.stringify(rascunho));
    } else if (abaAtiva === 'view-form-veiculo') {
        const rascunho = {
            cliente_v: document.getElementById('cliente_v').value,
            cpf_cnpj_v: document.getElementById('cpf_cnpj_v').value,
            valor_numerico_v: document.getElementById('valor_numerico_v').value,
            servico_v: document.getElementById('servico_v').value,
            placa_v: document.getElementById('placa_v').value,
            incluir_dados_bancarios_v: document.getElementById('incluir_dados_bancarios_v').checked
        };
        localStorage.setItem('rascunho_recibo_veiculo', JSON.stringify(rascunho));
    }
}

function recuperarRascunho(abaId) {
    if (idReciboEmEdicao) return;
    if (abaId === 'form') {
        const salvo = localStorage.getItem('rascunho_recibo_imovel');
        if (salvo) {
            try {
                const r = JSON.parse(salvo);
                if (r.cliente) document.getElementById('cliente').value = r.cliente;
                if (r.cpf_cnpj) document.getElementById('cpf_cnpj').value = r.cpf_cnpj;
                if (r.valor_numerico) {
                    document.getElementById('valor_numerico').value = r.valor_numerico;
                    document.getElementById('valor_numerico').dispatchEvent(new Event('input'));
                }
                if (r.incluir_dados_bancarios) document.getElementById('incluir_dados_bancarios').checked = r.incluir_dados_bancarios;
            } catch(e) {}
        }
    } else if (abaId === 'form-veiculo') {
        const salvo = localStorage.getItem('rascunho_recibo_veiculo');
        if (salvo) {
            try {
                const r = JSON.parse(salvo);
                if (r.cliente_v) document.getElementById('cliente_v').value = r.cliente_v;
                if (r.cpf_cnpj_v) document.getElementById('cpf_cnpj_v').value = r.cpf_cnpj_v;
                if (r.valor_numerico_v) {
                    document.getElementById('valor_numerico_v').value = r.valor_numerico_v;
                    document.getElementById('valor_numerico_v').dispatchEvent(new Event('input'));
                }
                if (r.servico_v) document.getElementById('servico_v').value = r.servico_v;
                if (r.placa_v) document.getElementById('placa_v').value = r.placa_v;
                if (r.incluir_dados_bancarios_v) document.getElementById('incluir_dados_bancarios_v').checked = r.incluir_dados_bancarios_v;
            } catch(e) {}
        }
    }
}

function limparRascunho(abaId) {
    if (abaId === 'form') localStorage.removeItem('rascunho_recibo_imovel');
    if (abaId === 'form-veiculo') localStorage.removeItem('rascunho_recibo_veiculo');
}

// ==========================================
// NAVEGAÇÃO E MODAIS
// ==========================================
function abrirModalEscolhaRecibo() { document.getElementById("modalEscolhaRecibo").style.display = "flex"; }
function fecharModalEscolhaRecibo() { document.getElementById("modalEscolhaRecibo").style.display = "none"; }

function mudarAba(abaId) {
    document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));
    document.getElementById('view-' + abaId).classList.add('active');
    
    if (abaId === 'dashboard' || abaId === 'historico') {
        if(!idReciboEmEdicao) { 
            limparRascunho('form');
            limparRascunho('form-veiculo');
            if(typeof resetarFormularioBase === 'function') resetarFormularioBase(); 
            if(typeof resetarFormularioVeiculo === 'function') resetarFormularioVeiculo(); 
        }
    }
    window.scrollTo(0,0);
}

function selecionarTipoFormulario(abaId) { 
    fecharModalEscolhaRecibo(); 
    mudarAba(abaId); 
    recuperarRascunho(abaId); 
}

function showLoader(txt = "Aguarde...") { 
    document.getElementById("loader-text").innerText = txt; 
    document.getElementById("loader").style.display = "flex"; 
}
function hideLoader() { document.getElementById("loader").style.display = "none"; }

// ==========================================
// FUNÇÕES DE UI DOS BLOCOS (IMÓVEIS)
// ==========================================
function toggleOutro(p) { const s = document.getElementById(p+"_select"), o = document.getElementById(p+"_outro"); if(s.value==="Outro") o.style.display="block"; else { o.style.display="none"; o.value=""; } }
function toggleOutroV() { const s = document.getElementById("garantia_select_v"), o = document.getElementById("garantia_outro_v"); if(s.value==="Outro") o.style.display="block"; else { o.style.display="none"; o.value=""; } }

const btnAdd = document.getElementById("btnAddItem");
if(btnAdd) {
    btnAdd.addEventListener("click", function() { 
        for(let i=2; i<=5; i++) { let b=document.getElementById("bloco_item_"+i); if(b.style.display==="none") { b.style.display="block"; break; } } 
        let vis=true; for(let i=2; i<=5; i++) if(document.getElementById("bloco_item_"+i).style.display==="none") vis=false; 
        if(vis) this.style.display="none"; 
    });
}

function fecharItem(n) { 
    document.getElementById("bloco_item_"+n).style.display="none"; 
    document.getElementById('item_'+n+'_servico_select').value=""; document.getElementById('item_'+n+'_servico_outro').value=""; document.getElementById('item_'+n+'_servico_outro').style.display="none"; document.getElementById('item_'+n+'_data').value=""; document.getElementById('item_'+n+'_local').value=""; document.getElementById('item_'+n+'_garantia_select').value=""; document.getElementById('item_'+n+'_garantia_outro').value=""; document.getElementById('item_'+n+'_garantia_outro').style.display="none"; document.getElementById('item_'+n+'_valor').value=""; 
    document.getElementById("btnAddItem").style.display="block"; 
}

function montarTextoItem(n) { 
    const b = document.getElementById("bloco_item_" + n); if (n > 1 && (b.style.display === "none")) return ""; 
    let sel = document.getElementById('item_'+n+'_servico_select').value, srv = sel === 'Outro' ? document.getElementById('item_'+n+'_servico_outro').value.trim() : sel; 
    let loc = document.getElementById('item_'+n+'_local').value.trim(), dIso = document.getElementById('item_'+n+'_data').value; 
    let gSel = document.getElementById('item_'+n+'_garantia_select').value, gar = gSel === 'Outro' ? document.getElementById('item_'+n+'_garantia_outro').value.trim() : gSel; 
    let val = document.getElementById('item_'+n+'_valor').value.trim(); 
    if (!srv) return ""; 
    let txt = "Serviço: " + srv + "\nLocal: " + (loc || "Não informado"); 
    if (dIso) txt += "\nExecutado: " + dataParaExtenso(dIso); 
    if (gar) txt += "\nGarantia: " + gar; 
    if (val) txt += "\nValor: " + val; 
    return txt; 
}
