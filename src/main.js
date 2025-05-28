import { UserManager } from './js/userManager.js';
import { ContactManager } from './js/contactManager.js';
import { GroupManager } from './js/groupManager.js';
import { BroadcastManager } from './js/broadcastManager.js';
import { TabManager } from './js/tabManager.js';
import { MessageManager } from './js/messageManager.js';
import { DatabaseManager } from './js/databaseManager.js';
import { ArchiveManager } from './js/archiveManager.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation de l\'application');


    UserManager.init();

    DatabaseManager.initDatabase();
    
    ContactManager.init();
    
    TabManager.initializeTabs();

    document.getElementById('newContactBtn').addEventListener('click', () => {
        document.getElementById('addContactForm').classList.remove('hidden');
    });

    document.getElementById('createGroupBtn')?.addEventListener('click', () => {
        const contactsContainer = document.getElementById('contactsForGroup');
        if (contactsContainer) {
            const users = DatabaseManager.getAllUsers();
            contactsContainer.innerHTML = users.map(user => `
                <div class="flex items-center gap-2 p-2 hover:bg-gray-50">
                    <input type="checkbox" id="contact-${user.id}" value="${user.id}">
                    <label for="contact-${user.id}" class="flex-1 cursor-pointer">
                        <div class="font-medium text-sm">${user.name}</div>
                        <div class="text-xs text-gray-500">${user.phone || ''}</div>
                    </label>
                </div>
            `).join('');
        }
        document.getElementById('newGroupModal').classList.remove('hidden');
    });

    document.getElementById('broadcastBtn')?.addEventListener('click', () => {
        document.getElementById('contactsList').classList.add('hidden');
        document.getElementById('groupsList').classList.add('hidden');
        document.getElementById('addContactForm').classList.add('hidden');
        
        document.getElementById('broadcastList').classList.remove('hidden');
        
        document.getElementById('panelTitle').textContent = 'Diffusion';
        
        const broadcastContactsList = document.getElementById('broadcastContactsList');
        if (broadcastContactsList) {
            const users = DatabaseManager.getAllUsers();
            broadcastContactsList.innerHTML = users.map(user => `
                <div class="flex items-center gap-3 p-4 hover:bg-gray-100 border-b border-gray-100">
                    <div class="w-11 h-11 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                        ${user.name.charAt(0).toUpperCase()}
                    </div>
                    <label for="broadcast-${user.id}" class="flex-1 cursor-pointer">
                        <div class="font-medium text-sm">${user.name}</div>
                        <div class="text-xs text-gray-500">${user.phone || ''}</div>
                    </label>
                    <input type="checkbox" 
                           id="broadcast-${user.id}" 
                           value="${user.id}"
                           class="rounded text-green-500 focus:ring-green-500 ml-2">
                </div>
            `).join('');
        }
    });

    GroupManager.init();
    BroadcastManager.init();
    MessageManager.init();
    
    setTimeout(() => {
        setupMessageSystem();
    }, 100);
});

function setupMessageSystem() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    if (!messageInput || !sendButton) return;

    const sendMessage = () => {
        const message = messageInput.value.trim();
        if (!message || !MessageManager.activeContact) return;


        MessageManager.addMessage(MessageManager.activeContact, message, true);
        messageInput.value = '';
    };

    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Fonctions globales
window.cancelAddContact = () => {
    document.getElementById('addContactForm').classList.add('hidden');
    document.getElementById('contactName').value = '';
    document.getElementById('contactPhone').value = '';
};

window.validatePhoneNumber = (input) => {
    const phoneError = document.getElementById('phoneError');
    const value = input.value.trim();
    
    input.value = value.replace(/\D/g, '');
    
    const isValid = /^(7[0578])\d{7}$/.test(value);
    
    if (value.length > 0) {
        if (!value.startsWith('7')) {
            phoneError.textContent = 'Le numéro doit commencer par 7';
            phoneError.classList.remove('hidden');
            input.classList.add('border-red-500');
        }
        else if (!'05678'.includes(value[1])) {
            phoneError.textContent = 'Le deuxième chiffre doit être 0, 5, 6, 7 ou 8';
            phoneError.classList.remove('hidden');
            input.classList.add('border-red-500');
        }
        else if (value.length !== 9) {
            phoneError.textContent = 'Le numéro doit contenir exactement 9 chiffres';
            phoneError.classList.remove('hidden');
            input.classList.add('border-red-500');
        }
        else {
            phoneError.classList.add('hidden');
            input.classList.remove('border-red-500');
            input.classList.add('border-green-500');
        }
    } else {
        phoneError.classList.add('hidden');
        input.classList.remove('border-red-500', 'border-green-500');
    }
    
    return isValid;
};

window.addNewContact = () => {
    const nameInput = document.getElementById('contactName');
    const phoneInput = document.getElementById('contactPhone');
    const phoneError = document.getElementById('phoneError');
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    
    if (!name) {
        alert('Veuillez saisir un nom');
        return;
    }

    const existingUsers = DatabaseManager.getAllUsers();
    const phoneExists = existingUsers.some(user => user.phone === phone);
    
    if (phoneExists) {

        phoneError.textContent = 'Ce numéro existe déjà';
        phoneError.classList.remove('hidden');
        phoneInput.classList.add('border-red-500');
        phoneInput.classList.remove('border-green-500');
        return;
    }

    if (!validatePhoneNumber(phoneInput)) {
        phoneError.textContent = 'Numéro de téléphone invalide';
        phoneError.classList.remove('hidden');
        phoneInput.classList.add('border-red-500');
        phoneInput.classList.remove('border-green-500');
        return;
    }
    
    ContactManager.addContact(name, phone);
    
    nameInput.value = '';
    phoneInput.value = '';
    phoneError.classList.add('hidden');
    phoneInput.classList.remove('border-red-500', 'border-green-500');
    document.getElementById('addContactForm').classList.add('hidden');
};

window.startBroadcast = () => {
    const selectedContacts = Array.from(
        document.querySelectorAll('#broadcastContactsList input[type="checkbox"]:checked')
    ).map(checkbox => parseInt(checkbox.value));

    if (selectedContacts.length === 0) {
        alert('Veuillez sélectionner au moins un contact');
        return;
    }

    alert(`Diffusion préparée pour ${selectedContacts.length} contact(s)`);
};

window.closeGroupMembersModal = () => {
    document.getElementById('groupMembersModal').classList.add('hidden');
};

window.GroupManager = GroupManager;
window.BroadcastManager = BroadcastManager;
window.ContactManager = ContactManager;
window.MessageManager = MessageManager;
window.DatabaseManager = DatabaseManager;
window.ArchiveManager = ArchiveManager;