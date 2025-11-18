import { API_BASE_URL } from '../config.js'; 


//Ela esconde o app e mostra a tela de login.
function _showAuthScreen() {
    const authView = document.getElementById('auth-view');
    const appLayout = document.querySelector('.app-layout');
    
    if (authView) authView.classList.remove('hidden');
    if (appLayout) appLayout.classList.add('hidden');
}

export async function handleFetchError(response) {
    if (response.ok) {
        if (response.status === 204) { 
            return null;
        }
        return response.json(); 
    }
    let errorMessage = `Erro ${response.status}: ${response.statusText}`;
    try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) { /* corpo do erro não era JSON */ }
    throw new Error(errorMessage); 
}


export async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const fetchOptions = { ...options, headers, };
    const response = await fetch(url, fetchOptions); 

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        
        _showAuthScreen(); 
        
        throw new Error('Sua sessão expirou. Faça o login novamente.');
    }
    return handleFetchError(response);
}