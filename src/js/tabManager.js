import { ContactManager } from './contactManager.js';

export class TabManager {
    static initializeTabs() {
        const messagesBtn = document.getElementById('messagesBtn');
        const groupsBtn = document.getElementById('groupsBtn');
        const broadcastBtn = document.getElementById('broadcastBtn');
        const archiveBtn = document.getElementById('archiveBtn');
        const contactsList = document.getElementById('contactsList');
        const groupsList = document.getElementById('groupsList');
        const broadcastList = document.getElementById('broadcastList');
        const archivedList = document.getElementById('archivedList');
        const addContactForm = document.getElementById('addContactForm');
        const panelTitle = document.getElementById('panelTitle');

        messagesBtn?.addEventListener('click', () => {

            [messagesBtn, groupsBtn, broadcastBtn, archiveBtn].forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-orange-600');
                btn.querySelector('span').classList.remove('text-white');
            });
            messagesBtn.classList.add('bg-yellow-600', 'border-orange-600');
            messagesBtn.querySelector('span').classList.add('text-white');


            panelTitle.textContent = 'Messages';

            [groupsList, broadcastList, archivedList, addContactForm].forEach(list => {
                list.classList.add('hidden');
            });
            contactsList.classList.remove('hidden');


            import('./contactManager.js').then(({ ContactManager }) => {
                ContactManager.renderContacts();
            });
        });

        groupsBtn?.addEventListener('click', () => {
            [messagesBtn, groupsBtn, broadcastBtn, archiveBtn].forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-orange-600');
                btn.querySelector('span').classList.remove('text-white');
            });
            groupsBtn.classList.add('bg-yellow-600', 'border-orange-600');
            groupsBtn.querySelector('span').classList.add('text-white');

            panelTitle.textContent = 'Groupes';

            [contactsList, broadcastList, archivedList, addContactForm].forEach(list => {
                list.classList.add('hidden');
            });
            groupsList.classList.remove('hidden');
        });

        broadcastBtn?.addEventListener('click', () => {

            [messagesBtn, groupsBtn, broadcastBtn, archiveBtn].forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-orange-600');
                btn.querySelector('span').classList.remove('text-white');
            });
            broadcastBtn.classList.add('bg-yellow-600', 'border-orange-600');
            broadcastBtn.querySelector('span').classList.add('text-white');

            panelTitle.textContent = 'Diffusion';

            [contactsList, groupsList, archivedList, addContactForm].forEach(list => {
                list.classList.add('hidden');
            });
            broadcastList.classList.remove('hidden');
        });

        archiveBtn?.addEventListener('click', () => {
            [messagesBtn, groupsBtn, broadcastBtn, archiveBtn].forEach(btn => {
                btn.classList.remove('bg-yellow-600', 'border-orange-600');
                btn.querySelector('span').classList.remove('text-white');
            });
            archiveBtn.classList.add('bg-yellow-600', 'border-orange-600');
            archiveBtn.querySelector('span').classList.add('text-white');

            panelTitle.textContent = 'Archives';


            [contactsList, groupsList, broadcastList, addContactForm].forEach(list => {
                list.classList.add('hidden');
            });

            archivedList.classList.remove('hidden');

            import('./archiveManager.js').then(({ ArchiveManager }) => {
                ArchiveManager.showArchivedList();
            });
        });
    }

    static switchTab(tabName) {
        // Cacher tous les contenus
        const contents = ['contactsList', 'groupsList', 'broadcastList', 'archivedList'];
        contents.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.add('hidden');
        });

        // Afficher le contenu sélectionné sans modifier les styles
        const selectedContent = document.getElementById(`${tabName}List`);
        if (selectedContent) {
            selectedContent.classList.remove('hidden');
        }

        // Mettre à jour le titre du panneau
        const panelTitle = document.getElementById('panelTitle');
        if (panelTitle) {
            panelTitle.textContent = this.getTitleForTab(tabName);
        }
    }
}