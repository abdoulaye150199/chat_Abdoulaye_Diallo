import { DatabaseManager } from './databaseManager.js';
import { ContactManager } from './contactManager.js';
import { GroupManager } from './groupManager.js';
import { TabManager } from './tabManager.js';

export class ArchiveManager {
    static init() {
        
    }

    static showArchivedList() {
        const archivedList = document.getElementById('archivedList');
        if (!archivedList) return;

        const archivedContacts = DatabaseManager.getArchivedUsers();
        const archivedGroups = DatabaseManager.getArchivedGroups();

        let html = '';
        
        if (archivedContacts.length > 0) {
            html += `
                <div class="p-4 border-b border-gray-200">
                    <h3 class="text-sm font-semibold text-gray-600 mb-2">Contacts archivés</h3>
                    ${archivedContacts.map(contact => `
                        <div class="flex items-center gap-3 p-4 hover:bg-gray-200 border-b border-gray-100 cursor-pointer contact-item" 
                             onclick="ArchiveManager.selectContact(this, ${contact.id})"
                             data-contact-id="${contact.id}">
                            <div class="w-11 h-11 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                                ${contact.name.charAt(0).toUpperCase()}
                            </div>
                            <div class="flex-1">
                                <div class="font-medium text-sm">${contact.name}</div>
                                <div class="text-xs text-gray-500">${contact.phone || ''}</div>
                            </div>
                            <div class="flex flex-col items-end gap-1">
                                <div class="text-xs text-green-500">date</div>
                                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                            <button onclick="ArchiveManager.unarchiveContact(${contact.id})" 
                                    class="w-9 h-9 border-amber border-2 rounded-full flex items-center justify-center hover:bg-orange-50 transition-colors"
                                    title="Désarchiver">
                                <i class='bx bxs-archive-alt bx-flip-horizontal' style='color:#5a5a5a'></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (archivedGroups.length > 0) {
            html += `
                <div class="p-4 border-b border-gray-200">
                    <h3 class="text-sm font-semibold text-gray-600 mb-2">Groupes archivés</h3>
                    ${archivedGroups.map(group => `
                        <div class="flex items-center gap-3 p-4 hover:bg-gray-200 border-b border-gray-100 cursor-pointer group-item" 
                             onclick="ArchiveManager.selectGroup(this, ${group.id})"
                             data-group-id="${group.id}">
                            <div class="w-11 h-11 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                                ${group.name.charAt(0).toUpperCase()}
                            </div>
                            <div class="flex-1">
                                <div class="font-medium text-sm">${group.name}</div>
                            </div>
                            <button onclick="ArchiveManager.unarchiveGroup(${group.id})" 
                                    class="w-9 h-9 border-amber border-2 rounded-full flex items-center justify-center hover:bg-orange-50 transition-colors"
                                    title="Désarchiver">
                                <i class='bx bxs-archive-alt bx-flip-horizontal' style='color:#5a5a5a'></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        archivedList.innerHTML = html;

        if (archivedContacts.length === 0 && archivedGroups.length === 0) {
            archivedList.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                    <i class='bx bx-archive text-4xl'></i>
                    <p>Aucun élément archivé</p>
                </div>
            `;
        }
    }

    static archiveContact(contactId) {
        if (!contactId) return;
        
        // Trouver l'élément du contact dans la liste
        const contactElement = document.querySelector(`[data-contact-id="${contactId}"]`);
        
        // Animation de disparition
        if (contactElement) {
            contactElement.style.transition = 'all 0.3s ease';
            contactElement.style.overflow = 'hidden';
            
            requestAnimationFrame(() => {
                contactElement.style.transform = 'translateX(-100%)';
                contactElement.style.opacity = '0';
                contactElement.style.maxHeight = '0';
                
                setTimeout(() => {
                    // Logique d'archivage
                    const contact = DatabaseManager.getUserById(contactId);
                    if (contact) {
                        contact.archived = true;
                        DatabaseManager.updateUser(contact);
                        
                        // Effacer le chat actif
                        MessageManager.clearChat();
                        
                        // Mettre à jour les listes
                        MessageManager.updateContactsList();
                        this.showArchivedList();
                        
                        // Afficher la notification
                        NotificationManager.show('Contact archivé avec succès', 'success');
                    }
                }, 300);
            });
        } else {
            // Si l'élément n'est pas trouvé, effectuer l'archivage sans animation
            const contact = DatabaseManager.getUserById(contactId);
            if (contact) {
                contact.archived = true;
                DatabaseManager.updateUser(contact);
                
                MessageManager.clearChat();
                MessageManager.updateContactsList();
                this.showArchivedList();
                
                NotificationManager.show('Contact archivé avec succès', 'success');
            }
        }
    }

    static unarchiveContact(contactId) {
        if (!contactId) return;

        const contactElement = document.querySelector(`[data-contact-id="${contactId}"]`);
        if (!contactElement) return;

        contactElement.style.transition = 'all 0.5s ease';
        contactElement.style.overflow = 'hidden';
        
        requestAnimationFrame(() => {
            contactElement.style.transform = 'translateY(-20px)';
            contactElement.style.opacity = '0';
            
            setTimeout(() => {
                contactElement.style.maxHeight = '0';
                contactElement.style.padding = '0';
                contactElement.style.margin = '0';
                contactElement.style.border = 'none';
                
                setTimeout(() => {
                    DatabaseManager.unarchiveContact(contactId);
                
                    this.showArchivedList();
                    ContactManager.renderContacts();
                }, 500);
            }, 300);
        });
    }

    static unarchiveGroup(groupId) {
       
        const groups = JSON.parse(localStorage.getItem('groups_table') || '[]');
    
        const groupIndex = groups.findIndex(group => group.id === groupId);
        if (groupIndex !== -1) {
            groups[groupIndex].archived = false;
            
            localStorage.setItem('groups_table', JSON.stringify(groups));
            
            this.updateAfterUnarchive();
        }
    }

    static updateAfterUnarchive() {
        ContactManager.renderContacts();
        GroupManager.renderGroups();
        
        this.showArchivedList();
        

        const messagesBtn = document.getElementById('messagesBtn');
        if (messagesBtn) {
            messagesBtn.click();
        }
        
        const panelTitle = document.getElementById('panelTitle');
        if (panelTitle) {
            panelTitle.textContent = 'Messages';
        }

        document.getElementById('contactsList')?.classList.remove('hidden');
        document.getElementById('groupsList')?.classList.add('hidden');
        document.getElementById('broadcastList')?.classList.add('hidden');
        document.getElementById('archivedList')?.classList.add('hidden');

        const buttons = [
            { id: 'messagesBtn', active: true },
            { id: 'groupsBtn', active: false },
            { id: 'broadcastBtn', active: false },
            { id: 'archiveBtn', active: false }
        ];

        buttons.forEach(({ id, active }) => {
            const btn = document.getElementById(id);
            if (btn) {
                const span = btn.querySelector('span');
                if (active) {
                    btn.classList.add('bg-yellow-600', 'border-orange-600');
                    span?.classList.add('text-white');
                } else {
                    btn.classList.remove('bg-yellow-600', 'border-orange-600');
                    span?.classList.remove('text-white');
                }
            }
        });
    }


    static selectContact(element, contactId) {
       
        document.querySelectorAll('.contact-item, .group-item').forEach(item => {
            item.classList.remove('bg-gray-300');
        });
        
    
        element.classList.add('bg-gray-300');
    }

    static selectGroup(element, groupId) {
    
        document.querySelectorAll('.contact-item, .group-item').forEach(item => {
            item.classList.remove('bg-gray-300');
        });
        
      
        element.classList.add('bg-gray-300');
    }
}