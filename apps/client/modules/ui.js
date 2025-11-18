// modules/ui.js

import { currentShelf, setCurrentShelf } from './store.js';
import { loadHomePage } from './books.js';

import { showProfileView } from './profile.js';

export function switchView(viewId) {

    document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
    

    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
    }


    document.querySelectorAll('.menu-link.active, .shelf-link.active')
        .forEach(link => link.classList.remove('active'));
    

    const activeLink = document.querySelector(`.menu-link[data-view="${viewId}"]`) || 
                       document.querySelector(`.shelf-link[data-shelf-id="${currentShelf.id}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}


export function initNavigation() {

    document.querySelectorAll('.sidebar-menu .menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = link.dataset.view;
            

            if (viewId === 'home-view') loadHomePage();
            if (viewId === 'search-view') document.getElementById('searchResults').innerHTML = '<p>Busque por um livro para ver os resultados.</p>';
            

            if (viewId === 'profile-view') {
                showProfileView(); 
            }
            

            setCurrentShelf(null, null);
            

            if (viewId !== 'profile-view') {
                switchView(viewId);
            }
        });
    });


    document.querySelector('.sidebar-logo').addEventListener('click', (e) => {
        e.preventDefault();
        setCurrentShelf(null, null);
        loadHomePage();
        switchView('home-view');
    });
}