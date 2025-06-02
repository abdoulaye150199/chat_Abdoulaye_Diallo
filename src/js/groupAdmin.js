export class GroupAdminManager {
    constructor() {
        this.contextMenu = document.getElementById('memberContextMenu');
        this.activeGroup = null;
        this.selectedMember = null;
    }

    showContextMenu(event, member, group) {
        event.preventDefault();
        this.activeGroup = group;
        this.selectedMember = member;

        // Positionner le menu
        const x = event.clientX;
        const y = event.clientY;

        this.contextMenu.innerHTML = `
            <div class="p-2">
                ${group.admins.includes(member.id) ? `
                    <button class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg" onclick="window.GroupAdminManager.removeAdmin()">
                        <i class='bx bx-crown text-gray-500 mr-2'></i>
                        Retirer les droits d'admin
                    </button>
                ` : `
                    <button class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg" onclick="window.GroupAdminManager.makeAdmin()">
                        <i class='bx bxs-crown text-yellow-500 mr-2'></i>
                        Nommer administrateur
                    </button>
                `}
                <button class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-red-500" onclick="window.GroupAdminManager.removeMember()">
                    <i class='bx bx-user-x mr-2'></i>
                    Retirer du groupe
                </button>
            </div>
        `;

        this.contextMenu.style.display = 'block';
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;

        // Fermer le menu en cliquant ailleurs
        document.addEventListener('click', this.hideContextMenu.bind(this));
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.style.display = 'none';
        }
        document.removeEventListener('click', this.hideContextMenu.bind(this));
    }

    makeAdmin() {
        if (DatabaseManager.makeAdmin(this.activeGroup.id, this.selectedMember.id)) {
            NotificationManager.show(`${this.selectedMember.name} est maintenant administrateur`, 'success');
            GroupManager.showGroupMembers(this.activeGroup.id);
        }
        this.hideContextMenu();
    }

    removeAdmin() {
        if (DatabaseManager.removeAdmin(this.activeGroup.id, this.selectedMember.id)) {
            NotificationManager.show(`${this.selectedMember.name} n'est plus administrateur`, 'info');
            GroupManager.showGroupMembers(this.activeGroup.id);
        }
        this.hideContextMenu();
    }

    removeMember() {
        if (confirm(`Voulez-vous vraiment retirer ${this.selectedMember.name} du groupe ?`)) {
            DatabaseManager.removeGroupMember(this.activeGroup.id, this.selectedMember.id);
            NotificationManager.show(`${this.selectedMember.name} a été retiré du groupe`, 'info');
            GroupManager.showGroupMembers(this.activeGroup.id);
        }
        this.hideContextMenu();
    }
}