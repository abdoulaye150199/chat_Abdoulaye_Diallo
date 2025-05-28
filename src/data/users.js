
import { DatabaseManager } from '../js/databaseManager.js';

export function getUsers() {
    DatabaseManager.initDatabase();
    return DatabaseManager.getAllUsers();
}

export const users = getUsers();