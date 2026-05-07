/* =============================================================================
    SISTEMA DE GERENCIAMENTO DE PEDIDOS - LÓGICA (JavaScript)
    =============================================================================
    Arquivo: script.js
    Descrição: Contém toda a lógica de funcionamento do sistema
    
    Funcionalidades:
    - Gerenciamento de pedidos (transporte e alimentação)
    - Armazenamento via LocalStorage
    - Renderização dinâmica de elementos
    - Impressão de relatórios
    
    Autor: Sistema de Pedidos
    Data: 27/04/2026
    ============================================================================= */

// =============================================================================
// VARIÁVEIS DE ESTADO
// Armazenam o estado atual do sistema
// =============================================================================

/**
 * Array que armazena todos os pedidos cadastrados
 * @type {Array} - Lista de objetos de pedido
 */
let pedidos = [];

/**
 * Tipo de pedido atualmente selecionado
 * @type {string} - 'transporte' ou 'alimentacao'
 */
let currentType = 'transporte';

/**
 * Contador para gerar IDs únicos para rotas
 * @type {number}
 */
let rotaCounter = 0;

/**
 * Contador para gerar IDs únicos para locais
 * @type {number}
 */
let localCounter = 0;

// =============================================================================
// INICIALIZAÇÃO
// Executado quando a página termina de carregar
// =============================================================================

/**
 * Evento disparado quando o DOM está pronto
 * Carrega pedidos do LocalStorage e renderiza a tabela
 */
document.addEventListener('DOMContentLoaded', () => {
    loadPedidos();     // Carrega pedidos salvos
    renderPedidos();   // Renderiza a tabela de pedidos
});

// =============================================================================
// FUNÇÕES DE SELEÇÃO DE TIPO
// =============================================================================

/**
 * Seleciona o tipo de pedido (transporte ou alimentação)
 * Atualiza a interface mostrando a seção correspondente
 * 
 * @param {string} type - Tipo de pedido: 'transporte' ou 'alimentacao'
 */
function selectType(type) {
    // Atualiza a variável de estado
    currentType = type;
    
    // Remove seleção de todas as opções
    document.querySelectorAll('.type-option').forEach(opt => {
        opt.classList.remove('selected');
        // Adiciona seleção à opção clicada
        if (opt.dataset.type === type) {
            opt.classList.add('selected');
        }
    });

    // Oculta todas as seções
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Exibe a seção do tipo selecionado
    document.getElementById(`${type}-section`).classList.add('active');
}

// =============================================================================
// FUNÇÕES DE TRANSPORTE (ROTAS E ESCOLAS)
// =============================================================================

/**
 * Adiciona uma nova rota ao formulário de transporte
 * Cria os campos para horário, destino e lista de escolas
 */
function addRota() {
    // Incrementa o contador de rotas
    rotaCounter++;
    const rotaId = `rota-${rotaCounter}`;
    
    // Template HTML para uma nova rota
    const rotaHTML = `
        <div class="item-card" id="${rotaId}">
            <div class="item-header">
                <span class="item-title">Rota ${rotaCounter}</span>
                <button class="btn btn-danger btn-sm" onclick="removeItem('${rotaId}')">Remover</button>
            </div>
            <div class="item-fields">
                <div class="form-group">
                    <label>Dia</label>
                    <input type="date" class="rota-dia">
                </div>
                <div class="form-group">
                    <label>Horário</label>
                    <input type="time" class="rota-horario" placeholder="Ex: 07:00">
                </div>
                <div class="form-group">
                    <label>Destino</label>
                    <input type="text" class="rota-destino" placeholder="Ex: Escola Central">
                </div>
            </div>
            <div class="nested-list">
                <label>Escolas:</label>
                <div class="escolas-container" id="escolas-${rotaCounter}">
                    <!-- Escolas serão adicionadas aqui -->
                </div>
                <button class="btn btn-primary btn-sm" onclick="addEscola(${rotaCounter})">+ Adicionar Escola</button>
            </div>
        </div>
    `;
    
    // Insere o HTML no container de rotas
    document.getElementById('rotas-list').insertAdjacentHTML('beforeend', rotaHTML);
}

/**
 * Adiciona uma escola a uma rota específica
 * 
 * @param {number} rotaNum - Número identificador da rota
 */
