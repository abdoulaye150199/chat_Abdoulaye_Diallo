import { UserManager } from './js/userManager.js';
import { ContactManager } from './js/contactManager.js';
import { GroupManager } from './js/groupManager.js';
import { BroadcastManager } from './js/broadcastManager.js';
import { TabManager } from './js/tabManager.js';
import { MessageManager } from './js/messageManager.js';
import { DatabaseManager } from './js/databaseManager.js';
import { ArchiveManager } from './js/archiveManager.js';
import { NotificationManager } from './js/notificationManager.js';
import { GroupAdminManager } from './js/groupAdmin.js';

function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    return JSON.parse(currentUser);
}

// Initialiser l'application avec la vérification
const currentUser = checkAuth();
if (currentUser) {
    window.currentUser = currentUser;
    ContactManager.init();
    DatabaseManager.initDatabase();
}

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
        
        BroadcastManager.showBroadcastList();
    });

    GroupManager.init();
    BroadcastManager.init();
    MessageManager.init();
    
    setTimeout(() => {
        setupUnifiedMessageSystem();
    }, 100);

    // Ajouter l'écouteur pour la recherche
    const searchInput = document.querySelector('input[placeholder="Rechercher..."]');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            ContactManager.searchContacts(e.target.value);
        });
    }
});

function setupUnifiedMessageSystem() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    if (!messageInput || !sendButton) return;

    const sendMessage = () => {
        const message = messageInput.value.trim();
        if (!message) return;

        // Déterminer le type de chat actif et envoyer le message
        if (MessageManager.chatType === 'contact' && MessageManager.activeContact) {
            MessageManager.addMessage(MessageManager.activeContact, message, true);
        } 
        else if (MessageManager.chatType === 'group' && MessageManager.activeGroup) {
            MessageManager.addGroupMessage(MessageManager.activeGroup, message, true, 'Vous');
        } 
        else if (MessageManager.chatType === 'broadcast' && MessageManager.activeBroadcast) {
            MessageManager.addBroadcastMessage(message);
        } 
        else {
            // Notification si aucun chat n'est actif
            import('./js/notificationManager.js').then(({ NotificationManager }) => {
                NotificationManager.show('Veuillez sélectionner un contact, un groupe ou une diffusion', 'warning');
            });
            return;
        }

        messageInput.value = '';
    };

    sendButton.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });

    // Mise à jour dynamique du placeholder
    const updatePlaceholder = () => {
        let placeholder = 'Tapez votre message...';
        
        if (MessageManager.chatType === 'contact' && MessageManager.activeContact) {
            const contact = DatabaseManager.getUserById(MessageManager.activeContact);
            placeholder = contact ? `Message à ${contact.name}...` : 'Tapez votre message...';
        } 
        else if (MessageManager.chatType === 'group' && MessageManager.activeGroup) {
            const group = DatabaseManager.getGroupById(MessageManager.activeGroup);
            placeholder = group ? `Message au groupe ${group.name}...` : 'Tapez votre message...';
        } 
        else if (MessageManager.chatType === 'broadcast' && MessageManager.activeBroadcast) {
            placeholder = `Diffusion vers ${MessageManager.activeBroadcast.length} contact(s)...`;
        }
        else {
            placeholder = 'Sélectionnez un contact pour commencer...';
        }
        
        messageInput.placeholder = placeholder;
    };

    // Observer les changements de chat actif
    const observer = new MutationObserver(updatePlaceholder);
    observer.observe(document.getElementById('chatHeader'), { 
        childList: true, 
        subtree: true, 
        characterData: true 
    });

    updatePlaceholder();
}

// Fonctions globales existantes
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

    BroadcastManager.startBroadcast();
};

