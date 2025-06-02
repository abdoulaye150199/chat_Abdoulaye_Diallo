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
                name: "Admin",
                phone: "782917770",
                avatar: null,
                status: "online",
                archived: false,
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                name: "Toto",
                phone: "+221123456789",
                avatar: null,
                status: "online",
                archived: false,
                created_at: new Date().toISOString()
            },
            {
                id: 3,
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

    static updateUser(user) {
        const users = this.getAllUsers();
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
            users[index] = user;
            localStorage.setItem('users_table', JSON.stringify(users));
        }
    }

    static createGroupsTable() {
        localStorage.setItem('groups_table', JSON.stringify([]));
    }

    static getAllGroups() {
        return JSON.parse(localStorage.getItem('groups') || '[]');
    }

    static getArchivedGroups() {
        const groups = this.getAllGroups();
        return groups.filter(group => group.archived);
    }

    // CORRECTION: Méthode pour obtenir l'ID utilisateur actuel de manière cohérente
    static getCurrentUserId() {
        // Essayer d'abord currentUser
        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
            try {
                const user = JSON.parse(currentUserStr);
                return parseInt(user.id) || user.id;
            } catch (e) {
                console.warn('⚠️ Erreur parsing currentUser:', e);
            }
        }
        
        // Puis essayer current_user
        const currentUserOldStr = localStorage.getItem('current_user');
        if (currentUserOldStr) {
            try {
                const user = JSON.parse(currentUserOldStr);
                if (user.id === 'admin') {
                    return 1; // ID par défaut pour l'admin
                }
                return parseInt(user.id) || user.id;
            } catch (e) {
                console.warn('⚠️ Erreur parsing current_user:', e);
            }
        }
        
        return 1; // ID par défaut
    }

    static addGroup(groupData) {
        const groups = this.getAllGroups();
        const currentUserId = this.getCurrentUserId();
        
        const newGroup = {
            id: Date.now(),
            name: groupData.name,
            members: groupData.members || [],
            admins: groupData.admins || [currentUserId],
            messages: [],
            archived: false,
            createdAt: new Date().toISOString(),
            createdBy: currentUserId
        };
        
        console.log('🔨 Création du groupe:', newGroup);
        
        groups.push(newGroup);
        localStorage.setItem('groups', JSON.stringify(groups));
        return newGroup;
    }

    static updateGroup(updatedGroup) {
        const groups = this.getAllGroups();
        const index = groups.findIndex(g => g.id === updatedGroup.id);
        
        if (index !== -1) {
            groups[index] = { ...groups[index], ...updatedGroup };
            localStorage.setItem('groups', JSON.stringify(groups));
            console.log('✅ Groupe mis à jour:', groups[index]);
            return true;
        }
        console.error('❌ Groupe non trouvé pour mise à jour:', updatedGroup.id);
        return false;
    }

    static getGroupById(groupId) {
        const groups = this.getAllGroups();
        return groups.find(g => g.id === parseInt(groupId));
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

    // CORRECTION: Amélioration de la gestion des messages de groupe
    static getGroupMessages(groupId) {
        try {
            // Récupérer les messages de groupe depuis group_messages_table
            const groupMessages = JSON.parse(localStorage.getItem('group_messages_table') || '[]');
            const messages = groupMessages.filter(message => 
                parseInt(message.group_id) === parseInt(groupId)
            ).sort((a, b) => 
                new Date(a.created_at) - new Date(b.created_at)
            );
            
            console.log(`💬 Messages du groupe ${groupId}:`, messages);
            return messages;
        } catch (e) {
            console.error('❌ Erreur lors de la récupération des messages du groupe:', e);
            return [];
        }
    }

    // CORRECTION: Amélioration de l'ajout de messages de groupe
    static addGroupMessage(groupId, message) {
        try {
            // Récupérer les messages existants
            const allGroupMessages = JSON.parse(localStorage.getItem('group_messages_table') || '[]');
            
            const newMessage = {
                id: Date.now(),
                group_id: parseInt(groupId),
                sender_id: parseInt(message.sender_id),
                content: message.content,
                created_at: new Date().toISOString(),
                is_read: false
            };
            
            console.log('💾 Ajout du message de groupe:', newMessage);
            
            // Ajouter le nouveau message
            allGroupMessages.push(newMessage);
            localStorage.setItem('group_messages_table', JSON.stringify(allGroupMessages));
            
            console.log('✅ Message de groupe sauvegardé');
            return newMessage;
        } catch (e) {
            console.error('❌ Erreur lors de l\'ajout du message au groupe:', e);
            return null;
        }
    }

    static createGroupMessagesTable() {
        if (!localStorage.getItem('group_messages_table')) {
            localStorage.setItem('group_messages_table', '[]');
        }
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

    static getGroupMember(groupId, userId) {
        const members = JSON.parse(localStorage.getItem('group_members_table') || '[]');
        return members.find(m => m.group_id === groupId && m.user_id === userId);
    }

    static updateGroupMemberStatus(groupId, userId, isAdmin) {
        const members = this.getAllGroupMembers();
        const memberIndex = members.findIndex(m => 
            m.group_id === parseInt(groupId) && m.user_id === parseInt(userId)
        );

        if (memberIndex !== -1) {
            members[memberIndex].is_admin = isAdmin;
            localStorage.setItem('group_members_table', JSON.stringify(members));
            return members[memberIndex];
        }
        return null;
    }

    // CORRECTION: Méthodes simplifiées pour la gestion des admins
    static makeAdmin(groupId, userId) {
        const group = this.getGroupById(groupId);
        if (!group) return false;

        if (!group.admins) {
            group.admins = [];
        }

        if (!group.admins.includes(parseInt(userId))) {
            group.admins.push(parseInt(userId));
            return this.updateGroup(group);
        }
        return false;
    }

    static removeAdmin(groupId, userId) {
        const group = this.getGroupById(groupId);
        if (!group || !group.admins) return false;

        const userIdInt = parseInt(userId);
        if (group.admins.includes(userIdInt)) {
            group.admins = group.admins.filter(id => id !== userIdInt);
            return this.updateGroup(group);
        }
        return false;
    }

    // MÉTHODES UTILITAIRES - CORRECTION
    static getLastMessage(userId) {
        const messages = this.getMessagesByUserId(userId);
        if (messages.length === 0) return null;
        return messages[messages.length - 1];
    }

    // CORRECTION: Méthode pour obtenir le dernier message d'un groupe
    static getLastGroupMessage(groupId) {
        const messages = this.getGroupMessages(groupId);
        if (messages.length === 0) return null;
        return messages[messages.length - 1];
    }

    // CORRECTION: Messages par groupe (alias pour compatibilité)
    static getMessagesByGroupId(groupId) {
        return this.getGroupMessages(groupId);
    }

    static getUnreadCount(userId) {
        const messages = this.getMessagesByUserId(userId);
        return messages.filter(msg => !msg.is_from_me && !msg.is_read).length;
    }

    // NOUVEAU: Compteur de messages non lus pour les groupes
    static getGroupUnreadCount(groupId) {
        const messages = this.getGroupMessages(groupId);
        const currentUserId = this.getCurrentUserId();
        return messages.filter(msg => 
            parseInt(msg.sender_id) !== parseInt(currentUserId) && !msg.is_read
        ).length;
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

    // NOUVEAU: Marquer les messages de groupe comme lus
    static markGroupMessagesAsRead(groupId) {
        const currentUserId = this.getCurrentUserId();
        const allGroupMessages = JSON.parse(localStorage.getItem('group_messages_table') || '[]');
        
        const updatedMessages = allGroupMessages.map(msg => {
            if (parseInt(msg.group_id) === parseInt(groupId) && 
                parseInt(msg.sender_id) !== parseInt(currentUserId)) {
                return { ...msg, is_read: true };
            }
            return msg;
        });
        
        localStorage.setItem('group_messages_table', JSON.stringify(updatedMessages));
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
            const groups = this.getAllGroups();
            const groupIndex = groups.findIndex(group => group.id === id);
            if (groupIndex !== -1) {
                groups[groupIndex].archived = true;
                localStorage.setItem('groups', JSON.stringify(groups));
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
            const groups = this.getAllGroups();
            const groupIndex = groups.findIndex(group => group.id === id);
            if (groupIndex !== -1) {
                groups[groupIndex].archived = false;
                localStorage.setItem('groups', JSON.stringify(groups));
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

    static deleteUser(userId) {
        const users = this.getAllUsers();
        const filteredUsers = users.filter(user => user.id !== userId);
        localStorage.setItem('users_table', JSON.stringify(filteredUsers));
    }

    static deleteGroup(groupId) {
        const groups = this.getAllGroups();
        const filteredGroups = groups.filter(group => group.id !== groupId);
        localStorage.setItem('groups', JSON.stringify(filteredGroups));
        
        // Supprimer aussi les messages du groupe
        const allGroupMessages = JSON.parse(localStorage.getItem('group_messages_table') || '[]');
        const filteredMessages = allGroupMessages.filter(msg => parseInt(msg.group_id) !== parseInt(groupId));
        localStorage.setItem('group_messages_table', JSON.stringify(filteredMessages));
    }

    // NOUVELLES MÉTHODES UTILITAIRES POUR UNE MEILLEURE GESTION

    static createGroupMembersTable() {
        if (!localStorage.getItem('group_members_table')) {
            localStorage.setItem('group_members_table', '[]');
        }
    }

    // Méthode pour nettoyer les données corrompues
    static cleanupDatabase() {
        try {
            // Vérifier et corriger les groupes
            const groups = this.getAllGroups();
            const cleanedGroups = groups.filter(group => group && group.id && group.name);
            localStorage.setItem('groups', JSON.stringify(cleanedGroups));

            // Vérifier et corriger les messages de groupe
            const groupMessages = JSON.parse(localStorage.getItem('group_messages_table') || '[]');
            const validGroupIds = cleanedGroups.map(g => g.id);
            const cleanedMessages = groupMessages.filter(msg => 
                msg && msg.group_id && validGroupIds.includes(parseInt(msg.group_id))
            );
            localStorage.setItem('group_messages_table', JSON.stringify(cleanedMessages));

            console.log('🧹 Base de données nettoyée');
        } catch (e) {
            console.error('❌ Erreur lors du nettoyage de la base de données:', e);
        }
    }

    // Méthode pour obtenir les statistiques d'un groupe
    static getGroupStats(groupId) {
        const group = this.getGroupById(groupId);
        if (!group) return null;

        const messages = this.getGroupMessages(groupId);
        const currentUserId = this.getCurrentUserId();
        
        return {
            memberCount: group.members.length,
            adminCount: group.admins ? group.admins.length : 0,
            messageCount: messages.length,
            unreadCount: messages.filter(msg => 
                parseInt(msg.sender_id) !== parseInt(currentUserId) && !msg.is_read
            ).length,
            lastActivity: messages.length > 0 ? messages[messages.length - 1].created_at : group.createdAt
        };
    }

    // Méthode pour vérifier si un utilisateur est admin d'un groupe
    static isUserGroupAdmin(groupId, userId) {
        const group = this.getGroupById(groupId);
        if (!group || !group.admins) return false;
        return group.admins.includes(parseInt(userId));
    }

    // Méthode pour vérifier si un utilisateur est membre d'un groupe
    static isUserGroupMember(groupId, userId) {
        const group = this.getGroupById(groupId);
        if (!group || !group.members) return false;
        return group.members.includes(parseInt(userId));
    }

    // CORRECTION: Méthode pour obtenir tous les groupes d'un utilisateur
    static getUserGroups(userId) {
        const groups = this.getAllGroups();
        return groups.filter(group => 
            group.members && group.members.includes(parseInt(userId))
        );
    }

    // CORRECTION: Méthode pour rechercher des groupes par nom
    static searchGroups(searchTerm, userId = null) {
        let groups = this.getAllGroups();
        
        if (userId) {
            groups = groups.filter(group => 
                group.members && group.members.includes(parseInt(userId))
            );
        }
        
        if (!searchTerm || searchTerm.trim() === '') {
            return groups;
        }
        
        const term = searchTerm.toLowerCase();
        return groups.filter(group => 
            group.name.toLowerCase().includes(term)
        );
    }

    // Méthode pour exporter les données (pour debug/backup)
    static exportData() {
        return {
            users: this.getAllUsers(),
            groups: this.getAllGroups(),
            messages: this.getAllMessages(),
            groupMessages: JSON.parse(localStorage.getItem('group_messages_table') || '[]'),
            groupMembers: this.getAllGroupMembers(),
            timestamp: new Date().toISOString()
        };
    }

    // Méthode pour importer des données (pour restore/debug)
    static importData(data) {
        try {
            if (data.users) localStorage.setItem('users_table', JSON.stringify(data.users));
            if (data.groups) localStorage.setItem('groups', JSON.stringify(data.groups));
            if (data.messages) localStorage.setItem('messages_table', JSON.stringify(data.messages));
            if (data.groupMessages) localStorage.setItem('group_messages_table', JSON.stringify(data.groupMessages));
            if (data.groupMembers) localStorage.setItem('group_members_table', JSON.stringify(data.groupMembers));
            
            console.log('✅ Données importées avec succès');
            return true;
        } catch (e) {
            console.error('❌ Erreur lors de l\'importation:', e);
            return false;
        }
    }
}