function addEscola(rotaNum) {
    // Obtém o container da rota específica
    const container = document.getElementById(`escolas-${rotaNum}`);
    const escolaCount = container.children.length + 1;
    
    // Template HTML para uma nova escola
    const escolaHTML = `
        <div class="nested-item">
            <div class="nested-item-header">
                <span>Escola ${escolaCount}</span>
                <button class="btn btn-danger btn-sm" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="nested-fields">
                <div class="form-group">
                    <label>Nome da Escola</label>
                    <input type="text" class="escola-nome" placeholder="Ex: EE João Paulo II">
                </div>
            </div>
        </div>
    `;
    
    // Insere o HTML no container de escolas
    container.insertAdjacentHTML('beforeend', escolaHTML);
}

// =============================================================================
// FUNÇÕES DE ALIMENTAÇÃO (LOCAIS)
// =============================================================================

/**
 * Adiciona um novo local ao formulário de alimentação
 * Cria os campos para nome, horário e quantidade
 */
function addLocal() {
    // Incrementa o contador de locais
    localCounter++;
    const localId = `local-${localCounter}`;
    
    // Template HTML para um novo local
    const localHTML = `
        <div class="item-card" id="${localId}">
            <div class="item-header">
                <span class="item-title">Local ${localCounter}</span>
                <button class="btn btn-danger btn-sm" onclick="removeItem('${localId}')">Remover</button>
            </div>
            <div class="item-fields">
                <div class="form-group">
                    <label>Nome do Local</label>
                    <input type="text" class="local-nome" placeholder="Ex: Centro Comunitário">
                </div>
                <div class="form-group">
                    <label>Dia</label>
                    <input type="date" class="local-dia">
                </div>
                <div class="form-group">
                    <label>Horário</label>
                    <input type="time" class="local-horario" placeholder="Ex: 12:00">
                </div>
                <div class="form-group">
                    <label>Quantidade</label>
                    <input type="number" class="local-quantidade" placeholder="Ex: 50" min="1">
                </div>
            </div>
        </div>
    `;
    
    // Insere o HTML no container de locais
    document.getElementById('locais-list').insertAdjacentHTML('beforeend', localHTML);
}

/**
 * Remove um item (rota ou local) do formulário
 * 
 * @param {string} id - ID do elemento a ser removido
 */
function removeItem(id) {
    document.getElementById(id).remove();
}

// =============================================================================
// FUNÇÕES DE PERSISTÊNCIA (LOCALSTORAGE)
// =============================================================================

/**
 * Salva o array de pedidos no LocalStorage
 * Converte o array para JSON antes de salvar
 */
function savePedidos() {
    localStorage.setItem('sistema_pedidos', JSON.stringify(pedidos));
}

/**
 * Carrega os pedidos do LocalStorage
 * Converte de JSON para array JavaScript
 */
function loadPedidos() {
    const stored = localStorage.getItem('sistema_pedidos');
    if (stored) {
        pedidos = JSON.parse(stored);
    }
}

/**
 * Gera um ID único para cada pedido
 * Formato: PED-{timestamp}-{hash aleatório}
 * 
 * @returns {string} - ID único gerado
 */
function generateId() {
    return 'PED-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function formatDescricao(descricao) {
    return String(descricao || '').toLocaleUpperCase('pt-BR');
}

// =============================================================================
// FUNÇÕES DE CADASTRO
// =============================================================================

/**
 * Salva um novo pedido no sistema
 * Coleta os dados do formulário conforme o tipo selecionado
 */
