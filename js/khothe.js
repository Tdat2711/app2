// js/khothe.js
import { showToast, generateId, getCategoryName, getDaysLeft } from './utils.js';
import { getUserDecks, saveUserDecks } from './data.js';

let decks = [];
let currentFilter = 'all';
let searchQuery = '';
let sortBy = 'newest';

let editingDeckId = null;        // ID bộ thẻ đang được chỉnh sửa trong modal
let modalFlashcards = [];        // Mảng flashcard tạm trong modal

document.addEventListener('DOMContentLoaded', function() {
    initKhoThe();
});

function initKhoThe() {
    loadDecks();
    initFilterTabs();
    initSearchAndSort();
    renderDecks();
    initModalEvents();
}

// --- Load / Save ---
function loadDecks() {
    decks = getUserDecks();
    if (!decks || decks.length === 0) {
        // Seed dữ liệu mẫu nếu chưa có
        decks = [{
            id: "D_crud_sample",
            name: "Kiến trúc & Thao tác CRUD trong Database",
            description: "Tổng hợp kiến thức nền tảng về Create, Read, Update, Delete trong quản trị cơ sở dữ liệu và xây dựng API.",
            category: "tech",
            icon: "💾",
            dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
            totalCards: 4,
            learned: 1,
            starred: true,
            createdAt: new Date().toISOString(),
            flashcards: [
                { id: "F_crud_c1", question: "Chữ 'C' trong CRUD đại diện cho lệnh gì trong SQL?", answer: "Lệnh INSERT (Tạo bản ghi mới)." },
                { id: "F_crud_c2", question: "Thao tác 'R' (Read) tương ứng với câu lệnh nào?", answer: "Câu lệnh SELECT truy vấn thông tin." },
                { id: "F_crud_c3", question: "Phân biệt mệnh đề UPDATE và DELETE?", answer: "UPDATE sửa đổi dữ liệu hiện có, DELETE xóa hoàn toàn bản ghi." },
                { id: "F_crud_c4", question: "Tại sao nên dùng mệnh đề WHERE trong UPDATE?", answer: "Để giới hạn phạm vi bản ghi, tránh cập nhật toàn bộ bảng." }
            ]
        }];
        saveDecks();
    }
}

function saveDecks() {
    saveUserDecks(decks);
}

