import { users } from '../data/users.js';

export class BroadcastManager {
    static broadcasts = [];
    static selectedContacts = [];

    static init() {
    }

    static showBroadcastList() {
        const broadcastContactsList = document.getElementById('broadcastContactsList');
        
        if (broadcastContactsList) {
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
    }

    static startBroadcast() {
        const selectedContacts = Array.from(
            document.querySelectorAll('#broadcastContactsList input[type="checkbox"]:checked')
        ).map(checkbox => parseInt(checkbox.value));

        if (selectedContacts.length === 0) {
            alert('Veuillez sélectionner au moins un contact');
            return;
        }

        this.selectedContacts = selectedContacts;
        alert(`Diffusion préparée pour ${selectedContacts.length} contact(s)`);
    }
}