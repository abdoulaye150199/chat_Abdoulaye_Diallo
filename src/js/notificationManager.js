export class NotificationManager {
    static show(message, type = 'info') {
        const notification = document.getElementById('notification');
        
        notification.innerHTML = `
            <div class="p-4 flex items-center gap-3 ${this.getBackgroundColor(type)}">
                <div class="text-2xl">${this.getIcon(type)}</div>
                <div class="flex-1 text-sm text-gray-800">${message}</div>
                <button onclick="NotificationManager.hide()" class="text-gray-400 hover:text-gray-600">
                    <i class='bx bx-x'></i>
                </button>
            </div>
        `;

        notification.classList.remove('scale-0', 'opacity-0');
        notification.classList.add('scale-100', 'opacity-100');

        // Auto-hide after 3 seconds
        setTimeout(() => this.hide(), 3000);
    }

    static hide() {
        const notification = document.getElementById('notification');
        notification.classList.remove('scale-100', 'opacity-100');
        notification.classList.add('scale-0', 'opacity-0');
    }

    static getBackgroundColor(type) {
        const colors = {
            success: 'bg-green-50',
            error: 'bg-red-50',
            warning: 'bg-yellow-50',
            info: 'bg-blue-50'
        };
        return colors[type] || colors.info;
    }

    static getIcon(type) {
        const icons = {
            success: '<i class="bx bx-check-circle text-green-500"></i>',
            error: '<i class="bx bx-x-circle text-red-500"></i>',
            warning: '<i class="bx bx-error-circle text-yellow-500"></i>',
            info: '<i class="bx bx-info-circle text-blue-500"></i>'
        };
        return icons[type] || icons.info;
    }
}

// Pour l'utilisation globale
window.NotificationManager = NotificationManager;