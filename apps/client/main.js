// main.js

// Importa as funções de "inicialização" de cada módulo
import { initAuth, checkAuthStatus } from './modules/auth.js';
import { initNavigation } from './modules/ui.js';
import { initShelves } from './modules/shelves.js';
import { initSearch, initModals } from './modules/books.js';
import { initProfile } from './modules/profile.js'; // Importação final

// Roda o código quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // "Liga" cada parte do aplicativo
    initAuth();
    initNavigation();
    initShelves();
    initSearch();
    initModals();
    initProfile(); // "Liga" o módulo de perfil
    
    // Checa se o usuário está logado para começar
    checkAuthStatus();
});