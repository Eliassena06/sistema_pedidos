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
        pedido.descricao = descricao;

        // Coleta as rotas
        const rotasContainer = document.getElementById('rotas-list');
        const rotasCards = rotasContainer.querySelectorAll('.item-card');
        
        if (rotasCards.length === 0) {
            alert('Por favor, adicione pelo menos uma rota.');
            return;
        }

        // Processa cada rota
        rotasCards.forEach((rota, index) => {
            const horario = rota.querySelector('.rota-horario').value;
            const destino = rota.querySelector('.rota-destino').value;
            
            if (!horario || !destino) {
                alert(`Por favor, preencha o horário e destino da Rota ${index + 1}.`);
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
                return;
            }

            // Adiciona a rota aos detalhes
            pedido.detalhes.push({
                tipo: 'rota',
                numero: index + 1,
                horario,
                destino,
                escolas
            });
        });
        
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
        pedido.descricao = descricao;

        // Coleta os locais
        const locaisContainer = document.getElementById('locais-list');
        const locaisCards = locaisContainer.querySelectorAll('.item-card');
        
        if (locaisCards.length === 0) {
            alert('Por favor, adicione pelo menos um local.');
            return;
        }

        // Processa cada local
        locaisCards.forEach((local, index) => {
            const nome = local.querySelector('.local-nome').value;
            const horario = local.querySelector('.local-horario').value;
            const quantidade = local.querySelector('.local-quantidade').value;
            
            if (!nome || !horario || !quantidade) {
                alert(`Por favor, preencha todos os campos do Local ${index + 1}.`);
                return;
            }

            // Adiciona o local aos detalhes
            pedido.detalhes.push({
                tipo: 'local',
                numero: index + 1,
                nome,
                horario,
                quantidade: parseInt(quantidade)
            });
        });
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
        const tipoIcon = pedido.tipo === 'transporte' ? '🚌' : '🍽️';
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
                <td>${pedido.id}</td>
                <td>${tipoIcon} ${tipoLabel}</td>
                <td>${pedido.descricao}</td>
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
                <h4 style="color: #2c3e50; margin-bottom: 10px;">🚏 Rota ${rota.numero}</h4>
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
                <h4 style="color: #2c3e50; margin-bottom: 10px;">📍 Local ${local.numero}</h4>
                <p><strong>Nome:</strong> ${local.nome}</p>
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
            <p><strong>ID:</strong> ${pedido.id}</p>
            <p><strong>Tipo:</strong> ${tipoLabel}</p>
            <p><strong>Descrição:</strong> ${pedido.descricao}</p>
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
 * Gera uma nova janela para impressão dos pedidos
 * Cria um relatório formatado para PDF
 */
function imprimirPedidos() {
    // Verifica se há pedidos para imprimir
    if (pedidos.length === 0) {
        alert('Nenhum pedido para imprimir.');
        return;
    }

    // Abre uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    
    // Template do relatório HTML
    let html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Pedidos</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; color: #333; margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
                th { background-color: #34495e; color: white; }
                .pedido-section { margin-bottom: 30px; page-break-after: always; }
                .pedido-header { background: #f8f9fa; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
                .detalhe-card { background: #fff; border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <h1>Relatório de Pedidos</h1>
            <p><strong>Data de geração:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>Total de pedidos:</strong> ${pedidos.length}</p>
            <hr>
    `;

    // Gera o HTML de cada pedido
    pedidos.forEach(pedido => {
        const tipoLabel = pedido.tipo === 'transporte' ? 'Transporte' : 'Alimentação';
        const dataFormatada = new Date(pedido.data).toLocaleDateString('pt-BR');

        html += `
            <div class="pedido-section">
                <div class="pedido-header">
                    <h2>${pedido.id}</h2>
                    <p><strong>Tipo:</strong> ${tipoLabel}</p>
                    <p><strong>Descrição:</strong> ${pedido.descricao}</p>
                    <p><strong>Data:</strong> ${dataFormatada}</p>
                </div>
        `;

        if (pedido.tipo === 'transporte') {
            // Template para transporte
            pedido.detalhes.forEach(rota => {
                html += `
                    <div class="detalhe-card">
                        <h3>Rota ${rota.numero}</h3>
                        <p><strong>Horário:</strong> ${rota.horario}</p>
                        <p><strong>Destino:</strong> ${rota.destino}</p>
                        <p><strong>Escolas:</strong></p>
                        <ul>
                            ${rota.escolas.map(e => `<li>${e.nome}</li>`).join('')}
                        </ul>
                    </div>
                `;
            });
        } else {
            // Template para alimentação
            let total = 0;
            pedido.detalhes.forEach(local => {
                total += local.quantidade;
                html += `
                    <div class="detalhe-card">
                        <h3>Local ${local.numero}</h3>
                        <p><strong>Nome:</strong> ${local.nome}</p>
                        <p><strong>Horário:</strong> ${local.horario}</p>
                        <p><strong>Quantidade:</strong> ${local.quantidade}</p>
                    </div>
                `;
            });
            html += `<p><strong>Total Geral:</strong> ${total}</p>`;
        }

        html += `</div>`;
    });

    html += `
        </body>
        </html>
    `;

    // Escreve o HTML na nova janela e dispara a impressão
    printWindow.document.write(html);
    printWindow.document.close();
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