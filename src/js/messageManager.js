import { DatabaseManager } from './databaseManager.js';

export class MessageManager {
    static activeContact = null;
    static activeGroup = null;

    static init() {
        const messagesArea = document.querySelector('.bg-[#efe7d7]');
        const inputArea = document.querySelector('.bg-white.p-5.border-t');
        const chatHeader = document.querySelector('.bg-[#efe7d7]').previousElementSibling;

        if (messagesArea) messagesArea.innerHTML = this.getEmptyStateHTML();
        if (inputArea) inputArea.classList.add('opacity-50', 'pointer-events-none');
        if (chatHeader) {
            const nameElement = chatHeader.querySelector('.font-semibold');
            if (nameElement) {
                nameElement.textContent = 'Sélectionnez un contact';
            }
        }
    }

    static getEmptyStateHTML() {
        return `
            <div class="flex-1 flex items-center justify-center">
                <div class="text-center text-gray-500">
                    <i class='bx bx-message-rounded-dots text-6xl mb-4 opacity-50'></i>
                    <p class="text-lg font-medium mb-2">Aucune conversation sélectionnée</p>
                    <p class="text-sm">Sélectionnez un contact pour commencer à discuter</p>
                </div>
            </div>
        `;
    }

    static activateChat(contactId) {
        this.activeContact = contactId;
        this.activeGroup = null;
        
        const contact = DatabaseManager.getUserById(contactId);
        if (contact) {
            // Mise à jour du header
            const chatHeader = document.getElementById('chatHeader');
            if (chatHeader) {
                // Mise à jour du nom
                const nameElement = chatHeader.querySelector('.font-semibold');
                if (nameElement) {
                    nameElement.textContent = contact.name;
                }
                
                // Mise à jour de l'avatar avec les initiales
                const avatarElement = chatHeader.querySelector('.w-10.h-10');
                if (avatarElement) {
                    avatarElement.innerHTML = contact.name.charAt(0).toUpperCase();
                    avatarElement.className = 'w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold';
                }
            }

            // Activer la zone de message
            const inputArea = document.querySelector('.bg-white.p-5.border-t');
            if (inputArea) {
                inputArea.classList.remove('opacity-50', 'pointer-events-none');
            }
            
            // Afficher les messages
            this.renderMessages(contactId);
        }
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

    static groupConsecutiveMessages(messages) {
        const groups = [];
        let currentGroup = null;

        messages.forEach((message, index) => {
            if (!currentGroup || currentGroup.isFromMe !== message.is_from_me) {
                currentGroup = {
                    isFromMe: message.is_from_me,
                    messages: [message]
                };
                groups.push(currentGroup);
            } else {
                currentGroup.messages.push(message);
            }
        });

        return groups;
    }

    static renderMessageGroup(group) {
        const groupClass = group.isFromMe ? 'sent' : 'received';
        
        return `
            <div class="message-group ${groupClass}">
                ${group.messages.map((message, index) => {
                    let bubbleClass = 'message-bubble ' + groupClass;
                    
                    if (group.messages.length > 1) {
                        if (index === 0) bubbleClass += ' grouped-first';
                        else if (index === group.messages.length - 1) bubbleClass += ' grouped-last';
                        else bubbleClass += ' grouped-middle';
                    }
                    
                    return this.renderMessage(message, bubbleClass, index === group.messages.length - 1);
                }).join('')}
            </div>
        `;
    }

    static renderMessage(message, bubbleClass, showTime = true) {
        const time = new Date(message.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        return `
            <div class="${bubbleClass}">
                <div class="message-content">${this.formatMessageContent(message.content)}</div>
                ${showTime ? `
                    <div class="message-info">
                        <span class="message-time">${time}</span>
                        ${message.is_from_me ? `
                            <span class="message-status ${message.is_read ? 'read' : 'delivered'}">
                                ${message.is_read ? '✓✓' : '✓'}
                            </span>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    static formatMessageContent(content) {
     
        return content
            .replace(/:\)/g, '😊')
            .replace(/:\(/g, '😢')
            .replace(/:D/g, '😃')
            .replace(/<3/g, '❤️');
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
            }, 1000 + Math.random() * 2000); // Délai variable pour plus de réalisme
        }

        // Mettre à jour la liste des contacts
        import('./contactManager.js').then(({ ContactManager }) => {
            ContactManager.renderContacts();
        });
    }

    static appendMessage(message, animate = false) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;

        const lastGroup = messagesContainer.lastElementChild;
        const isSameGroup = lastGroup && 
            lastGroup.classList.contains(message.is_from_me ? 'sent' : 'received');

        if (isSameGroup) {
            const bubbleClass = `message-bubble ${message.is_from_me ? 'sent' : 'received'} grouped-last`;
            
            const lastMessage = lastGroup.lastElementChild;
            if (lastMessage) {
                lastMessage.className = lastMessage.className.replace('grouped-last', 'grouped-middle');

                const messageInfo = lastMessage.querySelector('.message-info');
                if (messageInfo) messageInfo.remove();
            }
            
            const messageHTML = this.renderMessage(message, bubbleClass + (animate ? ' new' : ''), true);
            lastGroup.insertAdjacentHTML('beforeend', messageHTML);
        } else {

            const groupClass = message.is_from_me ? 'sent' : 'received';
            const bubbleClass = `message-bubble ${groupClass}` + (animate ? ' new' : '');
            
            const groupHTML = `
                <div class="message-group ${groupClass}">
                    ${this.renderMessage(message, bubbleClass, true)}
                </div>
            `;
            
            messagesContainer.insertAdjacentHTML('beforeend', groupHTML);
        }

        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    static showTypingIndicator(contactId) {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer || this.activeContact !== contactId) return;

        const typingHTML = `
            <div class="typing-indicator" id="typingIndicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    static hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
}

window.validatePhoneNumber = (input) => {
    const phoneError = document.getElementById('newContactPhoneError');
    const value = input.value.trim();
    
    input.value = value.replace(/\D/g, '');
    
    const isValid = /^(7[0578])\d{7}$/.test(value);
    
    if (value.length > 0) {
        if (!value.startsWith('7')) {
            phoneError.textContent = 'Le numéro doit commencer par 7';
            phoneError.classList.remove('hidden');
            return false;
        }
        else if (!'05678'.includes(value[1])) {
            phoneError.textContent = 'Le deuxième chiffre doit être 0, 5, 6, 7 ou 8';
            phoneError.classList.remove('hidden');
            return false;
        }
        else if (value.length !== 9) {
            phoneError.textContent = 'Le numéro doit contenir exactement 9 chiffres';
            phoneError.classList.remove('hidden');
            return false;
        }
        else {
            phoneError.classList.add('hidden');
            return true;
        }
    }
    return false;
};