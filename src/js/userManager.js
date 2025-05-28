import { users } from '../data/users.js';

export class UserManager {
    static currentUser = null;

    static init() {

        if (!localStorage.getItem('current_user')) {
            const adminUser = {
                id: 'admin',
                name: 'Admin',
                phone: '782917770',
                role: 'admin',
                status: 'online',
                created_at: new Date().toISOString()
            };
            
            localStorage.setItem('current_user', JSON.stringify(adminUser));
            this.currentUser = adminUser;
        } else {
            this.currentUser = JSON.parse(localStorage.getItem('current_user'));
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
            localStorage.setItem('current_user', JSON.stringify(this.currentUser));
        }
    }

    static isAdmin() {
        return this.getCurrentUser()?.role === 'admin';
    }

    static addUser(name) {
        const newUser = {
            id: users.length + 1,
            name: name,
            avatar: null,
            status: "online",
            lastMessage: "",
            lastMessageDate: new Date().toLocaleTimeString(),
            unread: 0
        };
        users.push(newUser);
        this.renderUsers();
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