
'use server';

import { db } from '@/lib/db';
import type { Profile, Group, Message, Friend } from '@/contexts/auth-context';
import { v4 as uuidv4 } from 'uuid';
import type { Theme } from '@/lib/themes';
import { getPrivateChatId } from '@/lib/utils';
import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';
import webpush from 'web-push';

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

        db.prepare('INSERT INTO users (id, username, email, passwordHash, phone, status, profilePic, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(userId, username, email, passwordHash, 'Non défini', 'En ligne', defaultProfilePic, 'Aucune description.');

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
    const users = db.prepare('SELECT * FROM users').all() as any[];
    return users.map(u => ({ ...u, isGroup: false, description: u.description ?? 'Aucune description.' }));
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
    try {
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
        if (!user) return null;

        // Profile data
        const profile: Profile = {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone ?? 'Non défini',
            status: user.status ?? 'En ligne',
            profilePic: user.profilePic,
            description: user.description ?? 'Aucune description.',
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
                    description: g.description ?? 'Aucune description de groupe.',
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
                const message: Message = {
                    id: msg.id,
                    chatId: msg.chat_id,
                    sender: getUserById(msg.sender_id)?.username || 'unknown',
                    text: msg.text,
                    timestamp: msg.timestamp,
                    editedTimestamp: msg.edited_timestamp,
                    isTransferred: !!msg.is_transferred,
                };
                if (msg.attachment_type && msg.attachment_url) {
                    message.attachment = {
                        type: msg.attachment_type,
                        url: msg.attachment_url,
                        name: msg.attachment_name,
                    }
                }
                messages[msg.chat_id].push(message);
            });
        }
        
        // Unread Counts
        const unreadRows = db.prepare('SELECT chat_id, count FROM unread_counts WHERE user_id = ?').all(user.id) as {chat_id: string, count: number}[];
        const unreadCounts = unreadRows.reduce((acc, row) => {
            acc[row.chat_id] = row.count;
            return acc;
        }, {} as Record<string, number>);

        return { profile, groups, messages, unreadCounts };
    } catch (error) {
        console.error(`Error in getInitialData for user ${username}:`, error);
        return null;
    }
}