window.closeGroupMembersModal = () => {
    const modal = document.getElementById('groupMembersModal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

// Exposition des managers pour l'utilisation globale
window.GroupManager = GroupManager;
window.BroadcastManager = BroadcastManager;
window.ContactManager = ContactManager;
window.MessageManager = MessageManager;
window.DatabaseManager = DatabaseManager;
window.ArchiveManager = ArchiveManager;
window.GroupAdminManager = new GroupAdminManager();

window.handleSearchKeyPress = (event) => {
    // Détection de l'étoile
    if (event.key === "*") {
        event.preventDefault(); // Empêche le comportement par défaut
        ContactManager.sortContactsAlphabetically();
        
        // On ne vide plus la barre de recherche
        // L'étoile restera visible jusqu'à ce que l'utilisateur la supprime
    }
};

window.handleLogin = () => {
    const nameInput = document.getElementById('loginName');
    const phoneInput = document.getElementById('loginPhone');
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    
    if (!name || !phone) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    // Vérifier si l'utilisateur existe
    const users = DatabaseManager.getAllUsers();
    const user = users.find(u => u.phone === phone);
    
    if (!user) {
        // Créer un nouvel utilisateur
        const newUser = DatabaseManager.addUser({
            name: name,
            phone: phone,
            status: "online"
        });
        
        if (newUser) {
            hideLoginForm();
            initializeApp(newUser);
        }
    } else {
        // Mettre à jour le nom si nécessaire
        if (user.name !== name) {
            user.name = name;
            DatabaseManager.updateUser(user);
        }
        hideLoginForm();
        initializeApp(user);
    }
};

function hideLoginForm() {
    document.getElementById('loginForm').style.display = 'none';
}

function initializeApp(user) {
    window.currentUser = user;
    ContactManager.init();
    // ...autres initialisations nécessaires
}

window.handleDelete = async () => {
    if (!MessageManager.activeContact && !MessageManager.activeGroup) {
        NotificationManager.show('Veuillez sélectionner un contact ou un groupe à supprimer', 'warning');
        return;
    }

    // Créer un élément de confirmation personnalisé
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    confirmDialog.innerHTML = `
        <div class="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h3 class="text-xl font-semibold mb-4 text-gray-800">Confirmation</h3>
            <p class="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer cet élément ?</p>
            <div class="flex justify-end gap-3">
                <button id="cancelDelete" 
                        class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    Annuler
                </button>
                <button id="confirmDelete" 
                        class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                    Supprimer
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(confirmDialog);

    // Gérer les actions de confirmation
    return new Promise((resolve) => {
        document.getElementById('cancelDelete').onclick = () => {
            document.body.removeChild(confirmDialog);
            resolve(false);
        };

        document.getElementById('confirmDelete').onclick = () => {
            document.body.removeChild(confirmDialog);
            resolve(true);
        };
    }).then((confirmed) => {
        if (!confirmed) return;

        if (MessageManager.chatType === 'contact' && MessageManager.activeContact) {
            // Suppression d'un contact
            const contactId = MessageManager.activeContact;
            DatabaseManager.deleteUser(contactId);
            
            // Rafraîchir la liste des contacts
            ContactManager.init();
            
            // Réinitialiser l'interface de chat
            document.querySelector('#chatHeader .font-semibold').textContent = 'Sélectionnez un contact';
            document.getElementById('messages-container').innerHTML = '';
            MessageManager.activeContact = null;

            NotificationManager.show('Contact supprimé avec succès', 'success');
        } 
        else if (MessageManager.chatType === 'group' && MessageManager.activeGroup) {
            // Suppression d'un groupe
            const groupId = MessageManager.activeGroup;
            DatabaseManager.deleteGroup(groupId);
            
            // Rafraîchir la liste des groupes
            GroupManager.init();
            
            // Réinitialiser l'interface de chat
            document.querySelector('#chatHeader .font-semibold').textContent = 'Sélectionnez un contact';
            document.getElementById('messages-container').innerHTML = '';
            MessageManager.activeGroup = null;

            NotificationManager.show('Groupe supprimé avec succès', 'success');
        }
    });
};

window.handleLogout = () => {
    // Créer un élément de confirmation personnalisé
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    confirmDialog.innerHTML = `
        <div class="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h3 class="text-xl font-semibold mb-4 text-gray-800">Déconnexion</h3>
            <p class="text-gray-600 mb-6">Êtes-vous sûr de vouloir vous déconnecter ?</p>
            <div class="flex justify-end gap-3">
                <button id="cancelLogout" 
                        class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    Annuler
                </button>
                <button id="confirmLogout" 
                        class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                    Déconnexion
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(confirmDialog);

    document.getElementById('cancelLogout').onclick = () => {
        document.body.removeChild(confirmDialog);
    };

    document.getElementById('confirmLogout').onclick = () => {
        // Supprimer les données de session
        localStorage.removeItem('currentUser');
        
        // Afficher une notification
        NotificationManager.show('Déconnexion réussie', 'success');
        
        // Rediriger vers la page de connexion après un court délai
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        
        document.body.removeChild(confirmDialog);
    };
};