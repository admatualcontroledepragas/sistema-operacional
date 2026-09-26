  // =========================================================================
  // URL DO SEU WEB APP
  const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbwgMyk1TaUiFi5-L3uYLmbGrs_AZ4WRJE7K-lC0uEgshRQtsnypgAZefcRHu0VRKmMffg/exec";
  // =========================================================================
  
  let usuarioLogadoNome = "";
  let tipoServicoAtual = "Imovel"; 
  let paginaAtual = 1;
  let modoEdicao = false;
  let codigoEdicao = null;
  
  let cacheHistorico = []; 
  let cacheDashboard = []; 
  let cacheClientes = []; 
  let codigoParaExcluirTemp = null; 
 
  // Dispara o carregamento dos dados iniciais puxando o nome da sessão global
  window.onload = function() {
      usuarioLogadoNome = sessionStorage.getItem("nomeUsuario") || "Usuário";
      document.getElementById('displayUsuario').innerText = usuarioLogadoNome;
      carregarColaboradores();
      carregarDashboard();
  };

  // --- UI AUXILIARES ---
  let toastTimeout; 
  function showToast(mensagem, tipo = 'success') {
    const t = document.getElementById("toast");
    if (toastTimeout) clearTimeout(toastTimeout);
    t.className = "show"; 
    
    if (tipo === 'error') {
        t.style.backgroundColor = "#ef4444";
    } else {
        t.style.backgroundColor = "#10b981";
    }
    
    t.innerText = mensagem;
    toastTimeout = setTimeout(function(){ t.className = t.className.replace("show", "").trim(); }, 3000);
  }
 
  function toggleLoading(btnId, isLoading, textDefault) {
    const btn = document.getElementById(btnId);
    if(!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner"></div> Processando...';
    } else {
      btn.disabled = false;
      btn.innerHTML = textDefault;
    }
  }
  
  function mostrarAlerta(titulo, mensagem) {
    document.getElementById('titulo-aviso').innerText = titulo;
    document.getElementById('mensagem-aviso').innerText = mensagem;
    document.getElementById('modal-aviso').style.display = 'flex';
  }
 
  // --- LOGOUT UNIFICADO ---
  function fazerLogout() {
    sessionStorage.clear();
    window.location.href = "../index.html";
  }
 
  // --- DASHBOARD ---
  function mudarAbaDashboard(tipo) {
    tipoServicoAtual = tipo;
    document.getElementById('tabImovel').className = tipo === 'Imovel' ? 'tab-btn active' : 'tab-btn';
    document.getElementById('tabVeiculo').className = tipo === 'Veiculo' ? 'tab-btn active' : 'tab-btn';
    document.getElementById('lblTotal').innerText = tipo === 'Imovel' ? 'Total de Imóveis' : 'Total de Veículos';
    document.getElementById('tituloHistorico').innerText = (tipo === 'Imovel' ? 'Imóveis' : 'Veículos');
    carregarDashboard();
  }
 
  function carregarDashboard() {
   const tbody = document.getElementById('tabelaRecentes');
   tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; padding:20px; color:#6b7280;'>Atualizando...</td></tr>"; 
   
   fetch(URL_SCRIPT, { method: "POST", body: JSON.stringify({ acao: "dashboard", tipo: tipoServicoAtual }) })
   .then(res => res.json())
   .then(dados => {
     if(dados.status === "sucesso") {
       document.getElementById('dashTotal').innerText = dados.total;
       tbody.innerHTML = "";
       
       cacheDashboard = dados.ultimos;
       
       if (dados.ultimos.length === 0) { 
         tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; color:#999; padding:20px;'>Nenhum registro recente.</td></tr>"; 
       } else {
         dados.ultimos.forEach((item, index) => {
             const tr = document.createElement('tr');
             
             let dataFormatada = item.data;
             if(dataFormatada) {
                 let d = new Date(dataFormatada);
                 if(!isNaN(d.getTime())) {
                     dataFormatada = d.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
                 }
             }

             let botoesHtml = "";
             if (item.linkRel && String(item.linkRel).startsWith("http")) botoesHtml += `<a href="${item.linkRel}" target="_blank" class="btn-doc bg-relatorio">RELATÓRIO</a>`;
             if (item.linkCert && String(item.linkCert).startsWith("http")) botoesHtml += `<a href="${item.linkCert}" target="_blank" class="btn-doc bg-certificado">CERTIFICADO</a>`;
             if (botoesHtml === "") botoesHtml = "<span class='no-file'>--</span>";
             
             const codigoVisual = item.codigo ? item.codigo : "--";
             const safeCodigo = item.codigo ? item.codigo : "";

             let botoesAcao = `
               <button class="icon-btn btn-table-action btn-edit" onclick="prepararEdicao(${index}, 'dashboard')" title="Editar">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
               </button>
               <button class="icon-btn btn-table-action btn-delete" onclick="confirmarExclusao('${safeCodigo}')" title="Excluir">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
               </button>
             `;
             
             tr.innerHTML = `
                <td><strong>${item.cliente}</strong></td>
                <td>${item.identificacao}</td>
                <td>${item.servico}</td>
                <td>${dataFormatada}</td>
                <td style="text-align: center; color: #1f2937;">${codigoVisual}</td>
                <td style="text-align:center;">
                    <div style="display:flex; gap:5px; justify-content:center;">${botoesHtml}</div>
                </td>
                <td class="actions" style="text-align:center; white-space:nowrap;">${botoesAcao}</td>
             `;
             tbody.appendChild(tr);
         });
       }
     } else {
       tbody.innerHTML = `<tr><td colspan='7' style='color:red'>Erro: ${dados.mensagem}</td></tr>`; 
     }
   })
   .catch(err => { tbody.innerHTML = "<tr><td colspan='7' style='color:red'>Erro de conexão.</td></tr>"; });
 }
 
