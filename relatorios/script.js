/* =======================================================
   ARQUIVO: script.js (RELATÓRIOS)
   Lógica de Interface, Tabelas, Histórico e Integração
   ======================================================= */

const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbwyHKCvctCJ3ZbP47Y9lohbRp52p3U9D8obCsFoumqsDNj64dShvBC3JA-aJbsrGw4ApQ/exec";
  
let usuarioLogadoNome = "";
let tipoServicoAtual = "Imovel"; 
let paginaAtual = 1;
let modoEdicao = false;
let codigoEdicao = null;

let cacheHistorico = []; 
let cacheDashboard = []; 
let cacheClientes = []; 
let codigoParaExcluirTemp = null; 

// Template de loading para usar dentro das tabelas
const loaderHTML = '<tr><td colspan="7" style="text-align: center; color: #6b7280; padding: 25px;"><div style="display: flex; align-items: center; justify-content: center; gap: 10px; white-space: nowrap;"><span>Carregando dados...</span><div class="spinner" style="width: 18px; height: 18px; border-width: 3px; margin: 0; flex-shrink: 0;"></div></div></td></tr>';

window.onload = function() {
    usuarioLogadoNome = sessionStorage.getItem("nomeUsuario") || "Usuário";
    const display = document.getElementById('displayUsuario');
    if(display) display.innerText = usuarioLogadoNome;
    
    carregarColaboradores();
    carregarDashboard();
    
    verificarTemaFundo();
    const observer = new MutationObserver(verificarTemaFundo);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
};

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

