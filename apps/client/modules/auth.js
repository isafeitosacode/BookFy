// modules/auth.js

import { API_BASE_URL } from '../config.js';
import { handleFetchError } from './api.js';
import { loadShelves } from './shelves.js';
import { loadHomePage } from './books.js';
import { switchView } from './ui.js';
import { loadProfilePic } from './profile.js';

// --- Seletores do DOM ---
const authView = document.getElementById('auth-view');
const appLayout = document.querySelector('.app-layout');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const authTabs = document.querySelectorAll('.auth-tab-link');
const authContents = document.querySelectorAll('.auth-content');
const logoutBtn = document.getElementById('logout-btn');


// Função 'initAuth' (responsável por "ligar" os listeners)
export function initAuth() {
    
    // Listener do Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.classList.add('hidden');
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            // Usa fetch normal, pois não está autenticado
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            // Mas usa o handleFetchError para tratar a resposta
            const data = await handleFetchError(response); 
            
            // Salva os dados do usuário
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.usuario));
            
            loginForm.reset();
            showApp(); // Mostra o aplicativo principal
        } catch (err) {
            loginError.textContent = err.message;
            loginError.classList.remove('hidden');
        }
    });

    // Listener do Registro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerError.classList.add('hidden');
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const pref1 = document.getElementById('reg-pref-1').value;
        const pref2 = document.getElementById('reg-pref-2').value;


        try {
            const response = await fetch(`${API_BASE_URL}/usuarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    preferencias: [pref1, pref2]
                })
            });
            await handleFetchError(response); 
            
            alert('Cadastro realizado com sucesso! Por favor, faça o login.');
            registerForm.reset();
            // Muda para a aba de login
            document.querySelector('.auth-tab-link[data-tab="login-tab"]').click();
        } catch (err) {
            registerError.textContent = err.message;
            registerError.classList.remove('hidden');
        }
    });

    // Listener das Tabs (Login/Registro)
    authTabs.forEach(clickedTab => {
        clickedTab.addEventListener('click', () => {
            authTabs.forEach(tab => tab.classList.remove('active'));
            authContents.forEach(content => content.classList.remove('active'));
            clickedTab.classList.add('active');
            document.getElementById(clickedTab.dataset.tab).classList.add('active');
            loginError.classList.add('hidden');
            registerError.classList.add('hidden');
        });
    });
    
    // Listener do Logout
    logoutBtn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja sair?')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            showAuth(); // Mostra a tela de login
        }
    });
}

/**
 * Exportada: Mostra a tela de login e esconde o app
 */
export function showAuth() {
    authView.classList.remove('hidden');
    appLayout.classList.add('hidden');
}

/**
 * Exportada: Mostra o app e esconde a tela de login
 * Esta é a função que "carrega" o app após o login.
 */
export function showApp() {
    authView.classList.add('hidden');
    appLayout.classList.remove('hidden');
    
    // Carrega a foto do perfil na sidebar
    loadProfilePic();

    // Carrega o resto (estantes, e depois a home page)
    loadShelves().then(() => {
        loadHomePage();
        switchView('home-view');
    });
}

/**
 * Exportada: Ponto de entrada do app.
 * Verifica se o usuário já tem um token e decide qual tela mostrar.
 */
export function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        showApp(); // Se tem token, vai direto pro app
    } else {
        showAuth(); // Se não tem, mostra a tela de login
    }
}