// --- Render danh sách bộ thẻ ---
function renderDecks() {
    const grid = document.getElementById('decksGrid');
    const empty = document.getElementById('emptyState');
    if (!grid) return;

    let filtered = decks.slice();

    // Lọc theo tab
    if (currentFilter === 'starred') {
        filtered = filtered.filter(d => d.starred);
    } else if (currentFilter === 'recent') {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        filtered = filtered.slice(0, 4);
    } else if (currentFilter === 'due') {
        const now = new Date();
        filtered = filtered.filter(d => d.dueDate && new Date(d.dueDate) < new Date(now.getTime() + 7 * 86400000));
    }

    // Tìm kiếm
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(d => d.name.toLowerCase().includes(q) || (d.description && d.description.toLowerCase().includes(q)));
    }

    // Sắp xếp
    if (sortBy === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } else if (sortBy === 'newest') {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'cardCount') {
        filtered.sort((a, b) => (b.flashcards?.length || 0) - (a.flashcards?.length || 0));
    }

    if (filtered.length === 0) {
        grid.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    if (empty) empty.style.display = 'none';
    grid.innerHTML = '';

    filtered.forEach(deck => {
        const cardCountNum = deck.flashcards?.length || 0;
        const learnedNum = deck.learned || 0;
        const progressPercent = cardCountNum > 0 ? Math.round((learnedNum / cardCountNum) * 100) : 0;
        const daysLeft = getDaysLeft(deck.dueDate);

        const card = document.createElement('div');
        card.className = 'deck-card';
        card.style.cssText = `
            background: var(--white);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 24px;
            position: relative;
            transition: all 0.3s;
        `;

        card.innerHTML = `
            <button class="star-btn ${deck.starred ? 'active' : ''}" onclick="window.toggleStar('${deck.id}')" style="position:absolute; top:16px; right:16px; background:none; border:none; cursor:pointer; font-size:18px; color: ${deck.starred ? '#f5a623' : '#cbd5e1'};">
                <i class="${deck.starred ? 'fas' : 'far'} fa-star"></i>
            </button>
            <div class="deck-icon" style="font-size:32px; margin-bottom:12px;">${deck.icon || '📁'}</div>
            <h3 style="font-size:16px; font-weight:600; margin-bottom:8px; color:var(--text-dark); max-width:85%;">${deck.name}</h3>
            <p style="font-size:13px; color:var(--text-gray); margin-bottom:16px; line-height:1.5; min-height:40px;">${deck.description || 'Không có mô tả.'}</p>
            
            <div class="deck-meta" style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-light); margin-bottom:12px;">
                <span><i class="fas fa-layer-group"></i> ${cardCountNum} thẻ</span>
                <span><i class="fas fa-tags"></i> ${getCategoryName(deck.category)}</span>
            </div>

            <div class="progress-container" style="margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                    <span style="color:var(--text-gray);">Tiến độ ôn tập</span>
                    <span style="font-weight:600; color:var(--primary);">${progressPercent}%</span>
                </div>
                <div class="progress-bar-bg" style="background:var(--bg-light); height:6px; border-radius:3px; overflow:hidden;">
                    <div class="progress-bar-fill" style="width:${progressPercent}%; background:var(--primary); height:100%; transition:width 0.3s;"></div>
                </div>
            </div>

            <div class="deck-footer" style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:14px;">
                <span class="due-badge" style="font-size:11px; font-weight:500; color:${daysLeft !== null && daysLeft <= 2 ? 'var(--danger)' : 'var(--text-gray)'};">
                    <i class="far fa-clock"></i> ${daysLeft !== null ? (daysLeft <= 0 ? 'Quá hạn học' : 'Còn ' + daysLeft + ' ngày') : 'Không giới hạn'}
                </span>
                <div style="display:flex; gap:6px;">
                    <button class="btn btn-outline" onclick="window.editDeck('${deck.id}')" style="padding:6px 10px; font-size:12px; border-color:transparent;" title="Sửa bộ thẻ">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn btn-outline" onclick="window.deleteDeck('${deck.id}')" style="padding:6px 10px; font-size:12px; color:var(--danger); border-color:transparent;" title="Xóa bộ thẻ">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button class="btn btn-primary" onclick="window.studyDeck('${deck.id}')" style="padding:6px 14px; font-size:12px; border-radius:16px;">
                        <i class="fas fa-play"></i> Học
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- Filter Tabs ---
function initFilterTabs() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderDecks();
        });
    });
}

// --- Search & Sort ---
function initSearchAndSort() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchQuery = this.value.trim();
            renderDecks();
        });
    }

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortBy = this.value;
            renderDecks();
        });
    }
}

// --- Các action toàn cục ---
window.toggleStar = function(id) {
    const deck = decks.find(d => d.id === id);
    if (deck) {
        deck.starred = !deck.starred;
        saveDecks();
        renderDecks();
        showToast(deck.starred ? 'Đã thêm vào yêu thích!' : 'Đã bỏ yêu thích.', 'info');
    }
};

window.deleteDeck = function(id) {
    if (confirm('Xóa vĩnh viễn bộ thẻ này và toàn bộ flashcard?')) {
        decks = decks.filter(d => d.id !== id);
        saveDecks();
        renderDecks();
        showToast('Đã xóa bộ thẻ.', 'success');
    }
};

window.studyDeck = function(id) {
    const deck = decks.find(d => d.id === id);
    if (!deck || !deck.flashcards || deck.flashcards.length === 0) {
        showToast('Bộ thẻ chưa có câu hỏi nào!', 'warning');
        return;
    }
    localStorage.setItem('forgetmenot_current_study_deck', id);
    showToast('Đang chuyển sang ôn tập...', 'success');
    setTimeout(() => window.location.href = 'ontap.html', 600);
};

// --- Mở modal chỉnh sửa flashcard ---
window.editDeck = function(id) {
    const deck = decks.find(d => d.id === id);
    if (!deck) return;

    editingDeckId = id;
    modalFlashcards = deck.flashcards ? deck.flashcards.map(f => ({ ...f })) : [];

    // Cập nhật tiêu đề modal
    document.getElementById('modalDeckTitle').innerHTML = `<i class="fas fa-folder-open text-warning mr-1"></i> ${deck.name}`;
    renderModalFlashcards();
    document.getElementById('viewFlashcardsModal').classList.add('open');
};

// --- Render flashcard trong modal ---
function renderModalFlashcards() {
    const container = document.getElementById('modalFlashcardsContainer');
    if (!container) return;
    container.innerHTML = '';

    if (modalFlashcards.length === 0) {
        container.innerHTML = '<p class="text-muted" style="padding:12px 0;">Chưa có thẻ nào. Hãy thêm thẻ mới bên dưới.</p>';
        return;
    }

    modalFlashcards.forEach((card, index) => {
        const row = document.createElement('div');
        row.className = 'flashcard-crud-item';
        row.style.display = 'flex';
        row.style.gap = '12px';
        row.style.alignItems = 'center';
        row.style.marginBottom = '10px';
        row.style.padding = '12px';
        row.style.background = 'var(--bg-light)';
        row.style.borderRadius = '8px';
        row.style.border = '1px solid var(--border-light)';

        row.innerHTML = `
            <input type="text" class="modal-q-input" value="${escapeHtml(card.question)}" placeholder="Mặt trước (câu hỏi)" style="flex:1; padding:8px; border-radius:6px; border:1px solid var(--border); font-size:14px;">
            <input type="text" class="modal-a-input" value="${escapeHtml(card.answer)}" placeholder="Mặt sau (câu trả lời)" style="flex:1; padding:8px; border-radius:6px; border:1px solid var(--border); font-size:14px;">
            <button class="btn btn-outline modal-delete-card" data-index="${index}" style="padding:6px 10px; color:var(--danger); border-color:transparent;">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        container.appendChild(row);

        // Lưu thay đổi khi input thay đổi
        const qInput = row.querySelector('.modal-q-input');
        const aInput = row.querySelector('.modal-a-input');
        qInput.addEventListener('input', function() {
            modalFlashcards[index].question = this.value;
        });
        aInput.addEventListener('input', function() {
            modalFlashcards[index].answer = this.value;
        });

        // Xóa thẻ
        row.querySelector('.modal-delete-card').addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            modalFlashcards.splice(idx, 1);
            renderModalFlashcards();
        });
    });
}

