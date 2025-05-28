import { DatabaseManager } from './databaseManager.js';

export class GroupManager {
    static init() {
        DatabaseManager.initDatabase();
        this.renderGroups();
        this.initializeEventListeners();
    }

    static initializeEventListeners() {
        // Gestionnaire pour le bouton de création de groupe
        document.getElementById('createGroupBtn')?.addEventListener('click', () => {
            this.showCreateGroupModal();
        });
    }

    static showCreateGroupModal() {
        const modal = document.getElementById('newGroupModal');
        const contactsContainer = document.getElementById('contactsForGroup');
        
        if (contactsContainer) {
            const users = DatabaseManager.getAllUsers();
            contactsContainer.innerHTML = `
                <div class="p-2 border-b border-gray-200">
                    <button onclick="GroupManager.showNewContactForm()" 
                            class="w-full py-2 px-3 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg flex items-center gap-2 text-sm">
                        <i class='bx bx-plus-circle'></i>
                        <span>Ajouter un nouveau contact</span>
                    </button>
                </div>
                ${users.map(user => `
                    <div class="flex items-center gap-2 p-2 hover:bg-gray-50">
                        <input type="checkbox" 
                               id="contact-${user.id}" 
                               value="${user.id}"
                               class="rounded text-orange-500 focus:ring-orange-500">
                        <label for="contact-${user.id}" class="flex-1 cursor-pointer">
                            <div class="font-medium text-sm">${user.name}</div>
                            <div class="text-xs text-gray-500">${user.phone || ''}</div>
                        </label>
                    </div>
                `).join('')}
            `;
        }

        modal?.classList.remove('hidden');
    }

