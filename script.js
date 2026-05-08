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

let configuracoes = {
    responsavelAcao: '',
    sloganJogos: 'Jogos com organização, cuidado e entrega no tempo certo.',
    aguaTotalComprada: 0,
    aguaValorComprado: 0
};

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

let editingPedidoId = null;

const API_ORIGIN = window.location.protocol === 'file:' ? 'http://127.0.0.1:3000' : '';

// =============================================================================
// INICIALIZAÇÃO
// Executado quando a página termina de carregar
// =============================================================================

/**
 * Evento disparado quando o DOM está pronto
 * Carrega pedidos do LocalStorage e renderiza a tabela
 */
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfiguracoes();
    await loadPedidos();     // Carrega pedidos salvos
    renderPedidos();   // Renderiza a tabela de pedidos
    renderRelatorio();
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
                <span class="item-title">ROTA ${rotaCounter}</span>
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
                    <label>Quantidade de alimentação</label>
                    <input type="number" class="local-quantidade" placeholder="Ex: 50" min="1">
                </div>
                <div class="form-group">
                    <label>Água (litros)</label>
                    <input type="number" class="local-agua" placeholder="Ex: 20" min="0" step="0.01">
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
function apiUrl(path) {
    return `${API_ORIGIN}${path}`;
}

async function apiRequest(path, options = {}) {
    const response = await fetch(apiUrl(path), {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Erro ao acessar o banco de dados.');
    }

    return response.json();
}

async function savePedidos() {
    localStorage.setItem('sistema_pedidos', JSON.stringify(pedidos));

    try {
        await apiRequest('/api/pedidos', {
            method: 'PUT',
            body: JSON.stringify({ pedidos })
        });
    } catch (error) {
        console.error(error);
        showNotification('warning', 'Não foi possível salvar os pedidos no banco. Eles foram salvos localmente.');
    }
}

/**
 * Carrega os pedidos do LocalStorage
 * Converte de JSON para array JavaScript
 */
async function loadPedidos() {
    try {
        const pedidosAntigos = JSON.parse(localStorage.getItem('sistema_pedidos') || '[]');
        const state = await apiRequest('/api/state');
        pedidos = state.pedidos || [];

        if (pedidos.length === 0 && pedidosAntigos.length > 0) {
            pedidos = pedidosAntigos;
            await savePedidos();
        }

        localStorage.setItem('sistema_pedidos', JSON.stringify(pedidos));
    } catch (error) {
        console.error(error);
        const cachedPedidos = localStorage.getItem('sistema_pedidos');
        if (cachedPedidos) {
            pedidos = JSON.parse(cachedPedidos);
        }
        showNotification('warning', 'Nao foi possivel carregar o banco. Inicie o servidor com npm start e acesse http://127.0.0.1:3000.');
        return;
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

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getResponsavelAtual() {
    const pedidoInput = document.getElementById('responsavel-pedido');
    return String(pedidoInput?.value || configuracoes.responsavelAcao || '').trim();
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function pluralize(quantity, singular, plural = `${singular}s`) {
    return `${quantity} ${Number(quantity) === 1 ? singular : plural}`;
}

function formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function parseDecimal(value) {
    return parseFloat(String(value || '').replace(',', '.')) || 0;
}

function formatDateTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateOnly(date) {
    if (!date) return '-';
    return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');
}

async function saveConfiguracoes() {
    localStorage.setItem('sistema_pedidos_config', JSON.stringify(configuracoes));

    try {
        configuracoes = await apiRequest('/api/configuracoes', {
            method: 'PUT',
            body: JSON.stringify(configuracoes)
        });
    } catch (error) {
        console.error(error);
        showNotification('warning', 'Não foi possível salvar as configurações no banco. Ajustes foram salvos localmente.');
    }
}

async function loadConfiguracoes() {
    try {
        const state = await apiRequest('/api/state');
        configuracoes = { ...configuracoes, ...(state.configuracoes || {}) };

        const configAntiga = localStorage.getItem('sistema_pedidos_config');
        if (configAntiga && !configuracoes.responsavelAcao) {
            configuracoes = { ...configuracoes, ...JSON.parse(configAntiga) };
            await saveConfiguracoes();
        }
    } catch (error) {
        console.error(error);
        const cachedConfig = localStorage.getItem('sistema_pedidos_config');
        if (cachedConfig) {
            configuracoes = { ...configuracoes, ...JSON.parse(cachedConfig) };
        }
        showNotification('warning', 'Nao foi possivel carregar as configuracoes do banco. Inicie o servidor com npm start e acesse http://127.0.0.1:3000.');
        preencherConfiguracoes();
        return;
    }
    preencherConfiguracoes();
}

function preencherConfiguracoes() {
    const responsavelPedidoInput = document.getElementById('responsavel-pedido');
    const aguaTotalInput = document.getElementById('agua-total-comprada');
    const aguaValorInput = document.getElementById('agua-valor-comprado');

    if (responsavelPedidoInput && !responsavelPedidoInput.value) {
        responsavelPedidoInput.value = configuracoes.responsavelAcao || '';
    }
    if (aguaTotalInput) aguaTotalInput.value = configuracoes.aguaTotalComprada || '';
    if (aguaValorInput) aguaValorInput.value = configuracoes.aguaValorComprado || '';
}

function showNotification(type, message) {
    const bar = document.getElementById('notification-bar');
    if (!bar) return;
    bar.textContent = message;
    bar.className = `notification-bar notification-${type}`;
    bar.style.display = 'block';
    bar.style.opacity = '1';

    clearTimeout(bar.hideTimeout);
    bar.hideTimeout = setTimeout(() => {
        bar.style.opacity = '0';
        setTimeout(() => {
            bar.style.display = 'none';
            bar.className = 'notification-bar';
        }, 300);
    }, 7000);
}

async function salvarConfiguracoes() {
    configuracoes.aguaTotalComprada = parseDecimal(document.getElementById('agua-total-comprada').value);
    configuracoes.aguaValorComprado = parseDecimal(document.getElementById('agua-valor-comprado').value);

    await saveConfiguracoes();
    preencherConfiguracoes();
    renderRelatorio();
    showNotification('success', 'Configurações de água atualizadas com sucesso!');
}

function toggleWaterSettings() {
    const section = document.getElementById('water-settings');
    if (!section) return;
    section.classList.toggle('active');
}

// =============================================================================
// FUNÇÕES DE CADASTRO
// =============================================================================

/**
 * Salva um novo pedido no sistema
 * Coleta os dados do formulário conforme o tipo selecionado
 */
async function salvarPedido() {
    const responsavel = getResponsavelAtual();
    if (!responsavel) {
        showNotification('error', 'Por favor, preencha o responsável do pedido.');
        return;
    }

    configuracoes.responsavelAcao = responsavel;
    await saveConfiguracoes();

    const pedidoEditado = editingPedidoId ? pedidos.find(p => p.id === editingPedidoId) : null;

    // Cria o objeto de pedido com dados iniciais
    const pedido = {
        id: pedidoEditado?.id || generateId(),
        tipo: currentType,
        data: pedidoEditado?.data || new Date().toISOString(),
        criadoPor: responsavel,
        status: pedidoEditado?.status || 'pendente',
        entreguePor: pedidoEditado?.entreguePor || '',
        entregueEm: pedidoEditado?.entregueEm || '',
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
            showNotification('error', 'Por favor, preencha a descrição do pedido.');
            return;
        }
        pedido.descricao = formatDescricao(descricao);

        // Coleta as rotas
        const rotasContainer = document.getElementById('rotas-list');
        const rotasCards = rotasContainer.querySelectorAll('.item-card');
        
        if (rotasCards.length === 0) {
            showNotification('error', 'Por favor, adicione pelo menos uma rota.');
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
                showNotification('error', `Por favor, preencha o dia, horário e destino da Rota ${index + 1}.`);
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
                showNotification('error', `Por favor, adicione pelo menos uma escola na Rota ${index + 1}.`);
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
            showNotification('error', 'Por favor, preencha a descrição do pedido.');
            return;
        }
        pedido.descricao = formatDescricao(descricao);

        // Coleta os locais
        const locaisContainer = document.getElementById('locais-list');
        const locaisCards = locaisContainer.querySelectorAll('.item-card');
        
        if (locaisCards.length === 0) {
            showNotification('error', 'Por favor, adicione pelo menos um local.');
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
            const agua = local.querySelector('.local-agua').value;
            
            if (!nome || !dia || !horario || !quantidade) {
                showNotification('error', `Por favor, preencha todos os campos do Local ${index + 1}.`);
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
                quantidade: parseInt(quantidade),
                agua: parseDecimal(agua)
            });
        });

        if (localInvalido) {
            return;
        }
    }

    if (editingPedidoId) {
        pedidos = pedidos.map(p => p.id === editingPedidoId ? pedido : p);
    } else {
        pedidos.push(pedido);
    }
    await savePedidos();
    
    // Limpa o formulário
    clearForm();
    
    // Atualiza a tabela
    renderPedidos();
    
    showNotification('success', pedidoEditado ? 'Pedido atualizado com sucesso!' : 'Pedido salvo com sucesso!');
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
    editingPedidoId = null;
    const cancelarButton = document.getElementById('cancelar-edicao');
    if (cancelarButton) cancelarButton.style.display = 'none';
    const responsavelPedidoInput = document.getElementById('responsavel-pedido');
    if (responsavelPedidoInput) {
        responsavelPedidoInput.value = configuracoes.responsavelAcao || '';
    }
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
            detalhesResumo = `${pluralize(pedido.detalhes.length, 'rota')}, ${pluralize(totalEscolas, 'escola')}`;
        } else {
            const totalQuantidade = pedido.detalhes.reduce((acc, local) => acc + local.quantidade, 0);
            detalhesResumo = `${pluralize(pedido.detalhes.length, 'local', 'locais')}, ${pluralize(totalQuantidade, 'alimentacao', 'alimentacoes')}`;
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
                <h4 style="color: #2c3e50; margin-bottom: 10px;">ROTA ${rota.numero}</h4>
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
async function deletePedido(pedidoId) {
    if (confirm('Tem certeza que deseja excluir este pedido?')) {
        // Filtra o pedido removendo-o do array
        pedidos = pedidos.filter(p => p.id !== pedidoId);
        await savePedidos();
        renderPedidos();
        showNotification('success', 'Pedido excluído com sucesso!');
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
        showNotification('warning', 'Nenhum pedido para imprimir.');
        return;
    }

    const printWindow = window.electronAPI?.printReport
        ? { document: { write() {}, close() {} }, focus() {}, print() {}, close() {}, closed: true }
        : window.open('', '_blank');
    if (!printWindow) {
        showNotification('error', 'Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.');
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
    const logoUrl = new URL('logoJECS.png', window.location.href).href;
    const aguaUsada = getAguaUsada();
    const aguaDisponivel = Math.max(0, (Number(configuracoes.aguaTotalComprada) || 0) - aguaUsada);
    let html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Relatorio de Pedidos</title>
            <style>
                @page { size: A4; margin: 14mm; }
                * {
                    box-sizing: border-box;
                    print-color-adjust: exact;
                    -webkit-print-color-adjust: exact;
                }
                body {
                    margin: 0;
                    color: #1f2933;
                    background: #fff;
                    font-family: "Segoe UI", Arial, sans-serif;
                    font-size: 11px;
                    line-height: 1.32;
                }
                .report-shell { max-width: 190mm; margin: 0 auto; }
                .report-header {
                    display: block;
                    text-align: center;
                    padding-bottom: 10px;
                    margin-bottom: 10px;
                    border-bottom: 2px solid #1f2933;
                }
                .report-logo {
                    display: block;
                    width: auto;
                    max-width: 245px;
                    max-height: 145px;
                    margin: 0 auto 14px;
                    object-fit: contain;
                }
                .report-title {
                    margin: 0 0 6px;
                    color: #17324d;
                    font-size: 25px;
                    letter-spacing: 0;
                }
                .report-subtitle { margin: 0; color: #5d6b78; font-size: 12px; }
                .water-summary {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    margin: 0 0 10px;
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
                .water-card {
                    padding: 5px 8px;
                    border: 1px solid #7f8ea3;
                    border-radius: 6px;
                    background: #f8fafc;
                }
                .water-card span {
                    display: block;
                    color: #687888;
                    font-size: 9px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .water-card strong {
                    display: block;
                    margin-top: 2px;
                    color: #17324d;
                    font-size: 11px;
                }
                .group-band {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin: 10px 0 6px;
                    padding: 6px 9px;
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
                    margin-bottom: 10px;
                    border: 1px solid #5f6f83;
                    border-radius: 7px;
                    overflow: hidden;
                }
                .pedido-header {
                    display: grid;
                    grid-template-columns: 1fr auto;
                    gap: 8px;
                    padding: 8px 10px;
                    background: #edf4fb;
                    border-bottom: 1px solid #5f6f83;
                }
                .pedido-descricao {
                    margin: 0;
                    color: #25313d;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                .pedido-meta {
                    text-align: right;
                    color: #5d6b78;
                    font-size: 10px;
                    white-space: nowrap;
                }
                .tipo-badge {
                    display: inline-block;
                    margin-bottom: 3px;
                    padding: 3px 7px;
                    border-radius: 999px;
                    color: #17324d;
                    background: #fff;
                    border: 1px solid #5f6f83;
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 10px;
                }
                .pedido-body { padding: 8px 10px 10px; }
                .detalhe-card {
                    break-inside: avoid;
                    page-break-inside: avoid;
                    margin-bottom: 7px;
                    padding: 7px;
                    border: 1px solid #5f6f83;
                    border-radius: 6px;
                    background: #fff;
                }
                .detalhe-card:last-child { margin-bottom: 0; }
                .detalhe-title {
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                    margin-bottom: 5px;
                    color: #17324d;
                    font-size: 11px;
                    font-weight: 700;
                }
                .detail-grid {
                    display: grid;
                    grid-template-columns: 120px 120px 1fr;
                    gap: 5px 12px;
                    margin-bottom: 5px;
                }
                .detail-item span,
                .schools-label {
                    display: block;
                    color: #687888;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .detail-item strong { color: #25313d; font-size: 11px; }
                .school-list {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 4px;
                    margin: 4px 0 0;
                    padding: 0;
                    list-style: none;
                }
                .school-list li {
                    padding: 4px 6px;
                    border: 1px solid #7f8ea3;
                    border-radius: 4px;
                    background: #f8fafc;
                }
                table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin-top: 2px;
                    overflow: hidden;
                    border: 1px solid #4b5c70;
                    border-radius: 7px;
                }
                th, td {
                    padding: 5px 7px;
                    border-right: 1px solid #4b5c70;
                    border-bottom: 1px solid #4b5c70;
                    text-align: left;
                    vertical-align: top;
                }
                th:last-child, td:last-child { border-right: 0; }
                tbody tr:last-child td { border-bottom: 0; }
                th {
                    color: #17324d;
                    background: #e8f1fb;
                    font-size: 9px;
                    text-transform: uppercase;
                }
                tbody tr:nth-child(even) td { background: #f9fbfd; }
                .number-cell, .total-number { text-align: right; }
                .total-row td {
                    background: #eef8f1 !important;
                    color: #1f5132;
                    font-weight: 700;
                }
                .report-footer {
                    margin-top: 10px;
                    padding-top: 7px;
                    border-top: 1px solid #5f6f83;
                    color: #748291;
                    font-size: 10px;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <main class="report-shell">
                <header class="report-header">
                    <img class="report-logo" src="${logoUrl}" alt="Logo" onerror="this.style.display='none'">
                    <h1 class="report-title">Relatorio de Pedidos</h1>
                    <p class="report-subtitle">Gerado em ${dataGeracao}</p>
                </header>
                <section class="water-summary">
                    <div class="water-card">
                        <span>Agua usada</span>
                        <strong>${formatNumber(aguaUsada)} L</strong>
                    </div>
                    <div class="water-card">
                        <span>Agua disponivel</span>
                        <strong>${formatNumber(aguaDisponivel)} L</strong>
                    </div>
                    <div class="water-card">
                        <span>Valor da agua</span>
                        <strong>${formatCurrency(configuracoes.aguaValorComprado)}</strong>
                    </div>
                </section>
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
                <span class="group-count">${pluralize(pedidosDoGrupo.length, 'pedido')}</span>
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
                                <span>ROTA ${rota.numero}</span>
                                <span>${pluralize(rota.escolas.length, 'escola')}</span>
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
                let totalAgua = 0;
                html += `
                    <table>
                        <thead>
                            <tr>
                                <th>Local</th>
                                <th>Dia</th>
                                <th>Horario</th>
                                <th class="number-cell">Quantidade</th>
                                <th class="number-cell">Agua (L)</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                pedido.detalhes.forEach(local => {
                    total += Number(local.quantidade) || 0;
                    totalAgua += Number(local.agua) || 0;
                    html += `
                        <tr>
                            <td>${escapeHTML(local.nome)}</td>
                            <td>${formatRouteDate(local.dia)}</td>
                            <td>${escapeHTML(local.horario)}</td>
                            <td class="number-cell">${local.quantidade}</td>
                            <td class="number-cell">${formatNumber(local.agua)} L</td>
                        </tr>
                    `;
                });

                html += `
                            <tr class="total-row">
                                <td colspan="3">TOTAL GERAL</td>
                                <td class="total-number">${total}</td>
                                <td class="total-number">${formatNumber(totalAgua)} L</td>
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

    if (window.electronAPI?.printReport) {
        window.electronAPI.printReport(html).catch((error) => {
            console.error(error);
            showNotification('error', 'Nao foi possivel abrir a visualizacao de impressao.');
        });
        return;
    }

    printWindow.document.write(html);
    printWindow.document.close();

    let impressaoIniciada = false;
    const imprimir = () => {
        if (impressaoIniciada) return;
        impressaoIniciada = true;
        printWindow.focus();
        printWindow.print();
        setTimeout(() => {
            if (!printWindow.closed) {
                printWindow.close();
            }
        }, 600);
    };

    printWindow.onafterprint = () => {
        if (!printWindow.closed) {
            printWindow.close();
        }
    };

    const logo = printWindow.document.querySelector('.report-logo');
    if (logo && !logo.complete) {
        logo.addEventListener('load', imprimir, { once: true });
        logo.addEventListener('error', imprimir, { once: true });
        setTimeout(imprimir, 1200);
    } else {
        setTimeout(imprimir, 250);
    }
}

function getResumoPedido(pedido) {
    if (pedido.tipo === 'transporte') {
        const totalEscolas = pedido.detalhes.reduce((acc, rota) => acc + rota.escolas.length, 0);
        return `${pluralize(pedido.detalhes.length, 'rota')}, ${pluralize(totalEscolas, 'escola')}`;
    }

    const totalQuantidade = pedido.detalhes.reduce((acc, local) => acc + (Number(local.quantidade) || 0), 0);
    const totalAgua = pedido.detalhes.reduce((acc, local) => acc + (Number(local.agua) || 0), 0);
    return `${pluralize(pedido.detalhes.length, 'local', 'locais')}, ${pluralize(totalQuantidade, 'alimentacao', 'alimentacoes')}, ${formatNumber(totalAgua)} L agua`;
}

function getAguaUsada() {
    return pedidos.reduce((total, pedido) => {
        if (pedido.tipo !== 'alimentacao') return total;
        return total + pedido.detalhes.reduce((acc, local) => acc + (Number(local.agua) || 0), 0);
    }, 0);
}

function getSearchText(pedido) {
    const detalhes = pedido.detalhes.map(item => {
        if (pedido.tipo === 'transporte') {
            return `${item.destino || ''} ${item.escolas.map(escola => escola.nome).join(' ')}`;
        }

        return `${item.nome || ''} ${item.quantidade || ''} ${item.agua || ''}`;
    }).join(' ');

    return `${pedido.descricao || ''} ${pedido.criadoPor || ''} ${pedido.entreguePor || ''} ${detalhes}`.toLocaleLowerCase('pt-BR');
}

function isSameDay(dateA, dateB) {
    return dateA.getFullYear() === dateB.getFullYear()
        && dateA.getMonth() === dateB.getMonth()
        && dateA.getDate() === dateB.getDate();
}

function isSameWeek(dateA, dateB) {
    const startOfWeek = (date) => {
        const copy = new Date(date);
        const day = copy.getDay();
        const diff = day === 0 ? 6 : day - 1;
        copy.setHours(0, 0, 0, 0);
        copy.setDate(copy.getDate() - diff);
        return copy;
    };

    return startOfWeek(dateA).getTime() === startOfWeek(dateB).getTime();
}

function renderPedidos() {
    const tbody = document.getElementById('pedidos-tbody');
    const emptyState = document.getElementById('empty-state');
    
    if (pedidos.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        renderRelatorio();
        return;
    }
    
    emptyState.style.display = 'none';
    
    tbody.innerHTML = pedidos.map(pedido => {
        const tipoLabel = pedido.tipo === 'transporte' ? 'Transporte' : 'Alimentação';
        const status = pedido.status === 'entregue' ? 'Entregue' : 'Pendente';
        const statusClass = pedido.status === 'entregue' ? 'status-completed' : 'status-pending';
        const entregarButton = pedido.status === 'entregue'
            ? ''
            : `<button class="btn btn-success btn-sm" onclick="marcarEntregue('${pedido.id}')">Entregar</button>`;
        
        return `
            <tr>
                <td>${tipoLabel}</td>
                <td>${escapeHTML(formatDescricao(pedido.descricao))}</td>
                <td>${new Date(pedido.data).toLocaleDateString('pt-BR')}</td>
                <td>${escapeHTML(pedido.criadoPor || '-')}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>${escapeHTML(getResumoPedido(pedido))}</td>
                <td class="no-print">
                    <div class="actions">
                        <button class="btn btn-primary btn-sm" onclick="viewDetails('${pedido.id}')">Ver</button>
                        <button class="btn btn-warning btn-sm" onclick="editarPedido('${pedido.id}')">Editar</button>
                        ${entregarButton}
                        <button class="btn btn-danger btn-sm" onclick="deletePedido('${pedido.id}')">Excluir</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    renderRelatorio();
}

function renderRelatorio() {
    const tbody = document.getElementById('relatorio-tbody');
    if (!tbody) return;

    const emptyState = document.getElementById('relatorio-empty');
    const termo = (document.getElementById('relatorio-pesquisa')?.value || '').toLocaleLowerCase('pt-BR').trim();
    const entregues = pedidos.filter(pedido => pedido.status === 'entregue');
    const hoje = new Date();
    const entregasHoje = entregues.filter(pedido => pedido.entregueEm && isSameDay(new Date(pedido.entregueEm), hoje)).length;
    const entregasSemana = entregues.filter(pedido => pedido.entregueEm && isSameWeek(new Date(pedido.entregueEm), hoje)).length;
    const aguaUsada = getAguaUsada();
    const aguaDisponivel = Math.max(0, (Number(configuracoes.aguaTotalComprada) || 0) - aguaUsada);

    document.getElementById('entregas-hoje').textContent = entregasHoje;
    document.getElementById('entregas-semana').textContent = entregasSemana;
    document.getElementById('entregas-total').textContent = entregues.length;
    document.getElementById('agua-usada').textContent = `${formatNumber(aguaUsada)} L`;
    document.getElementById('agua-disponivel').textContent = `${formatNumber(aguaDisponivel)} L`;
    document.getElementById('agua-valor').textContent = formatCurrency(configuracoes.aguaValorComprado);

    const resultados = entregues.filter(pedido => !termo || getSearchText(pedido).includes(termo));

    if (resultados.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    tbody.innerHTML = resultados.map(pedido => `
        <tr>
            <td>${escapeHTML(formatDescricao(pedido.descricao))}</td>
            <td>${pedido.tipo === 'transporte' ? 'Transporte' : 'Alimentação'}</td>
            <td>${escapeHTML(pedido.entreguePor || pedido.criadoPor || '-')}</td>
            <td>${formatDateTime(pedido.entregueEm)}</td>
            <td>${escapeHTML(getResumoPedido(pedido))}</td>
        </tr>
    `).join('');
}

function editarPedido(pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;

    editingPedidoId = pedidoId;
    selectType(pedido.tipo);

    const responsavelPedidoInput = document.getElementById('responsavel-pedido');
    if (responsavelPedidoInput) {
        responsavelPedidoInput.value = pedido.criadoPor || configuracoes.responsavelAcao || '';
    }
    document.getElementById('transporte-descricao').value = '';
    document.getElementById('alimentacao-descricao').value = '';
    document.getElementById('rotas-list').innerHTML = '';
    document.getElementById('locais-list').innerHTML = '';
    rotaCounter = 0;
    localCounter = 0;

    if (pedido.tipo === 'transporte') {
        document.getElementById('transporte-descricao').value = pedido.descricao || '';

        pedido.detalhes.forEach(rota => {
            addRota();
            const rotaCard = document.getElementById(`rota-${rotaCounter}`);
            rotaCard.querySelector('.rota-dia').value = rota.dia || '';
            rotaCard.querySelector('.rota-horario').value = rota.horario || '';
            rotaCard.querySelector('.rota-destino').value = rota.destino || '';

            (rota.escolas || []).forEach(escola => {
                addEscola(rotaCounter);
                const escolaItem = rotaCard.querySelector('.escolas-container .nested-item:last-child');
                escolaItem.querySelector('.escola-nome').value = escola.nome || '';
            });
        });
    } else {
        document.getElementById('alimentacao-descricao').value = pedido.descricao || '';

        pedido.detalhes.forEach(local => {
            addLocal();
            const localCard = document.getElementById(`local-${localCounter}`);
            localCard.querySelector('.local-nome').value = local.nome || '';
            localCard.querySelector('.local-dia').value = local.dia || '';
            localCard.querySelector('.local-horario').value = local.horario || '';
            localCard.querySelector('.local-quantidade').value = local.quantidade || '';
            localCard.querySelector('.local-agua').value = local.agua || '';
        });
    }

    const cancelarButton = document.getElementById('cancelar-edicao');
    if (cancelarButton) cancelarButton.style.display = 'inline-block';
    document.getElementById(`${pedido.tipo}-section`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelarEdicao() {
    clearForm();
}

async function marcarEntregue(pedidoId) {
    const responsavel = getResponsavelAtual();
    if (!responsavel) {
        showNotification('error', 'Por favor, preencha o responsável da entrega.');
        return;
    }

    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;

    pedido.status = 'entregue';
    pedido.entreguePor = responsavel;
    pedido.entregueEm = new Date().toISOString();
    configuracoes.responsavelAcao = responsavel;
    await saveConfiguracoes();
    await savePedidos();
    renderPedidos();
    showNotification('success', 'Entrega registrada com sucesso!');
}

function viewDetails(pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;

    const modalBody = document.getElementById('modal-body');
    const tipoLabel = pedido.tipo === 'transporte' ? 'Transporte' : 'Alimentação';
    const status = pedido.status === 'entregue' ? 'Entregue' : 'Pendente';

    let detalhesHTML = '';
    
    if (pedido.tipo === 'transporte') {
        detalhesHTML = pedido.detalhes.map(rota => `
            <div class="detail-box">
                <h4>ROTA ${rota.numero}</h4>
                <p><strong>Dia:</strong> ${formatDateOnly(rota.dia)}</p>
                <p><strong>Horário:</strong> ${escapeHTML(rota.horario)}</p>
                <p><strong>Destino:</strong> ${escapeHTML(rota.destino)}</p>
                <p><strong>Escolas:</strong></p>
                <ul>
                    ${rota.escolas.map(e => `<li>${escapeHTML(e.nome)}</li>`).join('')}
                </ul>
            </div>
        `).join('');
    } else {
        const totalGeral = pedido.detalhes.reduce((acc, local) => acc + (Number(local.quantidade) || 0), 0);
        const totalAgua = pedido.detalhes.reduce((acc, local) => acc + (Number(local.agua) || 0), 0);
        detalhesHTML = pedido.detalhes.map(local => `
            <div class="detail-box">
                <h4>Local ${local.numero}</h4>
                <p><strong>Nome:</strong> ${escapeHTML(local.nome)}</p>
                <p><strong>Dia:</strong> ${formatDateOnly(local.dia)}</p>
                <p><strong>Horário:</strong> ${escapeHTML(local.horario)}</p>
                <p><strong>Alimentação:</strong> ${Number(local.quantidade) || 0}</p>
                <p><strong>Água:</strong> ${formatNumber(local.agua)} L</p>
            </div>
        `).join('');
        
        detalhesHTML += `
            <div class="detail-total">
                <h4>Total Geral: ${pluralize(totalGeral, 'alimentacao', 'alimentacoes')} | ${formatNumber(totalAgua)} L agua</h4>
            </div>
        `;
    }

    modalBody.innerHTML = `
        <div class="detail-meta">
            <p><strong>Tipo:</strong> ${tipoLabel}</p>
            <p><strong>Descrição:</strong> ${escapeHTML(formatDescricao(pedido.descricao))}</p>
            <p><strong>Data:</strong> ${formatDateTime(pedido.data)}</p>
            <p><strong>Cadastrado por:</strong> ${escapeHTML(pedido.criadoPor || '-')}</p>
            <p><strong>Status:</strong> ${status}</p>
            ${pedido.entregueEm ? `<p><strong>Entregue por:</strong> ${escapeHTML(pedido.entreguePor || '-')} em ${formatDateTime(pedido.entregueEm)}</p>` : ''}
        </div>
        <hr style="margin: 20px 0;">
        <h4 style="color: #2c3e50; margin-bottom: 15px;">Detalhes:</h4>
        ${detalhesHTML}
    `;

    document.getElementById('details-modal').classList.add('active');
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
