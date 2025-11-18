// ===================================================================
// --- 1. IMPORTAÇÕES (Dependências de outros módulos) ---
// ===================================================================

// Funções de API e URLs
import { fetchWithAuth, handleFetchError } from './api.js';
import { API_BASE_URL, GOOGLE_API_URL } from '../config.js';

// Funções de UI (troca de tela)
import { switchView } from './ui.js';

// Funções de Estante (REMOVIDA A IMPORTAÇÃO QUEBRADA DAQUI)

// Variáveis Globais (Estado)
import { 
    currentShelf, 
    setCurrentBookData, 
    setCurrentBookInShelf, 
    currentBookInShelf, 
    currentBookData,
    setCurrentShelf // <-- ADICIONADO: Precisamos disso para loadBooksFromShelf
} from './store.js';


// ===================================================================
// --- 2. SELETORES DO DOM (Apenas os que este módulo usa) ---
// ===================================================================
// (Nenhuma mudança aqui, seu código está correto)
// Busca
const searchInput = document.getElementById('searchInput');
// Modais de Adicionar Livro
const addToShelfModal = document.getElementById('add-to-shelf-modal');
const confirmAddBtn = document.getElementById('modal-confirm-add-btn');
const cancelAddBtn = document.getElementById('modal-cancel-btn');
const modalStatusSelect = document.getElementById('modal-status-select');
// Modais de Mudar Status
const changeStatusModal = document.getElementById('change-status-modal');
const confirmStatusBtn = document.getElementById('status-modal-confirm-btn');
const cancelStatusBtn = document.getElementById('status-modal-cancel-btn');
const statusModalSelectUpdate = document.getElementById('status-modal-select-update');


// ===================================================================
// --- 3. FUNÇÕES "INIT" (Ligam os Event Listeners) ---
// ===================================================================

// Esta é a função que o main.js vai chamar para "ligar" a busca
export function initSearch() {
    let searchTimeout;
    searchInput.addEventListener('keyup', (e) => {
        clearTimeout(searchTimeout);
        if (e.key === 'Enter' || searchInput.value.length > 2) {
            searchTimeout = setTimeout(() => {
                searchGoogleBooks(searchInput.value);
            }, 500); 
        }
    });
}

