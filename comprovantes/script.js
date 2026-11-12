/* =======================================================
   ARQUIVO: script.js (COMPROVANTES DE EXECUÇÃO)
   Totalmente Padronizado (Material Icons e UI Unificada)
   ======================================================= */

// ==========================================
// COLE A URL DO SEU WEB APP ABAIXO
// ==========================================
const scriptURL = 'https://script.google.com/macros/s/AKfycbxL5OneACefDAaNhu7iSF6dT14Erqgjkx8Pma8MZMCL7ZNztG6pYRv9gk8e2kbGHEB-/exec'; // <<<<<<<< COLOQUE SUA URL AQUI

let todosOsRegistros = [];
let registrosFiltrados = [];
let paginaAtual = 1;
const itensPorPagina = 10;
let codigoParaExcluir = '';
let clienteParaExcluirCNPJ = '';
let acaoExclusaoAtual = ''; // 'registro' ou 'cliente'

document.addEventListener('DOMContentLoaded', () => {
    carregarRegistrosHistorico();
    carregarColaboradores();
    carregarBancoClientes();
});

// =========================================================================
// LOADERS, TOASTS E TRANSIÇÕES DE ECRÃ
// =========================================================================
function showLoader(txt = "Aguarde...") {
    document.getElementById("loader-text").innerText = txt;
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

function mudarTela(tela) {
    document.getElementById('dashboardView').classList.remove('active');
    document.getElementById('formView').classList.remove('active');
    
    if (tela === 'painel') {
        document.getElementById('dashboardView').classList.add('active');
        carregarRegistrosHistorico();
    } else {
        document.getElementById('formView').classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =========================================================================
// DASHBOARD: CARREGAMENTO DE HISTÓRICO E TABELA
// =========================================================================
function carregarRegistrosHistorico() {
    if (scriptURL === 'COLE_A_SUA_URL_DO_WEB_APP_AQUI') return;
    
    showLoader("A carregar histórico...");
    const corpo = document.getElementById('corpoTabela');
    
    fetch(`${scriptURL}?action=listarRegistros`)
    .then(r => r.json())
    .then(data => {
        if (data.sucesso) {
            todosOsRegistros = data.registros;
            aplicarFiltros();
        } else {
            corpo.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#6b7280; font-style:italic;">Nenhum registo encontrado.</td></tr>';
        }
    })
    .catch(e => {
        corpo.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#ef4444;">Erro de conexão ao carregar o histórico.</td></tr>';
    })
    .finally(() => hideLoader());
}

function aplicarFiltros() {
    const txt = document.getElementById('filtroTexto').value.toLowerCase();
    const dIni = document.getElementById('filtroDataIni').value;
    const dFim = document.getElementById('filtroDataFim').value;
    
    registrosFiltrados = todosOsRegistros.filter(reg => {
        const textMatch = reg.cliente.toLowerCase().includes(txt) || (reg.codigo && reg.codigo.toLowerCase().includes(txt));
        let dateMatch = true;
        
        if (dIni || dFim) {
            const pd = reg.data.split(' as ');
            if (pd.length > 0) {
                const d = pd[0].split('/'); 
                if (d.length === 3) {
                    const dr = `${d[2]}-${d[1]}-${d[0]}`; 
                    if (dIni && dr < dIni) dateMatch = false; 
                    if (dFim && dr > dFim) dateMatch = false;
                }
            }
        }
        return textMatch && dateMatch;
    });
    
    paginaAtual = 1; 
    renderizarTabela();
}

function limparFiltros() { 
    document.getElementById('filtroTexto').value = ''; 
    document.getElementById('filtroDataIni').value = ''; 
    document.getElementById('filtroDataFim').value = ''; 
    aplicarFiltros(); 
}

function renderizarTabela() {
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '';
    
    const tPaginas = Math.ceil(registrosFiltrados.length / itensPorPagina);
    const iIni = (paginaAtual - 1) * itensPorPagina;
    const paginaData = registrosFiltrados.slice(iIni, iIni + itensPorPagina);
    
    if (paginaData.length === 0) { 
        corpo.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#6b7280; font-style:italic;">Nenhum registo encontrado para os filtros.</td></tr>`; 
    } else {
        paginaData.forEach(reg => {
            // Lógica padronizada para os botões usando Material Icons
            const btnPdf = reg.linkPdf && reg.linkPdf.includes("http") 
                ? `<button type="button" class="icon-btn icon-pdf" onclick="window.open('${reg.linkPdf}', '_blank')" title="Ver PDF"><span class="material-icons">picture_as_pdf</span></button>` 
                : `<button type="button" class="icon-btn" disabled title="Sem PDF" style="opacity:0.4; cursor:not-allowed;"><span class="material-icons">picture_as_pdf</span></button>`;
                
            const btnFotos = reg.linkFotos && reg.linkFotos.includes("http") 
                ? `<button type="button" class="icon-btn icon-share" onclick="window.open('${reg.linkFotos}', '_blank')" title="Ver Fotos"><span class="material-icons">photo_camera</span></button>` 
                : `<button type="button" class="icon-btn" disabled title="Sem Fotos" style="opacity:0.4; cursor:not-allowed;"><span class="material-icons">photo_camera</span></button>`;
                
            const btnEditar = `<button type="button" class="icon-btn icon-edit" onclick="iniciarEdicao('${reg.codigo}')" title="Editar Registro"><span class="material-icons">edit</span></button>`;
            const btnExcluir = `<button type="button" class="icon-btn icon-del" onclick="iniciarExclusao('${reg.codigo}')" title="Excluir Registro"><span class="material-icons">delete</span></button>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:bold; color:#111827;">${reg.codigo || '-'}</td>
                <td>${reg.data || '-'}</td>
                <td>${reg.cliente}</td>
                <td><div class="actions">${btnPdf}${btnFotos}${btnEditar}${btnExcluir}</div></td>
            `;
            corpo.appendChild(tr);
        });
    }
    
    document.getElementById('infoPagina').innerText = tPaginas > 0 
        ? `Página ${paginaAtual} de ${tPaginas}` 
        : 'Página 0 de 0';
        
    document.getElementById('btnPaginaAnt').disabled = paginaAtual === 1 || tPaginas === 0; 
    document.getElementById('btnPaginaProx').disabled = paginaAtual === tPaginas || tPaginas === 0;
}

function mudarPagina(dir) { 
    paginaAtual += dir; 
    renderizarTabela(); 
}

// Event Listeners dos Filtros
document.getElementById('filtroTexto').addEventListener('input', aplicarFiltros);
document.getElementById('filtroDataIni').addEventListener('change', aplicarFiltros);
document.getElementById('filtroDataFim').addEventListener('change', aplicarFiltros);

// =========================================================================
// MÓDULO DE EXCLUSÕES (Registo e Cliente)
// =========================================================================
function iniciarExclusao(codigo) {
    codigoParaExcluir = codigo;
    acaoExclusaoAtual = 'registro';
    document.getElementById('tituloModalExclusao').innerText = 'Confirmar Exclusão';
    document.getElementById('textoModalExclusao').innerText = `ATENÇÃO: Deseja EXCLUIR permanentemente o registo ${codigo}? Esta ação não pode ser desfeita.`;
    document.getElementById('modalExclusaoGlobal').style.display = 'flex';
}

function iniciarExclusaoCliente(cnpj, nome) {
    clienteParaExcluirCNPJ = cnpj;
    acaoExclusaoAtual = 'cliente';
    document.getElementById('tituloModalExclusao').innerText = 'Excluir Cliente';
    document.getElementById('textoModalExclusao').innerHTML = `Tem certeza que deseja excluir o cliente <b>${nome}</b>?<br><br>Ele será removido do banco de dados (os serviços anteriores continuarão salvos).`;
    document.getElementById('modalExclusaoGlobal').style.display = 'flex';
}

function fecharModalExclusao() { 
    document.getElementById('modalExclusaoGlobal').style.display = 'none'; 
    codigoParaExcluir = ''; 
    clienteParaExcluirCNPJ = '';
    acaoExclusaoAtual = '';
}

document.getElementById('btnConfirmarExclusaoGlobal').addEventListener('click', function() {
    if (acaoExclusaoAtual === 'registro') {
        executarExclusaoRegistro();
    } else if (acaoExclusaoAtual === 'cliente') {
        executarExclusaoCliente();
    }
});

function executarExclusaoRegistro() {
    const codigo = codigoParaExcluir; 
    fecharModalExclusao(); 
    if (!codigo) return;
    
    showLoader("A excluir registo e ficheiros anexos...");
    const fd = new FormData(); 
    fd.append('acao', 'excluir'); 
    fd.append('codigo', codigo);
    
    fetch(scriptURL, { method: 'POST', body: fd }).then(r => r.text()).then(t => {
        if(t.includes("Erro")) { 
            showToast("Erro ao excluir: " + t, 'error'); 
        } else { 
            showToast('✔ Registo excluído com sucesso!', 'success'); 
        }
        carregarRegistrosHistorico();
    }).catch(e => { 
        showToast("Falha de conexão ao tentar excluir.", 'error'); 
        carregarRegistrosHistorico(); 
    });
}

function executarExclusaoCliente() {
    const cnpj = clienteParaExcluirCNPJ; 
    fecharModalExclusao(); 
    if (!cnpj) return;
    
    const sts = document.getElementById('statusBusca');
    sts.style.display = 'block'; 
    sts.innerText = 'Aguarde... A excluir cliente do banco de dados.';
    
    const fd = new FormData(); 
    fd.append('acao', 'excluirCliente'); 
    fd.append('cnpj', cnpj);
    
    fetch(scriptURL, { method: 'POST', body: fd }).then(r => r.text()).then(t => {
        if(t.includes("Erro")) { 
            showToast("Erro ao excluir cliente: " + t, 'error'); 
        } else { 
            showToast('✔ Cliente removido com sucesso!', 'success'); 
            bancoClientes = bancoClientes.filter(c => c.campo2 !== cnpj); 
            filtrarClientes(); 
        }
        sts.style.display = 'none';
    }).catch(e => { 
        showToast("Falha de conexão ao excluir cliente.", 'error'); 
        sts.style.display = 'none'; 
    });
}

// =========================================================================
// FLUXO DO FORMULÁRIO E MODO EDIÇÃO
// =========================================================================
function abrirNovoRegistro() { 
    resetarFormulario(); 
    mudarTela('formulario'); 
}

function cancelarEdicao() { 
    resetarFormulario(); 
    mudarTela('painel'); 
}

function iniciarEdicao(codigo) {
    showLoader('Buscando dados completos do serviço...');

    fetch(`${scriptURL}?action=obterRegistro&codigo=${codigo}`)
    .then(r => r.json())
    .then(data => {
        hideLoader();
        if (!data.sucesso || !data.registro) {
            showToast("Erro ao buscar dados para edição.", "error");
            return;
        }

        const reg = data.registro;
        const info = reg.colunaA.split(" /// ");
        
        document.getElementById('c_razao').value = info[0] || ''; 
        document.getElementById('c_cnpj').value = info[1] || '';
        document.getElementById('c_email').value = info[2] || ''; 
        document.getElementById('c_fantasia').value = info[3] || '';
        document.getElementById('c_endereco').value = info[4] || '';

        const pDataIni = reg.dataInicioRegistro.split(' as '); 
        if (pDataIni.length > 1) { 
            const d = pDataIni[0].split('/'); 
            document.querySelector('input[name="campo6"]').value = `${d[2]}-${d[1]}-${d[0]}`; 
            document.getElementById('horaIni').value = pDataIni[1].trim(); 
        }
        
        const pDataFim = reg.dataFimRegistro.split(' as '); 
        if (pDataFim.length > 1) {
            document.getElementById('horaFim').value = pDataFim[1].trim();
        }
        
        calcularDuracao();

        document.querySelector('textarea[name="campo10"]').value = reg.areasTratadas; 
        document.querySelector('textarea[name="campo11"]').value = (reg.restricao.includes("Durante a execução")) ? "" : reg.restricao;
        
        document.querySelectorAll('.check-praga').forEach(cb => cb.checked = false); 
        let pragas = reg.pragas.split(', '), outrasPragas = []; 
        pragas.forEach(p => { 
            const cb = document.querySelector(`.check-praga[value="${p}"]`); 
            if(cb) cb.checked = true; 
            else if(p) outrasPragas.push(p); 
        });
        
        if (outrasPragas.length > 0) { 
            document.getElementById('checkOutrasPragas').checked = true; 
            document.getElementById('inputOutrasPragas').value = outrasPragas.join(', '); 
            document.getElementById('inputOutrasPragas').style.display = 'block'; 
        } else { 
            document.getElementById('checkOutrasPragas').checked = false; 
            document.getElementById('inputOutrasPragas').style.display = 'none'; 
        }

        document.querySelectorAll('.check-equipe').forEach(cb => cb.checked = false); 
        let equipes = reg.equipe.split(', '), outrasEquipes = []; 
        equipes.forEach(eq => { 
            const cb = document.querySelector(`.check-equipe[value="${eq}"]`); 
            if(cb) cb.checked = true; 
            else if(eq) outrasEquipes.push(eq); 
        });
        
        if (outrasEquipes.length > 0) { 
            document.getElementById('checkOutraEquipe').checked = true; 
            document.getElementById('inputOutraEquipe').value = outrasEquipes.join(', '); 
            document.getElementById('inputOutraEquipe').style.display = 'block'; 
        } else { 
            document.getElementById('checkOutraEquipe').checked = false; 
            document.getElementById('inputOutraEquipe').style.display = 'none'; 
        }

        document.querySelectorAll('input[name="grupoSupervisor"]').forEach(r => r.checked = false); 
        const supRadio = document.querySelector(`input[name="grupoSupervisor"][value="${reg.supervisor}"]`);
        if (supRadio) { 
            supRadio.checked = true; 
            document.getElementById('inputOutroSupervisor').style.display = 'none'; 
        } else { 
            document.getElementById('radioOutroSupervisor').checked = true; 
            document.getElementById('inputOutroSupervisor').value = reg.supervisor; 
            document.getElementById('inputOutroSupervisor').style.display = 'block'; 
        }

        document.querySelector('input[name="campo15"]').value = reg.representante;
        document.getElementById('codigoEdit').value = reg.codigo; 
        document.getElementById('tituloFormulario').innerHTML = `<span class="material-icons" style="font-size: 20px;">edit</span> Editando Serviço: ${reg.codigo}`; 
        document.getElementById('btnTexto').innerText = 'Atualizar Registro de Serviço'; 
        
        document.getElementById('avisoEdicaoFotos').style.display = 'flex'; 
        document.getElementById('btnCancelarEdicao').style.display = 'flex'; 
        
        setModoCliente('cadastrar'); 
        document.getElementById('boxModoCliente').style.display = 'none'; 
        
        bancoDeFotos = []; 
        atualizarGaleria(); 
        mudarTela('formulario');
    })
    .catch(e => {
        hideLoader();
        showToast("Falha de conexão ao buscar dados completos.", "error");
    });
}

function resetarFormulario() {
    document.getElementById('meuFormulario').reset(); 
    document.getElementById('codigoEdit').value = ''; 
    document.getElementById('tituloFormulario').innerText = 'Novo Registro de Serviço'; 
    document.getElementById('btnTexto').innerText = 'Concluir Registro de Serviço'; 
    
    document.getElementById('boxModoCliente').style.display = 'flex'; 
    document.getElementById('avisoEdicaoFotos').style.display = 'none'; 
    document.getElementById('btnCancelarEdicao').style.display = 'none'; 
    document.getElementById('duracao').value = ''; 
    
    document.getElementById('inputOutrasPragas').style.display = 'none';
    document.getElementById('inputOutraEquipe').style.display = 'none';
    document.getElementById('inputOutroSupervisor').style.display = 'none';
    
    document.getElementById('areaImportar').style.display = 'none'; 
    document.getElementById('areaCadastrar').style.display = 'none'; 
    
    document.getElementById('btnModoImportar').classList.remove('btn-novo'); 
    document.getElementById('btnModoImportar').classList.add('btn-historico'); 
    document.getElementById('btnModoCadastrar').classList.remove('btn-novo'); 
    document.getElementById('btnModoCadastrar').classList.add('btn-historico'); 
    
    bancoDeFotos = []; 
    atualizarGaleria();
}

// =========================================================================
// GESTÃO DE CLIENTES E EQUIPE
// =========================================================================
let bancoClientes = []; 
let clientesCarregados = false;

function carregarColaboradores() { 
    fetch(`${scriptURL}?action=listarColaboradores`)
    .then(r => r.json())
    .then(data => { 
        if (data.sucesso) { 
            const grid = document.getElementById('gridEquipe'); 
            const labelOutros = document.getElementById('labelEquipeOutros'); 
            document.getElementById('statusEquipe').style.display = 'none'; 
            
            data.colaboradores.forEach(nome => { 
                const lbl = document.createElement('label'); 
                lbl.className = 'checkbox-item'; 
                lbl.innerHTML = `<input type="checkbox" class="check-equipe" value="${nome}"> ${nome}`; 
                grid.insertBefore(lbl, labelOutros); 
            }); 
        } 
    }); 
}

function carregarBancoClientes() { 
    fetch(`${scriptURL}?action=listarTodosClientes`)
    .then(r => r.json())
    .then(d => { 
        if (d.sucesso) { 
            bancoClientes = d.clientes.sort((a,b)=>a.campo4.localeCompare(b.campo4)); 
            clientesCarregados = true; 
            if(document.getElementById('areaImportar').style.display === 'block'){ 
                document.getElementById('statusBusca').style.display = 'none'; 
                filtrarClientes(); 
            } 
        } 
    }); 
}

function setModoCliente(modo) { 
    const btnI = document.getElementById('btnModoImportar');
    const btnC = document.getElementById('btnModoCadastrar');
    const aI = document.getElementById('areaImportar');
    const aC = document.getElementById('areaCadastrar');
    const sts = document.getElementById('statusBusca'); 
    
    if (modo === 'importar') { 
        btnI.classList.add('btn-novo'); btnI.classList.remove('btn-historico');
        btnC.classList.add('btn-historico'); btnC.classList.remove('btn-novo');
        
        aI.style.display = 'block'; 
        aC.style.display = 'none'; 
        
        if(clientesCarregados) {
            sts.style.display='none'; 
            filtrarClientes();
        } else {
            sts.style.display='block'; 
            sts.innerText='A sincronizar banco de clientes...';
        } 
    } else { 
        btnI.classList.remove('btn-novo'); btnI.classList.add('btn-historico');
        btnC.classList.add('btn-novo'); btnC.classList.remove('btn-historico');
        
        aI.style.display = 'none'; 
        aC.style.display = 'block'; 
        document.getElementById('liveSearch').value = ''; 
    } 
}

document.getElementById('liveSearch').addEventListener('input', filtrarClientes);

function filtrarClientes() { 
    if(!clientesCarregados) return; 
    
    const t = document.getElementById('liveSearch').value.toLowerCase(); 
    const lista = document.getElementById('listaLive'); 
    lista.innerHTML = ''; 
    
    const filt = bancoClientes.filter(c => c.campo4.toLowerCase().includes(t)).slice(0, 5); 
    
    if(filt.length === 0){ 
        lista.innerHTML = '<div style="padding:10px; color:#6b7280; font-style:italic;">Nenhum cliente encontrado.</div>'; 
        return;
    } 
    
    filt.forEach(c => { 
        const div = document.createElement('div'); 
        div.className = 'resultado-item'; 
        
        const infoDiv = document.createElement('div'); 
        infoDiv.className = 'resultado-info';
        infoDiv.style.flex = "1";
        infoDiv.style.cursor = "pointer";
        infoDiv.innerHTML = `<div class="resultado-nome">${c.campo4}</div><div class="resultado-detalhes">Razão: ${c.campo1} | CNPJ: ${c.campo2}</div>`;
        infoDiv.onclick = () => selecionarClienteLive(c);
        
        const btnExcluir = document.createElement('button'); 
        btnExcluir.type = 'button'; 
        btnExcluir.className = 'btn-excluir-cliente';
        btnExcluir.innerHTML = `<span class="material-icons">delete</span>`; 
        btnExcluir.title = "Excluir Cliente Permanentemente";
        btnExcluir.onclick = (e) => { e.stopPropagation(); iniciarExclusaoCliente(c.campo2, c.campo4); };
        
        div.appendChild(infoDiv); 
        div.appendChild(btnExcluir); 
        lista.appendChild(div); 
    }); 
}

function selecionarClienteLive(c) { 
    document.getElementById('c_razao').value = c.campo1||''; 
    document.getElementById('c_cnpj').value = c.campo2||''; 
    document.getElementById('c_email').value = c.campo3||''; 
    document.getElementById('c_fantasia').value = c.campo4||''; 
    document.getElementById('c_endereco').value = c.campo5||''; 
    setModoCliente('cadastrar'); 
    showToast("Cliente selecionado e campos preenchidos!", "success");
}

// =========================================================================
// TRIGGERS E CÁLCULO DE DURAÇÃO
// =========================================================================
document.getElementById('horaIni').addEventListener('change', calcularDuracao);
document.getElementById('horaFim').addEventListener('change', calcularDuracao);

function calcularDuracao() { 
    const hI=document.getElementById('horaIni').value;
    const hF=document.getElementById('horaFim').value; 
    
    if(hI && hF){ 
        const dI=new Date(`2000-01-01T${hI}`);
        const dF=new Date(`2000-01-01T${hF}`); 
        let df = dF - dI; 
        if(df < 0) df += 24*60*60*1000; 
        const h = Math.floor(df / (1000*60*60));
        const m = Math.floor((df % (1000*60*60)) / (1000*60)); 
        document.getElementById('duracao').value = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`; 
    } else {
        document.getElementById('duracao').value = '';
    }
}

document.getElementById('checkOutrasPragas').addEventListener('change', function() {
    document.getElementById('inputOutrasPragas').style.display = this.checked ? 'block' : 'none';
});
document.getElementById('checkOutraEquipe').addEventListener('change', function() {
    document.getElementById('inputOutraEquipe').style.display = this.checked ? 'block' : 'none';
});
document.querySelectorAll('input[name="grupoSupervisor"]').forEach(r => {
    r.addEventListener('change', function() {
        document.getElementById('inputOutroSupervisor').style.display = document.getElementById('radioOutroSupervisor').checked ? 'block' : 'none';
    });
});

// =========================================================================
// SISTEMA DE FOTOS (Upload Local e Compressão)
// =========================================================================
let bancoDeFotos = [];

document.getElementById('campoFotos').addEventListener('change', adicionarFotos);

function adicionarFotos(e) { 
    const n = Array.from(e.target.files); 
    if (bancoDeFotos.length + n.length > 20) { 
        showToast('Limite de 20 fotos excedido.', 'error'); 
        e.target.value = ''; 
        return; 
    } 
    bancoDeFotos = bancoDeFotos.concat(n); 
    e.target.value = ''; 
    atualizarGaleria(); 
}

function removerFoto(i) { 
    bancoDeFotos.splice(i, 1); 
    atualizarGaleria(); 
}

function atualizarGaleria() { 
    const ct = document.getElementById('previewFotos'); 
    ct.innerHTML = ''; 
    bancoDeFotos.forEach((a, i) => { 
        const div = document.createElement('div'); 
        div.className = 'preview-item'; 
        div.innerHTML = `<img src="${URL.createObjectURL(a)}"><button type="button" class="btn-remover-foto" onclick="removerFoto(${i})"><span class="material-icons" style="font-size:14px;">close</span></button>`; 
        ct.appendChild(div); 
    }); 
    const txtCont = document.getElementById('textoContador');
    txtCont.innerText = bancoDeFotos.length; 
    txtCont.style.color = (bancoDeFotos.length === 20) ? '#ef4444' : '#004481'; 
}

function compactarImagem(file) { 
    return new Promise((resolve) => { 
        const reader = new FileReader(); 
        reader.readAsDataURL(file); 
        reader.onload = (e) => { 
            const img = new Image(); 
            img.src = e.target.result; 
            img.onload = () => { 
                const MAX_WIDTH = 1200, MAX_HEIGHT = 1200; 
                let w = img.width, h = img.height; 
                if (w > h) { 
                    if (w > MAX_WIDTH) { h *= MAX_WIDTH / w; w = MAX_WIDTH; } 
                } else { 
                    if (h > MAX_HEIGHT) { w *= MAX_HEIGHT / h; h = MAX_HEIGHT; } 
                } 
                const canvas = document.createElement('canvas'); 
                canvas.width = w; canvas.height = h; 
                const ctx = canvas.getContext('2d'); 
                ctx.drawImage(img, 0, 0, w, h); 
                resolve({ nome: file.name, dadosBase64: canvas.toDataURL('image/jpeg', 0.7) }); 
            }; 
        }; 
    }); 
}

// =========================================================================
// SUBMIT E VALIDAÇÃO DO FORMULÁRIO
// =========================================================================
const form = document.getElementById('meuFormulario');
const btnEnviar = document.getElementById('btnEnviar');
const btnTexto = document.getElementById('btnTexto');

function resetarBotao() { 
    btnEnviar.disabled = false; 
    btnTexto.innerText = document.getElementById('codigoEdit').value === '' ? 'Concluir Registro de Serviço' : 'Atualizar Registro de Serviço'; 
}

form.addEventListener('submit', async e => {
    e.preventDefault(); 
    
    if(document.getElementById('c_razao').value === '') { 
        showToast('Importe ou cadastre um cliente!', 'error'); 
        return; 
    }
    
    // Tratamento de Pragas Alvo
    const ckP = document.querySelectorAll('.check-praga:checked'); 
    let pSel = Array.from(ckP).map(cb => cb.value); 
    if (document.getElementById('checkOutrasPragas').checked) { 
        const o = document.getElementById('inputOutrasPragas').value.trim(); 
        if(o) pSel.push(o); 
    } 
    if(pSel.length === 0){ 
        showToast('Selecione pelo menos uma Praga Alvo.', 'error'); 
        return;
    } 
    document.getElementById('campo12Final').value = pSel.join(', ');
    
    // Tratamento de Colaboradores
    const ckE = document.querySelectorAll('.check-equipe:checked'); 
    let eSel = Array.from(ckE).map(cb => cb.value); 
    if (document.getElementById('checkOutraEquipe').checked) { 
        const o = document.getElementById('inputOutraEquipe').value.trim(); 
        if(o) eSel.push(o); 
    } 
    if(eSel.length === 0){
        showToast('Selecione pelo menos um colaborador da equipe.', 'error'); 
        return;
    } 
    document.getElementById('campo13Final').value = eSel.join(', ');
    
    // Tratamento do Supervisor
    const supS = document.querySelector('input[name="grupoSupervisor"]:checked'); 
    if(!supS){
        showToast('Selecione o Supervisor responsável.', 'error'); 
        return;
    } 
    let nSup = supS.value; 
    if (nSup === 'Outro') nSup = document.getElementById('inputOutroSupervisor').value.trim(); 
    document.getElementById('campo14Final').value = nSup;
    
    if(bancoDeFotos.length > 20) {
        showToast('Limite de 20 fotos atingido.', 'error'); 
        return;
    }

    btnEnviar.disabled = true; 
    document.getElementById('btnCancelarEdicao').style.pointerEvents = 'none';
    
    showLoader(document.getElementById('codigoEdit').value === '' ? 'Compactando imagens e salvando registo...' : 'Atualizando dados e criando novo PDF...');
    
    let arrayFotos = [];
    if (bancoDeFotos.length > 0) { 
        for (let i = 0; i < bancoDeFotos.length; i++) {
            arrayFotos.push(await compactarImagem(bancoDeFotos[i])); 
        }
    }
    
    const fd = new FormData(form); 
    if (arrayFotos.length > 0) fd.append('fotosUpload', JSON.stringify(arrayFotos));
    
    fetch(scriptURL, { method: 'POST', body: fd })
    .then(r => r.text())
    .then(t => {
        document.getElementById('btnCancelarEdicao').style.pointerEvents = 'auto';
        if(t.includes("Erro")) { 
            showToast(t, 'error'); 
            resetarBotao(); 
        } else { 
            resetarFormulario(); 
            resetarBotao(); 
            mudarTela('painel'); 
            showToast('✔ Registro salvo com sucesso e anexado ao Drive!', 'success'); 
        }
    }).catch(error => { 
        document.getElementById('btnCancelarEdicao').style.pointerEvents = 'auto'; 
        showToast('Erro de conexão com o sistema.', 'error'); 
        resetarBotao(); 
    })
    .finally(() => { hideLoader(); });
});
