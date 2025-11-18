// modules/shelves.js

import { fetchWithAuth } from './api.js';
import { API_BASE_URL } from '../config.js';
import { currentShelf, setCurrentShelf } from './store.js';
import { switchView } from './ui.js';

import { displayBooks, loadHomePage, loadBooksFromShelf } from './books.js';


const addShelfBtn = document.getElementById('add-shelf-btn');
const shelvesListElement = document.getElementById('shelves-list');
const modalShelfSelect = document.getElementById('modal-shelf-select');


export function initShelves() {
    addShelfBtn.addEventListener('click', async () => {
        const shelfName = prompt('Digite o nome da nova estante:');
        if (shelfName && shelfName.trim() !== '') {
            try {
                await fetchWithAuth(`${API_BASE_URL}/estantes`, {
                    method: 'POST',
                    body: JSON.stringify({ nome: shelfName.trim() })
                });
                loadShelves(); 
            } catch (error) {
                alert(`Erro ao criar estante: ${error.message}`);
            }
        }
    });
}


export async function loadShelves() {
    try {
        const shelves = await fetchWithAuth(`${API_BASE_URL}/estantes`);
        
        shelvesListElement.innerHTML = '';
        shelves.forEach(shelf => {
            const shelfContainer = document.createElement('div');
            shelfContainer.className = 'shelf-item-container';
            shelfContainer.innerHTML = `
                <a href="#" class="shelf-link" data-shelf-id="${shelf.id_estante}">${shelf.nome}</a>
                <div class="shelf-actions">
                    <i class="fa-solid fa-pencil edit-shelf-btn" title="Renomear"></i>
                    <i class="fa-solid fa-trash-can delete-shelf-btn" title="Excluir"></i>
                </div>
            `;
            shelvesListElement.appendChild(shelfContainer);
        });
        

        shelvesListElement.querySelectorAll('.shelf-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const shelfId = link.dataset.shelfId;
                

                loadBooksFromShelf(shelfId, link.textContent);
            });
        });
        shelvesListElement.querySelectorAll('.edit-shelf-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => editShelfName(shelves[index].id_estante, shelves[index].nome));
        });
        shelvesListElement.querySelectorAll('.delete-shelf-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => deleteShelf(shelves[index].id_estante, shelves[index].nome));
        });
        

        modalShelfSelect.innerHTML = '';
        shelves.forEach(shelf => {
            const option = new Option(shelf.nome, shelf.id_estante);
            modalShelfSelect.add(option);
        });

    } catch (error) {
        shelvesListElement.innerHTML = `<li>Erro ao carregar estantes: ${error.message}</li>`;
        console.error('Erro em loadShelves:', error);
    }
}


async function editShelfName(shelfId, oldName) {
    const newName = prompt('Digite o novo nome para a estante:', oldName);
    if (newName && newName.trim() !== '' && newName !== oldName) {
        try {
            await fetchWithAuth(`${API_BASE_URL}/estantes/${shelfId}`, {
                method: 'PATCH',
                body: JSON.stringify({ nome: newName.trim() })
            });
            loadShelves(); 
        } catch (error) {
            alert(`Erro ao renomear estante: ${error.message}`);
        }
    }
}

/**
 * Função interna para excluir estante
 */
async function deleteShelf(shelfId, shelfName) {
    if (confirm(`Tem certeza que deseja excluir a estante "${shelfName}"? Todos os livros nela serão removidos.`)) {
        try {
            await fetchWithAuth(`${API_BASE_URL}/estantes/${shelfId}`, { method: 'DELETE' });
            loadShelves(); 
            
            if (currentShelf.id === shelfId) {
                loadHomePage();
                switchView('home-view');
            }
        } catch (error) {
            alert(`Erro ao excluir estante: ${error.message}`);
        }
    }
}