// Esta é a função que o main.js vai chamar para "ligar" os modais
export function initModals() {
    // Listeners do Modal de Adicionar
    cancelAddBtn.addEventListener('click', () => addToShelfModal.classList.add('hidden'));
    
    confirmAddBtn.addEventListener('click', async () => {
        const selectedShelfId = document.getElementById('modal-shelf-select').value;
        const selectedStatus = modalStatusSelect.value;
        if (!currentBookData || !selectedShelfId) return;

        const bookData = {
            google_book_id: currentBookData.id,
            titulo: currentBookData.volumeInfo.title,
            autores: currentBookData.volumeInfo.authors || [],
            capa_url: currentBookData.volumeInfo.imageLinks?.thumbnail || null,
            descricao: currentBookData.volumeInfo.description || null,
            status: selectedStatus
        };
        
        try {
            await fetchWithAuth(`${API_BASE_URL}/estantes/${selectedShelfId}/livros`, {
                method: 'POST',
                body: JSON.stringify(bookData)
            });
            alert(`'${bookData.titulo}' foi adicionado com sucesso!`);
            addToShelfModal.classList.add('hidden');
            const shelfName = document.getElementById('modal-shelf-select').selectedOptions[0].text;
            
            // Chama a função que AGORA VIVE NESTE ARQUIVO
            loadBooksFromShelf(selectedShelfId, shelfName);

        } catch (error) {
            alert(`Erro ao adicionar livro: ${error.message}`);
        }
    });

    // Listeners do Modal de Mudar Status
    cancelStatusBtn.addEventListener('click', () => changeStatusModal.classList.add('hidden'));

    confirmStatusBtn.addEventListener('click', async () => {
        const newStatus = statusModalSelectUpdate.value;
        if (!currentBookInShelf || !currentBookInShelf.id_associacao) return;
        try {
            await fetchWithAuth(`${API_BASE_URL}/livros_estante/${currentBookInShelf.id_associacao}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            alert('Status atualizado com sucesso!');
            changeStatusModal.classList.add('hidden');
            
            // Atualiza a tela
            if (document.getElementById('detail-view').classList.contains('hidden')) {
                // Se estiver na estante, recarrega
                if (currentShelf.id) {
                    // Chama a função que AGORA VIVE NESTE ARQUIVO
                    loadBooksFromShelf(currentShelf.id, currentShelf.name);
                } else {
                    loadHomePage(); // Recarrega o Início
                }
            } else {
                // Se estiver nos detalhes, re-renderiza os detalhes com o novo status
                displayBookDetails(currentBookInShelf.google_book_id || currentBookInShelf.id, {
                    ...currentBookInShelf,
                    status: newStatus
                });
            }
        } catch (error) {
            alert(`Erro ao atualizar status: ${error.message}`);
        }
    });
}


// ===================================================================
// --- 4. FUNÇÕES EXPORTADAS (Usadas por outros módulos) ---
// ===================================================================

/**
 * Função exportada, usada por `auth.js` e `ui.js` para carregar a Home.
 * (Função 'loadHomePage' do seu script.js)
 */
export async function loadHomePage() {
    const grid = document.getElementById('home-books-grid');
    grid.innerHTML = `<p>Buscando recomendações de livros...</p>`;
    
    try {
        const livrosDoGoogle = await fetchWithAuth(`${API_BASE_URL}/livros/aleatorios`);

        if (!livrosDoGoogle || livrosDoGoogle.length === 0) {
            grid.innerHTML = `<p>Não foi possível encontrar recomendações no momento.</p>`;
            return;
        }

        const livrosMapeados = livrosDoGoogle.map(mapearLivroDoGoogle);
        
        displayBooks(livrosMapeados, grid, { context: 'home-discovery' });

    } catch (error) {
        console.error(error);
        grid.innerHTML = `<p>Erro ao carregar recomendações: ${error.message}</p>`;
    }
}

/**
 * Exportada: Carrega os livros de uma estante específica
 * (Movida de 'shelves.js' para 'books.js' para quebrar a dependência circular)
 */
export async function loadBooksFromShelf(shelfId, shelfName) {
    setCurrentShelf(shelfId, shelfName); // Salva no 'store'
    
    document.getElementById('shelf-title').textContent = shelfName;
    const shelfBooksDiv = document.getElementById('shelf-books');
    shelfBooksDiv.innerHTML = `<p>Carregando livros...</p>`;
    
    switchView('shelf-view'); // Muda a tela
    
    try {
        const books = await fetchWithAuth(`${API_BASE_URL}/estantes/${shelfId}/livros`);
        // Chama a função 'displayBooks' que já está neste arquivo
        displayBooks(books, shelfBooksDiv, { context: 'shelf', shelfId });
    } catch(error) {
        shelfBooksDiv.innerHTML = `<p>Erro ao carregar livros: ${error.message}</p>`;
    }
}
// ===================================================================


/**
 * Função exportada. Esta é a 'displayBooks' que você mencionou.
 * Ela é usada por 'shelves.js' (loadBooksFromShelf) e por 'loadHomePage' (aqui mesmo).
 */
export function displayBooks(books, container, options = { context: 'search' }) {
    container.innerHTML = '';
    if (!books || books.length === 0) {
        container.innerHTML = `<p>${options.context === 'home' ? 'Nenhum livro como "Quero Ler". Busque e adicione novos livros!' : 'Nenhum livro encontrado.'}</p>`;
        return;
    }
    books.forEach(book => {
        // 'book.id' é da API Google, 'book.google_book_id' é do nosso BD
        const googleId = book.id || book.google_book_id;
        const card = document.createElement('div');
        card.className = 'book-card';
        // 'book.volumeInfo' é da API Google, 'book.capa_url' é do nosso BD
        const imageUrl = toHttps(book.volumeInfo?.imageLinks?.thumbnail || book.capa_url);
        const title = book.volumeInfo?.title || book.titulo;
        
        card.innerHTML = `
            ${options.context === 'shelf' ? `<button class="remove-book-btn" title="Remover da estante">&times;</button>` : ''}
            <img src="${imageUrl}" alt="Capa de ${title}">
            <div class="book-card-overlay">
                <h4 class="book-card-title">${title}</h4>
            </div>
        `;

        if (book.status) {
            const statusBadge = document.createElement('div');
            statusBadge.className = `status-badge status-${book.status.toLowerCase().replace(' ', '-')}`;
            statusBadge.textContent = book.status;
            statusBadge.title = 'Alterar status de leitura';
            statusBadge.onclick = (e) => {
                e.stopPropagation();
                openChangeStatusModal(book); // Chama função interna
            };
            card.prepend(statusBadge);
        }

        const imgElement = card.querySelector('img');
        if(imgElement) {
            // Chama a função interna
            imgElement.addEventListener('click', () => displayBookDetails(googleId, { shelfId: options.shelfId, id_associacao: book.id_associacao, status: book.status, google_book_id: googleId }));
        }

        if (options.context === 'shelf') {
            const removeBtn = card.querySelector('.remove-book-btn');
            if(removeBtn) {
               removeBtn.addEventListener('click', (e) => {
                   e.stopPropagation();
                   removeBookFromShelf(googleId, options.shelfId); // Chama função interna
               });
            }
        }
        container.appendChild(card);
    });
}

/**
 * Função exportada. Esta é a 'removeBookFromShelf' que você mencionou.
 * Ela é usada por 'displayBooks' (aqui mesmo) e 'displayBookDetails' (aqui mesmo).
 */
export async function removeBookFromShelf(googleBookId, shelfId) {
    if (confirm('Tem certeza que deseja remover este livro da estante?')) {
        try {
            await fetchWithAuth(`${API_BASE_URL}/estantes/${shelfId}/livros/${googleBookId}`, {
                method: 'DELETE'
            });
            
            // Recarrega a estante
            loadBooksFromShelf(shelfId, currentShelf.name);

        } catch (error) {
            alert(`Erro ao remover livro: ${error.message}`);
        }
    }
}


// ===================================================================
// --- 5. FUNÇÕES INTERNAS (Apenas este módulo usa) ---
// ===================================================================

/**
 * Helper 'toHttps'. Usada por 'displayBooks' e 'displayBookDetails'.
 * Não precisa ser exportada.
 */
function toHttps(url) {
    if (!url) return 'https://via.placeholder.com/180x260.png?text=Sem+Capa';
    return url.replace('http://', 'https://');
};

/**
 * Helper 'mapearLivroDoGoogle'. Usada por 'loadHomePage'.
 * Não precisa ser exportada.
 */
function mapearLivroDoGoogle(googleBook) {
    return {
        google_book_id: googleBook.id, 
        id: googleBook.id,
        titulo: googleBook.volumeInfo.title,
        capa_url: googleBook.volumeInfo.imageLinks?.thumbnail,
        autores: googleBook.volumeInfo.authors || [], 
        descricao: googleBook.volumeInfo.description,
        status: null, 
        id_associacao: null
    };
}

/**
 * Função interna. 'searchGoogleBooks'. Usada pelo 'initSearch'.
 * Não precisa ser exportada.
 */
async function searchGoogleBooks(query, containerId = 'searchResults') {
    const container = document.getElementById(containerId);
    container.innerHTML = '<p>Buscando...</p>';
    try {
        // Usa a GOOGLE_API_URL importada
        const response = await fetch(`${GOOGLE_API_URL}?q=${encodeURIComponent(query)}&maxResults=20`);
        
        // REFAÇÃO: Vamos usar o handleFetchError para sermos consistentes
        const data = await handleFetchError(response);
        
        // Mapeia os 'items' para um formato que 'displayBooks' entende
        // Adicionado .items para corrigir um provável bug
        const books = data.items ? data.items.map(mapearLivroDoGoogle) : [];
        
        displayBooks(books, container, { context: 'search' });

    } catch (error) {
        container.innerHTML = `<p>Erro na busca: ${error.message}</p>`;
    }
}

/**

 * Usada por 'displayBooks'. Não precisa ser exportada.
 */
async function displayBookDetails(googleBookId, bookContext = {}) {
    const view = document.getElementById('detail-view');
    view.innerHTML = '<p>Carregando detalhes...</p>'; 
    switchView('detail-view'); // Usa a função importada
    
    try {
        // Busca na API do Google
        const response = await fetch(`${GOOGLE_API_URL}/${googleBookId}`);
        const data = await handleFetchError(response);
        
        // Salva o livro atual no 'store'
        setCurrentBookData(data); 

        // Renderiza o HTML (idêntico ao seu)
        view.innerHTML = `
            <div class="view-header">
                <button id="detail-back-to-shelf-btn" class="btn-link hidden"><i class="fa-solid fa-arrow-left"></i> <span id="back-to-shelf-name">Voltar</span></button>
            </div>
            <div class="detail-content">
                <div class="detail-left">
                    <h1 id="detail-title"></h1>
                    <p class="detail-author">Por <span id="detail-author-name"></span></p>
                    <div class="detail-status-section hidden">
                        <span>Status:</span>
                        <strong id="detail-current-status">Nenhum</strong>
                        <button id="detail-change-status-btn" class="btn-link-small"><i class="fa-solid fa-pencil"></i> Alterar</button>
                    </div>
                    <p id="detail-description"></p>
                    <div class="detail-actions">
                        <button id="detail-add-to-shelf-btn"><i class="fa-solid fa.fa-plus"></i> Adicionar à Estante</button>
                        <button id="detail-remove-from-shelf-btn" class="btn-danger hidden"><i class="fa-solid fa-trash-can"></i> Remover da Estante</button>
                    </div>
                </div>
                <div class="detail-right">
                    <img id="detail-cover" src="" alt="Capa do livro">
                </div>
            </div>
            <div class="similar-books">
                <h2>Mais Livros Similares</h2>
                <div id="similar-books-grid" class="book-grid"></div>
            </div>`;
        
        // Preenche os dados
        document.getElementById('detail-title').textContent = currentBookData.volumeInfo.title || 'Título não encontrado';
        document.getElementById('detail-author-name').textContent = currentBookData.volumeInfo.authors?.join(', ') || 'Autor desconhecido';
        document.getElementById('detail-description').innerHTML = currentBookData.volumeInfo.description || 'Descrição não disponível.';
        document.getElementById('detail-cover').src = toHttps(currentBookData.volumeInfo.imageLinks?.thumbnail);

        // Salva o contexto do livro (se ele veio da estante)
        setCurrentBookInShelf(bookContext);

        // Lógica dos botões (Status, Adicionar, Remover, Voltar)
        const statusSection = document.querySelector('.detail-status-section');
        if (bookContext.status) {
            document.getElementById('detail-current-status').textContent = bookContext.status;
            statusSection.classList.remove('hidden');
            document.getElementById('detail-change-status-btn').onclick = () => openChangeStatusModal(bookContext);
        } else {
            statusSection.classList.add('hidden');
        }

        const addBtn = document.getElementById('detail-add-to-shelf-btn');
        const removeBtn = document.getElementById('detail-remove-from-shelf-btn');
        if (bookContext.shelfId) {
            addBtn.classList.add('hidden');
            removeBtn.classList.remove('hidden');
            removeBtn.onclick = () => removeBookFromShelf(googleBookId, bookContext.shelfId);
        } else {
            addBtn.classList.remove('hidden');
            removeBtn.classList.add('hidden');
            addBtn.onclick = openAddToShelfModal; // Chama função interna
        }

        const backBtn = document.getElementById('detail-back-to-shelf-btn');
        if (currentShelf.id) {
            backBtn.classList.remove('hidden');
            document.getElementById('back-to-shelf-name').textContent = `Voltar para ${currentShelf.name}`;
            // Chama a função que AGORA VIVE NESTE ARQUIVO
            backBtn.onclick = () => loadBooksFromShelf(currentShelf.id, currentShelf.name);
        } else {
             backBtn.classList.add('hidden');
        }

        // Busca similares
        if (currentBookData.volumeInfo.authors) {
            searchGoogleBooks(`inauthor:"${currentBookData.volumeInfo.authors[0]}"`, 'similar-books-grid');
        }
    } catch (error) {
        view.innerHTML = `<p>Erro ao carregar detalhes do livro: ${error.message}</p>`;
    }
}

/**
 * Função interna. Esta é a 'openChangeStatusModal' que você mencionou.
 * Usada por 'displayBooks' e 'displayBookDetails'.
 */
function openChangeStatusModal(book) {
    setCurrentBookInShelf(book); // Salva no store
    document.getElementById('status-modal-book-title').textContent = book.titulo;
    statusModalSelectUpdate.value = book.status;
    changeStatusModal.classList.remove('hidden');
}

/**
 * Função interna. Esta é a 'openAddToShelfModal'.
 * Usada por 'displayBookDetails'.
 */
async function openAddToShelfModal() {
    // Linha 'await loadShelves()' foi removida na correção anterior
    if (document.getElementById('modal-shelf-select').options.length === 0) {
        alert('Você precisa criar uma estante primeiro!');
        return;
    }
    document.getElementById('modal-book-title').textContent = currentBookData.volumeInfo.title;
    addToShelfModal.classList.remove('hidden');
}