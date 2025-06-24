
'use server';

import { db } from '@/lib/db';
import type { Profile, Group, Message, Friend } from '@/contexts/auth-context';
import { v4 as uuidv4 } from 'uuid';
import type { Theme } from '@/lib/themes';
import { getPrivateChatId } from '@/lib/utils';

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// User Actions
export async function registerUser(username: string, email: string, password: string) {
    try {
        const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
        if (existingUser) {
            return { success: false, message: 'Utilisateur ou e-mail déjà enregistré.' };
        }

        const passwordHash = await hashPassword(password);
        const userId = uuidv4();
        const defaultProfilePic = `https://placehold.co/100x100.png`;

        db.prepare('INSERT INTO users (id, username, email, passwordHash, phone, status, profilePic) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(userId, username, email, passwordHash, 'Non défini', 'En ligne', defaultProfilePic);

        return { success: true, message: 'Utilisateur enregistré avec succès !' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function loginUser(username: string, password: string) {
    try {
        const user = db.prepare('SELECT id, passwordHash FROM users WHERE username = ?').get(username) as { id: string, passwordHash: string } | undefined;
        if (!user) {
            return { success: false, message: 'Utilisateur non trouvé.' };
        }
        const passwordHash = await hashPassword(password);
        if (passwordHash !== user.passwordHash) {
            return { success: false, message: 'Mot de passe incorrect.' };
        }
        return { success: true, message: 'Connexion réussie !' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function getAllUsers(): Promise<Profile[]> {
    const users = db.prepare('SELECT id, username, email, phone, status, profilePic FROM users').all() as any[];
    return users.map(u => ({ ...u, isGroup: false }));
}

function getUserByName(username: string): { id: string, username: string } | null {
    const user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username) as { id: string, username: string } | undefined;
    return user || null;
}

function getUserById(userId: string): { id: string, username: string } | null {
    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId) as { id: string, username: string } | undefined;
    return user || null;
}


export async function getInitialData(username: string) {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user) return null;

    // Profile data
    const profile: Profile = {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        status: user.status,
        profilePic: user.profilePic,
        isGroup: false,
    };

    // Friends
    const friendRows = db.prepare('SELECT friend_id, addedAt FROM friends WHERE user_id = ?').all(user.id) as { friend_id: string, addedAt: string }[];
    const friends: Friend[] = friendRows.map(row => ({
        username: (getUserById(row.friend_id)?.username || 'unknown'),
        addedAt: row.addedAt
    })).filter(f => f.username !== 'unknown');
    profile.friends = friends;

    // Friend Requests
    const requestRows = db.prepare('SELECT sender_id FROM friend_requests WHERE receiver_id = ?').all(user.id) as { sender_id: string }[];
    profile.friendRequests = requestRows.map(r => getUserById(r.sender_id)?.username || 'unknown').filter(u => u !== 'unknown');

    const sentRequestRows = db.prepare('SELECT receiver_id FROM friend_requests WHERE sender_id = ?').all(user.id) as { receiver_id: string }[];
    profile.sentRequests = sentRequestRows.map(r => getUserById(r.receiver_id)?.username || 'unknown').filter(u => u !== 'unknown');


    // Groups
    const groupMemberRows = db.prepare('SELECT group_id FROM group_members WHERE user_id = ?').all(user.id) as { group_id: string }[];
    const groupIds = groupMemberRows.map(r => r.group_id);
    profile.groups = groupIds;
    
    let groups: Group[] = [];
    if (groupIds.length > 0) {
        const placeholders = groupIds.map(() => '?').join(',');
        const groupRows = db.prepare(`SELECT * FROM groups WHERE id IN (${placeholders})`).all(...groupIds) as any[];
        groups = groupRows.map(g => {
            const memberRows = db.prepare('SELECT user_id FROM group_members WHERE group_id = ?').all(g.id) as { user_id: string }[];
            return {
                id: g.id,
                name: g.name,
                creator: getUserById(g.creator_id)?.username || 'unknown',
                members: memberRows.map(m => getUserById(m.user_id)?.username || 'unknown').filter(u => u !== 'unknown'),
                profilePic: g.profilePic,
                isGroup: true
            };
        });
    }

    // Messages
    const chatIds = [
        ...groupIds,
        ...friends.map(f => getPrivateChatId(user.username, f.username))
    ];
    const messages: Record<string, Message[]> = {};
    if (chatIds.length > 0) {
        const placeholders = chatIds.map(() => '?').join(',');
        const messageRows = db.prepare(`SELECT * FROM messages WHERE chat_id IN (${placeholders}) ORDER BY timestamp ASC`).all(...chatIds) as any[];
        messageRows.forEach(msg => {
            if (!messages[msg.chat_id]) {
                messages[msg.chat_id] = [];
            }
            messages[msg.chat_id].push({
                id: msg.id,
                chatId: msg.chat_id,
                sender: getUserById(msg.sender_id)?.username || 'unknown',
                text: msg.text,
                timestamp: msg.timestamp
            });
        });
    }
    
    // Unread Counts
    const unreadRows = db.prepare('SELECT chat_id, count FROM unread_counts WHERE user_id = ?').all(user.id) as {chat_id: string, count: number}[];
    const unreadCounts = unreadRows.reduce((acc, row) => {
        acc[row.chat_id] = row.count;
        return acc;
    }, {} as Record<string, number>);

    return { profile, groups, messages, unreadCounts };
}

export async function updateUserProfile(newProfile: Profile) {
    try {
        db.prepare('UPDATE users SET email = ?, phone = ?, status = ?, profilePic = ? WHERE id = ?')
            .run(newProfile.email, newProfile.phone, newProfile.status, newProfile.profilePic, newProfile.id);
        return { success: true, message: 'Profil mis à jour' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// Friend Actions
export async function sendFriendRequestAction(currentUsername: string, friendUsername: string) {
    const currentUser = getUserByName(currentUsername);
    const friendUser = getUserByName(friendUsername);

    if (!currentUser || !friendUser) return { success: false, message: "Utilisateur non trouvé" };
    if (currentUser.id === friendUser.id) return { success: false, message: "Vous ne pouvez pas vous ajouter vous-même." };
    
    try {
        const existingRequest = db.prepare('SELECT * FROM friend_requests WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)')
            .get(currentUser.id, friendUser.id, friendUser.id, currentUser.id);
        if (existingRequest) return { success: false, message: "Une demande d'ami existe déjà." };

        const existingFriendship = db.prepare('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?').get(currentUser.id, friendUser.id);
        if (existingFriendship) return { success: false, message: "Vous êtes déjà amis." };

        db.prepare('INSERT INTO friend_requests (sender_id, receiver_id) VALUES (?, ?)')
          .run(currentUser.id, friendUser.id);
        return { success: true, message: "Demande d'ami envoyée." };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function acceptFriendRequestAction(currentUsername: string, friendUsername: string) {
    const currentUser = getUserByName(currentUsername);
    const friendUser = getUserByName(friendUsername);
    if (!currentUser || !friendUser) return { success: false, message: "Utilisateur non trouvé" };

    try {
        const request = db.prepare('SELECT * FROM friend_requests WHERE sender_id = ? AND receiver_id = ?')
            .get(friendUser.id, currentUser.id);
        if (!request) return { success: false, message: "Aucune demande d'ami trouvée." };
        
        const addedAt = new Date().toISOString();
        const transaction = db.transaction(() => {
            db.prepare('DELETE FROM friend_requests WHERE sender_id = ? AND receiver_id = ?')
              .run(friendUser.id, currentUser.id);
            db.prepare('INSERT INTO friends (user_id, friend_id, addedAt) VALUES (?, ?, ?)')
              .run(currentUser.id, friendUser.id, addedAt);
            db.prepare('INSERT INTO friends (user_id, friend_id, addedAt) VALUES (?, ?, ?)')
              .run(friendUser.id, currentUser.id, addedAt);
        });
        transaction();
        
        const newFriend: Friend = { username: friendUsername, addedAt };
        return { success: true, message: "Demande d'ami acceptée.", newFriend };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function rejectFriendRequestAction(currentUsername: string, friendUsername: string) {
    const currentUser = getUserByName(currentUsername);
    const friendUser = getUserByName(friendUsername);
    if (!currentUser || !friendUser) return { success: false, message: "Utilisateur non trouvé" };
    try {
        db.prepare('DELETE FROM friend_requests WHERE sender_id = ? AND receiver_id = ?')
            .run(friendUser.id, currentUser.id);
        return { success: true, message: "Demande d'ami rejetée." };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// Group Actions
export async function createGroupAction(creatorUsername: string, name: string, memberUsernames: string[]) {
    const creator = getUserByName(creatorUsername);
    if (!creator) return { success: false, message: "Créateur non trouvé" };

    try {
        const groupId = `group_${uuidv4()}`;
        const allMemberUsernames = Array.from(new Set([creatorUsername, ...memberUsernames]));
        
        const transaction = db.transaction(() => {
            db.prepare('INSERT INTO groups (id, name, creator_id, profilePic) VALUES (?, ?, ?, ?)')
                .run(groupId, name, creator.id, `https://placehold.co/100x100.png`);
            
            const stmt = db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)');
            allMemberUsernames.forEach(username => {
                const member = getUserByName(username);
                if (member) {
                    stmt.run(groupId, member.id);
                }
            });
        });
        transaction();
        
        const newGroup: Group = {
            id: groupId,
            name,
            creator: creatorUsername,
            members: allMemberUsernames,
            profilePic: `https://placehold.co/100x100.png`,
            isGroup: true,
        };
        return { success: true, message: "Groupe créé.", group: newGroup };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updateGroupAction(groupId: string, data: Partial<Group>) {
    try {
        if(data.profilePic) {
             db.prepare('UPDATE groups SET profilePic = ? WHERE id = ?').run(data.profilePic, groupId);
        }
        // Add other updatable fields here if necessary
        return { success: true, message: 'Groupe mis à jour' };
    } catch(error: any) {
        return { success: false, message: error.message };
    }
}

export async function addMembersToGroupAction(groupId: string, newUsernames: string[]) {
    try {
        const stmt = db.prepare('INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)');
        const transaction = db.transaction(() => {
            newUsernames.forEach(username => {
                const user = getUserByName(username);
                if(user) {
                    stmt.run(groupId, user.id);
                }
            });
        });
        transaction();
        return { success: true, message: "Membres ajoutés" };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// Message Actions
export async function sendMessageAction(senderUsername: string, chatId: string, text: string) {
    const sender = getUserByName(senderUsername);
    if (!sender) return { success: false, message: "Expéditeur non trouvé" };
    
    try {
        const newMessage: Message = {
            id: uuidv4(),
            chatId,
            sender: senderUsername,
            text,
            timestamp: new Date().toISOString(),
        };

        const transaction = db.transaction(() => {
            db.prepare('INSERT INTO messages (id, chat_id, sender_id, text, timestamp) VALUES (?, ?, ?, ?, ?)')
                .run(newMessage.id, chatId, sender.id, text, newMessage.timestamp);
            
            // Update unread counts
            let recipients: { id: string }[] = [];
            if (chatId.startsWith('group_')) {
                recipients = db.prepare('SELECT user_id as id FROM group_members WHERE group_id = ? AND user_id != ?').all(chatId, sender.id) as { id: string }[];
            } else {
                const usernames = chatId.split(':');
                const friendUsername = usernames.find(u => u !== senderUsername);
                if (friendUsername) {
                    const friend = getUserByName(friendUsername);
                    if (friend) recipients.push({ id: friend.id });
                }
            }

            const unreadStmt = db.prepare(`
                INSERT INTO unread_counts (user_id, chat_id, count) VALUES (?, ?, 1)
                ON CONFLICT(user_id, chat_id) DO UPDATE SET count = count + 1
            `);
            recipients.forEach(recipient => {
                unreadStmt.run(recipient.id, chatId);
            });
        });
        transaction();

        return { success: true, message: "Message envoyé", newMessage };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteMessageAction(messageId: string, senderUsername: string) {
    const sender = getUserByName(senderUsername);
    if (!sender) return { success: false, message: "Utilisateur non trouvé." };

    try {
        const message = db.prepare('SELECT sender_id, text FROM messages WHERE id = ?').get(messageId) as { sender_id: string, text: string } | undefined;
        if (!message) {
            return { success: false, message: "Message non trouvé." };
        }
        if (message.sender_id !== sender.id) {
            return { success: false, message: "Vous n'êtes pas autorisé à supprimer ce message." };
        }
        if (message.text === 'message supprimer') {
             return { success: false, message: "Le message est déjà supprimé." };
        }

        db.prepare('UPDATE messages SET text = ? WHERE id = ?').run('message supprimer', messageId);
        return { success: true, message: "Message supprimé." };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updateMessageAction(messageId: string, newText: string, senderUsername: string) {
    const sender = getUserByName(senderUsername);
    if (!sender) return { success: false, message: "Utilisateur non trouvé." };

    try {
        const message = db.prepare('SELECT sender_id, text FROM messages WHERE id = ?').get(messageId) as { sender_id: string, text: string } | undefined;
        if (!message) {
            return { success: false, message: "Message non trouvé." };
        }
        if (message.sender_id !== sender.id) {
            return { success: false, message: "Vous n'êtes pas autorisé à modifier ce message." };
        }
        if (message.text === 'message supprimer') {
            return { success: false, message: "Vous ne pouvez pas modifier un message supprimé." };
        }

        db.prepare('UPDATE messages SET text = ? WHERE id = ?').run(newText, messageId);
        return { success: true, message: "Message modifié." };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}


export async function clearUnreadCountAction(username: string, chatId: string) {
    const user = getUserByName(username);
    if (!user) return;
    try {
        db.prepare('UPDATE unread_counts SET count = 0 WHERE user_id = ? AND chat_id = ?')
            .run(user.id, chatId);
    } catch (error: any) {
        console.error("Failed to clear unread count:", error);
    }
}
