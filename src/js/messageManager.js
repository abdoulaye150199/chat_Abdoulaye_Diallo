import { DatabaseManager } from './databaseManager.js';

export class MessageManager {
    static activeContact = null;
    static activeGroup = null;
    static activeBroadcast = null;
    static chatType = null;
    static drafts = new Map();

    static init() {
        const messagesArea = document.querySelector('#Discuter');
        const inputArea = document.querySelector('.bg-white.p-5.border-t');
        const chatHeader = document.querySelector('#chatHeader');

        if (messagesArea) {
            messagesArea.innerHTML = this.getEmptyStateHTML();
        }
        if (inputArea) {
            inputArea.classList.add('opacity-50', 'pointer-events-none');
        }
        if (chatHeader) {
            chatHeader.innerHTML = `
                <div class="flex items-center gap-3 flex-1">
                    <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                        <i class='bx bx-message-dots'></i>
                    </div>
                    <div class="font-semibold">Sélectionnez un contact</div>
                </div>
            `;
        }
        
        // Réinitialiser les états
        this.activeContact = null;
        this.activeGroup = null;
        this.activeBroadcast = null;
        this.chatType = null;
    }

    static getEmptyStateHTML() {
        return `
            <div class="flex-1 flex items-center justify-center">
                <div class="text-center text-gray-500">
                    <i class='bx bx-message-rounded-dots text-6xl mb-4 opacity-50'></i>
                    <p class="text-lg font-medium mb-2">Aucune conversation sélectionnée</p>
                    <p class="text-sm">Sélectionnez un contact, un groupe ou une diffusion pour commencer</p>
                </div>
            </div>
        `;
    }

    static clearChat() {
        this.init();
    }

    // === GESTION DES CONTACTS ===
    static saveDraft(chatId, message) {
        if (message && message.trim()) {
            this.drafts.set(chatId, message.trim());
        } else {
            this.drafts.delete(chatId);
        }
        // Mettre à jour les listes
        this.updateContactsList();
        this.updateGroupsList();
    }

    static getInitials(name) {
        const names = name.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return name[0].toUpperCase();
    }

    static updateContactsList() {
        const contactsList = document.getElementById('contactsList');
        if (!contactsList) return;

        const contacts = DatabaseManager.getAllUsers().filter(contact => !contact.archived);
        
        contactsList.innerHTML = contacts.map(contact => {
            const draft = this.drafts.get(contact.id);
            const lastMessage = DatabaseManager.getLastMessage(contact.id);
            const isActive = this.activeContact === contact.id;
            const shouldShowDraft = draft && !isActive;
            
            return `
                <div class="flex items-center gap-3 p-4 hover:bg-gray-100 cursor-pointer ${
                    isActive ? 'bg-gray-50' : ''
                }" onclick="MessageManager.activateChat(${contact.id})" data-contact-id="${contact.id}">
                    <div class="w-12 h-12 ${
                    isActive ? 'bg-orange-500' : 'bg-gray-500'
                    } rounded-full flex items-center justify-center text-white font-bold">
                        ${this.getInitials(contact.name)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-center">
                            <div class="font-semibold text-gray-800">${contact.name}</div>
                            ${lastMessage ? `
                                <div class="text-xs text-gray-500">${lastMessage.timestamp}</div>
                            ` : ''}
                        </div>
                        ${shouldShowDraft ? `
                            <div class="text-sm text-gray-500 flex items-center gap-1">
                                <i class='bx bx-pencil'></i>
                                <span class="truncate">Brouillon : ${draft}</span>
                            </div>
                        ` : lastMessage ? `
                            <div class="text-sm text-gray-500 truncate">
                                ${lastMessage.is_from_me ? 'Vous : ' : ''}${lastMessage.content}
                            </div>
                        ` : ''}
                    </div>
                    <div class="w-2 h-2 ${contact.status === 'online' ? 'bg-green-500' : 'bg-gray-300'} rounded-full flex-shrink-0"></div>
                </div>
            `;
        }).join('');
    }

