// js/congdong.js
import { showToast, generateId } from './utils.js';
import {
  getUserFriends, saveUserFriends,
  getUserGroups, saveUserGroups,
  getMessages, addMessage,
  getUserDecks, saveUserDecks,
  getPublicDecks, savePublicDecks, addPublicDeck,
  getLeaderboard, updateLeaderboard,
  getTotalStudyTime, getUserCalendar
} from './data.js';
import { getCurrentUser } from './app.js';

// ===== STATE =====
let currentUser = null;
let friends = [];
let groups = [];
let messages = [];
let currentContact = null; // { type: 'friend'|'group', id, name }

// Dữ liệu leaderboard
let leaderboardData = [];
let sortCriteria = 'streak'; // 'streak' | 'totalCards' | 'totalHours'

// Dữ liệu explore
let publicSets = [];
let filteredSets = [];
let publicGroups = [];
let selectedPublicSet = null;
let selectedPublicGroup = null;

// ===== DOM REFS =====
// Tab navigation
const tabNavBtns = document.querySelectorAll('.ctab-nav-btn');
const tabPanes = document.querySelectorAll('.community-tab-content .tab-pane');

// Leaderboard
const leaderboardListEl = document.getElementById('leaderboardList');
const refreshLeaderboardBtn = document.getElementById('refreshLeaderboard');
const leaderboardSort = document.getElementById('leaderboardSort');

// Chat
const friendsListEl = document.getElementById('friendsList');
const groupsListEl = document.getElementById('groupsList');
const chatMessagesEl = document.getElementById('chatMessages');
const chatHeaderEl = document.getElementById('chatHeader');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendMessageBtn');
const addFriendBtn = document.getElementById('addFriendBtn');
const createGroupBtn = document.getElementById('createGroupBtn');

// Explore
const publicSetsListEl = document.getElementById('publicSetsList');
const publicGroupsListEl = document.getElementById('publicGroupsList');
const searchInput = document.getElementById('searchPublicSets');
const categoryFilter = document.getElementById('categoryFilter');
const setDetailModal = document.getElementById('setDetailModal');
const setDetailContent = document.getElementById('setDetailContent');
const closeSetDetail = document.getElementById('closeSetDetail');
const closeSetDetail2 = document.getElementById('closeSetDetail2');
const copyPublicSetBtn = document.getElementById('copyPublicSet');

// Modals
const addFriendModal = document.getElementById('addFriendModal');
const closeAddFriend = document.getElementById('closeAddFriend');
const cancelAddFriend = document.getElementById('cancelAddFriend');
const confirmAddFriend = document.getElementById('confirmAddFriend');
const friendInput = document.getElementById('friendInput');

const createGroupModal = document.getElementById('createGroupModal');
const closeCreateGroup = document.getElementById('closeCreateGroup');
const cancelCreateGroup = document.getElementById('cancelCreateGroup');
const confirmCreateGroup = document.getElementById('confirmCreateGroup');
const groupNameInput = document.getElementById('groupNameInput');
const groupDescInput = document.getElementById('groupDescInput');
const inviteFriendsContainer = document.getElementById('inviteFriendsContainer');

// ===== LOAD DATA =====
function loadData() {
    currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    friends = getUserFriends();
    groups = getUserGroups();
    messages = getMessages();
    loadLeaderboard();
    loadExploreData();
}

