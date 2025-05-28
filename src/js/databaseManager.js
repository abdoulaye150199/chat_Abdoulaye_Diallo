export class DatabaseManager {
    static initDatabase() {
        if (!localStorage.getItem('users_table')) {
            this.createUsersTable();
        }
        if (!localStorage.getItem('groups_table')) {
            this.createGroupsTable();
        }
        if (!localStorage.getItem('messages_table')) {
            this.createMessagesTable();
        }
        if (!localStorage.getItem('group_messages_table')) {
            this.createGroupMessagesTable();
        }
        if (!localStorage.getItem('group_members_table')) {
            this.createGroupMembersTable();
        }
    }

    static createUsersTable() {
        const defaultUsers = [
            {
                id: 1,
                name: "Toto",
                phone: "+221123456789",
                avatar: null,
                status: "online",
                archived: false,
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                name: "MM",
                phone: "+221987654321",
                avatar: null,
                status: "online",
                archived: false,
                created_at: new Date().toISOString()
            }
        ];
        localStorage.setItem('users_table', JSON.stringify(defaultUsers));
    }

    static getAllUsers() {
        const users = JSON.parse(localStorage.getItem('users_table') || '[]');
        // Ne retourner que les utilisateurs non archivés
        return users;
    }

    static getActiveUsers() {
        const users = JSON.parse(localStorage.getItem('users_table') || '[]');
        return users.filter(user => !user.archived);
    }

    static getArchivedUsers() {
        const users = JSON.parse(localStorage.getItem('users_table') || '[]');
        return users.filter(user => user.archived);
    }

    static addUser(userData) {
        const users = this.getAllUsers();
        const maxId = users.length > 0 ? Math.max(...users.map(u => u.id)) : 0;
        const newUser = {
            id: maxId + 1,
            ...userData,
            created_at: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('users_table', JSON.stringify(users));
        return newUser;
    }

    static getUserById(userId) {
        const users = this.getAllUsers();
        return users.find(user => user.id === parseInt(userId));
    }

    static updateUser(userId, userData) {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...userData };
            localStorage.setItem('users_table', JSON.stringify(users));
            return users[userIndex];
        }
        return null;
    }

    static createGroupsTable() {
        localStorage.setItem('groups_table', JSON.stringify([]));
    }

    static getAllGroups() {
        const groups = JSON.parse(localStorage.getItem('groups_table') || '[]');
        return groups.filter(group => !group.archived);
    }

    static getArchivedGroups() {
        const groups = JSON.parse(localStorage.getItem('groups_table') || '[]');
        return groups.filter(group => group.archived);
    }

    static addGroup(groupData) {
        const groups = JSON.parse(localStorage.getItem('groups_table') || '[]');
        const newGroup = {
            id: Date.now(),
            ...groupData,
            archived: false,
            created_at: new Date().toISOString()
        };
        groups.push(newGroup);
        localStorage.setItem('groups_table', JSON.stringify(groups));
        return newGroup;
    }

    static getGroupById(groupId) {
        const groups = JSON.parse(localStorage.getItem('groups_table') || '[]');
        return groups.find(group => group.id === parseInt(groupId));
    }

    static updateGroup(groupId, updateData) {
        const groups = this.getAllGroups();
        const groupIndex = groups.findIndex(group => group.id === parseInt(groupId));
        if (groupIndex !== -1) {
            groups[groupIndex] = { ...groups[groupIndex], ...updateData };
            localStorage.setItem('groups_table', JSON.stringify(groups));
            return groups[groupIndex];
        }
        return null;
    }

    static createMessagesTable() {
        localStorage.setItem('messages_table', JSON.stringify([]));
    }

    static getAllMessages() {
        return JSON.parse(localStorage.getItem('messages_table') || '[]');
    }

    static addMessage(messageData) {
        const messages = this.getAllMessages();
        const newMessage = {
            id: Date.now(),
            ...messageData,
            created_at: new Date().toISOString(),
            timestamp: new Date().toLocaleTimeString()
        };
        messages.push(newMessage);
        localStorage.setItem('messages_table', JSON.stringify(messages));
        return newMessage;
    }

    static getMessagesByUserId(userId) {
        const messages = this.getAllMessages();
        return messages.filter(msg => msg.user_id === parseInt(userId));
    }

    static createGroupMessagesTable() {
        localStorage.setItem('group_messages_table', JSON.stringify([]));
    }

    static getAllGroupMessages() {
        return JSON.parse(localStorage.getItem('group_messages_table') || '[]');
    }

    static addGroupMessage(messageData) {
        const messages = this.getAllGroupMessages();
        const newMessage = {
            id: Date.now(),
            ...messageData,
            created_at: new Date().toISOString(),
            timestamp: new Date().toLocaleTimeString()
        };
        messages.push(newMessage);
        localStorage.setItem('group_messages_table', JSON.stringify(messages));
        return newMessage;
    }

    static getMessagesByGroupId(groupId) {
        const messages = this.getAllGroupMessages();
        return messages.filter(msg => msg.group_id === parseInt(groupId));
    }

    static createGroupMembersTable() {
        localStorage.setItem('group_members_table', JSON.stringify([]));
    }

    static getAllGroupMembers() {
        return JSON.parse(localStorage.getItem('group_members_table') || '[]');
    }

    static addGroupMember(groupId, userId, isAdmin = false) {
        const members = this.getAllGroupMembers();
        const newMember = {
            id: Date.now(),
            group_id: parseInt(groupId),
            user_id: userId,
            is_admin: isAdmin,
            joined_at: new Date().toISOString()
        };
        members.push(newMember);
        localStorage.setItem('group_members_table', JSON.stringify(members));
        return newMember;
    }

    static getGroupMembers(groupId) {
        const members = this.getAllGroupMembers();
        const groupMembers = members.filter(m => m.group_id === parseInt(groupId));
        
        // Retourner les informations complètes des utilisateurs
        return groupMembers.map(member => {
            const user = this.getUserById(member.user_id);
            return {
                ...member,
                user: user
            };
        });
    }

    static removeGroupMember(groupId, userId) {
        const members = this.getAllGroupMembers();
        const filteredMembers = members.filter(m => !(m.group_id === parseInt(groupId) && m.user_id === parseInt(userId)));
        localStorage.setItem('group_members_table', JSON.stringify(filteredMembers));
    }

    // MÉTHODES UTILITAIRES
    static getLastMessage(userId) {
        const messages = this.getMessagesByUserId(userId);
        if (messages.length === 0) return null;
        return messages[messages.length - 1];
    }

    static getLastGroupMessage(groupId) {
        const messages = this.getMessagesByGroupId(groupId);
        if (messages.length === 0) return null;
        return messages[messages.length - 1];
    }

    static getUnreadCount(userId) {
        const messages = this.getMessagesByUserId(userId);
        return messages.filter(msg => !msg.is_from_me && !msg.is_read).length;
    }

    static markMessagesAsRead(userId) {
        const messages = this.getAllMessages();
        const updatedMessages = messages.map(msg => {
            if (msg.user_id === parseInt(userId) && !msg.is_from_me) {
                return { ...msg, is_read: true };
            }
            return msg;
        });
        localStorage.setItem('messages_table', JSON.stringify(updatedMessages));
    }

    static archiveItem(id, type) {
        if (type === 'contact') {
            const users = this.getAllUsers();
            const userIndex = users.findIndex(user => user.id === id);
            if (userIndex !== -1) {
                users[userIndex].archived = true;
                localStorage.setItem('users_table', JSON.stringify(users));
            }
        } else if (type === 'group') {
            const groups = JSON.parse(localStorage.getItem('groups_table') || '[]');
            const groupIndex = groups.findIndex(group => group.id === id);
            if (groupIndex !== -1) {
                groups[groupIndex].archived = true;
                localStorage.setItem('groups_table', JSON.stringify(groups));
            }
        }
    }

    static unarchiveItem(id, type) {
        if (type === 'contact') {
            const users = this.getAllUsers();
            const userIndex = users.findIndex(user => user.id === id);
            if (userIndex !== -1) {
                users[userIndex].archived = false;
                localStorage.setItem('users_table', JSON.stringify(users));
            }
        } else if (type === 'group') {
            const groups = JSON.parse(localStorage.getItem('groups_table') || '[]');
            const groupIndex = groups.findIndex(group => group.id === id);
            if (groupIndex !== -1) {
                groups[groupIndex].archived = false;
                localStorage.setItem('groups_table', JSON.stringify(groups));
            }
        }
    }

    static archiveContact(contactId) {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(user => user.id === contactId);
        if (userIndex !== -1) {
            users[userIndex].archived = true;
            localStorage.setItem('users_table', JSON.stringify(users));
            return true;
        }
        return false;
    }

    static unarchiveContact(contactId) {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(user => user.id === contactId);
        if (userIndex !== -1) {
            users[userIndex].archived = false;
            localStorage.setItem('users_table', JSON.stringify(users));
            return true;
        }
        return false;
    }
}