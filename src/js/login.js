import { DatabaseManager } from './databaseManager.js';

document.getElementById('loginButton').addEventListener('click', handleLogin);

function handleLogin() {
    const nameInput = document.getElementById('loginName');
    const phoneInput = document.getElementById('loginPhone');
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    
    if (!name || !phone) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    // Vérification des identifiants autorisés
    const AUTHORIZED_NAME = "Abdoulaye Diallo";
    const AUTHORIZED_PHONE = "782917770";
    
    if (name !== AUTHORIZED_NAME || phone !== AUTHORIZED_PHONE) {
        alert('Accès refusé. Identifiants non autorisés.');
        return;
    }
    
    // Vérifier si l'utilisateur existe dans la base de données
    const users = DatabaseManager.getAllUsers();
    let user = users.find(u => u.phone === phone);
    
    if (!user) {
        // Créer l'utilisateur autorisé s'il n'existe pas
        const newUser = DatabaseManager.addUser({
            name: AUTHORIZED_NAME,
            phone: AUTHORIZED_PHONE,
            status: "online",
            archived: false
        });
        
        if (newUser) {
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            window.location.href = 'index.html';
        }
    } else {
        // Mettre à jour le statut en ligne
        user.status = "online";
        DatabaseManager.updateUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = 'index.html';
    }
}