// ===== LEADERBOARD =====
function loadLeaderboard() {
    // Lấy từ localStorage (hoặc mock nếu chưa có)
    let stored = getLeaderboard();
    if (stored && stored.length > 0) {
        leaderboardData = stored;
    } else {
        // Tạo mock data nếu chưa có
        const mockUsers = [
            { userId: 'U1', name: 'Nguyễn Văn A', streak: 45, totalCards: 320, totalHours: 48, level: 'Vàng', color: '#fbbf24', initials: 'NA', xp: 1200 },
            { userId: 'U2', name: 'Trần Thị B', streak: 32, totalCards: 280, totalHours: 35, level: 'Bạc', color: '#9ca3af', initials: 'TB', xp: 900 },
            { userId: 'U3', name: 'Lê Văn C', streak: 28, totalCards: 250, totalHours: 30, level: 'Đồng', color: '#d97706', initials: 'LC', xp: 750 },
            { userId: 'U4', name: 'Phạm Quốc D', streak: 20, totalCards: 190, totalHours: 22, level: 'Sắt', color: '#6b7280', initials: 'PQ', xp: 600 },
            { userId: 'U5', name: 'Hoàng Thị E', streak: 15, totalCards: 150, totalHours: 18, level: 'Sắt', color: '#6b7280', initials: 'HT', xp: 500 },
            { userId: 'U6', name: 'Đặng Văn F', streak: 12, totalCards: 130, totalHours: 14, level: 'Đồng', color: '#d97706', initials: 'DV', xp: 400 },
            { userId: 'U7', name: 'Bùi Thị G', streak: 10, totalCards: 110, totalHours: 12, level: 'Bạc', color: '#9ca3af', initials: 'BT', xp: 350 },
            { userId: 'U8', name: 'Ngô Văn H', streak: 8, totalCards: 90, totalHours: 10, level: 'Vàng', color: '#fbbf24', initials: 'NV', xp: 300 },
            { userId: 'U9', name: 'Vũ Thị I', streak: 6, totalCards: 70, totalHours: 8, level: 'Sắt', color: '#6b7280', initials: 'VT', xp: 250 },
            { userId: 'U10', name: 'Lý Văn J', streak: 4, totalCards: 50, totalHours: 5, level: 'Đồng', color: '#d97706', initials: 'LV', xp: 200 },
        ];
        // Lưu lại
        mockUsers.forEach(u => updateLeaderboard(u.userId, u));
        leaderboardData = getLeaderboard();
    }
}