// ==========================================
// SISTEMA DE ALERTAS E MODAIS UNIFICADOS
// ==========================================
let toastTimeout; 
function showToast(mensagem, tipo = 'success') {
  const t = document.getElementById("toast");
  if (toastTimeout) clearTimeout(toastTimeout);
  t.className = "show"; 
  t.style.backgroundColor = (tipo === 'error') ? "#ef4444" : "#10b981";
  t.innerText = mensagem;
  toastTimeout = setTimeout(function(){ t.className = t.className.replace("show", "").trim(); }, 3000);
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

function fazerLogout() {
  sessionStorage.clear();
  window.location.href = "../index.html";
}

// ================================
// NAVEGAÇÃO SPA (VIEWS)
// ================================
function mostrarView(viewId) {
    document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    window.scrollTo(0, 0);
}

// ==========================================
// DASHBOARD E HISTÓRICO 
// ==========================================
function abrirHistorico() {
    mostrarView('view-historico');
    
    document.getElementById('tabHistImovel').className = tipoServicoAtual === 'Imovel' ? 'tab-btn active' : 'tab-btn';
    document.getElementById('tabHistVeiculo').className = tipoServicoAtual === 'Veiculo' ? 'tab-btn active' : 'tab-btn';
    
    const thHist = document.getElementById('thIdentificacao');
    if(thHist) thHist.innerText = (tipoServicoAtual === 'Imovel' ? 'Endereço' : 'Placa');
    
    const tabelaHistEl = document.querySelector('#view-historico .styled-table');
    if(tabelaHistEl) {
        tabelaHistEl.classList.remove('modo-imovel', 'modo-veiculo');
        tabelaHistEl.classList.add(tipoServicoAtual === 'Imovel' ? 'modo-imovel' : 'modo-veiculo');
    }
    
    if (tipoServicoAtual === 'Veiculo') {
        document.getElementById('containerFiltroPlaca').style.display = 'block';
        document.getElementById('containerFiltroEndereco').style.display = 'none'; 
    } else {
        document.getElementById('containerFiltroPlaca').style.display = 'none';
        document.getElementById('containerFiltroEndereco').style.display = 'block'; 
    }
    paginaAtual = 1;
    limparFiltros(false); 
    carregarHistorico();
}
  
function fecharHistorico() {
    mostrarView('view-dashboard');
    mudarAbaDashboard(tipoServicoAtual); 
}

function abrirModalSelecao() { 
    document.getElementById('modal-selecao').style.display = 'flex'; 
}

function mudarAbaDashboard(tipo) {
   tipoServicoAtual = tipo;
   
   document.getElementById('tabImovel').className = tipo === 'Imovel' ? 'tab-btn active' : 'tab-btn';
   document.getElementById('tabVeiculo').className = tipo === 'Veiculo' ? 'tab-btn active' : 'tab-btn';
   
   document.getElementById('lblTotal').innerText = tipo === 'Imovel' ? 'Total de Imóveis' : 'Total de Veículos';
   
   const thRecentes = document.querySelector('#view-dashboard th:nth-child(2)');
   if(thRecentes) thRecentes.innerText = (tipo === 'Imovel' ? 'Endereço' : 'Placa');

   const tabelaRecentesEl = document.querySelector('#view-dashboard .styled-table');
   if(tabelaRecentesEl) {
       tabelaRecentesEl.classList.remove('modo-imovel', 'modo-veiculo');
       tabelaRecentesEl.classList.add(tipo === 'Imovel' ? 'modo-imovel' : 'modo-veiculo');
   }
   
   document.getElementById('tabelaRecentes').innerHTML = loaderHTML;
   document.getElementById('dashTotal').innerText = "...";
   
   carregarDashboard();
}

function carregarDashboard() {
   const tbody = document.getElementById('tabelaRecentes');
   tbody.innerHTML = loaderHTML; 
   
   fetch(URL_SCRIPT, { method: "POST", body: JSON.stringify({ acao: "dashboard", tipo: tipoServicoAtual }) })
   .then(res => res.json())
   .then(dados => {
     if(dados.status === "sucesso") {
       document.getElementById('dashTotal').innerText = dados.total;
       tbody.innerHTML = "";
       cacheDashboard = dados.ultimos;
       
       if (dados.ultimos.length === 0) { 
         tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; color:#999; padding:25px;'>Nenhum registro recente.</td></tr>"; 
       } else {
         dados.ultimos.forEach((item, index) => {
             const tr = document.createElement('tr');
             
             let dataFormatada = item.data;
             if(dataFormatada) {
                 let d = new Date(dataFormatada);
                 if(!isNaN(d.getTime())) dataFormatada = d.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
             }

             let botoesDocs = "";
             if (item.linkRel && String(item.linkRel).startsWith("http")) botoesDocs += `<button type="button" class="icon-btn icon-pdf" onclick="window.open('${item.linkRel}', '_blank')" title="Ver Relatório"><span class="material-icons">description</span></button>`;
             if (item.linkCert && String(item.linkCert).startsWith("http")) botoesDocs += `<button type="button" class="icon-btn icon-share" onclick="window.open('${item.linkCert}', '_blank')" title="Ver Certificado"><span class="material-icons">workspace_premium</span></button>`;
             if (botoesDocs === "") botoesDocs = "<span class='no-file'>--</span>";
             
             const safeCodigo = item.codigo ? item.codigo : "";
             const codigoVisual = item.codigo ? item.codigo : "--";

             let botoesAcao = `
               <button type="button" class="icon-btn icon-edit" onclick="prepararEdicao(${index}, 'dashboard')" title="Editar">
                   <span class="material-icons" style="font-size:18px;">edit</span>
               </button>
               <button type="button" class="icon-btn icon-del" onclick="confirmarExclusao('${safeCodigo}')" title="Apagar">
                   <span class="material-icons" style="font-size:18px;">delete</span>
               </button>
             `;
             
             tr.innerHTML = `
                <td class="td-cliente" title="${item.cliente || ''}"><strong>${item.cliente}</strong></td>
                <td class="td-endereco" title="${item.identificacao || ''}">${item.identificacao}</td>
                <td class="td-servico" title="${item.servico || ''}">${item.servico}</td>
                <td style="white-space: nowrap;">${dataFormatada}</td>
                <td style="text-align: center; color: #1f2937;">${codigoVisual}</td>
                <td style="text-align:center;">
                    <div class="actions">${botoesDocs}</div>
                </td>
                <td style="text-align:center;">
                    <div class="actions">${botoesAcao}</div>
                </td>
             `;
             tbody.appendChild(tr);
         });
       }
     } else {
       tbody.innerHTML = `<tr><td colspan='7' style='color:var(--error-color); text-align:center; padding:25px;'>Erro: ${dados.mensagem}</td></tr>`; 
     }
   })
   .catch(() => { tbody.innerHTML = "<tr><td colspan='7' style='color:var(--error-color); text-align:center; padding:25px;'>Erro de conexão.</td></tr>"; });
}
 
function mudarAbaHistorico(tipo) {
   tipoServicoAtual = tipo;
   document.getElementById('tabHistImovel').className = tipo === 'Imovel' ? 'tab-btn active' : 'tab-btn';
   document.getElementById('tabHistVeiculo').className = tipo === 'Veiculo' ? 'tab-btn active' : 'tab-btn';
   
   const thHist = document.getElementById('thIdentificacao');
   if(thHist) thHist.innerText = (tipo === 'Imovel' ? 'Endereço' : 'Placa');
   
   const tabelaHistEl = document.querySelector('#view-historico .styled-table');
   if(tabelaHistEl) {
       tabelaHistEl.classList.remove('modo-imovel', 'modo-veiculo');
       tabelaHistEl.classList.add(tipo === 'Imovel' ? 'modo-imovel' : 'modo-veiculo');
   }
   
   if (tipo === 'Veiculo') {
       document.getElementById('containerFiltroPlaca').style.display = 'block';
       document.getElementById('containerFiltroEndereco').style.display = 'none'; 
   } else {
       document.getElementById('containerFiltroPlaca').style.display = 'none';
       document.getElementById('containerFiltroEndereco').style.display = 'block'; 
   }
   paginaAtual = 1;
   limparFiltros(false);
   carregarHistorico();
}
 
function limparFiltros(recarregar = true) {
   document.getElementById('filtroCliente').value = "";
   document.getElementById('filtroPlaca').value = "";
   document.getElementById('filtroEndereco').value = "";
   document.getElementById('filtroServico').value = "";
   document.getElementById('filtroDataInicio').value = "";
   document.getElementById('filtroDataFim').value = "";
   if(recarregar) { paginaAtual=1; carregarHistorico(); }
}
 
function mudarPagina(direcao) {
   paginaAtual += direcao;
   carregarHistorico();
}
 
function carregarHistorico() {
   const tbody = document.getElementById('tabelaHistorico');
   tbody.innerHTML = loaderHTML;
   
   const payload = {
     acao: "historico", tipo: tipoServicoAtual, pagina: paginaAtual,
     filtroCliente: document.getElementById('filtroCliente').value,
     filtroPlaca: document.getElementById('filtroPlaca') ? document.getElementById('filtroPlaca').value : "",
     filtroEndereco: document.getElementById('filtroEndereco') ? document.getElementById('filtroEndereco').value : "",
     filtroServico: document.getElementById('filtroServico').value,
     filtroDataInicio: document.getElementById('filtroDataInicio').value,
     filtroDataFim: document.getElementById('filtroDataFim').value
   };
 
   fetch(URL_SCRIPT, { method: "POST", body: JSON.stringify(payload) })
   .then(res => res.json())
   .then(dados => {
     if(dados.status === "sucesso") {
       tbody.innerHTML = "";
       cacheHistorico = dados.dados; 
       
       if (dados.dados.length === 0) {
          tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; padding:25px; color:#999;'>Nenhum registro encontrado.</td></tr>";
       } else {
          dados.dados.forEach((r, index) => {
             const tr = document.createElement('tr');
             
             let dataFormatada = r.data;
             if(dataFormatada) {
                 let d = new Date(dataFormatada);
                 if(!isNaN(d.getTime())) dataFormatada = d.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
             }

             let botoesDocs = "";
             if (r.linkRel && String(r.linkRel).startsWith("http")) botoesDocs += `<button type="button" class="icon-btn icon-pdf" onclick="window.open('${r.linkRel}', '_blank')" title="Ver Relatório"><span class="material-icons">description</span></button>`;
             if (r.linkCert && String(r.linkCert).startsWith("http")) botoesDocs += `<button type="button" class="icon-btn icon-share" onclick="window.open('${r.linkCert}', '_blank')" title="Ver Certificado"><span class="material-icons">workspace_premium</span></button>`;
             if (botoesDocs === "") botoesDocs = "<span class='no-file'>--</span>";
             
             const safeCodigo = r.codigo ? r.codigo : "";
             const codigoVisual = r.codigo ? r.codigo : "--";
             
             let botoesAcao = `
               <button type="button" class="icon-btn icon-edit" onclick="prepararEdicao(${index}, 'historico')" title="Editar">
                   <span class="material-icons" style="font-size:18px;">edit</span>
               </button>
               <button type="button" class="icon-btn icon-del" onclick="confirmarExclusao('${safeCodigo}')" title="Apagar">
                   <span class="material-icons" style="font-size:18px;">delete</span>
               </button>
             `;
             
             tr.innerHTML = `
                <td class="td-cliente" title="${r.cliente || ''}"><strong>${r.cliente}</strong></td>
                <td class="td-endereco" title="${r.identificacao || ''}">${r.identificacao}</td>
                <td style="white-space: nowrap;">${dataFormatada}</td>
                <td class="td-servico" title="${r.servico || ''}">${r.servico}</td>
                <td style="text-align: center; color: #1f2937;">${codigoVisual}</td>
                <td style="text-align:center;">
                    <div class="actions">${botoesDocs}</div>
                </td>
                <td style="text-align:center;">
                    <div class="actions">${botoesAcao}</div>
                </td>
             `;
             tbody.appendChild(tr);
           });
       }
       document.getElementById('infoPagina').innerText = `Página ${dados.paginaAtual} de ${dados.totalPaginas}`;
       document.getElementById('btnAnt').disabled = (dados.paginaAtual <= 1);
       document.getElementById('btnProx').disabled = (dados.paginaAtual >= dados.totalPaginas);
     } else {
       tbody.innerHTML = `<tr><td colspan='7' style='color:var(--error-color); text-align:center; padding:25px;'>Erro ao carregar.</td></tr>`; 
     }
   })
   .catch(() => { tbody.innerHTML = `<tr><td colspan='7' style='color:var(--error-color); text-align:center; padding:25px;'>Erro de conexão.</td></tr>`; });
}
 
// ==========================================
// EXCLUSÃO
// ==========================================
function confirmarExclusao(codigo) {
    if (!codigo || codigo === "undefined" || codigo === "") {
        showToast("Registro antigo sem código.", "error");
        return;
    }
    codigoParaExcluirTemp = codigo;
    mostrarModal("Tem a certeza que deseja apagar definitivamente este registo e os seus ficheiros PDF?", "confirmacao", () => {
        realizarExclusaoDefinitiva();
    });
}
 
function realizarExclusaoDefinitiva() {
    if(!codigoParaExcluirTemp) return;
    const codigoSeguro = codigoParaExcluirTemp;
    codigoParaExcluirTemp = null;
    
    document.getElementById('modal-salvando').style.display = 'flex';
    document.querySelector('#modal-salvando h3').innerText = "A apagar Registo...";
    document.querySelector('#modal-salvando p').innerText = "Removendo PDFs e atualizando a base de dados.";
 
    fetch(URL_SCRIPT, { method: "POST", body: JSON.stringify({ acao: "excluir", tipo: tipoServicoAtual, codigo: codigoSeguro }) })
    .then(res => res.json())
    .then(ret => {
       document.getElementById('modal-salvando').style.display = 'none';
       if(ret.status === "sucesso") {
         mostrarModal("Registo apagado com sucesso!", "alerta");
         carregarDashboard();
         if(document.getElementById('view-historico').classList.contains('active')) { carregarHistorico(); }
       } else {
         mostrarModal("Erro ao excluir: " + ret.mensagem, "alerta");
       }
    })
    .catch(() => {
        document.getElementById('modal-salvando').style.display = 'none';
        mostrarModal("Erro de ligação ao tentar apagar.", "alerta");
    });
}
 
// ==========================================
// EDIÇÃO E REGISTO
// ==========================================
function prepararEdicao(index, origem = 'historico') {
    let lista = (origem === 'dashboard') ? cacheDashboard : cacheHistorico;
    const item = lista[index];
    if(!item) return;
    
    modoEdicao = true;
    codigoEdicao = item.codigo; 

    document.getElementById('tituloFormulario').innerText = "Editando Registo";
    document.getElementById('modal-selecao').style.display = 'none';
    mostrarView('view-formulario');
    
    if(document.getElementById('btnImportarCliente')) document.getElementById('btnImportarCliente').style.display = 'none';

    const lblCampo2 = document.getElementById('lblCampo2');
    const inputCampo2 = document.getElementById('campo2');
    const selectServico = document.getElementById('campo9');
    
    selectServico.innerHTML = ""; 
    let opcoes = (tipoServicoAtual === 'Veiculo') 
      ? ["Desinsetização em veículos", "Desinsetização em veículos da RODASUL", "Limpeza e higienização de tanques automotivos", "Modelo alternativo"]
      : ["Desinsetização", "Desinsetização e desratização", "Descupinização", "Limpeza de Reservatórios", "Modelo alternativo"];
    
    opcoes.forEach(op => { const option = document.createElement('option'); option.value = op; option.text = op; selectServico.appendChild(option); });

    if (tipoServicoAtual === 'Veiculo') { 
        lblCampo2.innerText = "Placa"; inputCampo2.placeholder = "AAA-0000"; 
    } else { 
        lblCampo2.innerText = "Endereço"; inputCampo2.placeholder = "Endereço completo"; 
    }

    document.getElementById('campo1').value = item.cliente;
    document.getElementById('campo2').value = item.identificacao;
    
    let dataISO = "";
    if (item.data) { dataISO = String(item.data).substring(0, 10); }
    document.getElementById('campo5').value = dataISO;
    
    document.getElementById('campo3').value = item.entrada ? String(item.entrada).substring(0, 5) : "";
    document.getElementById('campo4').value = item.saida ? String(item.saida).substring(0, 5) : "";
    
    const selGarantia = document.getElementById('selectGarantia');
    const garantiaValor = String(item.garantia).replace(" dias", "").trim();
    
    if(["30","60","90","180","360","720"].includes(garantiaValor)) {
        selGarantia.value = garantiaValor;
        document.getElementById('campo6_manual').style.display = 'none';
    } else {
        selGarantia.value = "Outro";
        document.getElementById('campo6_manual').style.display = 'block';
        document.getElementById('campo6_manual').value = garantiaValor;
    }

    if(item.servico.includes("Limpeza de Reservatórios:")) {
        selectServico.value = "Limpeza de Reservatórios";
        document.getElementById('descReservatorio').style.display = 'block';
        let partesServico = item.servico.split(": ");
        document.getElementById('descReservatorio').value = partesServico.length > 1 ? partesServico[1] : "";
    } else {
        selectServico.value = item.servico;
        document.getElementById('descReservatorio').style.display = 'none';
    }

    const checks = document.querySelectorAll('input[name="colaboradores_check"]');
    checks.forEach(c => {
        if (item.colaboradores && item.colaboradores.includes(c.value)) c.checked = true;
        else c.checked = false;
    });
    
    const listaNomes = item.colaboradores ? item.colaboradores.split(", ") : [];
    document.getElementById('texto-selecao').innerText = listaNomes.length + " selecionados";
    calcularValidade();
}
 
function handleInputPlaca(e) { 
    if(tipoServicoAtual === 'Veiculo') { e.target.value = e.target.value.toUpperCase(); } 
}
 
function iniciarRegistro(tipo) {
    tipoServicoAtual = tipo;
    modoEdicao = false; codigoEdicao = null;
    document.getElementById('modal-selecao').style.display = 'none';
    document.getElementById('tituloFormulario').innerText = `Novo Registo - ${tipo === 'Imovel' ? 'IMÓVEL' : 'VEÍCULO'}`;
    const lblCampo2 = document.getElementById('lblCampo2');
    const inputCampo2 = document.getElementById('campo2');
    const btnImportar = document.getElementById('btnImportarCliente');
    
    inputCampo2.removeEventListener('input', handleInputPlaca);
    if (tipo === 'Veiculo') { 
        lblCampo2.innerText = "Placa"; inputCampo2.placeholder = "AAA-0000"; inputCampo2.addEventListener('input', handleInputPlaca);
        if(btnImportar) btnImportar.style.display = 'none';
    } else { 
        lblCampo2.innerText = "Endereço"; inputCampo2.placeholder = "Endereço completo"; 
        if(btnImportar) btnImportar.style.display = 'inline-flex';
    }
    
    const selectServico = document.getElementById('campo9');
    selectServico.innerHTML = ""; 
    let opcoes = (tipo === 'Veiculo') 
      ? ["Desinsetização em veículos", "Desinsetização em veículos da RODASUL", "Limpeza e higienização de tanques automotivos", "Modelo alternativo"]
      : ["Desinsetização", "Desinsetização e desratização", "Descupinização", "Limpeza de Reservatórios", "Modelo alternativo"];
    
    opcoes.forEach(op => { const option = document.createElement('option'); option.value = op; option.text = op; selectServico.appendChild(option); });
    
    document.getElementById('formulario').reset();
    document.querySelectorAll('input[name="colaboradores_check"]').forEach(c => c.checked = false);
    document.getElementById('texto-selecao').innerText = "Selecione os colaboradores...";
    document.getElementById('descReservatorio').style.display = 'none';
    
    const hoje = new Date();
    document.getElementById('campo5').value = hoje.toISOString().split('T')[0];

    const rascunhoSalvo = localStorage.getItem('rascunho_' + tipo);
    if (rascunhoSalvo) {
        try {
            const rascunho = JSON.parse(rascunhoSalvo);
            document.getElementById('campo1').value = rascunho.campo1 || '';
            document.getElementById('campo2').value = rascunho.campo2 || '';
            document.getElementById('campo3').value = rascunho.campo3 || '';
            document.getElementById('campo4').value = rascunho.campo4 || '';
            if (rascunho.campo5) document.getElementById('campo5').value = rascunho.campo5;
            
            if (rascunho.campo9) document.getElementById('campo9').value = rascunho.campo9;
            if (rascunho.selectGarantia) document.getElementById('selectGarantia').value = rascunho.selectGarantia;
            
            if (rascunho.descReservatorio && rascunho.campo9 === 'Limpeza de Reservatórios') {
                document.getElementById('descReservatorio').style.display = 'block';
                document.getElementById('descReservatorio').value = rascunho.descReservatorio;
            }
            showToast("Rascunho recuperado com sucesso!", "success");
        } catch(e) {}
    }

    mostrarView('view-formulario');
    calcularValidade(); 
}
 
function fecharFormulario() {
    limparRascunho(); 
    document.getElementById('formulario').reset();
    mostrarView('view-dashboard');
    modoEdicao = false; 
    codigoEdicao = null;
    mudarAbaDashboard(tipoServicoAtual);
}
 
document.getElementById('campo9').addEventListener('change', function() {
    const descInput = document.getElementById('descReservatorio');
    if (tipoServicoAtual === 'Imovel' && this.value === 'Limpeza de Reservatórios') { 
        descInput.style.display = 'block'; descInput.required = true; descInput.focus(); 
    } else { 
        descInput.style.display = 'none'; descInput.required = false; descInput.value = ''; 
    }
});
 
document.getElementById("formulario").addEventListener("submit", function (e) {
    e.preventDefault();
    
    document.getElementById('view-formulario').classList.remove('active');
    
    document.querySelector('#modal-salvando h3').innerText = "A Salvar Registo...";
    document.querySelector('#modal-salvando p').innerText = "Gerando PDFs e atualizando a base de dados.";
    document.getElementById('modal-salvando').style.display = 'flex';
    
    let garantiaTexto = (document.getElementById('selectGarantia').value === 'Outro') 
        ? document.getElementById('campo6_manual').value + " dias" 
        : document.getElementById('selectGarantia').value + " dias";
    
    const checkboxes = document.querySelectorAll('input[name="colaboradores_check"]:checked');
    let listaSel = [];
    checkboxes.forEach(cb => { 
        if(cb.value !== 'Outro') listaSel.push(cb.value); 
        else if(document.getElementById('campo8_manual').value) listaSel.push(document.getElementById('campo8_manual').value); 
    });
    
    let servicoFinal = document.getElementById("campo9").value;
    const descExtra = document.getElementById('descReservatorio');
    if (descExtra.style.display === 'block' && descExtra.value.trim() !== "") { 
        servicoFinal = `Limpeza de Reservatórios: ${descExtra.value}`; 
    }
    
    const dados = {
      acao: modoEdicao ? "editar" : "registrar", tipo: tipoServicoAtual, usuarioLogado: usuarioLogadoNome, 
      codigoOriginal: codigoEdicao,
      campo1: document.getElementById("campo1").value, campo2: document.getElementById("campo2").value, 
      campo3: document.getElementById("campo3").value, campo4: document.getElementById("campo4").value, 
      campo5: document.getElementById("campo5").value, campo6: garantiaTexto, 
      campo7: document.getElementById("campo7").value, campo8: listaSel.join(", "), campo9: servicoFinal
    };
    
    fetch(URL_SCRIPT, { method: "POST", body: JSON.stringify(dados) })
    .then(res => res.json())
    .then(ret => { 
        document.getElementById('modal-salvando').style.display = 'none';

        if(ret.status === "sucesso") { 
           limparRascunho(); 
           showToast(modoEdicao ? "Registo atualizado!" : "Registo guardado com sucesso!", "success");
           fecharFormulario(); 
        } else { 
           document.getElementById('view-formulario').classList.add('active');
           mostrarModal("Erro: " + ret.mensagem, "alerta"); 
        }
    })
    .catch(() => { 
        document.getElementById('modal-salvando').style.display = 'none';
        document.getElementById('view-formulario').classList.add('active'); 
        mostrarModal("Erro de ligação ao tentar salvar.", "alerta"); 
    });
});
 
// ==========================================
// AUXILIARES E COLABORADORES
// ==========================================
function carregarColaboradores() {
    fetch(URL_SCRIPT, { method: "POST", body: JSON.stringify({ acao: "listarColaboradores" }) })
    .then(res => res.json())
    .then(lista => {
        const divCheck = document.getElementById('checkboxes'); 
        divCheck.innerHTML = '';
        if(Array.isArray(lista)){ 
            lista.forEach((nome, i) => criarOpcao(nome, nome, i)); 
            criarOpcao("Outro", "Outro (Digitar)", "outro", true); 
        }
    })
    .catch(() => {
        const divCheck = document.getElementById('checkboxes');
        divCheck.innerHTML = '<label style="color:var(--error-color); padding:10px;">Erro ao carregar lista.</label>';
    });
}
  
const selectGarantia = document.getElementById('selectGarantia');
const inputManualGarantia = document.getElementById('campo6_manual');
const inputDataRealizacao = document.getElementById('campo5');
const inputDataValidade = document.getElementById('campo7');
  
selectGarantia.addEventListener('change', () => { 
      inputManualGarantia.style.display = selectGarantia.value === 'Outro' ? 'block' : 'none'; 
      calcularValidade(); 
});
inputManualGarantia.addEventListener('input', calcularValidade);
inputDataRealizacao.addEventListener('change', calcularValidade);
  
function calcularValidade() {
    let dias = selectGarantia.value === 'Outro' ? parseInt(inputManualGarantia.value) : parseInt(selectGarantia.value);
    const partesData = inputDataRealizacao.value.split('-'); 
    if(dias && partesData.length === 3) {
        const d = new Date(parseInt(partesData[0]), parseInt(partesData[1]) - 1, parseInt(partesData[2]));
        d.setDate(d.getDate() + dias);
        inputDataValidade.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
}
 
function toggleCheckboxes() { const div = document.getElementById('checkboxes'); div.style.display = div.style.display === 'block' ? 'none' : 'block'; }
function criarOpcao(val, txt, id, isOutro) {
      const div = document.getElementById('checkboxes'); const lbl = document.createElement('label'); const chk = document.createElement('input');
      chk.type='checkbox'; chk.value=val; chk.name='colaboradores_check'; chk.id='c_'+id;
      chk.addEventListener('change', () => {
        if(isOutro) document.getElementById('campo8_manual').style.display = chk.checked ? 'block' : 'none';
        const q = document.querySelectorAll('input[name="colaboradores_check"]:checked').length;
        document.getElementById('texto-selecao').innerText = q ? q + " selecionados" : "Selecione os colaboradores...";
      });
      lbl.appendChild(chk); lbl.appendChild(document.createTextNode(txt)); div.appendChild(lbl);
}
document.addEventListener('click', function(e) { 
    const ms = document.querySelector('.multiselect'); 
    const cb = document.getElementById('checkboxes');
    // Verifica se os elementos existem na tela antes de tentar fechá-los
    if (ms && cb && !ms.contains(e.target)) {
        cb.style.display = 'none'; 
    }
});

// ==========================================
// IMPORTAÇÃO DE CLIENTES
// ==========================================
function removerAcentos(texto) {
      if (!texto) return "";
      return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}

function abrirModalClientes() {
      document.getElementById('modal-clientes').style.display = 'flex';
      document.getElementById('buscaCliente').value = '';
      
      const divLista = document.getElementById('listaClientes');
      divLista.innerHTML = '<div style="padding:20px; text-align:center; color:#6b7280;">Carregando...</div>';
      
      fetch(URL_SCRIPT, { method: "POST", body: JSON.stringify({ acao: "listarClientes" }) })
      .then(res => res.json())
      .then(ret => {
          if (ret.status === "sucesso") {
              cacheClientes = ret.dados;
              renderizarListaClientes(cacheClientes.slice(0, 10));
          } else {
              divLista.innerHTML = '<div style="padding:10px; color:var(--error-color); text-align:center;">Erro ao carregar lista.</div>';
          }
      })
      .catch(() => {
          divLista.innerHTML = '<div style="padding:10px; color:var(--error-color); text-align:center;">Erro de conexão.</div>';
      });
}

function renderizarListaClientes(lista) {
      const divLista = document.getElementById('listaClientes');
      divLista.innerHTML = '';
      if(lista.length === 0) {
          divLista.innerHTML = '<div style="padding:20px; text-align:center;">Nenhum cliente encontrado.</div>';
          return;
      }
      lista.forEach((c) => {
          const div = document.createElement('div');
          div.className = 'item-cliente';
          div.onclick = function() { selecionarCliente(c); };
          div.innerHTML = `<strong>${c.nome}</strong><small>${c.endereco}</small>`;
          divLista.appendChild(div);
      });
}

function filtrarListaClientes() {
      const termoDigitado = document.getElementById('buscaCliente').value;
      const termo = removerAcentos(termoDigitado.toLowerCase());
      
      if (termo.trim() === "") {
          renderizarListaClientes(cacheClientes.slice(0, 10));
          return;
      }

      const filtrados = cacheClientes.filter(c => {
          const nomeNormalizado = removerAcentos(c.nome.toLowerCase());
          return nomeNormalizado.includes(termo);
      });
      
      renderizarListaClientes(filtrados);
}

function selecionarCliente(cliente) {
      document.getElementById('campo1').value = cliente.nome;
      document.getElementById('campo2').value = cliente.endereco;
      if(cliente.entrada) document.getElementById('campo3').value = cliente.entrada;
      if(cliente.saida) document.getElementById('campo4').value = cliente.saida;

      if (cliente.servico) {
          const selectServico = document.getElementById('campo9');
          if (cliente.servico.includes("Limpeza de Reservatórios:")) {
              selectServico.value = "Limpeza de Reservatórios";
              document.getElementById('descReservatorio').style.display = 'block';
              let partes = cliente.servico.split(": ");
              document.getElementById('descReservatorio').value = partes.length > 1 ? partes[1] : "";
          } else {
              if (Array.from(selectServico.options).some(opt => opt.value === cliente.servico)) {
                  selectServico.value = cliente.servico;
              }
              document.getElementById('descReservatorio').style.display = 'none';
              document.getElementById('descReservatorio').value = "";
          }
      }

      if (cliente.garantia) {
          const selGarantia = document.getElementById('selectGarantia');
          const garantiaValor = String(cliente.garantia).replace(" dias", "").trim();
          
          if (["30", "60", "90", "180", "360", "720"].includes(garantiaValor)) {
              selGarantia.value = garantiaValor;
              document.getElementById('campo6_manual').style.display = 'none';
          } else {
              selGarantia.value = "Outro";
              document.getElementById('campo6_manual').style.display = 'block';
              document.getElementById('campo6_manual').value = garantiaValor;
          }
      }

      if (cliente.colaboradores) {
          const checks = document.querySelectorAll('input[name="colaboradores_check"]');
          let arrayColab = cliente.colaboradores.split(", ").map(item => item.trim());
          let countSel = 0;

          checks.forEach(c => {
              if (c.value !== "Outro" && c.value !== "Outro (Digitar)" && arrayColab.includes(c.value)) {
                  c.checked = true;
                  countSel++;
                  arrayColab = arrayColab.filter(val => val !== c.value);
              } else {
                  c.checked = false;
              }
          });

          const chkOutro = document.getElementById('c_outro'); 
          if (arrayColab.length > 0 && chkOutro) {
              chkOutro.checked = true;
              document.getElementById('campo8_manual').style.display = 'block';
              document.getElementById('campo8_manual').value = arrayColab.join(", ");
              countSel++;
          } else {
              if (chkOutro) chkOutro.checked = false;
              document.getElementById('campo8_manual').style.display = 'none';
              document.getElementById('campo8_manual').value = "";
          }

          document.getElementById('texto-selecao').innerText = countSel > 0 ? countSel + " selecionados" : "Selecione os colaboradores...";
      }

      calcularValidade();
      document.getElementById('modal-clientes').style.display = 'none';
      showToast("Dados importados com sucesso!", "success");
}

// ==========================================
// RASCUNHO AUTOMÁTICO
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formulario');
    if (form) {
        form.addEventListener('input', salvarRascunhoAutomatico);
        form.addEventListener('change', salvarRascunhoAutomatico);
    }
});

function salvarRascunhoAutomatico() {
    if (modoEdicao) return; 
    if (!tipoServicoAtual) return; 

    const rascunho = {
        campo1: document.getElementById('campo1').value,
        campo2: document.getElementById('campo2').value,
        campo3: document.getElementById('campo3').value,
        campo4: document.getElementById('campo4').value,
        campo5: document.getElementById('campo5').value,
        campo9: document.getElementById('campo9').value,
        selectGarantia: document.getElementById('selectGarantia').value,
        descReservatorio: document.getElementById('descReservatorio').value
    };

    localStorage.setItem('rascunho_' + tipoServicoAtual, JSON.stringify(rascunho));
}

function limparRascunho() {
    if (tipoServicoAtual) {
        localStorage.removeItem('rascunho_' + tipoServicoAtual);
    }
}
