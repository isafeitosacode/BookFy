// modules/profile.js

import { fetchWithAuth } from './api.js';
import { API_BASE_URL } from '../config.js';
import { switchView } from './ui.js';

// --- Seletores do DOM ---
const profileForm = document.getElementById('profile-form');
const deleteAccountBtn = document.getElementById('delete-account-btn');

/**
 * Função "init" que será chamada pelo main.js
 * Adiciona os listeners de submit e delete.
 */
export function initProfile() {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const userId = user.id;

        const dadosParaAtualizar = {
            nome: document.getElementById('profile-nome').value,
            foto_perfil_url: document.getElementById('profile-foto').value,
            biografia: document.getElementById('profile-bio').value
        };

        try {
            // Usa a rota PATCH
            const usuarioAtualizado = await fetchWithAuth(`${API_BASE_URL}/usuarios/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify(dadosParaAtualizar)
            });

            // ATUALIZA o localStorage com os novos dados
            localStorage.setItem('currentUser', JSON.stringify(usuarioAtualizado));
            
            // Atualiza a foto na sidebar
            updateSidebarPic(usuarioAtualizado.foto_perfil_url);
            
            alert('Perfil atualizado com sucesso!');

        } catch (error) {
            alert(`Erro ao atualizar perfil: ${error.message}`);
        }
    });

    // Event Listener para DELETAR
    deleteAccountBtn.addEventListener('click', async () => {
        if (!confirm('TEM CERTEZA? Esta ação é irreversível e excluirá sua conta e todas as suas estantes.')) {
            return;
        }

        const user = JSON.parse(localStorage.getItem('currentUser'));
        const userId = user.id;

        try {
            // Usa a rota DELETE
            await fetchWithAuth(`${API_BASE_URL}/usuarios/${userId}`, {
                method: 'DELETE'
            });

            alert('Conta excluída com sucesso. Adeus! :(');
            // Simula o clique no botão de logout (que está no auth.js)
            // Isso evita uma "dependência circular"
            document.getElementById('logout-btn').click(); 

        } catch (error) {
            alert(`Erro ao excluir conta: ${error.message}`);
        }
    });
}

/**
 * Exportada para ser chamada pelo 'ui.js' (menu de navegação)
 * Preenche o formulário de perfil com dados do localStorage.
 */
export function showProfileView() {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            alert('Erro ao carregar dados. Faça login novamente.');
            document.getElementById('logout-btn').click();
            return;
        }

        // Preenche o formulário
        document.getElementById('profile-nome').value = user.nome || '';
        document.getElementById('profile-foto').value = user.foto_perfil_url || '';
        document.getElementById('profile-bio').value = user.biografia || '';

        // Atualiza a foto da sidebar
        updateSidebarPic(user.foto_perfil_url);
        
        // Muda para a view de perfil
        switchView('profile-view');

    } catch (e) {
        console.error('Erro ao ler dados do usuário:', e);
        document.getElementById('logout-btn').click();
    }
}

/**
 * Exportada para ser chamada pelo 'auth.js' (ao carregar o app)
 * Apenas atualiza a foto na sidebar.
 */
export function loadProfilePic() {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user) {
            updateSidebarPic(user.foto_perfil_url);
        }
    } catch (e) {
        console.error('Erro ao carregar foto de perfil:', e);
    }
}

/**
 * Função interna (helper) para mudar a <img> na sidebar
 */
function updateSidebarPic(url) {
    const picElement = document.getElementById('foto-de-perfil');
    if (picElement) {
        // Usa a URL ou uma imagem padrão
        picElement.src = url || './assets/icon-padrao-user.png'; // (use uma imagem padrão sua)
    }
}