// Helper escape HTML
function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- Xử lý sự kiện modal ---
function initModalEvents() {
    const modal = document.getElementById('viewFlashcardsModal');
    const closeBtns = [document.getElementById('closeModalBtn'), document.getElementById('modalCancelBtn')];
    const addBtn = document.getElementById('modalAddCardBtn');
    const saveBtn = document.getElementById('modalSaveAllBtn');

    // Đóng modal
    closeBtns.forEach(btn => {
        if (btn) btn.addEventListener('click', closeModal);
    });
    // Click ra ngoài cũng đóng
    modal.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    // Thêm thẻ mới
    addBtn.addEventListener('click', function() {
        modalFlashcards.push({ id: 'card_' + Date.now(), question: '', answer: '' });
        renderModalFlashcards();
        // Tự động focus vào input cuối
        const container = document.getElementById('modalFlashcardsContainer');
        const lastInput = container.querySelector('.flashcard-crud-item:last-child .modal-q-input');
        if (lastInput) setTimeout(() => lastInput.focus(), 100);
    });

    // Lưu tất cả thay đổi
    saveBtn.addEventListener('click', function() {
        if (!editingDeckId) return;
        const deck = decks.find(d => d.id === editingDeckId);
        if (!deck) return;

        // Lọc bỏ các thẻ trống (cả question và answer rỗng)
        const validCards = modalFlashcards.filter(c => c.question.trim() !== '' || c.answer.trim() !== '');
        deck.flashcards = validCards;
        deck.totalCards = validCards.length;
        saveDecks();
        renderDecks();
        showToast('Đã cập nhật bộ thẻ thành công!', 'success');
        closeModal();
    });
}

function closeModal() {
    document.getElementById('viewFlashcardsModal').classList.remove('open');
    editingDeckId = null;
    modalFlashcards = [];
}