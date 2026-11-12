/* =======================================================
   ARQUIVO: script-utils.js (RECIBOS)
   Variáveis Globais, Utilitários, Formatações e Máscaras
   ======================================================= */

const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbycL2E2wsmQIB7ta3EyLH8NpzzMo5trtHySkRIsXWIX64OzdOMTcCoxjiDfefhm6EGuMQ/exec";

// Variáveis Globais partilhadas entre os ficheiros
var baseServicosGeral = [];
var historicoImoveis = [];
var historicoVeiculos = [];
var dashState = 'imovel'; 
var filtroHistoricoAtual = 'imoveis'; 
var paginaAtual = 1; 
const itensPorPagina = 10;
var idReciboEmEdicao = null; 
var tipoReciboEdicao = null;
var modalImportacaoContext = 'imovel'; 

const loaderHTML = '<tr><td colspan="5" style="text-align: center; color: #6b7280; padding: 25px;"><div style="display: flex; align-items: center; justify-content: center; gap: 10px; white-space: nowrap;"><span>Carregando dados...</span><div class="spinner" style="width: 18px; height: 18px; border-width: 3px; margin: 0; flex-shrink: 0;"></div></div></td></tr>';

// ==========================================
// SISTEMA DE ALERTAS CUSTOMIZADOS
// ==========================================
function mostrarAlerta(msg) { 
    document.getElementById("customAlertMsg").innerText = msg; 
    document.getElementById("customAlert").style.display = "flex"; 
}
function fecharAlerta() { 
    document.getElementById("customAlert").style.display = "none"; 
}

var confirmCallback = null;
function mostrarConfirmacao(msg, callback) { 
    document.getElementById("customConfirmMsg").innerText = msg; 
    confirmCallback = callback; 
    document.getElementById("customConfirm").style.display = "flex"; 
}
function fecharConfirmacao() { 
    document.getElementById("customConfirm").style.display = "none"; 
}
document.getElementById("btnCustomConfirmAcao").addEventListener("click", () => { 
    fecharConfirmacao(); 
    if(confirmCallback) confirmCallback(); 
});

// ==========================================
// DETEÇÃO DE TEMA (CLARO/ESCURO)
// ==========================================
function verificarTemaFundo() {
    const titulos = document.querySelectorAll('.titulo-tela, .form-header h2, .form-header p, .modal-box h3');

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
        if (luminosidade < 128 && bg !== 'rgba(0, 0, 0, 0)') titulos.forEach(t => t.classList.add('tema-escuro-texto'));
        else if (bg !== 'rgba(0, 0, 0, 0)') titulos.forEach(t => t.classList.remove('tema-escuro-texto'));
    }
}

// ==========================================
// UTILITÁRIOS E FORMATAÇÕES
// ==========================================
function reverterDataExtensoParaIso(s) {
    if(!s) return ""; const ms = {"janeiro":"01","fevereiro":"02","março":"03","abril":"04","maio":"05","junho":"06","julho":"07","agosto":"08","setembro":"09","outubro":"10","novembro":"11","dezembro":"12"};
    const m = s.match(/(\d{1,2}) de ([a-zç]+) de (\d{4})/i); return m ? `${m[3]}-${ms[m[2].toLowerCase()]}-${m[1].padStart(2,'0')}` : "";
}

function dataParaExtenso(d) { 
    if(!d) return ""; const p=d.split('-'), m=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"]; 
    return `${parseInt(p[2], 10)} de ${m[parseInt(p[1], 10)-1]} de ${p[0]}`; 
}

function formatarDataPadrao(d) { 
    if(!d) return "-"; const p=d.split("-"); 
    return p.length===3 ? `${p[2]}/${p[1]}/${p[0]}` : d; 
}

function numeroParaExtenso(v) { 
    if(!v||v==="0,00")return ""; 
    const un=['','um','dois','três','quatro','cinco','seis','sete','oito','nove'], dz=['','','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa'], dz10=['dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove'], cn=['','cento','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos']; 
    function cv(n){ let r=[],c=Math.floor(n/100),d=Math.floor((n%100)/10),u=n%10; if(c>0)r.push(c===1&&d===0&&u===0?'cem':cn[c]); if(d===1)r.push(dz10[u]);else{if(d>1)r.push(dz[d]);if(u>0)r.push(un[u]);} return r.join(' e '); } 
    let num=v.replace(/\./g,"").split(","), r=parseInt(num[0],10)||0, c=parseInt(num[1]||"0",10), rs=""; 
    if(r>0){ let mi=Math.floor(r/1000000), mr=r%1000000, ms=mi>0?(cv(mi)+(mi===1?' milhão':' milhões')):'', ml=Math.floor(mr/1000), mlr=mr%1000, mls=ml>0?(cv(ml)+' mil'):'', us=mlr>0?cv(mlr):'', p=[]; if(ms)p.push(ms);if(mls)p.push(mls);if(us){if(p.length>0&&mlr<100)p.push('e '+us);else p.push(us);} rs=p.join(', ').replace(/, e /g,' e ')+(r===1?' real':' reais'); } 
    let cs=c>0?cv(c)+(c===1?' centavo':' centavos'):""; 
    return (r>0&&c>0) ? rs+' e '+cs : (r>0?rs:cs); 
}

// Máscaras (Definições)
function setupMascaraPessoa(nomeRadios, idDoc, idLabel) { 
    document.querySelectorAll(`input[name="${nomeRadios}"]`).forEach(r => r.addEventListener('change', (e) => { 
        let d = document.getElementById(idDoc); 
        if(e.target.value === 'F') { document.getElementById(idLabel).innerText = 'CPF'; d.placeholder = '000.000.000-00'; } 
        else { document.getElementById(idLabel).innerText = 'CNPJ'; d.placeholder = '00.000.000/0001-00'; } d.value = ''; 
    })); 
    document.getElementById(idDoc).addEventListener('input', function(e) { 
        let t = document.querySelector(`input[name="${nomeRadios}"]:checked`).value, v = e.target.value.replace(/\D/g, ''); 
        if (t === 'F') { if(v.length>11)v=v.substring(0,11); v=v.replace(/(\d{3})(\d)/,"$1.$2"); v=v.replace(/(\d{3})(\d)/,"$1.$2"); v=v.replace(/(\d{3})(\d{1,2})$/,"$1-$2"); } 
        else { if(v.length>14)v=v.substring(0,14); v=v.replace(/(\d{2})(\d)/,"$1.$2"); v=v.replace(/(\d{3})(\d)/,"$1.$2"); v=v.replace(/(\d{3})(\d)/,"$1/$2"); v=v.replace(/(\d{4})(\d{1,2})$/,"$1-$2"); } 
        e.target.value = v; 
    }); 
}

function setupMascaraValor(idValor, idExtenso) { 
    document.getElementById(idValor).addEventListener('input', function(e) { 
        let v = e.target.value.replace(/\D/g, ''); 
        if (v === '') { e.target.value = ''; document.getElementById(idExtenso).value = ''; return; } 
        v = (parseInt(v, 10)/100).toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'); 
        e.target.value = v; document.getElementById(idExtenso).value = numeroParaExtenso(v); 
    }); 
}
