import { NotificationManager } from './notificationManager.js';
import { DatabaseManager } from './databaseManager.js';
import { MessageManager } from './messageManager.js';

export class ContactManager {
    // Définir une constante pour le style des contacts
    static CONTACT_STYLES = {
        default: `
            flex items-center gap-3 p-4 
            hover:bg-gray-200 
            cursor-pointer 
            border-b border-gray-100 
            bg-white
            transition-colors
            contact-item
        `,
        active: `
            flex items-center gap-3 p-4 
            bg-gray-200 
            cursor-pointer 
            border-b border-gray-100
            transition-colors
            contact-item
        `
    };

    static CONTACT_ITEM_CLASS = `
        flex items-center gap-3 p-3 
        hover:bg-[#efe7d7] 
        cursor-pointer
        border-b border-gray-200
        last:border-0 
        transition-colors 
        bg-gray-50
    `;
    
    static init() {
        DatabaseManager.initDatabase();
        this.renderContacts();
    }

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

        // Notification de succès
        NotificationManager.show('Contact ajouté avec succès', 'success');
    }

    static getInitials(name) {
        const words = name.split(' ');
        
        if (words.length >= 2) {
            return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
        } else {
            return words[0].charAt(0).toUpperCase();
        }
    }

    static renderContact(contact) {
        return `
            <div class="${this.CONTACT_STYLES.default}" data-contact-id="${contact.id}">
                <div class="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                    ${contact.name.charAt(0).toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm text-gray-800">${contact.name}</div>
                    <div class="text-xs text-gray-500 truncate">${contact.phone}</div>
                </div>
            </div>
        `;
    }

    static renderContacts() {
        const contactsList = document.getElementById('contactsList');
        if (!contactsList) return;

        const users = DatabaseManager.getActiveUsers();
        
        contactsList.innerHTML = users.map(user => `
            <div class="flex items-center gap-3 p-4 hover:bg-gray-200 border-b border-gray-100 cursor-pointer contact-item transition-colors" 
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
            MessageManager.activateChat(id);
        }
    }

    static searchContacts(query = '') {
        const searchQuery = query.toLowerCase().trim();
        const contacts = DatabaseManager.getAllUsers();
        const contactsList = document.getElementById('contactsList');

        if (!contactsList) return;

        // Si la recherche est vide, afficher tous les contacts
        if (!searchQuery) {
            this.renderContacts();
            return;
        }

        // Filtrer les contacts
        const filteredContacts = contacts.filter(contact => 
            contact.name.toLowerCase().includes(searchQuery) ||
            contact.phone.includes(searchQuery)
        );

        if (filteredContacts.length === 0) {
            contactsList.innerHTML = `
                <div class="flex items-center justify-center h-40">
                    <div class="text-center text-gray-500">
                        <i class='bx bx-search text-3xl mb-2'></i>
                        <p>Aucun résultat pour "${query}"</p>
                    </div>
                </div>
            `;
            return;
        }

        contactsList.innerHTML = filteredContacts.map(contact => `
            <div class="flex items-center gap-3 p-4 hover:bg-gray-200 border-b border-gray-100 cursor-pointer contact-item transition-colors"
                 onclick="ContactManager.selectContact(${contact.id}, this)"
                 data-contact-id="${contact.id}">
                <div class="w-11 h-11 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                    ${contact.name.charAt(0).toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm">${this.highlightMatch(contact.name, searchQuery)}</div>
                    <div class="text-xs text-gray-500">${this.highlightMatch(contact.phone, searchQuery)}</div>
                </div>
            </div>
        `).join('');
    }

    static highlightMatch(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="bg-yellow-200">$1</span>');
    }

    static sortContactsAlphabetically() {
        const contactsList = document.getElementById('contactsList');
        if (!contactsList) return;

        // Récupérer les contacts depuis la base de données
        const contacts = DatabaseManager.getActiveUsers();
        
        // Trier les contacts par nom
        contacts.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase(), 'fr'));
        
        // Réafficher la liste triée
        contactsList.innerHTML = contacts.map(user => `
            <div class="flex items-center gap-3 p-4 hover:bg-gray-200 border-b border-gray-100 cursor-pointer contact-item transition-colors" 
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

    static handleContactClick(contactElement) {
        // Retirer la classe active de tous les contacts
        document.querySelectorAll('[data-contact-id]').forEach(el => {
            el.className = this.CONTACT_STYLES.default;
        });
        
        // Ajouter la classe active au contact sélectionné
        contactElement.className = this.CONTACT_STYLES.active;
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