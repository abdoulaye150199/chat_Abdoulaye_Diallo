import { DatabaseManager } from './databaseManager.js';
import { MessageManager } from './messageManager.js';

export class BroadcastManager {
    
    static broadcasts = [];
    static selectedContacts = [];

    static init() {
        this.loadBroadcasts();
    }

    static loadBroadcasts() {
        this.broadcasts = JSON.parse(localStorage.getItem('broadcasts') || '[]');
    }

    static showBroadcastList() {
        const broadcastContactsList = document.getElementById('broadcastContactsList');
        
        if (broadcastContactsList) {
            const users = DatabaseManager.getActiveUsers();
            broadcastContactsList.innerHTML = `
                <div class="p-4 border-b border-gray-200 bg-blue-50">
                    <h3 class="text-sm font-semibold mb-3 text-orange-800">Sélectionner les contacts</h3>
                    <div class="flex gap-2 mb-3">
                        <button onclick="BroadcastManager.selectAll()" 
                                class="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600">
                            Tout sélectionner
                        </button>
                        <button onclick="BroadcastManager.deselectAll()" 
                                class="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600">
                            Tout désélectionner
                        </button>
                    </div>
                    <div id="selectedCount" class="text-xs text-green-600 mb-2">
                        0 contact(s) sélectionné(s)
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto">
                    ${users.map(user => `
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
                                   onchange="BroadcastManager.updateSelectedCount()"
                                   class="rounded text-green-500 focus:ring-green-500 ml-2 w-5 h-5">
                        </div>
                    `).join('')}
                </div>
                <div class="p-4 border-t border-gray-200 bg-green-50">
                    <button onclick="BroadcastManager.startBroadcast()" 
                            class="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 font-medium">
                        <i class='bx bx-send'></i>
                        <span>Commencer la diffusion</span>
                    </button>
                </div>
            `;
            this.updateSelectedCount();
        }
    }

    static selectAll() {
        const checkboxes = document.querySelectorAll('#broadcastContactsList input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        this.updateSelectedCount();
    }

    static deselectAll() {
        const checkboxes = document.querySelectorAll('#broadcastContactsList input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        this.updateSelectedCount();
    }

    static updateSelectedCount() {
        const selectedCheckboxes = document.querySelectorAll('#broadcastContactsList input[type="checkbox"]:checked');
        const count = selectedCheckboxes.length;
        const countElement = document.getElementById('selectedCount');
        
        if (countElement) {
            countElement.textContent = `${count} contact(s) sélectionné(s)`;
            countElement.className = count > 0 ? 
                'text-xs text-green-600 mb-2 font-medium' : 
                'text-xs text-blue-600 mb-2';
        }

        // Mettre à jour le bouton
        const startButton = document.querySelector('[onclick="BroadcastManager.startBroadcast()"]');
        if (startButton) {
            if (count > 0) {
                startButton.disabled = false;
                startButton.classList.remove('opacity-50', 'cursor-not-allowed');
                startButton.innerHTML = `
                    <i class='bx bx-send'></i>
                    <span>Diffuser vers ${count} contact(s)</span>
                `;
            } else {
                startButton.disabled = true;
                startButton.classList.add('opacity-50', 'cursor-not-allowed');
                startButton.innerHTML = `
                    <i class='bx bx-send'></i>
                    <span>Commencer la diffusion</span>
                `;
            }
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
        
        // Activer le chat de diffusion
        MessageManager.activateBroadcastChat(selectedContacts);
        
        // Notification de succès
        import('./notificationManager.js').then(({ NotificationManager }) => {
            NotificationManager.show(
                `Diffusion activée pour ${selectedContacts.length} contact(s)`, 
                'success'
            );
        });
    }

    static getBroadcastHistory() {
        return this.broadcasts;
    }

    static createBroadcast(content, recipients) {
        const broadcast = {
            id: Date.now(),
            content: content,
            recipients: recipients,
            sent_at: new Date().toISOString(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        this.broadcasts.push(broadcast);
        localStorage.setItem('broadcasts', JSON.stringify(this.broadcasts));
        
        return broadcast;
    }

    static getSelectedContacts() {
        return this.selectedContacts;
    }

    static clearSelection() {
        this.selectedContacts = [];
        const checkboxes = document.querySelectorAll('#broadcastContactsList input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        this.updateSelectedCount();
    }
}