    static activateChat(contactId) {
        const messageInput = document.getElementById('messageInput');
        const currentChatId = this.activeContact || this.activeGroup;
        
        // Sauvegarder le brouillon du chat actuel uniquement si on change de conversation
        if (currentChatId && messageInput && messageInput.value.trim() && currentChatId !== contactId) {
            this.drafts.set(currentChatId, messageInput.value.trim());
            // Mettre à jour l'affichage pour montrer le brouillon de l'ancienne conversation
            this.updateContactsList();
        }

        // Mettre à jour la conversation active
        this.activeContact = contactId;
        this.activeGroup = null;
        this.activeBroadcast = null;
        this.chatType = 'contact';

        // Charger les informations du contact
        const contact = DatabaseManager.getUserById(contactId);
        if (contact) {
            const chatHeader = document.getElementById('chatHeader');
            if (chatHeader) {
                chatHeader.innerHTML = `
                    <div class="flex items-center gap-3 flex-1">
                        <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                            ${this.getInitials(contact.name)}
                        </div>
                        <div class="font-semibold">${contact.name}</div>
                    </div>
                    <div class="ml-auto flex items-center gap-2">
                        <button class="w-9 h-9 border-amber border-2 border-orange-300 rounded-full flex items-center justify-center text-white transition-colors">
                            <i class='bx bxs-backspace bx-flip-vertical' style='color:#ff7b00'></i> 
                        </button>
                        <button onclick="ArchiveManager.archiveContact('${contactId}')" 
                                id="headerArchiveBtn"
                                class="w-9 h-9 border-amber border-2 border-gray-800 rounded-full flex items-center justify-center text-white transition-colors">
                            <i class='bx bxs-archive-alt bx-flip-horizontal' style='color:#5a5a5a'></i>
                        </button>
                        <button class="w-9 h-9 border-amber border-2 border-black rounded-full flex items-center justify-center text-white transition-colors">
                            <i class='bx bxs-square' style='color:#000000'></i> 
                        </button>
                        <button onclick="handleDelete()" 
                            id="deleteBtn"
                            class="w-9 h-9 border-amber border-2 border-red-300 rounded-full flex items-center justify-center text-white transition-colors">
                            <i class='bx bxs-trash-alt' style='color:#ff4040'></i>
                        </button>
                        <button onclick="handleLogout()" 
                            class="w-9 h-9 border-amber border-2 border-gray-400 rounded-full flex items-center justify-center text-white transition-colors hover:bg-gray-100">
                            <i class="fa-solid fa-right-from-bracket" style="color: #ff0000;"></i>
                        </button>
                    </div>
                `;
            }

            this.enableInput();
            this.renderMessages(contactId);

            // Restaurer le brouillon s'il existe
            if (messageInput) {
                const draft = this.drafts.get(contactId);
                messageInput.value = draft || '';
                
                // Supprimer le brouillon une fois restauré dans la conversation active
                if (draft) {
                    this.drafts.delete(contactId);
                    this.updateContactsList();
                }
            }
        }

        // Mettre à jour la liste des contacts
        this.updateContactsList();
    }