function renderLeaderboard() {
    if (!leaderboardListEl) return;
    if (!leaderboardData || leaderboardData.length === 0) {
        leaderboardListEl.innerHTML = `<div class="empty-contact"><i class="fas fa-trophy"></i><p>Chưa có dữ liệu</p></div>`;
        return;
    }

    // Sắp xếp theo tiêu chí
    let sorted = [...leaderboardData];
    if (sortCriteria === 'streak') {
        sorted.sort((a, b) => (b.streak || 0) - (a.streak || 0));
    } else if (sortCriteria === 'totalCards') {
        sorted.sort((a, b) => (b.totalCards || 0) - (a.totalCards || 0));
    } else if (sortCriteria === 'totalHours') {
        sorted.sort((a, b) => (b.totalHours || 0) - (a.totalHours || 0));
    }

    // Lấy top 20
    const top = sorted.slice(0, 20);

    leaderboardListEl.innerHTML = top.map((user, index) => {
        const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
        // Xác định level dựa trên xp
        const level = user.level || 'Sắt';
        const xpPercent = Math.min((user.xp || 0) % 100, 100);
        return `
            <div class="leaderboard-item">
                <div class="rank ${rankClass}">#${index + 1}</div>
                <div class="avatar" style="background:${user.color || '#4f46e5'}">${user.initials || user.name[0]}</div>
                <div class="info">
                    <div class="name">${user.name}</div>
                    <div class="stats">
                        <span><i class="fas fa-fire"></i> ${user.streak || 0} ngày</span>
                        <span><i class="fas fa-layer-group"></i> ${user.totalCards || 0} thẻ</span>
                        <span><i class="fas fa-clock"></i> ${(user.totalHours || 0).toFixed(1)}h</span>
                    </div>
                </div>
                <div class="badge">${level}</div>
                <div class="xp-bar">
                    <div class="fill" style="width:${xpPercent}%;"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== EXPLORE DATA =====
function loadExploreData() {
    // Public sets từ localStorage
    publicSets = getPublicDecks();
    if (!publicSets || publicSets.length === 0) {
        // Mock data
        const mockSets = [
            {
                id: 'S1', title: 'Từ vựng tiếng Anh cơ bản', description: '50 từ vựng thông dụng cho người mới', icon: '📚',
                author: 'Nguyễn Văn A', category: 'language', cards: [{ front: 'Hello', back: 'Xin chào' }, { front: 'Goodbye', back: 'Tạm biệt' }, { front: 'Thank you', back: 'Cảm ơn' }],
                copies: 18, createdAt: '2026-06-20'
            },
            {
                id: 'S2', title: 'Lịch sử Việt Nam tóm tắt', description: 'Các mốc quan trọng', icon: '🏛️',
                author: 'Trần Thị B', category: 'history', cards: [{ front: 'Hai Bà Trưng', back: 'Khởi nghĩa năm 40' }, { front: 'Ngô Quyền', back: 'Chiến thắng Bạch Đằng 938' }],
                copies: 12, createdAt: '2026-06-18'
            },
            {
                id: 'S3', title: 'Công thức Toán đại số', description: 'Hằng đẳng thức', icon: '📐',
                author: 'Lê Văn C', category: 'math', cards: [{ front: '(a+b)^2', back: 'a² + 2ab + b²' }, { front: '(a-b)^2', back: 'a² - 2ab + b²' }],
                copies: 7, createdAt: '2026-06-15'
            },
        ];
        mockSets.forEach(s => addPublicDeck(s));
        publicSets = getPublicDecks();
    }
    filteredSets = [...publicSets];

    // Public groups: lấy từ nhóm cá nhân? Chưa có bảng riêng. Tạm thời giả lập.
    // Ở thực tế, publicGroups nên là danh sách nhóm từ tất cả người dùng. Ở đây mock.
    publicGroups = [
        { id: 'G1', name: 'Nhóm tiếng Anh', description: 'Cùng nhau học tiếng Anh', members: ['U1','U2','U3'], creator: 'U1', createdAt: '2026-06-01', icon: '🌍' },
        { id: 'G2', name: 'Nhóm Toán học', description: 'Chia sẻ bài tập toán', members: ['U4','U5'], creator: 'U4', createdAt: '2026-06-05', icon: '📐' },
        { id: 'G3', name: 'Nhóm lịch sử', description: 'Đam mê lịch sử', members: ['U2','U6'], creator: 'U2', createdAt: '2026-06-08', icon: '🏛️' },
    ];
}

// ===== RENDER CONTACT =====
function renderContactList() {
    renderFriends();
    renderGroups();
}

function renderFriends() {
    if (!friendsListEl) return;
    if (friends.length === 0) {
        friendsListEl.innerHTML = `<div class="empty-contact"><i class="fas fa-user-plus"></i><p>Chưa có bạn bè</p></div>`;
        return;
    }
    friendsListEl.innerHTML = friends.map(f => `
        <div class="contact-item" data-id="${f.id}" data-type="friend">
            <div class="contact-avatar" style="background:${f.color || '#4f46e5'}">${f.initials || f.name[0]}</div>
            <div class="contact-info">
                <div class="contact-name">${f.name}</div>
                <div class="contact-email">${f.email || ''}</div>
            </div>
            <button class="contact-action delete-friend" data-id="${f.id}"><i class="fas fa-times"></i></button>
        </div>
    `).join('');

    document.querySelectorAll('.contact-item[data-type="friend"]').forEach(el => {
        el.addEventListener('click', function(e) {
            if (e.target.closest('.delete-friend')) return;
            const id = this.dataset.id;
            const friend = friends.find(f => f.id === id);
            if (friend) openChat('friend', friend.id, friend.name);
        });
    });
    document.querySelectorAll('.delete-friend').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            if (confirm('Xóa bạn này?')) {
                friends = friends.filter(f => f.id !== id);
                saveUserFriends(friends);
                renderFriends();
                if (currentContact && currentContact.type === 'friend' && currentContact.id === id) closeChat();
                showToast('Đã xóa bạn', 'success');
            }
        });
    });
}

function renderGroups() {
    if (!groupsListEl) return;
    if (groups.length === 0) {
        groupsListEl.innerHTML = `<div class="empty-contact"><i class="fas fa-layer-group"></i><p>Chưa có nhóm</p></div>`;
        return;
    }
    groupsListEl.innerHTML = groups.map(g => `
        <div class="contact-item" data-id="${g.id}" data-type="group">
            <div class="contact-avatar" style="background:${g.color || '#8b5cf6'}">${g.icon || '👥'}</div>
            <div class="contact-info">
                <div class="contact-name">${g.name}</div>
                <div class="contact-email">${g.members.length} thành viên</div>
            </div>
            <button class="contact-action leave-group" data-id="${g.id}"><i class="fas fa-sign-out-alt"></i></button>
        </div>
    `).join('');

    document.querySelectorAll('.contact-item[data-type="group"]').forEach(el => {
        el.addEventListener('click', function(e) {
            if (e.target.closest('.leave-group')) return;
            const id = this.dataset.id;
            const group = groups.find(g => g.id === id);
            if (group) openChat('group', group.id, group.name);
        });
    });
    document.querySelectorAll('.leave-group').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            if (confirm('Rời nhóm này?')) {
                const group = groups.find(g => g.id === id);
                if (!group) return;
                if (group.creator === currentUser.id) {
                    showToast('Không thể rời nhóm do bạn là người tạo', 'error');
                    return;
                }
                group.members = group.members.filter(m => m !== currentUser.id);
                saveUserGroups(groups);
                renderGroups();
                if (currentContact && currentContact.type === 'group' && currentContact.id === id) closeChat();
                showToast('Đã rời nhóm', 'success');
            }
        });
    });
}

// ===== CHAT =====
function openChat(type, id, name) {
    currentContact = { type, id, name };
    chatHeaderEl.innerHTML = `<span class="chat-title"><i class="fas ${type === 'friend' ? 'fa-user' : 'fa-layer-group'}"></i> ${name}</span>`;
    renderMessages();
    chatInput.disabled = false;
    chatInput.focus();
}

function closeChat() {
    currentContact = null;
    chatHeaderEl.innerHTML = `<span class="chat-title">Chọn một người bạn hoặc nhóm để bắt đầu trò chuyện</span>`;
    chatMessagesEl.innerHTML = `<div class="empty-chat"><i class="fas fa-comment-dots"></i><p>Chưa có tin nhắn nào</p></div>`;
    chatInput.disabled = true;
}

function renderMessages() {
    if (!currentContact) return;
    const key = currentContact.type === 'friend' ? `friend_${currentContact.id}` : `group_${currentContact.id}`;
    const msgs = messages.filter(m => m.chatKey === key);

    if (msgs.length === 0) {
        chatMessagesEl.innerHTML = `<div class="empty-chat"><i class="fas fa-comment-dots"></i><p>Chưa có tin nhắn nào</p></div>`;
        return;
    }
    chatMessagesEl.innerHTML = msgs.map(m => {
        const isMine = m.fromUserId === currentUser.id;
        return `
            <div class="chat-message ${isMine ? 'mine' : 'theirs'}">
                <div class="message-bubble">
                    <span class="message-text">${escapeHtml(m.content)}</span>
                    <span class="message-time">${new Date(m.timestamp).toLocaleTimeString()}</span>
                </div>
            </div>
        `;
    }).join('');
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function sendMessage() {
    const content = chatInput.value.trim();
    if (!content || !currentContact) return;
    const key = currentContact.type === 'friend' ? `friend_${currentContact.id}` : `group_${currentContact.id}`;
    const message = { id: generateId('msg_'), chatKey: key, fromUserId: currentUser.id, content, timestamp: Date.now(), read: false };
    addMessage(message);
    messages = getMessages();
    renderMessages();
    chatInput.value = '';
    chatInput.focus();
}

// ===== EXPLORE: PUBLIC SETS =====
function renderPublicSets() {
    if (!publicSetsListEl) return;
    if (filteredSets.length === 0) {
        publicSetsListEl.innerHTML = `<div class="empty-contact"><i class="fas fa-share-alt"></i><p>Không có bộ thẻ công khai</p></div>`;
        return;
    }
    publicSetsListEl.innerHTML = filteredSets.map(set => `
        <div class="public-set-item" data-id="${set.id}">
            <div class="icon">${set.icon || '📄'}</div>
            <div class="info">
                <div class="title">${set.title}</div>
                <div class="description">${set.description || ''}</div>
                <div class="meta">
                    <span><i class="fas fa-user"></i> ${set.author}</span>
                    <span><i class="fas fa-tag"></i> ${set.category || 'other'}</span>
                    <span><i class="fas fa-credit-card"></i> ${set.cards ? set.cards.length : 0} thẻ</span>
                    <span><i class="fas fa-copy"></i> ${set.copies || 0}</span>
                </div>
            </div>
            <div class="actions">
                <button class="view-set" data-id="${set.id}"><i class="fas fa-eye"></i></button>
                <button class="copy-set" data-id="${set.id}"><i class="fas fa-copy"></i></button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.view-set, .copy-set').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            const set = publicSets.find(s => s.id === id);
            if (!set) return;
            if (this.classList.contains('view-set')) showSetDetail(set);
            else copyPublicSet(set);
        });
    });
    document.querySelectorAll('.public-set-item').forEach(el => {
        el.addEventListener('click', function() {
            const id = this.dataset.id;
            const set = publicSets.find(s => s.id === id);
            if (set) showSetDetail(set);
        });
    });
}

