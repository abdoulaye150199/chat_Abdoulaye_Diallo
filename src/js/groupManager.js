import { DatabaseManager } from './databaseManager.js';
import { MessageManager } from './messageManager.js';
import { NotificationManager } from './notificationManager.js';

export class GroupManager {
    // CORRECTION: Méthode pour obtenir l'utilisateur actuel de manière cohérente
    static getCurrentUser() {
        // Essayer d'abord currentUser (nouveau système)
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                return user;
            } catch (e) {
                console.warn('⚠️ Erreur parsing currentUser:', e);
            }
        }
        
        // Puis essayer current_user (ancien système UserManager)
        const currentUserOld = localStorage.getItem('current_user');
        if (currentUserOld) {
            try {
                const user = JSON.parse(currentUserOld);
                // Normaliser l'ID pour qu'il soit numérique
                if (user.id === 'admin') {
                    user.id = 1;
                } else if (typeof user.id === 'string') {
                    user.id = parseInt(user.id);
                }
                return user;
            } catch (e) {
                console.warn('⚠️ Erreur parsing current_user:', e);
            }
        }
        
        // Valeur par défaut si aucun utilisateur trouvé
        return { id: 1, name: 'Admin', phone: '782917770' };
    }

    static init() {
        console.log('🏁 GroupManager: Initialisation');
        
        // Attacher l'écouteur d'événements pour le bouton Groupes
        document.getElementById('groupsBtn')?.addEventListener('click', () => {
            console.log('📱 Clic sur le bouton Groupes');
            
            // Masquer les autres sections
            document.getElementById('contactsList')?.classList.add('hidden');
            document.getElementById('broadcastList')?.classList.add('hidden');
            document.getElementById('addContactForm')?.classList.add('hidden');
            document.getElementById('archivedList')?.classList.add('hidden');
            
            // Afficher la section des groupes
            document.getElementById('groupsList')?.classList.remove('hidden');
            document.getElementById('panelTitle').textContent = 'Groupes';
            
            // Actualiser la liste des groupes
            this.renderGroups();
        });

        // NOUVEAU: Initialiser les gestionnaires du menu contextuel
        this.initContextMenuHandlers();

        // Premier rendu des groupes
        this.renderGroups();

        // Ajouter l'écouteur pour le bouton d'ajout de participant
        document.getElementById('addParticipantBtn')?.addEventListener('click', () => {
            const modal = document.getElementById('groupMembersModal');
            const groupId = parseInt(modal.dataset.groupId);
            if (groupId) {
                this.addMember(groupId);
            }
        });
    }

    // NOUVEAU: Initialiser les gestionnaires d'événements du menu contextuel
    static initContextMenuHandlers() {
        console.log('🔧 Initialisation des gestionnaires du menu contextuel');
        
        // Gestionnaire pour le bouton "Nommer/Retirer Admin"
        document.addEventListener('click', (e) => {
            if (e.target.closest('#toggleAdminBtn')) {
                e.preventDefault();
                e.stopPropagation();
                
                const contextMenu = document.getElementById('memberContextMenu');
                if (contextMenu) {
                    const memberId = parseInt(contextMenu.dataset.memberId);
                    const groupId = parseInt(contextMenu.dataset.groupId);
                    
                    console.log('👑 Clic sur toggleAdmin pour membre:', memberId, 'groupe:', groupId);
                    
                    if (memberId && groupId) {
                        this.toggleAdmin(memberId, groupId);
                    } else {
                        console.error('❌ IDs manquants pour toggleAdmin');
                    }
                }
            }
        });

        // Gestionnaire pour le bouton "Retirer du groupe"
        document.addEventListener('click', (e) => {
            if (e.target.closest('#removeMemberBtn')) {
                e.preventDefault();
                e.stopPropagation();
                
                const contextMenu = document.getElementById('memberContextMenu');
                if (contextMenu) {
                    const memberId = parseInt(contextMenu.dataset.memberId);
                    const groupId = parseInt(contextMenu.dataset.groupId);
                    
                    console.log('🚫 Clic sur removeMember pour membre:', memberId, 'groupe:', groupId);
                    
                    if (memberId && groupId) {
                        this.removeMember(memberId, groupId);
                    } else {
                        console.error('❌ IDs manquants pour removeMember');
                    }
                }
            }
        });

        // Gestionnaire pour fermer le menu contextuel en cliquant ailleurs
        document.addEventListener('click', (e) => {
            const contextMenu = document.getElementById('memberContextMenu');
            if (contextMenu && !contextMenu.contains(e.target) && !e.target.closest('.member-action-btn')) {
                contextMenu.classList.add('hidden');
            }
        });
    }

    static renderGroups() {
        console.log('🔄 GroupManager: Rendu des groupes');
        
        const groupsList = document.getElementById('groupsList');
        if (!groupsList) {
            console.error('❌ Element groupsList non trouvé');
            return;
        }

        const currentUser = this.getCurrentUser();
        const currentUserId = currentUser.id;
        const groups = DatabaseManager.getAllGroups();

        console.log('👤 Utilisateur actuel:', currentUserId);
        console.log('👥 Groupes trouvés:', groups);

        // CORRECTION: Réinitialiser complètement le contenu
        groupsList.innerHTML = `
            <div class="p-4 border-b border-gray-200">
                <button id="createGroupBtn" 
                        class="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2">
                    <i class='bx bxs-plus-circle'></i>
                    <span>Créer un groupe</span>
                </button>
            </div>
            <div id="groups-container"></div>
        `;

        const container = groupsList.querySelector('#groups-container');

        if (!groups || groups.length === 0) {
            container.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    <i class='bx bx-group text-4xl mb-2'></i>
                    <p>Aucun groupe créé</p>
                    <p class="text-xs">Cliquez sur "Créer un groupe" pour commencer</p>
                </div>`;
        } else {
            // Filtrer les groupes où l'utilisateur est membre
            const userGroups = groups.filter(group => 
                group.members && group.members.includes(currentUserId)
            );

            console.log('👥 Groupes de l\'utilisateur:', userGroups);

            if (userGroups.length === 0) {
                container.innerHTML = `
                    <div class="p-4 text-center text-gray-500">
                        <i class='bx bx-group text-4xl mb-2'></i>
                        <p>Vous n'êtes membre d'aucun groupe</p>
                        <p class="text-xs">Créez un groupe ou demandez à être ajouté</p>
                    </div>`;
            } else {
                userGroups.forEach(group => {
                    const isAdmin = group.admins && group.admins.includes(currentUserId);
                    
                    // Vérifier s'il y a un brouillon pour ce groupe
                    const draft = MessageManager.drafts ? MessageManager.drafts.get(group.id) : null;
                    const lastMessage = DatabaseManager.getGroupMessages(group.id).slice(-1)[0];
                    const isActive = MessageManager.activeGroup === group.id;
                    const shouldShowDraft = draft && !isActive;
                    
                    const div = document.createElement('div');
                    div.className = `group-item p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 transition-colors ${isActive ? 'bg-gray-50' : ''}`;
                    div.dataset.groupId = group.id;
                    
                    div.innerHTML = `
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 ${isActive ? 'bg-orange-500' : 'bg-gray-500'} rounded-full flex items-center justify-center text-white font-bold text-lg">
                                ${group.name.charAt(0).toUpperCase()}
                            </div>
                            <div class="flex-1">
                                <div class="flex items-center gap-2">
                                    <h3 class="font-medium text-gray-800">${group.name}</h3>
                                    ${isAdmin ? '<i class="bx bxs-crown text-yellow-500 text-sm" title="Administrateur"></i>' : ''}
                                </div>
                                <p class="text-sm text-gray-500">${group.members.length} participant${group.members.length > 1 ? 's' : ''}</p>
                                ${shouldShowDraft ? `
                                    <div class="text-sm text-gray-500 flex items-center gap-1">
                                        <i class='bx bx-pencil'></i>
                                        <span class="truncate">Brouillon : ${draft}</span>
                                    </div>
                                ` : lastMessage ? `
                                    <div class="text-sm text-gray-500 truncate">
                                        ${lastMessage.sender_id === currentUserId ? 'Vous' : DatabaseManager.getUserById(lastMessage.sender_id)?.name || 'Inconnu'}: ${lastMessage.content}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="flex items-center gap-1">
                                <button class="group-info-btn p-2 hover:bg-gray-200 rounded-full transition-colors"
                                        onclick="event.stopPropagation(); GroupManager.showGroupMembers(${group.id})"
                                        title="Informations du groupe">
                                    <i class='bx bx-info-circle text-gray-600'></i>
                                </button>
                            </div>
                        </div>
                    `;
                    container.appendChild(div);
                });
            }
        }

        // CORRECTION: Réattacher les écouteurs après le rendu
        this.attachGroupEventListeners();
    }

    static attachGroupEventListeners() {
        console.log('🔗 Attachement des écouteurs d\'événements');
        
        // CORRECTION: Écouteur pour le bouton de création de groupe avec délai
        setTimeout(() => {
            const createBtn = document.getElementById('createGroupBtn');
            if (createBtn) {
                // Supprimer les anciens écouteurs
                createBtn.replaceWith(createBtn.cloneNode(true));
                const newCreateBtn = document.getElementById('createGroupBtn');
                
                newCreateBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('➕ Ouverture du modal de création de groupe');
                    this.showCreateGroupModal();
                });
                
                console.log('✅ Écouteur du bouton créer groupe attaché');
            } else {
                console.error('❌ Bouton createGroupBtn non trouvé');
            }
        }, 100);

        // Écouteurs pour cliquer sur les groupes
        document.querySelectorAll('.group-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.group-info-btn')) {
                    const groupId = parseInt(item.dataset.groupId);
                    console.log('💬 Ouverture du chat pour le groupe:', groupId);
                    
                    // CORRECTION: Utiliser activateGroupChat au lieu de showGroupChat
                    if (window.MessageManager && typeof window.MessageManager.activateGroupChat === 'function') {
                        window.MessageManager.activateGroupChat(groupId);
                        // Mettre à jour l'affichage des groupes pour montrer l'état actif
                        this.renderGroups();
                    } else {
                        console.error('❌ MessageManager.activateGroupChat n\'est pas disponible');
                    }
                }
            });
        });
    }

    static showCreateGroupModal() {
        console.log('📝 Affichage du modal de création de groupe');
        
        const modal = document.getElementById('newGroupModal');
        const contactsContainer = document.getElementById('contactsForGroup');
        
        if (!modal || !contactsContainer) {
            console.error('❌ Éléments du modal non trouvés');
            return;
        }

        const currentUser = this.getCurrentUser();
        const users = DatabaseManager.getAllUsers().filter(user => 
            user.id !== currentUser.id
        );

        console.log('👥 Utilisateurs disponibles:', users);

        // NOUVEAU: Affichage avec option d'ajout de nouveau contact
        contactsContainer.innerHTML = `
            <!-- Section pour ajouter un nouveau contact -->
            <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-center gap-2 mb-2">
                    <i class='bx bx-user-plus text-orange-600'></i>
                    <span class="text-sm font-medium text-orange-800">Créer un nouveau contact</span>
                </div>
                <div class="space-y-2">
                    <input type="text" 
                           id="newContactName"
                           class="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm outline-none focus:border-orange-500" 
                           placeholder="Nom du nouveau contact">
                    <input type="tel" 
                           id="newContactPhone"
                           pattern="^(7[0578])[0-9]{7}$"
                           maxlength="9"
                           class="w-full px-3 py-2 bg-white border border-white rounded-lg text-sm outline-none focus:border-orange-500" 
                           placeholder="Téléphone (77/78/76/70/75)"
                           oninput="GroupManager.validatePhoneNumber(this)">
                    <div id="newContactPhoneError" class="text-red-500 text-xs hidden"></div>
                    <button type="button" 
                            onclick="GroupManager.addNewContactInModal()"
                            class="w-full px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm">
                        <i class='bx bx-plus mr-1'></i>Ajouter et sélectionner
                    </button>
                </div>
            </div>
            
            <!-- Séparateur -->
            <div class="flex items-center gap-2 mb-3">
                <div class="flex-1 h-px bg-gray-300"></div>
                <span class="text-xs text-gray-500">OU SÉLECTIONNER</span>
                <div class="flex-1 h-px bg-gray-300"></div>
            </div>
            
            <!-- Liste des contacts existants -->
            <div class="space-y-1">
                ${users.map(user => `
                    <div class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                        <input type="checkbox" 
                               id="contact-${user.id}" 
                               value="${user.id}"
                               class="rounded text-orange-500 focus:ring-orange-500">
                        <div class="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                            ${user.name.charAt(0).toUpperCase()}
                        </div>
                        <label for="contact-${user.id}" class="flex-1 cursor-pointer">
                            <div class="font-medium text-sm">${user.name}</div>
                            <div class="text-xs text-gray-500">${user.phone || ''}</div>
                        </label>
                    </div>
                `).join('')}
            </div>
        `;

        modal.classList.remove('hidden');
    }

    // NOUVEAU: Validation du numéro de téléphone
    static validatePhoneNumber(input) {
        const phoneError = document.getElementById('newContactPhoneError');
        const phonePattern = /^(7[0578])[0-9]{7}$/;
        
        if (input.value.length > 0 && !phonePattern.test(input.value)) {
            phoneError.textContent = 'Format: 77/78/76/70/75 + 7 chiffres';
            phoneError.classList.remove('hidden');
            input.classList.add('border-red-300');
            input.classList.remove('border-blue-300');
        } else {
            phoneError.classList.add('hidden');
            input.classList.remove('border-red-300');
            input.classList.add('border-blue-300');
        }
    }

    // NOUVEAU: Ajouter un nouveau contact dans le modal
    static addNewContactInModal() {
        const nameInput = document.getElementById('newContactName');
        const phoneInput = document.getElementById('newContactPhone');
        const phoneError = document.getElementById('newContactPhoneError');
        
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        
        if (!name) {
            NotificationManager?.show('Veuillez entrer un nom', 'error');
            return;
        }
        
        if (!phone) {
            NotificationManager?.show('Veuillez entrer un numéro de téléphone', 'error');
            return;
        }
        
        const phonePattern = /^(7[0578])[0-9]{7}$/;
        if (!phonePattern.test(phone)) {
            phoneError.textContent = 'Format invalide: utilisez 77/78/76/70/75 + 7 chiffres';
            phoneError.classList.remove('hidden');
            return;
        }
        
        // Vérifier si le contact existe déjà
        const existingUsers = DatabaseManager.getAllUsers();
        if (existingUsers.some(user => user.phone === phone)) {
            NotificationManager?.show('Ce numéro existe déjà', 'error');
            return;
        }
        
        // Ajouter le nouveau contact
        const newUser = DatabaseManager.addUser({
            name: name,
            phone: phone,
            status: "online",
            archived: false
        });
        
        console.log('✅ Nouveau contact créé:', newUser);
        
        // Effacer les champs
        nameInput.value = '';
        phoneInput.value = '';
        phoneError.classList.add('hidden');
        
        // Rafraîchir le modal pour inclure le nouveau contact
        this.showCreateGroupModal();
        
        // Sélectionner automatiquement le nouveau contact
        setTimeout(() => {
            const checkbox = document.getElementById(`contact-${newUser.id}`);
            if (checkbox) {
                checkbox.checked = true;
            }
        }, 100);
        
        NotificationManager?.show(`Contact "${name}" ajouté avec succès`, 'success');
    }

    static createNewGroup() {
        console.log('🔨 Création d\'un nouveau groupe');
        
        const groupName = document.getElementById('groupName')?.value.trim();
        const selectedMembers = Array.from(
            document.querySelectorAll('#contactsForGroup input[type="checkbox"]:checked')
        ).map(checkbox => parseInt(checkbox.value));

        console.log('📝 Nom du groupe:', groupName);
        console.log('👥 Membres sélectionnés:', selectedMembers);

        if (!groupName) {
            NotificationManager?.show('Veuillez entrer un nom pour le groupe', 'error');
            return;
        }

        if (selectedMembers.length === 0) {
            NotificationManager?.show('Veuillez sélectionner au moins un membre', 'error');
            return;
        }

        const currentUser = this.getCurrentUser();
        const currentUserId = currentUser.id;

        // Créer le groupe avec l'utilisateur actuel comme admin
        const newGroup = DatabaseManager.addGroup({
            name: groupName,
            members: [currentUserId, ...selectedMembers],
            admins: [currentUserId]
        });

        console.log('✅ Groupe créé:', newGroup);

        this.closeModal();
        this.renderGroups();
        NotificationManager?.show(`Groupe "${groupName}" créé avec succès`, 'success');
    }

    static closeModal() {
        console.log('❌ Fermeture du modal');
        
        const modal = document.getElementById('newGroupModal');
        const groupNameInput = document.getElementById('groupName');
        
        if (groupNameInput) groupNameInput.value = '';
        
        // Effacer les champs du nouveau contact
        const newContactName = document.getElementById('newContactName');
        const newContactPhone = document.getElementById('newContactPhone');
        const phoneError = document.getElementById('newContactPhoneError');
        
        if (newContactName) newContactName.value = '';
        if (newContactPhone) newContactPhone.value = '';
        if (phoneError) phoneError.classList.add('hidden');
        
        const checkboxes = document.querySelectorAll('#contactsForGroup input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.checked = false);
        
        if (modal) modal.classList.add('hidden');
    }

    static showGroupMembers(groupId) {
        console.log('👥 Affichage des membres du groupe:', groupId);
        
        const group = DatabaseManager.getGroupById(groupId);
        if (!group) {
            console.error('❌ Groupe non trouvé:', groupId);
            return;
        }

        const modal = document.getElementById('groupMembersModal');
        if (!modal) {
            console.error('❌ Modal des membres non trouvé');
            return;
        }

        modal.dataset.groupId = groupId;

        // Mettre à jour l'en-tête du groupe
        const groupNameElement = modal.querySelector('.group-name');
        const groupCountElement = modal.querySelector('.group-count');
        const groupAvatarElement = modal.querySelector('.group-avatar');

        if (groupNameElement) groupNameElement.textContent = group.name;
        if (groupCountElement) groupCountElement.textContent = `${group.members.length} participant${group.members.length > 1 ? 's' : ''}`;
        if (groupAvatarElement) groupAvatarElement.textContent = group.name.charAt(0).toUpperCase();

        // Afficher les membres
        this.renderGroupMembers(groupId);

        modal.classList.remove('hidden');
    }

    static renderGroupMembers(groupId) {
        console.log('👥 Rendu des membres du groupe:', groupId);
        
        const group = DatabaseManager.getGroupById(groupId);
        const membersList = document.getElementById('groupMembersList');
        const currentUser = this.getCurrentUser();
        const isCurrentUserAdmin = group.admins && group.admins.includes(currentUser.id);

        if (!membersList || !group) return;

        membersList.innerHTML = '';

        // S'assurer que les admins sont initialisés et que le créateur est admin
        if (!group.admins || group.admins.length === 0) {
            group.admins = [currentUser.id];
            DatabaseManager.updateGroup(group);
        }

        // Trier les membres : admins en premier, puis utilisateur actuel, puis les autres
        const sortedMembers = [...group.members].sort((a, b) => {
            const aIsAdmin = group.admins.includes(a);
            const bIsAdmin = group.admins.includes(b);
            const aIsCurrentUser = a === currentUser.id;
            const bIsCurrentUser = b === currentUser.id;

            // Les admins en premier
            if (aIsAdmin && !bIsAdmin) return -1;
            if (!aIsAdmin && bIsAdmin) return 1;

            // Parmi les admins ou non-admins, l'utilisateur actuel en premier
            if (aIsCurrentUser && !bIsCurrentUser) return -1;
            if (!aIsCurrentUser && bIsCurrentUser) return 1;

            return 0;
        });

        sortedMembers.forEach(memberId => {
            const member = DatabaseManager.getUserById(memberId);
            if (!member) return;

            const isAdmin = group.admins && group.admins.includes(memberId);
            const isCurrentUser = memberId === currentUser.id;

            const memberDiv = document.createElement('div');
            memberDiv.className = 'flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg';
            
            memberDiv.innerHTML = `
                <div class="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                    ${member.name.charAt(0).toUpperCase()}
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <span class="font-medium">${member.name}</span>
                        ${isCurrentUser ? '<span class="text-xs text-gray-500">(Vous)</span>' : ''}
                        ${isAdmin ? '<i class="bx bxs-crown text-yellow-500" title="Administrateur"></i>' : ''}
                    </div>
                    <div class="text-sm text-gray-500">${member.phone}</div>
                </div>
                ${isCurrentUserAdmin && !isCurrentUser ? `
                    <button class="member-action-btn p-2 hover:bg-gray-200 rounded-full"
                            onclick="GroupManager.showMemberContextMenu(event, ${memberId}, ${groupId})">
                        <i class='bx bx-dots-vertical-rounded text-gray-600'></i>
                    </button>
                ` : ''}
            `;

            membersList.appendChild(memberDiv);
        });
    }

    // CORRECTION: Amélioration du menu contextuel avec meilleurs gestionnaires
    static showMemberContextMenu(event, memberId, groupId) {
        event.stopPropagation();
        console.log('📋 Affichage du menu contextuel pour le membre:', memberId, 'groupe:', groupId);
        
        // Fermer le menu s'il est déjà ouvert
        const existingMenu = document.getElementById('memberContextMenu');
        if (existingMenu && !existingMenu.classList.contains('hidden')) {
            existingMenu.classList.add('hidden');
        }

        const contextMenu = document.getElementById('memberContextMenu');
        if (!contextMenu) {
            console.error('❌ Menu contextuel non trouvé dans le DOM');
            return;
        }

        const group = DatabaseManager.getGroupById(groupId);
        if (!group) {
            console.error('❌ Groupe non trouvé:', groupId);
            return;
        }

        const isAdmin = group.admins && group.admins.includes(memberId);
        console.log('🔍 Membre admin?', isAdmin, 'Liste admins:', group.admins);

        // Mettre à jour le texte du bouton admin
        const toggleAdminBtn = document.getElementById('toggleAdminBtn');
        if (toggleAdminBtn) {
            const span = toggleAdminBtn.querySelector('span');
            if (span) {
                span.textContent = isAdmin ? 'Retirer Admin' : 'Nommer Admin';
            }
            console.log('✅ Texte du bouton admin mis à jour:', span?.textContent);
        } else {
            console.error('❌ Bouton toggleAdminBtn non trouvé');
        }

        // CORRECTION: Stocker les IDs dans les data attributes
        contextMenu.dataset.memberId = memberId.toString();
        contextMenu.dataset.groupId = groupId.toString();
        
        console.log('💾 IDs stockés dans le menu:', {
            memberId: contextMenu.dataset.memberId,
            groupId: contextMenu.dataset.groupId
        });

        // Positionner le menu
        const rect = event.target.getBoundingClientRect();
        contextMenu.style.position = 'fixed';
        contextMenu.style.top = `${rect.bottom + 5}px`;
        contextMenu.style.left = `${rect.left}px`;
        contextMenu.style.zIndex = '1000';

        contextMenu.classList.remove('hidden');
        console.log('✅ Menu contextuel affiché');
    }

    static toggleAdmin(memberId = null, groupId = null) {
        console.log('👑 Début toggleAdmin avec params:', { memberId, groupId });
        
        // Récupérer les IDs depuis le menu contextuel si non fournis
        if (!memberId || !groupId) {
            const contextMenu = document.getElementById('memberContextMenu');
            if (!contextMenu) {
                console.error('❌ Menu contextuel non trouvé');
                return;
            }
            
            memberId = parseInt(contextMenu.dataset.memberId);
            groupId = parseInt(contextMenu.dataset.groupId);
            console.log('🔍 IDs récupérés du menu:', { memberId, groupId });
        }

        if (!memberId || !groupId) {
            console.error('❌ IDs manquants:', { memberId, groupId });
            return;
        }

        const group = DatabaseManager.getGroupById(groupId);
        if (!group) {
            console.error('❌ Groupe non trouvé:', groupId);
            return;
        }

        // Initialiser le tableau des admins s'il n'existe pas
        if (!group.admins) {
            group.admins = [];
        }

        const isAdmin = group.admins.includes(memberId);
        console.log('📊 État actuel - Membre admin?', isAdmin, 'Liste admins:', group.admins);

        if (isAdmin) {
            // Retirer les droits d'admin
            group.admins = group.admins.filter(id => id !== memberId);
            console.log('➖ Droits admin retirés, nouvelle liste:', group.admins);
            NotificationManager?.show('Droits d\'administrateur retirés', 'success');
        } else {
            // Ajouter les droits d'admin
            group.admins.push(memberId);
            console.log('➕ Droits admin ajoutés, nouvelle liste:', group.admins);
            NotificationManager?.show('Membre promu administrateur', 'success');
        }

        // Sauvegarder les modifications
        const updateSuccess = DatabaseManager.updateGroup(group);
        
        if (updateSuccess) {
            console.log('✅ Groupe mis à jour avec succès');
            
            // Fermer le menu contextuel
            const contextMenu = document.getElementById('memberContextMenu');
            if (contextMenu) {
                contextMenu.classList.add('hidden');
            }

            // Rafraîchir l'affichage
            this.renderGroupMembers(groupId);
            this.renderGroups();
        } else {
            console.error('❌ Erreur lors de la mise à jour du groupe');
            NotificationManager?.show('Erreur lors de la mise à jour', 'error');
        }
    }

    static removeMember(memberId = null, groupId = null) {
        console.log('🚫 Début removeMember avec params:', { memberId, groupId });
        
        // Récupérer les IDs depuis le menu contextuel si non fournis
        if (!memberId || !groupId) {
            const contextMenu = document.getElementById('memberContextMenu');
            if (!contextMenu) {
                console.error('❌ Menu contextuel non trouvé');
                return;
            }
            
            memberId = parseInt(contextMenu.dataset.memberId);
            groupId = parseInt(contextMenu.dataset.groupId);
            console.log('🔍 IDs récupérés du menu:', { memberId, groupId });
        }

        if (!memberId || !groupId) {
            console.error('❌ IDs manquants:', { memberId, groupId });
            return;
        }

        // Fermer le menu contextuel
        const contextMenu = document.getElementById('memberContextMenu');
        if (contextMenu) {
            contextMenu.classList.add('hidden');
        }

        // Créer une boîte de dialogue de confirmation
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        confirmDialog.innerHTML = `
            <div class="bg-white p-6 rounded-xl w-96 shadow-xl">
                <h3 class="text-xl font-semibold mb-4 text-gray-800">Confirmer la suppression</h3>
                <p class="text-gray-600 mb-6">Voulez-vous vraiment retirer ce membre du groupe ?</p>
                <div class="flex justify-end gap-3">
                    <button id="cancelRemove" 
                            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        Annuler
                    </button>
                    <button id="confirmRemove" 
                            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                        Retirer
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmDialog);

        document.getElementById('cancelRemove').onclick = () => {
            document.body.removeChild(confirmDialog);
        };

        document.getElementById('confirmRemove').onclick = () => {
            const group = DatabaseManager.getGroupById(groupId);
            if (!group) {
                console.error('❌ Groupe non trouvé pour suppression');
                return;
            }

            console.log('🔄 Suppression du membre:', memberId, 'du groupe:', groupId);

            // Retirer le membre du groupe
            group.members = group.members.filter(id => id !== memberId);
            
            // Retirer également des admins si nécessaire
            if (group.admins) {
                group.admins = group.admins.filter(id => id !== memberId);
            }

            console.log('📊 Nouveaux membres:', group.members);
            console.log('📊 Nouveaux admins:', group.admins);

            const updateSuccess = DatabaseManager.updateGroup(group);
            
            if (updateSuccess) {
                console.log('✅ Membre supprimé avec succès');
                NotificationManager?.show('Membre retiré du groupe', 'success');
                
                // Rafraîchir l'affichage
                this.renderGroupMembers(groupId);
                this.renderGroups();
            } else {
                console.error('❌ Erreur lors de la suppression');
                NotificationManager?.show('Erreur lors de la suppression', 'error');
            }
            
            document.body.removeChild(confirmDialog);
        };
    }

    static addMember(groupId) {
        console.log('➕ Ajout d\'un membre au groupe:', groupId);
        
        const group = DatabaseManager.getGroupById(groupId);
        if (!group) {
            console.error('❌ Groupe non trouvé');
            return;
        }

        // Obtenir tous les utilisateurs qui ne sont pas déjà membres
        const allUsers = DatabaseManager.getAllUsers();
        const availableUsers = allUsers.filter(user => 
            !group.members.includes(user.id)
        );

        if (availableUsers.length === 0) {
            NotificationManager.show({
                message: 'Tous les contacts sont déjà membres du groupe',
                type: 'info'
            });
            return;
        }

        // Créer et afficher le modal de sélection
        const selectModal = this.createAddMemberModal(availableUsers, group);
        document.body.appendChild(selectModal);

        this.attachAddMemberListeners(selectModal, group);
    }

    static createAddMemberModal(availableUsers, group) {
        // Créer le modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-xl w-96 max-w-[90vw] max-h-[80vh] overflow-y-auto shadow-xl">
                <h3 class="text-xl font-semibold mb-4 text-orange-800">Ajouter des membres</h3>
                <div class="space-y-2 mb-6 max-h-60 overflow-y-auto">
                    ${availableUsers.map(user => `
                        <div class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                            <input type="checkbox" 
                                   id="add-member-${user.id}" 
                                   value="${user.id}"
                                   class="rounded text-orange-500 focus:ring-orange-500">
                            <div class="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                ${user.name.charAt(0).toUpperCase()}
                            </div>
                            <label for="add-member-${user.id}" class="flex-1 cursor-pointer">
                                <div class="font-medium text-sm">${user.name}</div>
                                <div class="text-xs text-gray-500">${user.phone}</div>
                            </label>
                        </div>
                    `).join('')}
                </div>
                <div class="flex justify-end gap-3">
                    <button id="cancelAddMember" 
                            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        Annuler
                    </button>
                    <button id="confirmAddMember" 
                            class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                        Ajouter
                    </button>
                </div>
            </div>
        `;

        return modal;
    }

    static attachAddMemberListeners(modal, group) {
        document.getElementById('cancelAddMember').onclick = () => {
            document.body.removeChild(modal);
        };

        document.getElementById('confirmAddMember').onclick = () => {
            const selectedMembers = Array.from(
                modal.querySelectorAll('input[type="checkbox"]:checked')
            ).map(checkbox => parseInt(checkbox.value));

            if (selectedMembers.length === 0) {
                NotificationManager?.show('Veuillez sélectionner au moins un membre', 'warning');
                return;
            }

            // Ajouter les nouveaux membres
            group.members = [...group.members, ...selectedMembers];
            const updateSuccess = DatabaseManager.updateGroup(group);

            if (updateSuccess) {
                NotificationManager?.show(`${selectedMembers.length} membre(s) ajouté(s) au groupe`, 'success');
                
                // Rafraîchir l'affichage
                this.renderGroupMembers(group.id);
                this.renderGroups();
            } else {
                NotificationManager?.show('Erreur lors de l\'ajout des membres', 'error');
            }
            
            document.body.removeChild(modal);
        };
    }

    static initializeContextMenuListeners() {
        const makeAdminBtn = document.getElementById('makeAdminBtn');
        const removeMemberBtn = document.getElementById('removeMemberBtn');
        
        if (makeAdminBtn) {
            makeAdminBtn.addEventListener('click', () => {
                const menu = document.getElementById('memberContextMenu');
                const memberId = parseInt(menu.dataset.memberId);
                const groupId = parseInt(menu.dataset.groupId);
                
                if (memberId && groupId) {
                    this.toggleAdmin(groupId, memberId);
                    this.hideContextMenu();
                }
            });
        }

        if (removeMemberBtn) {
            removeMemberBtn.addEventListener('click', () => {
                const menu = document.getElementById('memberContextMenu');
                const memberId = parseInt(menu.dataset.memberId);
                const groupId = parseInt(menu.dataset.groupId);
                
                if (memberId && groupId) {
                    this.removeMember(groupId, memberId);
                    this.hideContextMenu();
                }
            });
        }
    }

    static toggleAdmin(groupId, memberId) {
        const group = DatabaseManager.getGroupById(groupId);
        if (!group) return;

        if (!group.admins) group.admins = [];
        
        const isAdmin = group.admins.includes(memberId);
        
        if (isAdmin) {
            // Retirer les droits d'admin
            group.admins = group.admins.filter(id => id !== memberId);
            NotificationManager.show({
                message: "Les droits d'administrateur ont été retirés",
                type: 'info'
            });
        } else {
            // Nommer admin
            group.admins.push(memberId);
            NotificationManager.show({
                message: "L'utilisateur a été nommé administrateur",
                type: 'success'
            });
        }

        // Sauvegarder les modifications
        DatabaseManager.updateGroup(group);
        
        // Remplacer updateGroupsList par renderGroups
        this.renderGroups();
        this.renderGroupMembers(groupId);
    }

    static removeMember(groupId, memberId) {
        const group = DatabaseManager.getGroupById(groupId);
        if (!group) return;

        // Retirer le membre du groupe
        group.members = group.members.filter(id => id !== memberId);
        
        // Si c'était un admin, le retirer aussi de la liste des admins
        if (group.admins) {
            group.admins = group.admins.filter(id => id !== memberId);
        }

        // Sauvegarder les modifications
        DatabaseManager.updateGroup(group);
        
        // Notification
        NotificationManager.show({
            message: "Le membre a été retiré du groupe",
            type: 'warning'
        });

        // Remplacer updateGroupsList par renderGroups
        this.renderGroups();
        this.renderGroupMembers(groupId);
    }

    static hideContextMenu() {
        const menu = document.getElementById('memberContextMenu');
        if (menu) {
            menu.classList.add('hidden');
        }
    }
}

// Initialiser les écouteurs d'événements au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    GroupManager.initializeContextMenuListeners();
});