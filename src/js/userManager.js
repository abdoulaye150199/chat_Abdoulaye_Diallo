// userManager.js - Version modifiée
import { users } from '../data/users.js';
import { NotificationManager } from './notificationManager.js';

export class UserManager {
    static currentUser = null;

    static init() {
        // Utiliser une variable temporaire au lieu de localStorage
        if (!this.currentUser) {
            const adminUser = {
                id: 'admin',
                name: 'Admin',
                phone: '782917770',
                role: 'admin',
                status: 'online',
                created_at: new Date().toISOString()
            };
            
            this.currentUser = adminUser;
        }
    }

    static getCurrentUser() {
        if (!this.currentUser) {
            this.init();
        }
        return this.currentUser;
    }

    static updateStatus(status) {
        if (this.currentUser) {
            this.currentUser.status = status;
            // Notification au lieu d'alert
            NotificationManager.show(`Statut mis à jour: ${status}`, 'success');
        }
    }

    static isAdmin() {
        return this.getCurrentUser()?.role === 'admin';
    }

    static addUser(name) {
        if (!name || name.trim() === '') {
            NotificationManager.show('Veuillez saisir un nom valide', 'error');
            return null;
        }

        const newUser = {
            id: users.length + 1,
            name: name.trim(),
            avatar: null,
            status: "online",
            lastMessage: "",
            lastMessageDate: new Date().toLocaleTimeString(),
            unread: 0
        };
        
        users.push(newUser);
        this.renderUsers();
        
        // Notification de succès
        NotificationManager.show('Utilisateur ajouté avec succès', 'success');
        return newUser;
    }

    static renderUsers() {
        const usersList = document.querySelector('.flex-1.overflow-y-auto');
        if (!usersList) return;

        usersList.innerHTML = users.map(user => `
            <div class="flex items-center gap-3 p-4 hover:bg-gray-100 cursor-pointer border-b border-gray-100">
                <div class="w-11 h-11 bg-gray-400 rounded-full flex-shrink-0"></div>
                <div class="flex-1 min-w-0">
                    <div class="font-semibold text-gray-800 text-sm">${user.name}</div>
                    <div class="text-xs text-gray-500 truncate">${user.lastMessage}</div>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <div class="text-xs text-green-500">${user.lastMessageDate}</div>
                    ${user.unread ? `<div class="w-2 h-2 bg-green-500 rounded-full"></div>` : ''}
                </div>
            </div>
        `).join('');
    }
}

// contactManager.js - Modifications pour éviter les alerts
export class ContactManager {
    // ... (garder le code existant pour CONTACT_STYLES et CONTACT_ITEM_CLASS)

    static addContact(name, phone) {
        let contactName = name.trim();
        const contactPhone = phone.trim();
        
        if (!contactName || !contactPhone) {
            NotificationManager.show('Veuillez remplir tous les champs', 'error');
            return;
        }

        // Vérification du format du numéro
        if (!contactPhone.match(/^(7[0578])[0-9]{7}$/)) {
            NotificationManager.show('Le numéro doit commencer par 70, 75, 76, 77 ou 78 et contenir 9 chiffres', 'error');
            return;
        }

        // Vérifier si le numéro existe déjà
        const existingUsers = DatabaseManager.getAllUsers();
        const phoneExists = existingUsers.some(user => user.phone === contactPhone);
        if (phoneExists) {
            NotificationManager.show('Ce numéro de téléphone existe déjà', 'error');
            return;
        }

        // Vérifier si le nom existe et ajouter un numéro si nécessaire
        const nameExists = existingUsers.some(user => user.name === contactName);
        if (nameExists) {
            let counter = 1;
            let newName = `${contactName} ${counter}`;
            while (existingUsers.some(user => user.name === newName)) {
                counter++;
                newName = `${contactName} ${counter}`;
            }
            contactName = newName;
            // Notification pour informer du changement de nom
            NotificationManager.show(`Nom modifié en "${contactName}" car il existait déjà`, 'success');
        }

        // Ajouter le contact
        try {
            const newUser = DatabaseManager.addUser({
                name: contactName,
                phone: contactPhone,
                status: "online"
            });

            // Réinitialiser le formulaire
            const nameInput = document.getElementById('contactName');
            const phoneInput = document.getElementById('contactPhone');
            const phoneError = document.getElementById('phoneError');

            if (nameInput) nameInput.value = '';
            if (phoneInput) phoneInput.value = '';
            if (phoneError) phoneError.classList.add('hidden');

            document.getElementById('addContactForm')?.classList.add('hidden');

            // Rafraîchir la liste des contacts
            this.renderContacts();

            // Notification de succès
            NotificationManager.show('Contact ajouté avec succès', 'success');
        } catch (error) {
            NotificationManager.show('Erreur lors de l\'ajout du contact', 'error');
            console.error('Erreur:', error);
        }
    }

    static selectContact(id, element) {
        const contact = this.getContactById(id);
        if (!contact) {
            NotificationManager.show('Contact introuvable', 'error');
            return;
        }

        // Retirer la sélection de tous les contacts
        document.querySelectorAll('.contact-item').forEach(item => {
            item.classList.remove('bg-gray-300');
        });
        
        // Appliquer la sélection au contact cliqué
        element.classList.add('bg-gray-300');

        // Activer la zone de saisie des messages
        const inputArea = document.querySelector('.bg-white.p-5.border-t');
        if (inputArea) {
            inputArea.classList.remove('opacity-50', 'pointer-events-none');
        }

        // Activer le chat avec ce contact
        try {
            MessageManager.activateChat(id);
            NotificationManager.show(`Chat activé avec ${contact.name}`, 'success');
        } catch (error) {
            NotificationManager.show('Erreur lors de l\'activation du chat', 'error');
            console.error('Erreur:', error);
        }
    }

    // ... (garder le reste des méthodes existantes)
}

// Fonction globale pour validation des formulaires sans alert
window.validateForm = function(formId) {
    const form = document.getElementById(formId);
    if (!form) {
        NotificationManager.show('Formulaire introuvable', 'error');
        return false;
    }

    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('border-red-500');
            isValid = false;
        } else {
            input.classList.remove('border-red-500');
        }
    });

    if (!isValid) {
        NotificationManager.show('Veuillez remplir tous les champs obligatoires', 'error');
    }

    return isValid;
};

// Remplacer toutes les utilisations d'alert() par NotificationManager
window.showMessage = function(message, type = 'success') {
    NotificationManager.show(message, type);
};

// Pour capturer et remplacer les alerts accidentelles
window.alert = function(message) {
    console.warn('Alert interceptée:', message);
    NotificationManager.show(message, 'error');
};

window.confirm = function(message) {
    console.warn('Confirm interceptée:', message);
    NotificationManager.show(message + ' (Confirmation requise)', 'error');
    return false; // Par défaut, retourner false
};

// Fonction pour créer des modales de confirmation personnalisées
window.showConfirmModal = function(message, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-medium mb-4">Confirmation</h3>
            <p class="text-gray-600 mb-6">${message}</p>
            <div class="flex gap-3 justify-end">
                <button onclick="this.closest('.fixed').remove(); ${onCancel ? onCancel.toString() + '()' : ''}" 
                        class="px-4 py-2 text-gray-600 hover:text-gray-800">
                    Annuler
                </button>
                <button onclick="this.closest('.fixed').remove(); ${onConfirm ? onConfirm.toString() + '()' : ''}" 
                        class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
                    Confirmer
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};