// --- HISTÓRICO ---
 function abrirHistorico() {
   document.getElementById('view-dashboard').style.display = 'none';
   document.getElementById('view-historico').style.display = 'block';
   
   document.getElementById('tabHistImovel').className = tipoServicoAtual === 'Imovel' ? 'tab-btn active' : 'tab-btn';
   document.getElementById('tabHistVeiculo').className = tipoServicoAtual === 'Veiculo' ? 'tab-btn active' : 'tab-btn';
   document.getElementById('thIdentificacao').innerText = (tipoServicoAtual === 'Imovel' ? 'Endereço' : 'Placa');
   
   if (tipoServicoAtual === 'Veiculo') {
       document.getElementById('containerFiltroPlaca').style.display = 'block';
       document.getElementById('containerFiltroEndereco').style.display = 'none'; 
   } else {
       document.getElementById('containerFiltroPlaca').style.display = 'none';
       document.getElementById('containerFiltroEndereco').style.display = 'block'; 
   }
   window.scrollTo(0,0);
   paginaAtual = 1;
   limparFiltros(false); 
   carregarHistorico();
 }
 
 function fecharHistorico() {
   document.getElementById('view-historico').style.display = 'none';
   document.getElementById('view-dashboard').style.display = 'block';
   mudarAbaDashboard(tipoServicoAtual); // Sincroniza a aba principal
 }

 function mudarAbaHistorico(tipo) {
   tipoServicoAtual = tipo;
   document.getElementById('tabHistImovel').className = tipo === 'Imovel' ? 'tab-btn active' : 'tab-btn';
   document.getElementById('tabHistVeiculo').className = tipo === 'Veiculo' ? 'tab-btn active' : 'tab-btn';
   document.getElementById('thIdentificacao').innerText = (tipo === 'Imovel' ? 'Endereço' : 'Placa');
   
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
   tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; padding:30px; color:#666;'>Carregando histórico...</td></tr>";
   
   // ATUALIZADO: Agora envia Data Inicio e Data Fim separadas para a sua pesquisa
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
          tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; padding:30px; color:#999;'>Nenhum registro encontrado.</td></tr>";
       } else {
          dados.dados.forEach((r, index) => {
             const tr = document.createElement('tr');
             
             let dataFormatada = r.data;
             if(dataFormatada) {
                 let d = new Date(dataFormatada);
                 if(!isNaN(d.getTime())) dataFormatada = d.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
             }

             let botoesDocs = "";
             if (r.linkRel && String(r.linkRel).startsWith("http")) botoesDocs += `<a href="${r.linkRel}" target="_blank" class="btn-doc bg-relatorio" title="Abrir Relatório">RELATÓRIO</a>`;
             if (r.linkCert && String(r.linkCert).startsWith("http")) botoesDocs += `<a href="${r.linkCert}" target="_blank" class="btn-doc bg-certificado" title="Abrir Certificado">CERTIFICADO</a>`;
             if (botoesDocs === "") botoesDocs = "<span class='no-file'>--</span>";
             
             const safeCodigo = r.codigo ? r.codigo : "";
             const codigoVisual = r.codigo ? r.codigo : "--";
             
             let botoesAcao = `
               <button class="icon-btn btn-table-action btn-edit" onclick="prepararEdicao(${index}, 'historico')" title="Editar">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
               </button>
               <button class="icon-btn btn-table-action btn-delete" onclick="confirmarExclusao('${safeCodigo}')" title="Excluir">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
               </button>
             `;
             
             tr.innerHTML = `
                <td><strong>${r.cliente}</strong></td>
                <td>${r.identificacao}</td>
                <td>${dataFormatada}</td>
                <td>${r.servico}</td>
                <td style="text-align: center; color: #1f2937;">${codigoVisual}</td>
                <td style="text-align:center;">
                    <div style="display:flex; gap:3px; justify-content:center;">${botoesDocs}</div>
                </td>
                <td class="actions" style="text-align:center; white-space:nowrap;">${botoesAcao}</td>
             `;
             tbody.appendChild(tr);
           });
       }
       document.getElementById('infoPagina').innerText = `Página ${dados.paginaAtual} de ${dados.totalPaginas}`;
       document.getElementById('btnAnt').disabled = (dados.paginaAtual <= 1);
       document.getElementById('btnProx').disabled = (dados.paginaAtual >= dados.totalPaginas);
     } else {
       tbody.innerHTML = `<tr><td colspan='7' style='color:red'>Erro ao carregar.</td></tr>`; 
     }
   })
   .catch(err => { tbody.innerHTML = `<tr><td colspan='7' style='color:red'>Erro de conexão.</td></tr>`; });
 }
 
  // --- EXCLUSÃO BLINDADA ---
  function confirmarExclusao(codigo) {
    if (!codigo || codigo === "undefined" || codigo === "") {
        showToast("Registro antigo sem código.", "error");
        return;
    }
    codigoParaExcluirTemp = codigo;
    document.getElementById('modal-confirmacao').style.display = 'flex';
  }
 
  function fecharModalConfirmacao() {
    document.getElementById('modal-confirmacao').style.display = 'none';
    codigoParaExcluirTemp = null;
  }
 
  function realizarExclusaoDefinitiva() {
    if(!codigoParaExcluirTemp) return;
    const codigoSeguro = codigoParaExcluirTemp;
    fecharModalConfirmacao();
    showToast("Processando exclusão...", "show");
 
    fetch(URL_SCRIPT, { 
        method: "POST", 
        body: JSON.stringify({ acao: "excluir", tipo: tipoServicoAtual, codigo: codigoSeguro }) 
    })
    .then(res => res.json())
    .then(ret => {
       if(ret.status === "sucesso") {
         mostrarAlerta("✅ Sucesso!", "O registro e os arquivos foram excluídos permanentemente.");
         carregarDashboard();
         if(document.getElementById('view-historico').style.display === 'block') { carregarHistorico(); }
       } else {
         mostrarAlerta("❌ Erro!", "Não foi possível excluir o registro.\nMotivo: " + ret.mensagem);
       }
    })
    .catch(err => {
        mostrarAlerta("Erro de Conexão", "Verifique sua internet e tente novamente.");
    });
  }
 