function showSetDetail(set) {
    selectedPublicSet = set;
    const cardList = set.cards ? set.cards.map(c => `
        <div class="set-detail-card-item">
            <span class="front">${escapeHtml(c.front)}</span>
            <span class="back">${escapeHtml(c.back)}</span>
        </div>
    `).join('') : '<p>Bộ thẻ này không có thẻ nào.</p>';
    setDetailContent.innerHTML = `
        <div class="set-detail-header">
            <div class="icon">${set.icon || '📄'}</div>
            <div class="info"><h4>${escapeHtml(set.title)}</h4><p>${escapeHtml(set.description || '')}</p></div>
        </div>
        <div class="set-detail-stats">
            <span><i class="fas fa-user"></i> ${escapeHtml(set.author)}</span>
            <span><i class="fas fa-tag"></i> ${set.category || 'other'}</span>
            <span><i class="fas fa-credit-card"></i> ${set.cards ? set.cards.length : 0} thẻ</span>
            <span><i class="fas fa-copy"></i> ${set.copies || 0} sao chép</span>
        </div>
        <div class="set-detail-card-list">${cardList}</div>
    `;
    openModal('setDetailModal');
}

function copyPublicSet(set) {
    if (!currentUser) return;
    // Lấy danh sách decks cá nhân
    let userDecks = getUserDecks();
    // Tạo bản sao với ID mới
    const newDeck = {
        id: generateId('deck_'),
        title: set.title + ' (bản sao)',
        description: set.description,
        icon: set.icon,
        cards: JSON.parse(JSON.stringify(set.cards || [])),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        owner: currentUser.id,
        category: set.category || 'other'
    };
    userDecks.push(newDeck);
    saveUserDecks(userDecks);
    // Tăng số lượt sao chép cho bộ công khai
    set.copies = (set.copies || 0) + 1;
    savePublicDecks(publicSets);
    renderPublicSets();
    showToast('Đã sao chép bộ thẻ vào kho của bạn!', 'success');
    closeModal('setDetailModal');
}

