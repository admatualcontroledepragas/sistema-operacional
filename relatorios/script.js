  // =========================================================================
  // URL DO SEU WEB APP
  const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbzmS3tmbAt7DpHwm_tZHjV6x1TGSm76AaRhnUooR3ISL2Rua-wBGqSakwS-162QxRBr1Q/exec";
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
             if (item.linkRel && String(item.linkRel).startsWith("http")) botoesHtml += `<a href="${item.linkRel}" target="_blank" class="btn-doc bg-relatorio">PDF</a>`;
             if (item.linkCert && String(item.linkCert).startsWith("http")) botoesHtml += `<a href="${item.linkCert}" target="_blank" class="btn-doc bg-certificado">CERT</a>`;
             if (botoesHtml === "") botoesHtml = "<span class='no-file'>--</span>";
             
             const codigoVisual = item.codigo ? item.codigo : "--";
             const safeCodigo = item.codigo ? item.codigo : "";

             let botoesAcao = `
               <button class="btn-table-action btn-edit" onclick="prepararEdicao(${index}, 'dashboard')" title="Editar"><span class="material-icons" style="font-size:18px">edit</span></button>
               <button class="btn-table-action btn-delete" onclick="confirmarExclusao('${safeCodigo}')" title="Excluir"><span class="material-icons" style="font-size:18px">delete</span></button>
             `;
             
             tr.innerHTML = `
                <td><strong>${item.cliente}</strong></td>
                <td>${item.identificacao}</td>
                <td>${item.servico}</td>
                <td>${dataFormatada}</td>
                <td style="text-align: center; font-size: 11px; color: #555;">${codigoVisual}</td>
                <td style="text-align:center; display:flex; gap:5px; justify-content:center;">${botoesHtml}</td>
                <td style="text-align:center; white-space:nowrap;">${botoesAcao}</td>
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
    
    document.getElementById('tituloHistorico').innerText = (tipoServicoAtual === 'Imovel' ? 'Imóveis' : 'Veículos');
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
  }
 
  function limparFiltros(recarregar = true) {
    document.getElementById('filtroCliente').value = "";
    document.getElementById('filtroPlaca').value = "";
    document.getElementById('filtroEndereco').value = "";
    document.getElementById('filtroServico').value = "";
    document.getElementById('filtroData').value = "";
    if(recarregar) { paginaAtual=1; carregarHistorico(); }
  }
 
  function mudarPagina(direcao) {
    paginaAtual += direcao;
    carregarHistorico();
  }
 
  function carregarHistorico() {
    const tbody = document.getElementById('tabelaHistorico');
    tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; padding:30px; color:#666;'>Carregando histórico...</td></tr>";
    
    const payload = {
      acao: "historico", tipo: tipoServicoAtual, pagina: paginaAtual,
      filtroCliente: document.getElementById('filtroCliente').value,
      filtroPlaca: document.getElementById('filtroPlaca').value,
      filtroEndereco: document.getElementById('filtroEndereco').value,
      filtroServico: document.getElementById('filtroServico').value,
      filtroData: document.getElementById('filtroData').value
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
                 if(!isNaN(d.getTime())) {
                     dataFormatada = d.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
                 }
             }

             let botoesDocs = "";
             if (r.linkRel && String(r.linkRel).startsWith("http")) botoesDocs += `<a href="${r.linkRel}" target="_blank" class="btn-doc bg-relatorio" title="Relatório">Rel</a>`;
             if (r.linkCert && String(r.linkCert).startsWith("http")) botoesDocs += `<a href="${r.linkCert}" target="_blank" class="btn-doc bg-certificado" title="Certificado">Cert</a>`;
             if (botoesDocs === "") botoesDocs = "<span class='no-file'>--</span>";
             
             const safeCodigo = r.codigo ? r.codigo : "";
             
             let botoesAcao = `
               <button class="btn-table-action btn-edit" onclick="prepararEdicao(${index}, 'historico')" title="Editar"><span class="material-icons" style="font-size:18px">edit</span></button>
               <button class="btn-table-action btn-delete" onclick="confirmarExclusao('${safeCodigo}')" title="Excluir"><span class="material-icons" style="font-size:18px">delete</span></button>
             `;
             
             tr.innerHTML = `
                <td><strong>${r.cliente}</strong></td>
                <td>${r.identificacao}</td>
                <td>${dataFormatada}</td>
                <td>${r.servico}</td>
                <td style="text-align: center; font-size: 11px; color: #555;">${safeCodigo}</td>
                <td style="text-align:center; display:flex; gap:3px; justify-content:center;">${botoesDocs}</td>
                <td style="text-align:center; white-space:nowrap;">${botoesAcao}</td>
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
    
    document.getElementById('campo3').value = item.entrada;
    document.getElementById('campo4').value = item.saida;
    
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
  function abrirModalClientes() {
      document.getElementById('modal-clientes').style.display = 'flex';
      const divLista = document.getElementById('listaClientes');
      divLista.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">Carregando lista...</div>';
      
      fetch(URL_SCRIPT, { method: "POST", body: JSON.stringify({ acao: "listarClientes" }) })
      .then(res => res.json())
      .then(ret => {
          if (ret.status === "sucesso") {
              cacheClientes = ret.dados;
              renderizarListaClientes(cacheClientes);
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
      const termo = document.getElementById('buscaCliente').value.toLowerCase();
      const filtrados = cacheClientes.filter(c => c.nome.toLowerCase().includes(termo));
      renderizarListaClientes(filtrados);
  }

  function selecionarCliente(cliente) {
      document.getElementById('campo1').value = cliente.nome;
      document.getElementById('campo2').value = cliente.endereco;
      if(cliente.entrada) document.getElementById('campo3').value = cliente.entrada;
      if(cliente.saida) document.getElementById('campo4').value = cliente.saida;
      document.getElementById('modal-clientes').style.display = 'none';
      showToast("Dados importados!", "success");
  }