function salvarPedido() {
    // Cria o objeto de pedido com dados iniciais
    const pedido = {
        id: generateId(),
        tipo: currentType,
        data: new Date().toISOString(),
        descricao: '',
        detalhes: []
    };

    // Processa conforme o tipo de pedido
    if (currentType === 'transporte') {
        // ==========================================
        // PROCESSAMENTO DE TRANSPORTE
        // ==========================================
        
        // Coleta a descrição
        const descricao = document.getElementById('transporte-descricao').value.trim();
        if (!descricao) {
            alert('Por favor, preencha a descrição do pedido.');
            return;
        }
        pedido.descricao = formatDescricao(descricao);

        // Coleta as rotas
        const rotasContainer = document.getElementById('rotas-list');
        const rotasCards = rotasContainer.querySelectorAll('.item-card');
        
        if (rotasCards.length === 0) {
            alert('Por favor, adicione pelo menos uma rota.');
            return;
        }

        let rotaInvalida = false;

        // Processa cada rota
        rotasCards.forEach((rota, index) => {
            if (rotaInvalida) return;

            const dia = rota.querySelector('.rota-dia').value;
            const horario = rota.querySelector('.rota-horario').value;
            const destino = rota.querySelector('.rota-destino').value;
            
            if (!dia || !horario || !destino) {
                alert(`Por favor, preencha o dia, horário e destino da Rota ${index + 1}.`);
                rotaInvalida = true;
                return;
            }

            // Coleta as escolas da rota
            const escolas = [];
            const escolasContainer = rota.querySelector('.escolas-container');
            const escolasItems = escolasContainer.querySelectorAll('.nested-item');
            
            escolasItems.forEach(escola => {
                const nome = escola.querySelector('.escola-nome').value;
                if (nome) {
                    escolas.push({ nome });
                }
            });

            if (escolas.length === 0) {
                alert(`Por favor, adicione pelo menos uma escola na Rota ${index + 1}.`);
                rotaInvalida = true;
                return;
            }

            // Adiciona a rota aos detalhes
            pedido.detalhes.push({
                tipo: 'rota',
                numero: index + 1,
                dia,
                horario,
                destino,
                escolas
            });
        });

        if (rotaInvalida) {
            return;
        }
        
    } else {
        // ==========================================
        // PROCESSAMENTO DE ALIMENTAÇÃO
        // ==========================================
        
        // Coleta a descrição
        const descricao = document.getElementById('alimentacao-descricao').value.trim();
        if (!descricao) {
            alert('Por favor, preencha a descrição do pedido.');
            return;
        }
        pedido.descricao = formatDescricao(descricao);

        // Coleta os locais
        const locaisContainer = document.getElementById('locais-list');
        const locaisCards = locaisContainer.querySelectorAll('.item-card');
        
        if (locaisCards.length === 0) {
            alert('Por favor, adicione pelo menos um local.');
            return;
        }

        let localInvalido = false;

        // Processa cada local
        locaisCards.forEach((local, index) => {
            if (localInvalido) return;

            const nome = local.querySelector('.local-nome').value;
            const dia = local.querySelector('.local-dia').value;
            const horario = local.querySelector('.local-horario').value;
            const quantidade = local.querySelector('.local-quantidade').value;
            
            if (!nome || !dia || !horario || !quantidade) {
                alert(`Por favor, preencha todos os campos do Local ${index + 1}.`);
                localInvalido = true;
                return;
            }

            // Adiciona o local aos detalhes
            pedido.detalhes.push({
                tipo: 'local',
                numero: index + 1,
                nome,
                dia,
                horario,
                quantidade: parseInt(quantidade)
            });
        });

        if (localInvalido) {
            return;
        }
    }

    // Salva o pedido no array e no LocalStorage
    pedidos.push(pedido);
    savePedidos();
    
    // Limpa o formulário
    clearForm();
    
    // Atualiza a tabela
    renderPedidos();
    
    alert('Pedido salvo com sucesso!');
}

/**
 * Limpa os campos do formulário após salvar
 */
function clearForm() {
    document.getElementById('transporte-descricao').value = '';
    document.getElementById('alimentacao-descricao').value = '';
    document.getElementById('rotas-list').innerHTML = '';
    document.getElementById('locais-list').innerHTML = '';
    rotaCounter = 0;
    localCounter = 0;
}

// =============================================================================
// FUNÇÕES DE RENDERIZAÇÃO
// =============================================================================

/**
 * Renderiza a tabela de pedidos com todos os cadastros
 */
