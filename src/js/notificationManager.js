export class NotificationManager {
    static show(message, type) {
        // Supprimer les anciennes notifications
        const oldNotifs = document.querySelectorAll('.notification-toast');
        oldNotifs.forEach(notif => notif.remove());

        // Créer la nouvelle notification
        const notification = document.createElement('div');
        notification.className = `notification-toast fixed top-4 right-4 p-4 rounded-lg shadow-xl text-white z-50 transform transition-all duration-300 ${
            type === 'success' ? 'bg-orange-500' : 'bg-red-500'
        }`;

        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                    ${type === 'success' 
                        ? '<i class="bx bx-check-circle text-2xl"></i>' 
                        : '<i class="bx bx-x-circle text-2xl"></i>'}
                </div>
                <p class="font-medium">${message}</p>
            </div>
        `;

        // Ajouter au DOM
        document.body.appendChild(notification);

        // Animation d'entrée
        requestAnimationFrame(() => {
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        });

        // Disparition automatique
        setTimeout(() => {
            notification.style.transform = 'translateY(-100%)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Ajouter les styles nécessaires
const style = document.createElement('style');
style.textContent = `
    .notification-toast {
        transform: translateY(-100%);
        opacity: 0;
    }
`;
document.head.appendChild(style);

// Pour l'utilisation globale
window.NotificationManager = NotificationManager;