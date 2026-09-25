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

        // Dispara o carregamento dos dados iniciais assim que o aplicativo abre
        window.onload = function() {
            aplicarFiltroPrincipal();
        };

        function abrirModal(id) { document.getElementById(id).style.display = 'flex'; }
        function fecharModal(id) { document.getElementById(id).style.display = 'none'; }

        function abrirModalSelecaoNovo() { idEmEdicao = null; abrirModal('modal-selecao'); }
        
        function prepararFormularioNovo(idModal) {
            fecharModal('modal-selecao');
            idEmEdicao = null;
            document.getElementById('form-dedetizacao').reset();
            document.getElementById('form-limpeza').reset();
            document.getElementById('form-termo').reset();
            document.getElementById('obs-limp').innerHTML = '';
            document.getElementById('titulo-modal-dedetizacao').innerText = 'Novo Comunicado - Dedetização';
            document.getElementById('titulo-modal-limpeza').innerText = 'Novo Comunicado - Limpeza';
            document.getElementById('titulo-modal-termo').innerText = 'Novo Comunicado - Fumacê';
            document.getElementById('btn-salvar-dedetizacao').innerText = 'Salvar Comunicado';
            document.getElementById('btn-salvar-limpeza').innerText = 'Salvar Comunicado';
            document.getElementById('btn-salvar-termo').innerText = 'Salvar Comunicado';
            
            servGeralOutrasOpcoes.forEach(cb => cb.disabled = false); document.getElementById('serv-geral-outro-txt').classList.add('hidden');
            [1, 2, 3].forEach(id => { memoriaPragas[id] = []; memoriaPragasOutrosTxt[id] = ""; document.getElementById(`serv-outro-txt-${id}`).classList.add('hidden'); document.getElementById(`imovel-outro-txt-${id}`).classList.add('hidden'); });
            document.getElementById('praga-outros-txt').classList.add('hidden');
            document.getElementById('display-pragas-1').innerText = "Nenhuma praga selecionada."; document.getElementById('display-pragas-2').innerText = "Nenhuma praga selecionada."; document.getElementById('display-pragas-3').innerText = "Nenhuma praga selecionada.";
            
            abrirModal(idModal); 
            if(idModal === 'modal-dedetizacao') { ativarCard(1); }
        }

        async function aplicarFiltroPrincipal() { 
            const tbody = document.getElementById('tabela-corpo-ultimos');
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color:#6b7280;">Carregando comunicados...</td></tr>';
            
            const res = await fetchAPI('listar', { aba: filtroAtualPrincipal, limite: 5 }, "Carregando comunicados...");
            
            if (res.sucesso) { 
                // Atualiza o Número de Totais
                const dashTotal = document.getElementById('dashTotal');
                if (dashTotal) {
                    dashTotal.innerText = res.total || res.registros.length;
                }
                
                desenharLinhas(res.registros, 'tabela-corpo-ultimos'); 
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color:var(--error-color);">Erro ao carregar dados.</td></tr>';
            }
        }

        function setFiltroPrincipal(filtro, btnElement) {
            filtroAtualPrincipal = filtro; const container = btnElement.parentElement;
            container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); btnElement.classList.add('active');
            
            // --- ATUALIZAÇÃO DO NOME NO CARTÃO DE MÉTRICAS ---
            let tituloMetrica = filtro;
            if (filtro === "Dedetizacao") tituloMetrica = "Dedetização";
            if (filtro === "Limpeza") tituloMetrica = "Limpeza";
            if (filtro === "Termo") tituloMetrica = "Fumacê";

            const lblTotal = document.getElementById('lblTotal');
            if (lblTotal) {
                lblTotal.innerText = "Total de " + tituloMetrica;
            }
            // -------------------------------------------------
            
            aplicarFiltroPrincipal();
        }

        function abrirModalHistorico() { abrirModal('modal-historico'); dispararBuscaHistorico(); }

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
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color:#6b7280;">Buscando histórico...</td></tr>';
            
            const searchCliente = document.getElementById('filtro-cliente').value;
            const dataInicioStr = document.getElementById('filtro-data-inicio').value;
            const dataFimStr = document.getElementById('filtro-data-fim').value;

            const res = await fetchAPI('listar', { 
                aba: filtroAtualHistorico, 
                limite: itemsPerPage, 
                pagina: currentPage,
                busca: searchCliente,
                dataInicio: dataInicioStr,
                dataFim: dataFimStr
            }, "Buscando histórico...");
            
            if (res.sucesso) {
                desenharLinhas(res.registros, 'tabela-corpo-historico');
                
                totalPagesCache = Math.ceil(res.total / itemsPerPage) || 1;
                document.getElementById('page-info').innerText = `Página ${currentPage} de ${totalPagesCache}`;
                document.getElementById('btn-prev-page').disabled = (currentPage === 1);
                document.getElementById('btn-next-page').disabled = (currentPage >= totalPagesCache);
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color:var(--error-color);">Erro ao carregar dados.</td></tr>';
            }
        }

        function mudarPagina(direcao) {
            currentPage += direcao;
            if (currentPage < 1) currentPage = 1;
            if (currentPage > totalPagesCache) currentPage = totalPagesCache;
            aplicarFiltrosEBusca(); 
        }

        async function abrirModalImportacao(tipoServico) {
            tipoImportacaoAtual = tipoServico;
            document.getElementById('input-busca-importacao').value = '';
            
            let abaParaBackend = tipoServico;
            const res = await fetchAPI('listar', { aba: abaParaBackend, limite: 100 }, "Carregando clientes para importação..."); 
            
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
            const res = await fetchAPI('buscar_registro', { id: id, tipo: tipo }, "Extraindo dados completos...");
            if (!res.sucesso) { showToast(res.mensagem, 'error'); return; }
            
            const dados = res.dados;
            
            if (tipo === 'Dedetização' || tipo === 'Dedetizacao') {
                if(!isImportacao) {
                    idEmEdicao = id;
                    document.getElementById('titulo-modal-dedetizacao').innerText = 'Editando Comunicado - Dedetização';
                    document.getElementById('btn-salvar-dedetizacao').innerText = 'Atualizar Comunicado';
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
                    memoriaPragas[idCard] = [];
                    memoriaPragasOutrosTxt[idCard] = "";
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
                
                if(!isImportacao) abrirModal('modal-dedetizacao');
                ativarCard(1);
                if(isImportacao) showToast("Dados preenchidos. Informe a Data.", "success");
            } 
            else if (tipo === 'Limpeza de Reservatório') {
                if(!isImportacao) {
                    idEmEdicao = id;
                    document.getElementById('titulo-modal-limpeza').innerText = 'Editando Comunicado - Limpeza';
                    document.getElementById('btn-salvar-limpeza').innerText = 'Atualizar Comunicado';
                } else {
                    idEmEdicao = null;
                    document.getElementById('data-limp').value = '';
                }
                
                document.getElementById('cliente-limp').value = dados.cliente || '';
                if(!isImportacao) document.getElementById('data-limp').value = dados.data || '';
                document.getElementById('obs-limp').innerHTML = dados.observacao || '';
                
                let radioVend = document.querySelector(`input[name="vendedor-limp"][value="${dados.vendedor}"]`);
                if(radioVend) radioVend.checked = true;
                
                if(!isImportacao) abrirModal('modal-limpeza');
                if(isImportacao) showToast("Dados preenchidos. Informe a Data.", "success");
            } 
            else if (tipo === 'Termonebulização') {
                if(!isImportacao) {
                    idEmEdicao = id;
                    document.getElementById('titulo-modal-termo').innerText = 'Editando Comunicado - Fumacê';
                    document.getElementById('btn-salvar-termo').innerText = 'Atualizar Comunicado';
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
                
                if(!isImportacao) abrirModal('modal-termo');
                if(isImportacao) showToast("Dados preenchidos. Informe a Data.", "success");
            }
        }

        async function editarRegistro(id, tipo) {
            fecharModal('modal-historico');
            await aplicarEngenhariaReversa(id, tipo, false);
        }

        function abrirLinkPdf(link) {
            if (!link || link === "undefined" || link.includes("Erro") || link === "") {
                showToast("PDF indisponível para este comunicado.", "error");
                return;
            }
            window.open(link, '_blank');
        }

        async function baixarPDF(id, tipo) {
            try {
                showToast("Baixando PDF do Drive...", "success");
                const res = await fetchAPI('iniciarCompartilhamentoPDF', { id: id, tipo: tipo }, "Baixando PDF do Drive...");
                
                if (!res.sucesso) { showToast(res.mensagem, "error"); return; }

                const base64Data = res.base64;
                const contentType = 'application/pdf';
                const byteCharacters = atob(base64Data);
                const byteArrays = [];

                for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                    const slice = byteCharacters.slice(offset, offset + 512);
                    const byteNumbers = new Array(slice.length);
                    for (let i = 0; i < slice.length; i++) { byteNumbers[i] = slice.charCodeAt(i); }
                    const byteArray = new Uint8Array(byteNumbers);
                    byteArrays.push(byteArray);
                }

                const blob = new Blob(byteArrays, { type: contentType });
                const nomeDoArquivo = res.nomeArquivo || "Documento.pdf";
                
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = nomeDoArquivo;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                showToast("Download concluído!", "success");

            } catch (error) { showToast("Erro ao baixar arquivo.", "error"); }
        }

        function desenharLinhas(registros, tbodyId) {
            const tbody = document.getElementById(tbodyId);
            tbody.innerHTML = '';
            if (registros.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Nenhum comunicado encontrado.</td></tr>'; return; }

            registros.forEach(item => {
                const tr = document.createElement('tr');
                
                const codigoSeguro = item.id || item.codigo || "";
                let botoesAcao = `
                    <button class="icon-btn" onclick="abrirLinkPdf('${item.linkPdf}')" title="Abrir">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </button>
                    <button class="icon-btn share" onclick="baixarPDF('${item.id}', '${item.servico}')" title="Baixar PDF">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </button>
                    <button class="icon-btn edit" onclick="editarRegistro('${codigoSeguro}', '${item.servico}')" title="Editar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="icon-btn delete" onclick="abrirModalExclusao('${codigoSeguro}')" title="Excluir">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                `;

                // --- NOVA ORDEM DAS COLUNAS DA TABELA ---
                // 1º Cliente | 2º Serviço | 3º Data | 4º Ações Centralizadas
                tr.innerHTML = `
                    <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.cliente || '-'}">
                        <strong>${item.cliente || '-'}</strong>
                    </td>
                    <td style="white-space: nowrap;">${item.servico || '-'}</td>
                    <td style="white-space: nowrap;">${item.data || '-'}</td>
                    <td class="actions" style="white-space: nowrap; width: 140px;">
                        ${botoesAcao}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        function inserirModeloLimpeza() {
            const editor = document.getElementById('obs-limp');
            const textoPadrao = `Informamos que, no período das <strong>XX horas às XX horas</strong>, serão realizadas a limpeza e higienização das cisternas, sem comprometimento no fornecimento de água.<br><br>Posteriormente, das <strong>XX horas às XX horas</strong>, será executada a limpeza das caixas d’água, ocasião em que haverá interrupção temporária no abastecimento de água do condomínio por algumas horas.`;
            
            if (editor.innerHTML.trim() !== '' && editor.innerHTML.trim() !== '<br>') {
                if(!confirm("Atenção: A caixa de texto já possui conteúdo. Deseja substituí-lo pelo modelo padrão?")) return;
            }
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
                if (this.value === "Outro") { txtInput.classList.remove('hidden'); txtInput.focus(); } 
                else { txtInput.classList.add('hidden'); txtInput.value = ''; }
            });

            document.getElementById(`serv-outro-cb-${id}`).addEventListener('change', function() {
                const txtInput = document.getElementById(`serv-outro-txt-${id}`);
                if (this.checked) { txtInput.classList.remove('hidden'); txtInput.focus(); } 
                else { txtInput.classList.add('hidden'); txtInput.value = ''; }
            });
        });

        document.querySelectorAll('.servico-cb-1, .servico-cb-2, .servico-cb-3').forEach(cb => {
            cb.addEventListener('change', function() {
                let idCard = this.classList.contains('servico-cb-1') ? 1 : (this.classList.contains('servico-cb-2') ? 2 : 3);
                const servico = this.value;
                const isChecked = this.checked;
                let pragasAfetadas = [];
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
            cardAtivo = idCard;
            document.querySelectorAll('.promo-card').forEach(card => card.classList.remove('active'));
            document.getElementById('card-' + idCard).classList.add('active');
            
            document.querySelectorAll('.praga-cb').forEach(cb => { cb.checked = memoriaPragas[idCard].includes(cb.value); });
            const txtOutrosPragas = document.getElementById('praga-outros-txt');
            if (memoriaPragas[idCard].includes("OUTROS")) {
                txtOutrosPragas.classList.remove('hidden'); txtOutrosPragas.value = memoriaPragasOutrosTxt[idCard];
            } else { txtOutrosPragas.classList.add('hidden'); txtOutrosPragas.value = ""; }
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
            const display = document.getElementById('display-pragas-' + idCard);
            let pragasParaMostrar = [...memoriaPragas[idCard]];
            const indexOutros = pragasParaMostrar.indexOf("OUTROS");
            if (indexOutros > -1 && memoriaPragasOutrosTxt[idCard].trim() !== "") { pragasParaMostrar[indexOutros] = memoriaPragasOutrosTxt[idCard]; }
            display.innerText = pragasParaMostrar.length > 0 ? pragasParaMostrar.join(', ') : "Nenhuma praga selecionada.";
        }

        function showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `<span>${message}</span>`;
            container.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
        }

        function toggleLoader(show, text = "Processando, aguarde...") {
            const loader = document.getElementById('global-loader');
            const loaderText = document.getElementById('global-loader-text');
            if (show) {
                loaderText.innerText = text;
                loader.classList.remove('hidden');
            } else {
                loader.classList.add('hidden');
            }
        }

        async function fetchAPI(action, dados = {}, mensagemLoader = "Processando, aguarde...") {
            try {
                toggleLoader(true, mensagemLoader);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 45000);

                const response = await fetch(URL_SCRIPT, { 
                    method: 'POST', 
                    body: JSON.stringify({ action: action, dados: dados }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                const result = await response.json();
                
                toggleLoader(false);
                return result;
                
            } catch (error) { 
                toggleLoader(false); 
                if (error.name === 'AbortError') {
                    showToast("O servidor demorou muito para responder. Verifique o histórico se a ação foi concluída.", "error");
                } else {
                    showToast("Falha na conexão com o servidor. Verifique sua internet.", "error"); 
                }
                return { sucesso: false }; 
            }
        }

        function obterServicosGerais() { return Array.from(document.querySelectorAll('.servico-geral-cb:checked')).map(cb => { if (cb.value === "Outro") return document.getElementById('serv-geral-outro-txt').value.trim() || "Outro"; return cb.value; }).join(', '); }
        function obterImovelDoCard(idCard) { const select = document.getElementById(`imovel-${idCard}`); if (select.value === "Outro") return document.getElementById(`imovel-outro-txt-${idCard}`).value.trim() || "Outro"; return select.value; }
        function obterServicosDoCard(idCard) { return Array.from(document.querySelectorAll(`.servico-cb-${idCard}:checked`)).map(cb => { if (cb.value === "Outro") return document.getElementById(`serv-outro-txt-${idCard}`).value.trim() || "Outro"; return cb.value; }).join(', '); }
        function obterPragasDoCard(idCard) { let pragas = [...memoriaPragas[idCard]]; const indexOutros = pragas.indexOf("OUTROS"); if (indexOutros > -1) pragas[indexOutros] = memoriaPragasOutrosTxt[idCard].trim() || "OUTROS"; return pragas.join(', '); }

        document.getElementById('form-dedetizacao').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSalvar = document.getElementById('btn-salvar-dedetizacao');
            btnSalvar.disabled = true; btnSalvar.textContent = "Processando...";
            const dados = {
                id: idEmEdicao, cliente: document.getElementById('cliente').value, data: document.getElementById('data').value,
                previsao: `${document.getElementById('hora-inicio').value} às ${document.getElementById('hora-fim').value}`,
                servico: obterServicosGerais(), vendedor: document.querySelector('input[name="vendedor"]:checked').value,
                promo1: { valor: document.getElementById('valor-1').value, imovel: obterImovelDoCard(1), servicos: obterServicosDoCard(1), pragas: obterPragasDoCard(1) },
                promo2: { valor: document.getElementById('valor-2').value, imovel: obterImovelDoCard(2), servicos: obterServicosDoCard(2), pragas: obterPragasDoCard(2) },
                promo3: { valor: document.getElementById('valor-3').value, imovel: obterImovelDoCard(3), servicos: obterServicosDoCard(3), pragas: obterPragasDoCard(3) }
            };
            const res = await fetchAPI('salvar_dedetizacao', dados, "Salvando e Gerando PDF..."); 
            if (res.sucesso) { showToast(res.mensagem, 'success'); fecharModal('modal-dedetizacao'); idEmEdicao = null; aplicarFiltroPrincipal(); dispararBuscaHistorico(); } 
            else { showToast("Erro ao salvar: " + res.mensagem, 'error'); }
            btnSalvar.disabled = false; btnSalvar.textContent = "Salvar Comunicado";
        });

        document.getElementById('form-limpeza').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSalvar = document.getElementById('btn-salvar-limpeza');
            btnSalvar.disabled = true; btnSalvar.textContent = "Processando...";
            const dados = { 
                id: idEmEdicao, cliente: document.getElementById('cliente-limp').value, data: document.getElementById('data-limp').value, 
                vendedor: document.querySelector('input[name="vendedor-limp"]:checked').value, observacao: document.getElementById('obs-limp').innerHTML 
            };
            const res = await fetchAPI('salvar_limpeza', dados, "Salvando e Gerando PDF..."); 
            if (res.sucesso) { showToast(res.mensagem, 'success'); fecharModal('modal-limpeza'); idEmEdicao = null; aplicarFiltroPrincipal(); dispararBuscaHistorico(); } 
            else { showToast("Erro ao salvar: " + res.mensagem, 'error'); }
            btnSalvar.disabled = false; btnSalvar.textContent = "Salvar Comunicado";
        });

        document.getElementById('form-termo').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSalvar = document.getElementById('btn-salvar-termo');
            btnSalvar.disabled = true; btnSalvar.textContent = "Processando...";
            const dados = { 
                id: idEmEdicao, cliente: document.getElementById('cliente-termo').value, data: document.getElementById('data-termo').value, 
                previsao: `${document.getElementById('hora-inicio-termo').value} às ${document.getElementById('hora-fim-termo').value}`, 
                vendedor: document.querySelector('input[name="vendedor-termo"]:checked').value 
            };
            const res = await fetchAPI('salvar_termo', dados, "Salvando e Gerando PDF..."); 
            if (res.sucesso) { showToast(res.mensagem, 'success'); fecharModal('modal-termo'); idEmEdicao = null; aplicarFiltroPrincipal(); dispararBuscaHistorico(); } 
            else { showToast("Erro ao salvar: " + res.mensagem, 'error'); }
            btnSalvar.disabled = false; btnSalvar.textContent = "Salvar Comunicado";
        });

        function abrirModalExclusao(id) { idParaExcluir = id; abrirModal('modal-exclusao'); }
        document.getElementById('btn-confirmar-exclusao').addEventListener('click', async () => {
            if (!idParaExcluir) return;
            fecharModal('modal-exclusao');
            const res = await fetchAPI('excluir', { id: idParaExcluir }, "Excluindo Comunicado e PDF...");
            if (res.sucesso) { showToast(res.mensagem, 'success'); aplicarFiltroPrincipal(); dispararBuscaHistorico(); } 
            else { showToast("Erro ao excluir: " + res.mensagem, 'error'); }
        });
