import { NotificationManager } from './notificationManager.js';
import { DatabaseManager } from './databaseManager.js';
import { MessageManager } from './messageManager.js';

export class ContactManager {
    static init() {
        DatabaseManager.initDatabase();
        this.renderContacts();
    }

    static addContact(name, phone) {
        let contactName = name.trim();
        const contactPhone = phone.trim();
        
        if (!contactName || !contactPhone) {
            NotificationManager.show('Veuillez remplir tous les champs', 'warning');
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
        }

        // Ajouter le contact
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

        // Notifier avec le nouveau nom si modifié
        if (contactName !== name.trim()) {
            NotificationManager.show(`Contact ajouté sous le nom "${contactName}"`, 'success');
        } else {
            NotificationManager.show('Contact ajouté avec succès', 'success');
        }
    }

    static getInitials(name) {

        const words = name.split(' ');
        
        if (words.length >= 2) {

            return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
        } else {
            return words[0].charAt(0).toUpperCase();
        }
    }

    static renderContacts() {
        const contactsList = document.getElementById('contactsList');
        if (!contactsList) return;

        const users = DatabaseManager.getActiveUsers();
        
        contactsList.innerHTML = users.map(user => `
            <div class="flex items-center gap-3 p-4 hover:bg-gray-200 border-b border-gray-100 cursor-pointer contact-item" 
                 onclick="ContactManager.selectContact(${user.id}, this)"
                 data-contact-id="${user.id}">
                <div class="w-11 h-11 bg-gray-400 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold">
                    ${this.getInitials(user.name)}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="font-semibold text-gray-800 text-sm">${user.name}</div>
                    <div class="text-xs text-gray-500 truncate">${user.phone || ''}</div>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <div class="text-xs text-green-500">date</div>
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
            </div>
        `).join('');
    }

    static getContactById(id) {
        return DatabaseManager.getUserById(id);
    }

    static selectContact(id, element) {
        const contact = this.getContactById(id);
        if (contact) {
            document.querySelectorAll('.contact-item').forEach(item => {
                item.classList.remove('bg-gray-300');
            });
            
           
            element.classList.add('bg-gray-300');

           
            const inputArea = document.querySelector('.bg-white.p-5.border-t');
            if (inputArea) {
                inputArea.classList.remove('opacity-50', 'pointer-events-none');
            }


            MessageManager.activateChat(id);
        }
    }
}

// Pour l'utilisation globale
window.addNewContact = () => {
    const nameInput = document.getElementById('contactName');
    const phoneInput = document.getElementById('contactPhone');
    if (nameInput && phoneInput) {
        ContactManager.addContact(nameInput.value, phoneInput.value);
    }
};