function filterSets() {
    const query = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    filteredSets = publicSets.filter(set => {
        const matchQuery = query === '' || 
            set.title.toLowerCase().includes(query) ||
            set.description.toLowerCase().includes(query) ||
            set.author.toLowerCase().includes(query);
        const matchCategory = category === 'all' || set.category === category;
        return matchQuery && matchCategory;
    });
    renderPublicSets();
}

// ===== EXPLORE: PUBLIC GROUPS =====
function renderPublicGroups() {
    if (!publicGroupsListEl) return;
    if (publicGroups.length === 0) {
        publicGroupsListEl.innerHTML = `<div class="empty-contact"><i class="fas fa-users"></i><p>Chưa có nhóm công khai</p></div>`;
        return;
    }
    publicGroupsListEl.innerHTML = publicGroups.map(g => {
        const isMember = g.members.includes(currentUser.id);
        // Kiểm tra xem nhóm này đã có trong danh sách nhóm của user chưa
        const inMyGroups = groups.some(myg => myg.id === g.id);
        return `
            <div class="public-group-item" data-id="${g.id}">
                <div class="icon" style="font-size:28px;">${g.icon || '👥'}</div>
                <div class="info">
                    <div class="name">${g.name}</div>
                    <div class="description">${g.description || ''}</div>
                    <div class="meta">
                        <span><i class="fas fa-user"></i> ${g.members.length} thành viên</span>
                        <span><i class="fas fa-clock"></i> ${g.createdAt}</span>
                    </div>
                </div>
                <div class="actions">
                    <button class="view-group" data-id="${g.id}"><i class="fas fa-info-circle"></i></button>
                    ${!isMember && !inMyGroups ? `<button class="btn-join join-group" data-id="${g.id}">Tham gia</button>` : 
                      (inMyGroups ? `<button class="btn-join joined" disabled>Đã tham gia</button>` : `<button class="btn-join joined" disabled>Đã tham gia</button>`)}
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.view-group').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            const group = publicGroups.find(g => g.id === id);
            if (group) {
                alert(`Nhóm: ${group.name}\nMô tả: ${group.description}\nSố thành viên: ${group.members.length}`);
            }
        });
    });

    document.querySelectorAll('.join-group').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            const group = publicGroups.find(g => g.id === id);
            if (group && !group.members.includes(currentUser.id)) {
                // Thêm vào nhóm công khai
                group.members.push(currentUser.id);
                // Lưu lại publicGroups (nếu có cơ chế lưu)
                // Vì chưa có storage cho publicGroups, ta lưu vào localStorage tạm
                localStorage.setItem('forgetmenot_public_groups', JSON.stringify(publicGroups));
                // Thêm nhóm này vào danh sách nhóm cá nhân của user
                const newGroup = {
                    id: group.id,
                    name: group.name,
                    description: group.description,
                    creator: group.creator,
                    members: group.members,
                    createdAt: group.createdAt,
                    color: '#8b5cf6',
                    icon: group.icon || '👥'
                };
                groups.push(newGroup);
                saveUserGroups(groups);
                renderGroups(); // cập nhật tab Liên hệ
                renderPublicGroups(); // cập nhật tab Khám phá
                showToast('Đã tham gia nhóm ' + group.name, 'success');
            }
        });
    });
}

// ===== MODAL TẠO NHÓM CÓ MỜI BẠN =====
function renderInviteFriends() {
    if (!inviteFriendsContainer) return;
    if (friends.length === 0) {
        inviteFriendsContainer.innerHTML = '<p style="color:var(--text-muted);">Chưa có bạn bè để mời.</p>';
        return;
    }
    inviteFriendsContainer.innerHTML = friends.map(f => `
        <label>
            <input type="checkbox" value="${f.id}" /> ${f.name}
        </label>
    `).join('');
}

// ===== UTILITIES =====
function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    loadData();

    // Tab navigation
    tabNavBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            tabNavBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(`tab-${tab}`).classList.add('active');
        });
    });

    // Leaderboard
    renderLeaderboard();
    leaderboardSort.addEventListener('change', function() {
        sortCriteria = this.value;
        renderLeaderboard();
    });
    refreshLeaderboardBtn.addEventListener('click', function() {
        loadLeaderboard();
        renderLeaderboard();
        showToast('Đã làm mới bảng xếp hạng', 'success');
    });

    // Chat
    renderContactList();
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
    sendBtn.addEventListener('click', sendMessage);

    // Add friend
    addFriendBtn.addEventListener('click', () => openModal('addFriendModal'));
    closeAddFriend.addEventListener('click', () => closeModal('addFriendModal'));
    cancelAddFriend.addEventListener('click', () => closeModal('addFriendModal'));
    confirmAddFriend.addEventListener('click', function() {
        const val = friendInput.value.trim();
        if (!val) { showToast('Vui lòng nhập tên hoặc email', 'error'); return; }
        const newFriend = {
            id: generateId('F'),
            name: val,
            email: val + '@example.com',
            initials: val.substring(0,2).toUpperCase(),
            color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')
        };
        friends.push(newFriend);
        saveUserFriends(friends);
        renderFriends();
        renderInviteFriends(); // cập nhật danh sách mời trong modal tạo nhóm
        showToast('Đã thêm bạn: ' + newFriend.name, 'success');
        friendInput.value = '';
        closeModal('addFriendModal');
    });

    // Create group (có mời bạn)
    createGroupBtn.addEventListener('click', function() {
        renderInviteFriends();
        openModal('createGroupModal');
    });
    closeCreateGroup.addEventListener('click', () => closeModal('createGroupModal'));
    cancelCreateGroup.addEventListener('click', () => closeModal('createGroupModal'));
    confirmCreateGroup.addEventListener('click', function() {
        const name = groupNameInput.value.trim();
        const desc = groupDescInput.value.trim();
        if (!name) { showToast('Vui lòng nhập tên nhóm', 'error'); return; }
        // Lấy danh sách bạn bè được chọn
        const checkedBoxes = inviteFriendsContainer.querySelectorAll('input[type="checkbox"]:checked');
        const invitedFriendIds = Array.from(checkedBoxes).map(cb => cb.value);
        // Tạo nhóm
        const newGroup = {
            id: generateId('G'),
            name: name,
            description: desc || '',
            creator: currentUser.id,
            members: [currentUser.id, ...invitedFriendIds],
            createdAt: new Date().toISOString(),
            color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0'),
            icon: '👥'
        };
        groups.push(newGroup);
        saveUserGroups(groups);
        renderGroups();
        showToast('Đã tạo nhóm "' + name + '" với ' + invitedFriendIds.length + ' bạn được mời', 'success');
        groupNameInput.value = '';
        groupDescInput.value = '';
        closeModal('createGroupModal');
    });

    // Chat tab contact tabs
    document.querySelectorAll('.contact-list-panel .ctab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.contact-list-panel .ctab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.contact-list-panel .tab-pane').forEach(p => p.classList.remove('active'));
            document.getElementById('tab-' + this.dataset.tab).classList.add('active');
        });
    });

    // Explore
    renderPublicSets();
    renderPublicGroups();

    searchInput.addEventListener('input', filterSets);
    categoryFilter.addEventListener('change', filterSets);

    // Modal detail
    closeSetDetail.addEventListener('click', () => closeModal('setDetailModal'));
    closeSetDetail2.addEventListener('click', () => closeModal('setDetailModal'));
    copyPublicSetBtn.addEventListener('click', function() {
        if (selectedPublicSet) copyPublicSet(selectedPublicSet);
    });

    // Đóng modal khi click ngoài
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('open'); });
    });

    // Polling chat messages
    setInterval(() => {
        const newMessages = getMessages();
        if (newMessages.length !== messages.length) {
            messages = newMessages;
            if (currentContact) renderMessages();
        }
    }, 2000);
});