function renderPedidos() {
    const tbody = document.getElementById('pedidos-tbody');
    const emptyState = document.getElementById('empty-state');
    
    // Verifica se há pedidos
    if (pedidos.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Gera o HTML de cada linha da tabela
    tbody.innerHTML = pedidos.map(pedido => {
        const tipoLabel = pedido.tipo === 'transporte' ? 'Transporte' : 'Alimentação';
        const dataFormatada = new Date(pedido.data).toLocaleDateString('pt-BR');
        
        // Gera o resumo dos detalhes
        let detalhesResumo = '';
        if (pedido.tipo === 'transporte') {
            const totalEscolas = pedido.detalhes.reduce((acc, rota) => acc + rota.escolas.length, 0);
            detalhesResumo = `${pedido.detalhes.length} rota(s), ${totalEscolas} escola(s)`;
        } else {
            const totalQuantidade = pedido.detalhes.reduce((acc, local) => acc + local.quantidade, 0);
            detalhesResumo = `${pedido.detalhes.length} local(is), ${totalQuantidade} total`;
        }
        
        return `
            <tr>
                <td>${tipoLabel}</td>
                <td>${formatDescricao(pedido.descricao)}</td>
                <td>${dataFormatada}</td>
                <td>${detalhesResumo}</td>
                <td class="no-print">
                    <div class="actions">
                        <button class="btn btn-primary btn-sm" onclick="viewDetails('${pedido.id}')">Ver</button>
                        <button class="btn btn-danger btn-sm" onclick="deletePedido('${pedido.id}')">Excluir</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// =============================================================================
// FUNÇÕES DE VISUALIZAÇÃO
// =============================================================================

/**
 * Exibe os detalhes de um pedido em um modal
 * 
 * @param {string} pedidoId - ID do pedido a ser visualizado
 */
function viewDetails(pedidoId) {
    // Localiza o pedido
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;

    const modalBody = document.getElementById('modal-body');
    const tipoLabel = pedido.tipo === 'transporte' ? 'Transporte' : 'Alimentação';
    const dataFormatada = new Date(pedido.data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    let detalhesHTML = '';
    
    // Gera o HTML dos detalhes conforme o tipo
    if (pedido.tipo === 'transporte') {
        // Template para rotas
        detalhesHTML = pedido.detalhes.map(rota => `
            <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px;">
                <h4 style="color: #2c3e50; margin-bottom: 10px;">Rota ${rota.numero}</h4>
                <p><strong>Dia:</strong> ${rota.dia ? new Date(`${rota.dia}T00:00:00`).toLocaleDateString('pt-BR') : '-'}</p>
                <p><strong>Horário:</strong> ${rota.horario}</p>
                <p><strong>Destino:</strong> ${rota.destino}</p>
                <p style="margin-top: 10px;"><strong>Escolas:</strong></p>
                <ul style="margin-left: 20px;">
                    ${rota.escolas.map(e => `<li>${e.nome}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    } else {
        // Template para locais de alimentação
        const totalGeral = pedido.detalhes.reduce((acc, local) => acc + local.quantidade, 0);
        detalhesHTML = pedido.detalhes.map(local => `
            <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px;">
                <h4 style="color: #2c3e50; margin-bottom: 10px;">Local ${local.numero}</h4>
                <p><strong>Nome:</strong> ${local.nome}</p>
                <p><strong>Dia:</strong> ${local.dia ? new Date(`${local.dia}T00:00:00`).toLocaleDateString('pt-BR') : '-'}</p>
                <p><strong>Horário:</strong> ${local.horario}</p>
                <p><strong>Quantidade:</strong> ${local.quantidade}</p>
            </div>
        `).join('');
        
        // Adiciona o total geral
        detalhesHTML += `
            <div style="margin-top: 20px; padding: 15px; background: #d4edda; border-radius: 4px;">
                <h4 style="color: #155724;">Total Geral: ${totalGeral}</h4>
            </div>
        `;
    }

    // Insere o conteúdo no modal
    modalBody.innerHTML = `
        <div style="margin-bottom: 15px;">
            <p><strong>Tipo:</strong> ${tipoLabel}</p>
            <p><strong>Descrição:</strong> ${formatDescricao(pedido.descricao)}</p>
            <p><strong>Data:</strong> ${dataFormatada}</p>
        </div>
        <hr style="margin: 20px 0;">
        <h4 style="color: #2c3e50; margin-bottom: 15px;">Detalhes:</h4>
        ${detalhesHTML}
    `;

    // Exibe o modal
    document.getElementById('details-modal').classList.add('active');
}

/**
 * Fecha o modal de detalhes
 */
function closeModal() {
    document.getElementById('details-modal').classList.remove('active');
}

// =============================================================================
// FUNÇÕES DE AÇÃO
// =============================================================================

/**
 * Exclui um pedido do sistema
 * 
 * @param {string} pedidoId - ID do pedido a ser excluído
 */
function deletePedido(pedidoId) {
    if (confirm('Tem certeza que deseja excluir este pedido?')) {
        // Filtra o pedido removendo-o do array
        pedidos = pedidos.filter(p => p.id !== pedidoId);
        savePedidos();
        renderPedidos();
        alert('Pedido excluído com sucesso!');
    }
}

// =============================================================================
// FUNÇÕES DE IMPRESSÃO
// =============================================================================

/**
 * Versao visual aprimorada do relatorio de impressao.
 * Esta declaracao substitui a implementacao anterior mantendo o mesmo botao.
 */
function imprimirPedidos() {
    if (pedidos.length === 0) {
        alert('Nenhum pedido para imprimir.');
        return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Nao foi possivel abrir a janela de impressao. Verifique o bloqueador de pop-ups.');
        return;
    }

    const escapeHTML = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const formatDate = (date) => new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const formatRouteDate = (date) => {
        if (!date) return '-';
        return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');
    };

    const dataGeracao = formatDate(new Date());
    let html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Relatorio de Pedidos</title>
            <style>
                @page { size: A4; margin: 14mm; }
                * { box-sizing: border-box; }
                body {
                    margin: 0;
                    color: #1f2933;
                    background: #fff;
                    font-family: "Segoe UI", Arial, sans-serif;
                    font-size: 12px;
                    line-height: 1.45;
                }
                .report-shell { max-width: 190mm; margin: 0 auto; }
                .report-header {
                    display: flex;
                    justify-content: space-between;
                    gap: 24px;
                    padding-bottom: 16px;
                    margin-bottom: 18px;
                    border-bottom: 3px solid #1f4e79;
                }
                .report-title {
                    margin: 0 0 6px;
                    color: #17324d;
                    font-size: 25px;
                    letter-spacing: 0;
                }
                .report-subtitle { margin: 0; color: #5d6b78; font-size: 12px; }
                .group-band {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin: 18px 0 10px;
                    padding: 9px 12px;
                    color: #ffffff;
                    background: #1f4e79;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0;
                    text-transform: uppercase;
                    break-after: avoid;
                    page-break-after: avoid;
                }
                .group-count {
                    font-size: 10px;
                    font-weight: 600;
                    opacity: 0.9;
                }
                .pedido-section {
                    break-inside: avoid;
                    page-break-inside: avoid;
                    margin-bottom: 18px;
                    border: 1px solid #d7dee8;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .pedido-header {
                    display: grid;
                    grid-template-columns: 1fr auto;
                    gap: 12px;
                    padding: 14px 16px;
                    background: #edf4fb;
                    border-bottom: 1px solid #d7dee8;
                }
                .pedido-descricao {
                    margin: 0;
                    color: #25313d;
                    font-size: 13px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .pedido-meta {
                    text-align: right;
                    color: #5d6b78;
                    font-size: 11px;
                    white-space: nowrap;
                }
                .tipo-badge {
                    display: inline-block;
                    margin-bottom: 6px;
                    padding: 4px 8px;
                    border-radius: 999px;
                    color: #17324d;
                    background: #fff;
                    border: 1px solid #c6d6e6;
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 10px;
                }
                .pedido-body { padding: 14px 16px 16px; }
                .detalhe-card {
                    break-inside: avoid;
                    page-break-inside: avoid;
                    margin-bottom: 12px;
                    padding: 12px;
                    border: 1px solid #dfe5ec;
                    border-radius: 6px;
                    background: #fff;
                }
                .detalhe-card:last-child { margin-bottom: 0; }
                .detalhe-title {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 8px;
                    color: #17324d;
                    font-size: 13px;
                    font-weight: 700;
                }
                .detail-grid {
                    display: grid;
                    grid-template-columns: 120px 120px 1fr;
                    gap: 8px 18px;
                    margin-bottom: 8px;
                }
                .detail-item span,
                .schools-label {
                    display: block;
                    color: #687888;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .detail-item strong { color: #25313d; font-size: 12px; }
                .school-list {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 6px;
                    margin: 6px 0 0;
                    padding: 0;
                    list-style: none;
                }
                .school-list li {
                    padding: 6px 8px;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    background: #f8fafc;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 2px;
                }
                th, td {
                    padding: 8px 9px;
                    border: 1px solid #dfe5ec;
                    text-align: left;
                    vertical-align: top;
                }
                th {
                    color: #17324d;
                    background: #edf4fb;
                    font-size: 10px;
                    text-transform: uppercase;
                }
                .number-cell, .total-number { text-align: right; }
                .total-row td {
                    background: #f1f7ef;
                    color: #1f5132;
                    font-weight: 700;
                }
                .report-footer {
                    margin-top: 18px;
                    padding-top: 10px;
                    border-top: 1px solid #d7dee8;
                    color: #748291;
                    font-size: 10px;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <main class="report-shell">
                <header class="report-header">
                    <div>
                        <h1 class="report-title">Relatorio de Pedidos</h1>
                        <p class="report-subtitle">Gerado em ${dataGeracao}</p>
                    </div>
                </header>
    `;

    const grupos = [
        { tipo: 'transporte', titulo: 'Transporte' },
        { tipo: 'alimentacao', titulo: 'Alimentacao' }
    ];

    grupos.forEach(grupo => {
        const pedidosDoGrupo = pedidos.filter(pedido => pedido.tipo === grupo.tipo);
        if (pedidosDoGrupo.length === 0) return;

        html += `
            <div class="group-band">
                <span>${grupo.titulo}</span>
                <span class="group-count">${pedidosDoGrupo.length} pedido(s)</span>
            </div>
        `;

        pedidosDoGrupo.forEach(pedido => {
            const tipoLabel = pedido.tipo === 'transporte' ? 'Transporte' : 'Alimentacao';

            html += `
                <section class="pedido-section">
                    <div class="pedido-header">
                        <div>
                            <h2 class="pedido-descricao">${escapeHTML(formatDescricao(pedido.descricao))}</h2>
                        </div>
                        <div class="pedido-meta">
                            <span class="tipo-badge">${tipoLabel}</span><br>
                            ${formatDate(pedido.data)}
                        </div>
                    </div>
                    <div class="pedido-body">
            `;

            if (pedido.tipo === 'transporte') {
                pedido.detalhes.forEach(rota => {
                    html += `
                        <div class="detalhe-card">
                            <div class="detalhe-title">
                                <span>Rota ${rota.numero}</span>
                                <span>${rota.escolas.length} escola(s)</span>
                            </div>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span>Dia</span>
                                    <strong>${formatRouteDate(rota.dia)}</strong>
                                </div>
                                <div class="detail-item">
                                    <span>Horario</span>
                                    <strong>${escapeHTML(rota.horario)}</strong>
                                </div>
                                <div class="detail-item">
                                    <span>Destino</span>
                                    <strong>${escapeHTML(rota.destino)}</strong>
                                </div>
                            </div>
                            <span class="schools-label">Escolas</span>
                            <ul class="school-list">
                                ${rota.escolas.map(e => `<li>${escapeHTML(e.nome)}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                });
            } else {
                let total = 0;
                html += `
                    <table>
                        <thead>
                            <tr>
                                <th>Local</th>
                                <th>Dia</th>
                                <th>Horario</th>
                                <th class="number-cell">Quantidade</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                pedido.detalhes.forEach(local => {
                    total += local.quantidade;
                    html += `
                        <tr>
                            <td>${escapeHTML(local.nome)}</td>
                            <td>${formatRouteDate(local.dia)}</td>
                            <td>${escapeHTML(local.horario)}</td>
                            <td class="number-cell">${local.quantidade}</td>
                        </tr>
                    `;
                });

                html += `
                            <tr class="total-row">
                                <td colspan="3">TOTAL GERAL</td>
                                <td class="total-number">${total}</td>
                            </tr>
                        </tbody>
                    </table>
                `;
            }

            html += `
                    </div>
                </section>
            `;
        });
    });

    html += `
                <footer class="report-footer">
                    Sistema de Gerenciamento de Pedidos
                </footer>
            </main>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

// =============================================================================
// EVENTOS ADICIONAIS
// =============================================================================

/**
 * Fecha o modal ao clicar fora do conteúdo
 */
document.getElementById('details-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('details-modal')) {
        closeModal();
    }
});
