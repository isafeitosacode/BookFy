// modules/store.js

// Estas são as variáveis que você tinha no topo do script.js
export let currentBookData = null;
export let currentBookInShelf = null;
export let currentShelf = { id: null, name: null };

// Funções para atualizar essas variáveis de forma segura
export function setCurrentBookData(data) {
    currentBookData = data;
}

export function setCurrentBookInShelf(book) {
    currentBookInShelf = book;
}

export function setCurrentShelf(id, name) {
    currentShelf = { id, name };
}

// Também podemos colocar suas constantes aqui
export const STATUS = {
    WANT_TO_READ: 'Quero Ler',
    READING: 'Lendo',
    READ: 'Lido'
};