    static showNewContactForm() {
        const currentModal = document.getElementById('newGroupModal');
        currentModal.innerHTML += `
            <div id="newContactInGroupModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white p-6 rounded-xl w-96">
                    <h3 class="text-xl font-semibold mb-4">Ajouter un nouveau contact</h3>
                    <div class="space-y-3">
                        <input type="text" 
                               id="newContactName"
                               class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-500" 
                               placeholder="Nom du contact">
                        <input type="tel" 
                               id="newContactPhone"
                               pattern="^(7[0578])[0-9]{7}$"
                               maxlength="9"
                               class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-orange-500" 
                               placeholder="Numéro de téléphone (77/78/76/70/75)"
                               oninput="validatePhoneNumber(this)">
                        <div id="newContactPhoneError" class="text-red-500 text-xs hidden"></div>
                        <div class="flex justify-end gap-2">
                            <button onclick="GroupManager.closeNewContactForm()" 
                                    class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                Annuler
                            </button>
                            <button onclick="GroupManager.addNewContactToGroup()" 
                                    class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                                Ajouter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static closeNewContactForm() {
        const modal = document.getElementById('newContactInGroupModal');
        if (modal) {
            modal.remove();
        }
    }

    static addNewContactToGroup() {
        const nameInput = document.getElementById('newContactName');
        const phoneInput = document.getElementById('newContactPhone');
        const errorDiv = document.getElementById('newContactPhoneError');
        
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        
        if (!name || !phone) {
            errorDiv.textContent = 'Veuillez remplir tous les champs';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        if (!validatePhoneNumber(phoneInput)) {
            errorDiv.textContent = 'Numéro de téléphone invalide';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        // Ajouter le nouveau contact
        const newContact = DatabaseManager.addUser({
            name: name,
            phone: phone,
            status: "online"
        });
        
        // Fermer le formulaire
        this.closeNewContactForm();
        
        // Rafraîchir la liste des contacts dans le modal de groupe
        this.showCreateGroupModal();
        
        // Sélectionner automatiquement le nouveau contact
        setTimeout(() => {
            const checkbox = document.getElementById(`contact-${newContact.id}`);
            if (checkbox) {
                checkbox.checked = true;
            }
        }, 100);
    }

    static createGroup(name, memberIds = []) {
        // Créer le groupe
        const newGroup = DatabaseManager.addGroup({
            name: name,
            created_by: 'admin', // L'ID de l'admin
            created_at: new Date().toISOString()
        });

        // Ajouter l'admin comme premier membre
        DatabaseManager.addGroupMember(newGroup.id, 'admin');

        // Ajouter les autres membres
        memberIds.forEach(userId => {
            DatabaseManager.addGroupMember(newGroup.id, userId);
        });

        this.renderGroups();
        return newGroup;
    }

    static renderGroups() {
        const groupsList = document.getElementById('groupsList');
        if (!groupsList) return;

        const groups = DatabaseManager.getAllGroups();
        
        const groupsHtml = groups.map(group => {
            const members = DatabaseManager.getGroupMembers(group.id);
            const lastMessage = DatabaseManager.getLastGroupMessage(group.id);
            const totalMembers = members.length; // Inclut déjà l'admin
            
            return `
                <div class="flex items-center gap-3 p-4 hover:bg-gray-200 border-b border-gray-100 cursor-pointer group-item"
                     onclick="GroupManager.selectGroup(${group.id}, this)"
                     data-group-id="${group.id}">
                    <div class="w-11 h-11 bg-gray-400 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold">
                        ${this.getInitials(group.name)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-semibold text-gray-800 text-sm">${group.name}</div>
                        <div class="text-xs text-gray-500">${totalMembers} membre${totalMembers > 1 ? 's' : ''}</div>
                        ${lastMessage ? `
                            <div class="text-xs text-gray-500 truncate">${lastMessage.content}</div>
                        ` : ''}
                    </div>
                    <div class="flex flex-col items-end gap-1">
                        ${lastMessage ? `
                            <div class="text-xs text-green-500">date</div>
                            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                        ` : ''}
                        <div class="flex gap-1 mt-1">
                            <button onclick="GroupManager.showAddMemberModal(${group.id})" 
                                    class="p-1 text-blue-500 hover:bg-blue-50 rounded">
                                <i class='bx bx-user-plus text-sm'></i>
                            </button>
                            <button onclick="GroupManager.showGroupMembers(${group.id})" 
                                    class="p-1 text-gray-500 hover:bg-gray-50 rounded">
                                <i class='bx bx-group text-sm'></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        groupsList.innerHTML = `
            <div class="p-4 border-b border-gray-200">
                <button id="createGroupBtn" 
                        class="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2">
                    <i class='bx bxs-plus-circle'></i>
                    <span>Créer un groupe</span>
                </button>
            </div>
            ${groupsHtml}
        `;

        // Réattacher les événements après le rendu
        this.initializeEventListeners();
    }

    static selectGroup(groupId, element) {
        const group = DatabaseManager.getGroupById(groupId);
        if (group) {
            // Enlever la sélection précédente
            document.querySelectorAll('.group-item').forEach(el => {
                el.classList.remove('bg-gray-300');
            });
            
            // Sélectionner le nouveau groupe
            element.classList.add('bg-gray-300');

            // Mettre à jour le header et activer le chat
            this.activateGroupChat(groupId);
            
            // Stocker le groupe actif dans MessageManager
            window.MessageManager.activeGroup = groupId;
            window.MessageManager.activeContact = null;
        }
    }

    static activateGroupChat(groupId) {
        const group = DatabaseManager.getGroupById(groupId);
        if (!group) return;

        // Activer la zone de message
        const inputArea = document.querySelector('.bg-white.p-5.border-t');
        if (inputArea) {
            inputArea.classList.remove('opacity-50', 'pointer-events-none');
        }
        
        // Mettre à jour l'en-tête
        const chatHeader = document.querySelector('.bg-[#efe7d7]').previousElementSibling;
        if (chatHeader) {
            const nameElement = chatHeader.querySelector('.font-semibold');
            if (nameElement) {
                nameElement.textContent = group.name;
            }
            
            // Mettre à jour l'avatar
            const avatarElement = chatHeader.querySelector('.w-10.h-10');
            if (avatarElement) {
                avatarElement.innerHTML = this.getInitials(group.name);
                avatarElement.className = 'w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold';
            }
        }
        
        // Afficher les messages du groupe
        this.renderGroupMessages(groupId);
    }

    static addGroupMessage(groupId, content, isFromMe = true, senderName = 'Vous') {
        const messageData = {
            group_id: parseInt(groupId),
            content: content,
            is_from_me: isFromMe,
            sender_name: senderName
        };

        DatabaseManager.addGroupMessage(messageData);
        this.renderGroupMessages(groupId);
        this.renderGroups(); // Mettre à jour la liste des groupes
    }

    static renderGroupMessages(groupId) {
        const messagesArea = document.querySelector('.bg-[#efe7d7]');
        if (!messagesArea) return;

        const messages = DatabaseManager.getMessagesByGroupId(groupId);
        
        if (messages.length === 0) {
            messagesArea.innerHTML = `
                <div class="flex-1 flex items-center justify-center">
                    <p class="text-gray-500">Aucun message pour le moment</p>
                </div>
            `;
            return;
        }
        
        messagesArea.innerHTML = `
            <div class="flex-1 overflow-y-auto p-4 space-y-3" id="groupMessagesContainer">
                ${messages.map(msg => `
                    <div class="flex ${msg.is_from_me ? 'justify-end' : 'justify-start'} mb-2">
                        <div class="${msg.is_from_me ? 
                            'bg-green-500 text-white ml-12' : 
                            'bg-white text-gray-800 mr-12'} 
                            rounded-lg py-2 px-3 max-w-[70%] shadow-sm relative message-bubble ${
                                msg.is_from_me ? 'sent' : 'received'
                            }">
                            ${!msg.is_from_me ? `<p class="text-xs text-blue-600 font-semibold mb-1">${msg.sender_name}</p>` : ''}
                            <p class="text-sm">${msg.content}</p>
                            <p class="text-[10px] ${msg.is_from_me ? 'text-green-100' : 'text-gray-500'} text-right mt-1">${msg.timestamp}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Scroll to bottom
        const messageContainer = messagesArea.querySelector('#groupMessagesContainer');
        if (messageContainer) {
            setTimeout(() => {
                messageContainer.scrollTop = messageContainer.scrollHeight;
            }, 100);
        }
    }