    static renderMessages(contactId) {
        const messagesArea = document.getElementById('Discuter');
        if (!messagesArea) return;

        const messages = DatabaseManager.getMessagesByUserId(contactId);
        
        if (messages.length === 0) {
            messagesArea.innerHTML = `
                <div class="messages-container">
                    <div class="flex-1 flex items-center justify-center">
                        <div class="text-center text-gray-500">
                            <i class='bx bx-message-rounded text-4xl mb-2 opacity-50'></i>
                            <p class="text-sm">Commencer une conversation avec ${DatabaseManager.getUserById(contactId)?.name}</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        const groupedMessages = this.groupConsecutiveMessages(messages);
        
        messagesArea.innerHTML = `
            <div class="messages-container" id="messagesContainer">
                ${groupedMessages.map(group => this.renderMessageGroup(group)).join('')}
            </div>
        `;

        const container = messagesArea.querySelector('#messagesContainer');
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        }
    }

    static appendMessage(message, animate = false) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) {
            // Si le container n'existe pas, on recharge tous les messages
            this.renderMessages(message.user_id);
            return;
        }

        // Créer un nouveau groupe de messages ou ajouter au dernier groupe
        const lastGroup = messagesContainer.lastElementChild;
        const lastMessageIsFromMe = lastGroup?.querySelector('.message-bubble')?.classList.contains('sent');
        
        if (lastGroup && lastMessageIsFromMe === message.is_from_me) {
            // Ajouter au groupe existant
            const messageHTML = `
                <div class="flex ${message.is_from_me ? 'justify-end' : 'justify-start'} mb-2">
                    <div class="${message.is_from_me ? 
                        'bg-green-500 text-white ml-12' : 
                        'bg-white text-gray-800 mr-12'} 
                        rounded-lg py-2 px-3 max-w-[70%] shadow-sm relative message-bubble ${
                            message.is_from_me ? 'sent' : 'received'
                        }">
                        <p class="text-sm">${this.formatMessageContent(message.content)}</p>
                        <p class="text-[10px] ${message.is_from_me ? 'text-green-100' : 'text-gray-500'} text-right mt-1">
                            ${message.timestamp}
                        </p>
                    </div>
                </div>
            `;
            lastGroup.insertAdjacentHTML('beforeend', messageHTML);
        } else {
            // Créer un nouveau groupe
            const groupHTML = `
                <div class="message-group">
                    <div class="flex ${message.is_from_me ? 'justify-end' : 'justify-start'} mb-2">
                        <div class="${message.is_from_me ? 
                            'bg-green-500 text-white ml-12' : 
                            'bg-white text-gray-800 mr-12'} 
                            rounded-lg py-2 px-3 max-w-[70%] shadow-sm relative message-bubble ${
                                message.is_from_me ? 'sent' : 'received'
                            }">
                            <p class="text-sm">${this.formatMessageContent(message.content)}</p>
                            <p class="text-[10px] ${message.is_from_me ? 'text-green-100' : 'text-gray-500'} text-right mt-1">
                                ${message.timestamp}
                            </p>
                        </div>
                    </div>
                </div>
            `;
            messagesContainer.insertAdjacentHTML('beforeend', groupHTML);
        }

        // Scroll to bottom
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    static addMessage(contactId, content, isFromMe = true) {
        const messageData = {
            user_id: parseInt(contactId),
            content: content,
            is_from_me: isFromMe,
            is_read: isFromMe,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const savedMessage = DatabaseManager.addMessage(messageData);
        this.appendMessage(savedMessage, true);

        // Simuler une réponse automatique
        if (isFromMe) {
            setTimeout(() => {
                const responses = [
                    "D'accord ! 👍", 
                    "Je comprends 😊", 
                    "Merci beaucoup !", 
                    "Parfait ! ✨", 
                    "Ok, pas de souci",
                    "Bien reçu 📝",
                    "Super ! 🎉"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                
                const responseData = {
                    user_id: parseInt(contactId),
                    content: randomResponse,
                    is_from_me: false,
                    is_read: false,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                
                const savedResponse = DatabaseManager.addMessage(responseData);
                this.appendMessage(savedResponse, true);
            }, 1000 + Math.random() * 2000);
        }

        // Mise à jour synchrone des contacts
        const contacts = document.querySelectorAll('[data-contact-id]');
        contacts.forEach(contact => {
            if (contact.dataset.contactId === contactId.toString()) {
                contact.classList.add('bg-gray-50');
            } else {
                contact.classList.remove('bg-gray-50');
            }
        });
    }

    // === GESTION DES GROUPES ===
    // CORRECTION: Méthode activateGroupChat au lieu de showGroupChat
    static activateGroupChat(groupId) {
        console.log('💬 Activation du chat de groupe:', groupId);
        
        const messageInput = document.getElementById('messageInput');
        const currentChatId = this.activeContact || this.activeGroup;
        
        // Sauvegarder le brouillon du chat actuel si on change de conversation
        if (currentChatId && messageInput && messageInput.value.trim() && currentChatId !== groupId) {
            this.drafts.set(currentChatId, messageInput.value.trim());
        }

        this.chatType = 'group';
        this.activeGroup = groupId;
        this.activeContact = null;
        this.activeBroadcast = null;

        const group = DatabaseManager.getGroupById(groupId);
        if (!group) {
            console.error('❌ Groupe non trouvé:', groupId);
            return;
        }

        // Récupérer les noms des membres
        const memberNames = group.members.map(memberId => {
            const member = DatabaseManager.getUserById(memberId);
            return member ? member.name : 'Inconnu';
        });

        // Formater la liste des membres
        let membersList = memberNames;
        if (memberNames.length > 2) {
            membersList = `${memberNames.slice(0, 2).join(', ')}... et ${memberNames.length - 2} autres`;
        } else {
            membersList = memberNames.join(', ');
        }

        // Mettre à jour l'en-tête du chat
        const chatHeader = document.getElementById('chatHeader');
        if (chatHeader) {
            chatHeader.innerHTML = `
                <div class="flex items-center gap-3 flex-1">
                    <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                        ${group.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-1">
                        <div class="font-semibold">${group.name}</div>
                        <div class="text-xs text-gray-500">${group.members.length} participants</div>
                        <div class="text-xs text-gray-500 truncate">${membersList}</div>
                    </div>
                </div>
                <div class="ml-auto flex items-center gap-2">
                    <button onclick="GroupManager.showGroupMembers(${groupId})" 
                            class="w-9 h-9 border-amber border-2 border-blue-300 rounded-full flex items-center justify-center">
                        <i class='bx bx-info-circle' style='color:#0066cc'></i>
                    </button>
                    <button class="w-9 h-9 border-amber border-2 border-orange-300 rounded-full flex items-center justify-center">
                        <i class='bx bxs-backspace bx-flip-vertical' style='color:#ff7b00'></i>
                    </button>
                    <button class="w-9 h-9 border-amber border-2 border-gray-800 rounded-full flex items-center justify-center">
                        <i class='bx bxs-archive-alt bx-flip-horizontal' style='color:#5a5a5a'></i>
                    </button>
                    <button class="w-9 h-9 border-amber border-2 border-black rounded-full flex items-center justify-center">
                        <i class='bx bxs-square' style='color:#000000'></i>
                    </button>
                    <button class="w-9 h-9 border-amber border-2 border-red-300 rounded-full flex items-center justify-center">
                        <i class='bx bxs-trash-alt' style='color:#ff4040'></i>
                    </button>
                </div>
            `;
        }

        // Activer la zone de saisie
        this.enableInput();

        // Afficher les messages
        this.renderGroupMessages(groupId);

        // Restaurer le brouillon s'il existe
        if (messageInput) {
            const draft = this.drafts.get(groupId);
            messageInput.value = draft || '';
            
            // Supprimer le brouillon une fois restauré dans la conversation active
            if (draft) {
                this.drafts.delete(groupId);
            }
        }

        // Mettre à jour la liste des groupes
        this.updateGroupsList();
    }

    // AJOUT: Alias pour la compatibilité
    static showGroupChat(groupId) {
        console.log('🔄 Redirection vers activateGroupChat pour le groupe:', groupId);
        this.activateGroupChat(groupId);
    }

    static getCurrentUserId() {
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
            try {
                const user = JSON.parse(currentUserStr);
                console.log('🔍 CurrentUser trouvé:', user);
                return parseInt(user.id) || user.id;
            } catch (e) {
                console.warn('⚠️ Erreur parsing currentUser:', e);
            }
        }
        
        // Fallback à l'ancien système
        const currentUserOldStr = localStorage.getItem('current_user');
        if (currentUserOldStr) {
            try {
                const user = JSON.parse(currentUserOldStr);
                console.log('🔍 Current_user trouvé:', user);
                return user.id === 'admin' ? 1 : parseInt(user.id) || user.id;
            } catch (e) {
                console.warn('⚠️ Erreur parsing current_user:', e);
            }
        }
        
        console.warn('⚠️ Aucun utilisateur actuel trouvé, utilisation de l\'ID par défaut');
        return 1;
    }

    static renderGroupMessages(groupId) {
        const messagesArea = document.getElementById('Discuter');
        if (!messagesArea) return;

        const messages = DatabaseManager.getGroupMessages(groupId) || [];
        const currentUserId = this.getCurrentUserId();

        console.log('💬 Affichage des messages du groupe:', groupId);
        console.log('📊 Nombre de messages:', messages.length);
        console.log('👤 ID utilisateur actuel:', currentUserId);

        if (messages.length === 0) {
            messagesArea.innerHTML = `
                <div class="messages-container">
                    <div class="flex-1 flex items-center justify-center">
                        <div class="text-center text-gray-500">
                            <i class='bx bx-message-rounded-dots text-4xl mb-2 opacity-50'></i>
                            <p class="text-sm">Commencer la conversation de groupe</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        messagesArea.innerHTML = `
            <div class="messages-container" id="messagesContainer">
                ${messages.map(message => {
                    const messageUserId = parseInt(message.sender_id);
                    const currentUserIdInt = parseInt(currentUserId);
                    const isFromMe = messageUserId === currentUserIdInt;
                    const sender = DatabaseManager.getUserById(message.sender_id);

                    return `
                        <div class="flex ${isFromMe ? 'justify-end' : 'justify-start'} mb-2">
                            <div class="relative max-w-[65%] break-words ${
                                isFromMe ? 'bg-green-500 text-white' : 'bg-white text-gray-800'
                            } px-3 py-2 rounded-lg ${
                                isFromMe ? 'rounded-tr-none' : 'rounded-tl-none'
                            } shadow">
                                ${!isFromMe ? `
                                    <div class="text-xs text-orange-600 font-medium mb-1">
                                        ${sender?.name || 'Utilisateur inconnu'}
                                    </div>
                                ` : ''}
                                <p class="mb-1">${message.content}</p>
                                <div class="text-[11px] text-right ${
                                    isFromMe ? 'text-green-100' : 'text-gray-500'
                                }">
                                    ${new Date(message.created_at).toLocaleTimeString('fr-FR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Scroll to bottom
        const container = messagesArea.querySelector('#messagesContainer');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    static addGroupMessage(groupId, content) {
        const currentUserId = this.getCurrentUserId();
        if (!currentUserId || !content.trim()) return;

        const message = {
            content: content.trim(),
            sender_id: parseInt(currentUserId),
            group_id: parseInt(groupId),
            created_at: new Date().toISOString(),
            is_read: false
        };

        console.log('📤 Envoi du message:', message);

        // Sauvegarder le message
        const savedMessage = DatabaseManager.addGroupMessage(groupId, message);

        if (savedMessage) {
            // Rafraîchir l'affichage
            this.renderGroupMessages(groupId);
            
            // Vider l'input
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.value = '';
                messageInput.focus();
            }

            // Mettre à jour la liste des groupes
            this.updateGroupsList();
        } else {
            console.error('❌ Erreur lors de l\'envoi du message');
        }
    }

    // === GESTION DES DIFFUSIONS ===
    static activateBroadcastChat(selectedContacts) {
        this.activeContact = null;
        this.activeGroup = null;
        this.activeBroadcast = selectedContacts;
        this.chatType = 'broadcast';
        
        const contactNames = selectedContacts.map(id => {
            const contact = DatabaseManager.getUserById(id);
            return contact ? contact.name : 'Contact inconnu';
        });
        
        this.updateChatHeader(
            `Diffusion (${selectedContacts.length})`, 
            '📢',
            `Vers: ${contactNames.join(', ')}`
        );
        this.enableInput();
        this.renderBroadcastMessages();
    }

    static addBroadcastMessage(content) {
        if (!this.activeBroadcast || this.activeBroadcast.length === 0) return;

        // Enregistrer le message de diffusion
        const broadcastData = {
            id: Date.now(),
            content: content,
            recipients: this.activeBroadcast,
            sent_at: new Date().toISOString(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Stocker dans localStorage
        const broadcasts = JSON.parse(localStorage.getItem('broadcasts') || '[]');
        broadcasts.push(broadcastData);
        localStorage.setItem('broadcasts', JSON.stringify(broadcasts));

        // Ajouter le message à chaque contact individuellement
        this.activeBroadcast.forEach(contactId => {
            const messageData = {
                user_id: parseInt(contactId),
                content: content,
                is_from_me: true,
                is_broadcast: true,
                broadcast_id: broadcastData.id,
                is_read: true,
                timestamp: broadcastData.timestamp
            };
            DatabaseManager.addMessage(messageData);
        });

        // Afficher dans l'interface
        this.appendBroadcastMessage(broadcastData, true);

        // Simulation de réponses aléatoires
        setTimeout(() => {
            const responseCount = Math.floor(Math.random() * this.activeBroadcast.length / 2) + 1;
            for (let i = 0; i < responseCount; i++) {
                setTimeout(() => {
                    const randomContactId = this.activeBroadcast[Math.floor(Math.random() * this.activeBroadcast.length)];
                    const contact = DatabaseManager.getUserById(randomContactId);
                    if (contact) {
                        const responses = ["👍", "Merci", "OK", "Bien reçu", "D'accord"];
                        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                        
                        const responseData = {
                            user_id: parseInt(randomContactId),
                            content: randomResponse,
                            is_from_me: false,
                            is_read: false,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };
                        DatabaseManager.addMessage(responseData);
                    }
                }, (i + 1) * 1000);
            }
        }, 2000);

        // Mettre à jour les listes
        import('./contactManager.js').then(({ ContactManager }) => {
            ContactManager.renderContacts();
        });
    }

    static renderBroadcastMessages() {
        const messagesArea = document.getElementById('Discuter');
        if (!messagesArea) return;

        const broadcasts = JSON.parse(localStorage.getItem('broadcasts') || '[]');
        const relevantBroadcasts = broadcasts.filter(broadcast => 
            broadcast.recipients.some(id => this.activeBroadcast.includes(id))
        );
        
        if (relevantBroadcasts.length === 0) {
            messagesArea.innerHTML = `
                <div class="messages-container">
                    <div class="flex-1 flex items-center justify-center">
                        <div class="text-center text-gray-500">
                            <i class='bx bx-broadcast text-4xl mb-2 opacity-50'></i>
                            <p class="text-sm">Aucun message de diffusion envoyé</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        messagesArea.innerHTML = `
            <div class="messages-container" id="messagesContainer">
                ${relevantBroadcasts.map(broadcast => this.renderBroadcastMessage(broadcast)).join('')}
            </div>
        `;

        const container = messagesArea.querySelector('#messagesContainer');
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        }
    }

    static renderBroadcastMessage(broadcast) {
        return `
            <div class="flex justify-end mb-2">
                <div class="bg-blue-500 text-white ml-12 rounded-lg py-2 px-3 max-w-[70%] shadow-sm relative message-bubble sent">
                    <div class="flex items-center gap-2 mb-1">
                        <i class='bx bx-broadcast text-sm'></i>
                        <span class="text-xs opacity-75">Diffusion vers ${broadcast.recipients.length} contact(s)</span>
                    </div>
                    <p class="text-sm">${this.formatMessageContent(broadcast.content)}</p>
                    <p class="text-[10px] text-blue-100 text-right mt-1">${broadcast.timestamp}</p>
                </div>
            </div>
        `;
    }

    static appendBroadcastMessage(broadcast, animate = false) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        const messageHTML = this.renderBroadcastMessage(broadcast);
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML);

        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    // === MÉTHODES UTILITAIRES ===
    static updateChatHeader(name, avatar = null, subtitle = null) {
        const chatHeader = document.getElementById('chatHeader');
        if (chatHeader) {
            chatHeader.innerHTML = `
                <div class="flex items-center gap-3 flex-1">
                    <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                        ${avatar || name.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-1">
                        <div class="font-semibold">${name}</div>
                        ${subtitle ? `<div class="text-xs text-gray-500">${subtitle}</div>` : ''}
                    </div>
                </div>
                <div class="ml-auto flex items-center gap-2">
                    <button onclick="window.ArchiveManager.archiveContact(window.MessageManager.activeContact)" 
                            id="headerArchiveBtn"
                            class="w-9 h-9 border-amber border-2 border-gray-800 rounded-full flex items-center justify-center text-white transition-colors">
                        <i class='bx bxs-archive-alt bx-flip-horizontal' style='color:#5a5a5a'></i>
                    </button>
                    <button onclick="handleDelete()" 
                        id="deleteBtn"
                        class="w-9 h-9 border-amber border-2 border-red-300 rounded-full flex items-center justify-center text-white transition-colors">
                        <i class='bx bxs-trash-alt' style='color:#ff4040'></i>
                    </button>
                    <button onclick="handleLogout()" 
                        class="w-9 h-9 border-amber border-2 border-gray-400 rounded-full flex items-center justify-center text-white transition-colors hover:bg-gray-100">
                        <i class="fa-solid fa-right-from-bracket" style="color: #ff0000;"></i>
                    </button>
                </div>
            `;
        }
    }

    static enableInput() {
        const inputArea = document.querySelector('.bg-white.p-5.border-t');
        if (inputArea) {
            inputArea.classList.remove('opacity-50', 'pointer-events-none');
        }
    }

    static formatMessageContent(content) {
        // Échapper les caractères spéciaux pour éviter les problèmes d'injection HTML
        const escapedContent = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // Convertir les liens en balises cliquables
        const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        const formattedContent = escapedContent.replace(urlPattern, '<a href="$1" target="_blank" class="text-blue-500">$1</a>');

        return formattedContent;
    }

    static groupConsecutiveMessages(messages) {
        const grouped = [];
        
        messages.forEach(msg => {
            const lastGroup = grouped[grouped.length - 1];
            
            if (!lastGroup || lastGroup[lastGroup.length - 1].is_from_me !== msg.is_from_me) {
                // Nouveau groupe si pas de dernier groupe ou si l'expéditeur change
                grouped.push([msg]);
            } else {
                // Ajouter au groupe existant
                lastGroup.push(msg);
            }
        });
        
        return grouped;
    }

    static renderMessageGroup(group) {
        const isFromMe = group[0].is_from_me;
        const alignClass = isFromMe ? 'justify-end' : 'justify-start';
        const bgColorClass = isFromMe ? 'bg-green-500 text-white' : 'bg-white text-gray-800';
        const marginClass = isFromMe ? 'ml-12' : 'mr-12';
        
        return `
            <div class="flex ${alignClass} mb-2">
                <div class="${bgColorClass} ${marginClass} rounded-lg py-2 px-3 max-w-[70%] shadow-sm relative message-bubble ${
                    isFromMe ? 'sent' : 'received'
                }">
                    ${!isFromMe ? `<p class="text-xs text-orange-600 font-semibold mb-1">${group[0].sender_name}</p>` : ''}
                    ${group.map(msg => `
                        <div class="text-sm">${this.formatMessageContent(msg.content)}</div>
                    `).join('')}
                    <p class="text-[10px] ${isFromMe ? 'text-green-100' : 'text-gray-500'} text-right mt-1">
                        ${group[group.length - 1].timestamp}
                    </p>
                </div>
            </div>
        `;
    }

    // CORRECTION: Mise à jour de la liste des groupes avec gestion des brouillons
    static updateGroupsList() {
        const groupsList = document.getElementById('groupsList');
        if (!groupsList || !groupsList.querySelector('#groups-container')) return;

        const container = groupsList.querySelector('#groups-container');
        if (!container) return;

        const currentUser = DatabaseManager.getCurrentUserId ? DatabaseManager.getCurrentUserId() : this.getCurrentUserId();
        const groups = DatabaseManager.getAllGroups().filter(group => 
            group.members && group.members.includes(currentUser)
        );
        
        if (groups.length === 0) {
            container.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    <i class='bx bx-group text-4xl mb-2'></i>
                    <p>Vous n'êtes membre d'aucun groupe</p>
                    <p class="text-xs">Créez un groupe ou demandez à être ajouté</p>
                </div>`;
            return;
        }

        // Vider le container et ajouter les groupes un par un
        container.innerHTML = '';
        
        groups.forEach(group => {
            const isAdmin = group.admins && group.admins.includes(currentUser);
            const draft = this.drafts.get(group.id);
            const messages = DatabaseManager.getGroupMessages(group.id);
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            const isActive = this.activeGroup === group.id;
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
                                ${lastMessage.sender_id === currentUser ? 'Vous' : DatabaseManager.getUserById(lastMessage.sender_id)?.name || 'Inconnu'}: ${lastMessage.content}
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
            
            // Ajouter l'écouteur de clic pour le groupe
            div.addEventListener('click', (e) => {
                if (!e.target.closest('.group-info-btn')) {
                    this.activateGroupChat(group.id);
                }
            });
            
            container.appendChild(div);
        });
    }
}

// Exposer MessageManager globalement
window.MessageManager = MessageManager;