// --- LÓGICA DE EDIÇÃO ---
  function prepararEdicao(index, origem = 'historico') {
    let lista = (origem === 'dashboard') ? cacheDashboard : cacheHistorico;
    const item = lista[index];
    if(!item) return;
    
    modoEdicao = true;
    codigoEdicao = item.codigo; 

    document.getElementById('tituloFormulario').innerText = "Editando Registro";
    document.getElementById('modal-selecao').style.display = 'none';
    document.getElementById('view-dashboard').style.display = 'none';
    document.getElementById('view-historico').style.display = 'none';
    document.getElementById('view-formulario').style.display = 'block';
    
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
    
    // === BLINDAGEM DE HORÁRIO ADICIONADA AQUI ===
    // Pega apenas os 5 primeiros caracteres (HH:mm) para não dar conflito no HTML
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
 
  // --- FORMULÁRIO ---
  function abrirModalSelecao() { document.getElementById('modal-selecao').style.display = 'flex'; }
  function handleInputPlaca(e) { if(tipoServicoAtual === 'Veiculo') { e.target.value = e.target.value.toUpperCase(); } }
 
  function iniciarRegistro(tipo) {
    tipoServicoAtual = tipo;
    modoEdicao = false; codigoEdicao = null;
    document.getElementById('modal-selecao').style.display = 'none';
    document.getElementById('tituloFormulario').innerText = `Novo Registro - ${tipo === 'Imovel' ? 'IMÓVEL' : 'VEÍCULO'}`;
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

    document.getElementById('view-dashboard').style.display = 'none';
    document.getElementById('view-historico').style.display = 'none'; 
    document.getElementById('view-formulario').style.display = 'block';
    window.scrollTo(0,0);
    calcularValidade(); 
  }
 
  function fecharFormulario() {
    document.getElementById('formulario').reset();
    document.getElementById('view-formulario').style.display = 'none';
    if(modoEdicao) {
        document.getElementById('view-historico').style.display = 'block';
    } else {
        document.getElementById('view-dashboard').style.display = 'block';
        mudarAbaDashboard(tipoServicoAtual);
    }
    modoEdicao = false; codigoEdicao = null;
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
    
    document.getElementById('view-formulario').style.display = 'none';
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
           showToast(modoEdicao ? "Registro atualizado!" : "Registro salvo!", "success");
           fecharFormulario(); 
           if(modoEdicao) { carregarHistorico(); } 
           
        } else { 
           document.getElementById('view-formulario').style.display = 'block';
           showToast("Erro: " + ret.mensagem, "error"); 
        }
    })
    .catch(err => { 
        document.getElementById('modal-salvando').style.display = 'none';
        document.getElementById('view-formulario').style.display = 'block'; 
        showToast("Erro ao enviar dados. Verifique a internet.", "error"); 
    });
  });
 
  // --- AUXILIARES ---
  function carregarColaboradores() {
    fetch(URL_SCRIPT, { 
        method: "POST", 
        body: JSON.stringify({ acao: "listarColaboradores" }) 
    })
    .then(res => res.json())
    .then(lista => {
        const divCheck = document.getElementById('checkboxes'); 
        divCheck.innerHTML = '';
        
        if(Array.isArray(lista)){ 
            lista.forEach((nome, i) => criarOpcao(nome, nome, i)); 
            criarOpcao("Outro", "Outro (Digitar)", "outro", true); 
        }
    })
    .catch(err => {
        console.error("Erro ao carregar colaboradores:", err);
        const divCheck = document.getElementById('checkboxes');
        divCheck.innerHTML = '<label style="color:red; padding:10px;">Erro ao carregar lista.</label>';
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
  document.addEventListener('click', function(e) { const ms = document.querySelector('.multiselect'); if (!ms.contains(e.target)) document.getElementById('checkboxes').style.display = 'none'; });

  // === LÓGICA DE IMPORTAÇÃO DE CLIENTES ===
  
  // Função auxiliar para ignorar acentuação e cedilha na busca
  function removerAcentos(texto) {
      if (!texto) return "";
      return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  }

  function abrirModalClientes() {
      document.getElementById('modal-clientes').style.display = 'flex';
      
      // Limpa a busca sempre que o modal for aberto
      document.getElementById('buscaCliente').value = '';
      
      const divLista = document.getElementById('listaClientes');
      divLista.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">Carregando lista...</div>';
      
      fetch(URL_SCRIPT, { method: "POST", body: JSON.stringify({ acao: "listarClientes" }) })
      .then(res => res.json())
      .then(ret => {
          if (ret.status === "sucesso") {
              cacheClientes = ret.dados;
              // Carrega apenas os 10 primeiros (mais recentes) ao abrir
              renderizarListaClientes(cacheClientes.slice(0, 10));
          } else {
              divLista.innerHTML = '<div style="padding:10px; color:red;">Erro ao carregar lista.</div>';
          }
      })
      .catch(e => {
          divLista.innerHTML = '<div style="padding:10px; color:red;">Erro de conexão.</div>';
      });
  }

  function renderizarListaClientes(lista) {
      const divLista = document.getElementById('listaClientes');
      divLista.innerHTML = '';
      if(lista.length === 0) {
          divLista.innerHTML = '<div style="padding:20px; text-align:center;">Nenhum cliente encontrado.</div>';
          return;
      }
      lista.forEach((c, index) => {
          const div = document.createElement('div');
          div.className = 'item-cliente';
          div.onclick = function() { selecionarCliente(c); };
          div.innerHTML = `<strong>${c.nome}</strong><br><small style="color:#6b7280;">${c.endereco}</small>`;
          divLista.appendChild(div);
      });
  }

  function filtrarListaClientes() {
      const termoDigitado = document.getElementById('buscaCliente').value;
      const termo = removerAcentos(termoDigitado.toLowerCase());
      
      // Se a barra de pesquisa for apagada, volta a mostrar os 10 mais recentes
      if (termo.trim() === "") {
          renderizarListaClientes(cacheClientes.slice(0, 10));
          return;
      }

      // Faz a busca em todo o histórico ignorando acentos
      const filtrados = cacheClientes.filter(c => {
          const nomeNormalizado = removerAcentos(c.nome.toLowerCase());
          return nomeNormalizado.includes(termo);
      });
      
      renderizarListaClientes(filtrados);
  }

  function selecionarCliente(cliente) {
      // 1. Campos Básicos
      document.getElementById('campo1').value = cliente.nome;
      document.getElementById('campo2').value = cliente.endereco;
      if(cliente.entrada) document.getElementById('campo3').value = cliente.entrada;
      if(cliente.saida) document.getElementById('campo4').value = cliente.saida;

      // 2. Serviço e Descrição de Reservatório
      if (cliente.servico) {
          const selectServico = document.getElementById('campo9');
          if (cliente.servico.includes("Limpeza de Reservatórios:")) {
              selectServico.value = "Limpeza de Reservatórios";
              document.getElementById('descReservatorio').style.display = 'block';
              let partes = cliente.servico.split(": ");
              document.getElementById('descReservatorio').value = partes.length > 1 ? partes[1] : "";
          } else {
              // Verifica se a opção existe no select antes de atribuir para evitar valores em branco
              if (Array.from(selectServico.options).some(opt => opt.value === cliente.servico)) {
                  selectServico.value = cliente.servico;
              }
              document.getElementById('descReservatorio').style.display = 'none';
              document.getElementById('descReservatorio').value = "";
          }
      }

      // 3. Garantia
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

      // 4. Colaboradores (Checkboxes e Outro)
      if (cliente.colaboradores) {
          const checks = document.querySelectorAll('input[name="colaboradores_check"]');
          let arrayColab = cliente.colaboradores.split(", ").map(item => item.trim());
          let countSel = 0;

          checks.forEach(c => {
              // Marca os colaboradores que estão nos checkboxes fixos
              if (c.value !== "Outro" && c.value !== "Outro (Digitar)" && arrayColab.includes(c.value)) {
                  c.checked = true;
                  countSel++;
                  // Remove do array para descobrirmos depois quem foi preenchido manualmente
                  arrayColab = arrayColab.filter(val => val !== c.value);
              } else {
                  c.checked = false;
              }
          });

          // Se sobrou algum nome, ele havia sido preenchido manualmente no campo "Outro"
          const chkOutro = document.getElementById('c_outro'); // ID definido na função criarOpcao
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

      // 5. Recalcula a validade com a nova garantia e fecha o modal
      calcularValidade();
      document.getElementById('modal-clientes').style.display = 'none';
      showToast("Dados importados!", "success");
  }