    static showAddMemberModal(groupId) {
        const group = DatabaseManager.getGroupById(groupId);
        if (!group) return;

        const existingMembers = DatabaseManager.getGroupMembers(groupId);
        const existingMemberIds = existingMembers.map(m => m.user_id);
        const allUsers = DatabaseManager.getAllUsers();
        const availableUsers = allUsers.filter(user => !existingMemberIds.includes(user.id));

        if (availableUsers.length === 0) {
            alert('Tous les contacts sont déjà membres de ce groupe');
            return;
        }

        // Créer et afficher le modal d'ajout de membre
        const modalHtml = `
            <div id="addMemberModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white p-6 rounded-xl w-96">
                    <h3 class="text-xl font-semibold mb-4">Ajouter un membre à "${group.name}"</h3>
                    <div class="max-h-60 overflow-y-auto mb-4 border rounded-lg" id="availableUsers">
                        ${availableUsers.map(user => `
                            <div class="flex items-center gap-2 p-2 hover:bg-gray-50">
                                <input type="checkbox" 
                                       id="user-${user.id}" 
                                       value="${user.id}"
                                       class="rounded text-blue-500 focus:ring-blue-500">
                                <label for="user-${user.id}" class="flex-1 cursor-pointer">
                                    <div class="font-medium text-sm">${user.name}</div>
                                    <div class="text-xs text-gray-500">${user.phone || ''}</div>
                                </label>
                            </div>
                        `).join('')}
                    </div>
                    <div class="flex justify-end gap-2">
                        <button onclick="GroupManager.closeAddMemberModal()" 
                                class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            Annuler
                        </button>
                        <button onclick="GroupManager.addSelectedMembers(${groupId})" 
                                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                            Ajouter
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    static addSelectedMembers(groupId) {
        const selectedUsers = Array.from(
            document.querySelectorAll('#availableUsers input[type="checkbox"]:checked')
        ).map(checkbox => parseInt(checkbox.value));

        if (selectedUsers.length === 0) {
            alert('Veuillez sélectionner au moins un utilisateur');
            return;
        }

        selectedUsers.forEach(userId => {
            DatabaseManager.addGroupMember(groupId, userId);
        });

        this.closeAddMemberModal();
        this.renderGroups();
        
        alert(`${selectedUsers.length} membre(s) ajouté(s) au groupe`);
    }

    static closeAddMemberModal() {
        const modal = document.getElementById('addMemberModal');
        if (modal) {
            modal.remove();
        }
    }

    static showGroupMembers(groupId) {
        const group = DatabaseManager.getGroupById(groupId);
        if (!group) return;

        const members = DatabaseManager.getGroupMembers(groupId);
        const membersList = document.getElementById('groupMembersList');
        
        if (!membersList) return;

        // Commencer par l'admin
        let html = `
            <div class="flex items-center gap-3 p-2 border-b border-gray-100">
                <div class="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    ${this.getInitials('Admin')}
                </div>
                <div class="flex-1">
                    <div class="font-medium text-sm">Vous (admin)</div>
                </div>
            </div>
        `;

        // Ajouter les autres membres
        html += members
            .filter(member => member.user_id !== 'admin') // Exclure l'admin car déjà affiché
            .map(member => {
                const user = DatabaseManager.getUserById(member.user_id);
                if (!user) return '';

                return `
                    <div class="flex items-center gap-3 p-2 border-b border-gray-100">
                        <div class="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            ${this.getInitials(user.name)}
                        </div>
                        <div class="flex-1">
                            <div class="font-medium text-sm">${user.name}</div>
                            <div class="text-xs text-gray-500">${user.phone || ''}</div>
                        </div>
                        <button onclick="GroupManager.removeMember(${groupId}, ${user.id})" 
                                class="p-1 text-red-500 hover:bg-red-50 rounded">
                            <i class='bx bx-user-minus text-sm'></i>
                        </button>
                    </div>
                `;
            }).join('');

        membersList.innerHTML = html;
        document.getElementById('groupMembersModal').classList.remove('hidden');
    }

    static removeMember(groupId, userId) {
        if (confirm('Êtes-vous sûr de vouloir retirer ce membre du groupe ?')) {
            DatabaseManager.removeGroupMember(groupId, userId);
            this.showGroupMembers(groupId); // Rafraîchir la liste
            this.renderGroups(); // Mettre à jour le compteur de membres
        }
    }

    static getGroupById(id) {
        return DatabaseManager.getGroupById(id);
    }

    static closeModal() {
        const modal = document.getElementById('newGroupModal');
        const groupNameInput = document.getElementById('groupName');
        
        if (modal) {
            modal.classList.add('hidden');
        }
        if (groupNameInput) {
            groupNameInput.value = '';
        }
        
        // Décocher toutes les cases
        document.querySelectorAll('#contactsForGroup input[type="checkbox"]')
            .forEach(checkbox => checkbox.checked = false);
    }

    static createNewGroup() {
        const groupName = document.getElementById('groupName')?.value.trim();
        const selectedContacts = Array.from(
            document.querySelectorAll('#contactsForGroup input[type="checkbox"]:checked')
        ).map(checkbox => parseInt(checkbox.value));

        if (!groupName || selectedContacts.length === 0) {
            alert('Veuillez saisir un nom de groupe et sélectionner au moins un contact');
            return;
        }

        this.createGroup(groupName, selectedContacts);
        this.closeModal();
    }

    // Ajouter une méthode pour obtenir les initiales du nom du groupe
    static getInitials(name) {
        const words = name.split(' ');
        if (words.length >= 2) {
            return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
        }
        return words[0].charAt(0).toUpperCase();
    }

    // Ajouter une nouvelle méthode pour la suppression
    static deleteGroup() {
        const activeGroupId = window.MessageManager.activeGroup;
        if (!activeGroupId) return;

        if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
            // Supprimer le groupe
            DatabaseManager.deleteGroup(activeGroupId);
            
            // Réinitialiser la zone de chat
            MessageManager.init();
            MessageManager.activeGroup = null;
            
            this.renderGroups();
        }
    }
}