export async function updateUserProfile(newProfile: Profile) {
    try {
        db.prepare('UPDATE users SET email = ?, phone = ?, status = ?, profilePic = ?, description = ? WHERE id = ?')
            .run(newProfile.email, newProfile.phone, newProfile.status, newProfile.profilePic, newProfile.description, newProfile.id);
        return { success: true, message: 'Profil mis à jour' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updateUsernameAction(userId: string, oldUsername: string, newUsername: string) {
    if (!newUsername || newUsername.length < 3) {
        return { success: false, message: "Le nom d'utilisateur doit contenir au moins 3 caractères." };
    }
    if (newUsername === oldUsername) {
        return { success: true, message: "Le nom d'utilisateur est le même." };
    }

    try {
        const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(newUsername);
        if (existingUser) {
            return { success: false, message: 'Ce nom d\'utilisateur est déjà pris.' };
        }

        const friendRows = db.prepare('SELECT u.username FROM users u INNER JOIN friends f ON f.friend_id = u.id WHERE f.user_id = ?').all(userId) as { username: string }[];
        const friends = friendRows.map(r => r.username);

        const transaction = db.transaction(() => {
            // 1. Update users table
            db.prepare('UPDATE users SET username = ? WHERE id = ?').run(newUsername, userId);

            // 2. Update sender in messages table for all messages from this user
            db.prepare('UPDATE messages SET sender = ? WHERE sender = ?').run(newUsername, oldUsername);
            
            // 3. Migrate private chat data
            for (const friendUsername of friends) {
                const oldChatId = getPrivateChatId(oldUsername, friendUsername);
                const newChatId = getPrivateChatId(newUsername, friendUsername);

                if(oldChatId !== newChatId) {
                    db.prepare('UPDATE messages SET chat_id = ? WHERE chat_id = ?').run(newChatId, oldChatId);
                    db.prepare('UPDATE unread_counts SET chat_id = ? WHERE chat_id = ?').run(newChatId, oldChatId);
                    db.prepare('UPDATE chat_themes SET chat_id = ? WHERE chat_id = ?').run(newChatId, oldChatId);
                    db.prepare('UPDATE chat_wallpapers SET chat_id = ? WHERE chat_id = ?').run(newChatId, oldChatId);
                }
            }
        });

        transaction();

        return { success: true, message: 'Nom d\'utilisateur mis à jour avec succès.' };

    } catch (error: any) {
        console.error("Failed to update username:", error);
        return { success: false, message: `Une erreur est survenue: ${error.message}` };
    }
}

export async function setUserOnline(username: string) {
    try {
        const user = getUserByName(username);
        if (user) {
            db.prepare('UPDATE users SET status = ? WHERE id = ?').run('En ligne', user.id);
        }
    } catch (error: any) {
        // This is a background task, so we don't need to return an error to the user.
        // We can log it on the server for debugging.
        console.error(`Failed to set user status to online for ${username}:`, error.message);
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
            db.prepare('INSERT INTO groups (id, name, creator_id, profilePic, description) VALUES (?, ?, ?, ?, ?)')
                .run(groupId, name, creator.id, `https://placehold.co/100x100.png`, 'Aucune description de groupe.');
            
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
            description: 'Aucune description de groupe.',
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
        if (data.description !== undefined) {
             db.prepare('UPDATE groups SET description = ? WHERE id = ?').run(data.description, groupId);
        }
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

export async function leaveGroupAction(groupId: string, username:string) {
    const user = getUserByName(username);
    if (!user) return { success: false, message: "Utilisateur non trouvé" };
    try {
        const transaction = db.transaction(() => {
            // Remove user from group
            db.prepare('DELETE FROM group_members WHERE group_id = ? AND user_id = ?')
              .run(groupId, user.id);
            
            // Check if group is now empty
            const remainingMembers = db.prepare('SELECT COUNT(*) as count FROM group_members WHERE group_id = ?').get(groupId) as { count: number };
            
            if (remainingMembers.count === 0) {
                // If empty, delete the group and its messages
                db.prepare('DELETE FROM groups WHERE id = ?').run(groupId);
                db.prepare('DELETE FROM messages WHERE chat_id = ?').run(groupId);
                db.prepare('DELETE FROM unread_counts WHERE chat_id = ?').run(groupId);
                db.prepare('DELETE FROM chat_themes WHERE chat_id = ?').run(groupId);
                db.prepare('DELETE FROM chat_wallpapers WHERE chat_id = ?').run(groupId);
            }
        });
        transaction();
        return { success: true, message: "Vous avez quitté le groupe." };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// Message Actions
export async function sendMessageAction(senderUsername: string, chatId: string, text: string | null, attachment?: { type: 'image' | 'video' | 'file'; url: string; name?: string }, options?: { isTransfer?: boolean }) {
    const sender = getUserByName(senderUsername);
    if (!sender) return { success: false, message: "Expéditeur non trouvé" };
    
    let finalAttachmentUrl: string | undefined = attachment?.url;
    let finalAttachmentName: string | undefined = attachment?.name;

    if (attachment && attachment.url.startsWith('data:')) {
        try {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const matches = attachment.url.match(/^data:(.+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                return { success: false, message: "Format de fichier invalide." };
            }
            
            const buffer = Buffer.from(matches[2], 'base64');
            const safeFilename = finalAttachmentName ? finalAttachmentName.replace(/[^a-zA-Z0-9.\-_]/g, '') : 'file';
            const filename = `${uuidv4()}-${safeFilename}`;
            const filepath = path.join(uploadDir, filename);

            fs.writeFileSync(filepath, buffer);

            finalAttachmentUrl = `/uploads/${filename}`;
        } catch (error: any) {
            console.error("File upload error:", error);
            return { success: false, message: `Erreur lors de l'enregistrement du fichier: ${error.message}` };
        }
    }


    try {
        const newMessage: Message = {
            id: uuidv4(),
            chatId,
            sender: senderUsername,
            text,
            timestamp: new Date().toISOString(),
            isTransferred: options?.isTransfer,
            attachment: attachment ? {
                type: attachment.type,
                url: finalAttachmentUrl!,
                name: finalAttachmentName
            } : undefined,
        };

        const transaction = db.transaction(() => {
            db.prepare('INSERT INTO messages (id, chat_id, sender_id, text, timestamp, is_transferred, attachment_type, attachment_url, attachment_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
                .run(newMessage.id, chatId, sender.id, text, newMessage.timestamp, options?.isTransfer ? 1 : 0, attachment?.type, finalAttachmentUrl, finalAttachmentName);
            
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
        const message = db.prepare('SELECT sender_id, text FROM messages WHERE id = ?').get(messageId) as { sender_id: string, text: string | null } | undefined;
        if (!message) {
            return { success: false, message: "Message non trouvé." };
        }
        if (message.sender_id !== sender.id) {
            return { success: false, message: "Vous n'êtes pas autorisé à supprimer ce message." };
        }
        if (message.text === 'message supprimer') {
             return { success: false, message: "Le message est déjà supprimé." };
        }
        
        const editedTimestamp = new Date().toISOString();
        db.prepare('UPDATE messages SET text = ?, attachment_url = NULL, attachment_type = NULL, attachment_name = NULL, edited_timestamp = ? WHERE id = ?').run('message supprimer', editedTimestamp, messageId);
        return { success: true, message: "Message supprimé.", editedTimestamp };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function updateMessageAction(messageId: string, newText: string, senderUsername: string) {
    const sender = getUserByName(senderUsername);
    if (!sender) return { success: false, message: "Utilisateur non trouvé." };

    try {
        const message = db.prepare('SELECT sender_id, text, attachment_url FROM messages WHERE id = ?').get(messageId) as { sender_id: string, text: string | null, attachment_url: string | null } | undefined;
        if (!message) {
            return { success: false, message: "Message non trouvé." };
        }
        if (message.sender_id !== sender.id) {
            return { success: false, message: "Vous n'êtes pas autorisé à modifier ce message." };
        }
        if (message.text === 'message supprimer') {
            return { success: false, message: "Vous ne pouvez pas modifier un message supprimé." };
        }
        if (message.attachment_url) {
            return { success: false, message: "Vous ne pouvez pas modifier un message avec une pièce jointe." };
        }
        
        const editedTimestamp = new Date().toISOString();
        db.prepare('UPDATE messages SET text = ?, edited_timestamp = ? WHERE id = ?').run(newText, editedTimestamp, messageId);
        return { success: true, message: "Message modifié.", editedTimestamp };
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


// Private Space Actions
export type PrivatePost = {
    id: string;
    senderId: string;
    senderUsername: string;
    senderProfilePic: string;
    text: string | null;
    timestamp: string;
    attachment?: {
      type: 'image' | 'video' | 'file';
      url: string;
      name?: string;
    };
}
export async function getPrivateSpacePosts(): Promise<PrivatePost[]> {
    const posts = db.prepare(`
        SELECT 
            p.id, 
            p.user_id as senderId, 
            u.username as senderUsername, 
            u.profilePic as senderProfilePic,
            p.text, 
            p.timestamp, 
            p.attachment_type, 
            p.attachment_url, 
            p.attachment_name
        FROM private_space_posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.timestamp ASC
    `).all() as any[];

    return posts.map(p => ({
        id: p.id,
        senderId: p.senderId,
        senderUsername: p.senderUsername,
        senderProfilePic: p.senderProfilePic,
        text: p.text,
        timestamp: p.timestamp,
        attachment: p.attachment_type && p.attachment_url ? {
            type: p.attachment_type,
            url: p.attachment_url,
            name: p.attachment_name,
        } : undefined,
    }));
}

export async function addPrivateSpacePost(username: string, text: string | null, attachment?: { type: 'image' | 'video' | 'file'; url: string; name?: string }) {
    const user = getUserByName(username);
    if (!user) return { success: false, message: "Utilisateur non trouvé" };

    let finalAttachmentUrl: string | undefined = attachment?.url;
    let finalAttachmentName: string | undefined = attachment?.name;

    if (attachment && attachment.url.startsWith('data:')) {
        try {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const matches = attachment.url.match(/^data:(.+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                return { success: false, message: "Format de fichier invalide." };
            }
            const buffer = Buffer.from(matches[2], 'base64');
            const safeFilename = finalAttachmentName ? finalAttachmentName.replace(/[^a-zA-Z0-9.\-_]/g, '') : 'file';
            const filename = `${uuidv4()}-${safeFilename}`;
            const filepath = path.join(uploadDir, filename);
            fs.writeFileSync(filepath, buffer);
            finalAttachmentUrl = `/uploads/${filename}`;
        } catch (error: any) {
            console.error("File upload error:", error);
            return { success: false, message: `Erreur lors de l'enregistrement du fichier: ${error.message}` };
        }
    }

    try {
        const newPostData = {
            id: uuidv4(),
            userId: user.id,
            text,
            timestamp: new Date().toISOString(),
            attachmentType: attachment?.type,
            attachmentUrl: finalAttachmentUrl,
            attachmentName: finalAttachmentName,
        };

        db.prepare('INSERT INTO private_space_posts (id, user_id, text, timestamp, attachment_type, attachment_url, attachment_name) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .run(newPostData.id, newPostData.userId, newPostData.text, newPostData.timestamp, newPostData.attachmentType, newPostData.attachmentUrl, newPostData.attachmentName);
        
        const fullNewPost: PrivatePost = {
            id: newPostData.id,
            senderId: user.id,
            senderUsername: user.username,
            senderProfilePic: (db.prepare('SELECT profilePic FROM users WHERE id = ?').get(user.id) as any).profilePic,
            text: newPostData.text,
            timestamp: newPostData.timestamp,
            attachment: attachment ? {
                type: attachment.type,
                url: finalAttachmentUrl!,
                name: finalAttachmentName,
            } : undefined,
        };

        return { success: true, message: "Message envoyé", newPost: fullNewPost };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deletePrivateSpacePost(postId: string, username: string) {
    const user = getUserByName(username);
    if (!user) return { success: false, message: "Utilisateur non trouvé" };

    try {
        const post = db.prepare('SELECT user_id FROM private_space_posts WHERE id = ?').get(postId) as { user_id: string } | undefined;
        if (!post) {
            return { success: false, message: "Message non trouvé." };
        }
        if (post.user_id !== user.id) {
            return { success: false, message: "Vous n'êtes pas autorisé à supprimer ce message." };
        }

        const info = db.prepare('DELETE FROM private_space_posts WHERE id = ? AND user_id = ?').run(postId, user.id);
        
        if (info.changes > 0) {
            return { success: true, message: "Message supprimé." };
        }
        
        return { success: false, message: "Échec de la suppression du message." };

    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

// RSS Feed Actions
export type NewsItem = {
    title: string;
    link: string;
    pubDate: string;
    content: string;
    imageUrl?: string;
};

export async function getNewsFeed(): Promise<NewsItem[]> {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL('https://www.lemonde.fr/rss/une.xml');

    return feed.items.map(item => {
      let imageUrl;
      if (item.enclosure?.url) {
        imageUrl = item.enclosure.url;
      } else {
        const content = item['content:encoded'] || item.content || '';
        const imgMatch = content.match(/<img src="([^"]+)"/);
        if (imgMatch && imgMatch[1]) {
          imageUrl = imgMatch[1];
        }
      }

      const contentSnippet = item.contentSnippet ? item.contentSnippet.substring(0, 120) + '...' : '';

      return {
        title: item.title || 'Sans titre',
        link: item.link || '#',
        pubDate: item.pubDate || new Date().toISOString(),
        content: contentSnippet,
        imageUrl,
      };
    }).slice(0, 6);
  } catch (error) {
    console.error('Failed to fetch RSS feed:', error);
    return [];
  }
}

// PWA Actions
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:test@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}
 
// In-memory subscription store. 
// In a production app, you would store this in a database.
let subscriptions: Record<string, webpush.PushSubscription> = {};

export async function subscribeUser(sub: webpush.PushSubscription, username: string) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.error('VAPID keys are not configured. Skipping push subscription.');
    return { success: false, message: 'VAPID keys not configured on server.' };
  }
  console.log('Subscribing user:', username);
  subscriptions[username] = sub;
  // Here you would save the subscription to your database
  // e.g. db.prepare('INSERT OR REPLACE INTO push_subscriptions (username, subscription) VALUES (?, ?)').run(username, JSON.stringify(sub));
  return { success: true, message: 'Subscribed successfully.' };
}
 
export async function unsubscribeUser(username: string) {
  console.log('Unsubscribing user:', username);
  delete subscriptions[username];
  // Here you would remove the subscription from your database
  // e.g. db.prepare('DELETE FROM push_subscriptions WHERE username = ?').run(username);
  return { success: true, message: 'Unsubscribed successfully.' };
}
 
export async function sendNotification(username: string, message: string) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.error('VAPID keys are not configured. Skipping push notification.');
    return { success: false, error: 'VAPID keys not configured on server.' };
  }
  
  // In a real app, you'd fetch this from the database
  const sub = subscriptions[username];
  
  if (!sub) {
    console.error('No subscription available for user:', username);
    return { success: false, error: 'No subscription available' };
  }
 
  try {
    await webpush.sendNotification(
      sub,
      JSON.stringify({
        title: 'ChatFamily Notification',
        body: message,
        icon: '/fcicon.png',
      })
    );
    return { success: true };
  } catch (error) {
    if (error instanceof webpush.WebPushError && error.statusCode === 410) {
      // Subscription is no longer valid, remove it
      delete subscriptions[username];
       // Also remove from DB
    } else {
      console.error('Error sending push notification:', error);
    }
    return { success: false, error: 'Failed to send notification' };
  }
}
