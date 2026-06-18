// js/taothe.js
import { showToast, generateId } from './utils.js';
import { getUserDecks, saveUserDecks } from './data.js';

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const deckSelect = document.getElementById('deckSelect');
    const newDeckGroup = document.getElementById('newDeckGroup');
    const newDeckName = document.getElementById('newDeckName');
    const deckDesc = document.getElementById('deckDescInput');
    const deckCategory = document.getElementById('deckCategorySelect');
    const deckDueDate = document.getElementById('deckDueDate');
    const cardFront = document.getElementById('cardFront');
    const cardBack = document.getElementById('cardBack');
    const addCardBtn = document.getElementById('addCardBtn');
    const clearCardBtn = document.getElementById('clearCardBtn');
    const saveDeckBtn = document.getElementById('finalizeDeckBtn');
    const deleteDeckBtn = document.getElementById('deleteDeckBtn');
    const favoriteDeckBtn = document.getElementById('favoriteDeckBtn');
    const cardList = document.getElementById('cardList');
    const cardCount = document.getElementById('cardCount');

    // AI elements
    const aiTextRaw = document.getElementById('aiTextRaw');
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const fileList = document.getElementById('fileList');
    const aiGenerateBtn = document.getElementById('aiGenerateBtn');
    const aiResult = document.getElementById('aiResult');

    // State
    let pendingCards = [];
    let currentEditingDeckId = null;

    function getDecks() { return getUserDecks(); }
    function saveDecks(decks) { saveUserDecks(decks); }

    // Khởi tạo
    initPage();

    function initPage() {
        loadDecksToSelect();
        initTabs();
        initManualEvents();
        initAiEvents();
        if (deleteDeckBtn) deleteDeckBtn.style.display = 'none';
    }

    // Tabs
    function initTabs() {
        const tabs = document.querySelectorAll('.tab-trigger');
        const manualPane = document.getElementById('manualPane');
        const aiPane = document.getElementById('aiPane');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                if (this.dataset.tab === 'manual') {
                    if (manualPane) manualPane.style.display = 'block';
                    if (aiPane) aiPane.style.display = 'none';
                } else {
                    if (manualPane) manualPane.style.display = 'none';
                    if (aiPane) aiPane.style.display = 'block';
                }
            });
        });
    }

    // Load danh sách bộ thẻ vào dropdown
    function loadDecksToSelect() {
        if (!deckSelect) return;
        const decks = getDecks();
        deckSelect.innerHTML = `
            <option value="">-- Chọn bộ thẻ đã có --</option>
            <option value="new_deck">+ Khởi tạo bộ thẻ mới</option>
        `;
        decks.forEach(deck => {
            const opt = document.createElement('option');
            opt.value = deck.id;
            opt.textContent = deck.name;
            deckSelect.appendChild(opt);
        });
        if (newDeckGroup) newDeckGroup.style.display = 'none';
        if (deleteDeckBtn) deleteDeckBtn.style.display = 'none';
        currentEditingDeckId = null;
        pendingCards = [];
        renderPendingCards();
        clearFormFields();
        // Reset trạng thái nút yêu thích
        updateFavoriteButton(false);
    }

    function clearFormFields() {
        if (newDeckName) newDeckName.value = '';
        if (deckDesc) deckDesc.value = '';
        if (deckCategory) deckCategory.value = 'tech';
        if (deckDueDate) deckDueDate.value = '';
        if (cardFront) cardFront.value = '';
        if (cardBack) cardBack.value = '';
    }

    // Cập nhật trạng thái nút yêu thích
    function updateFavoriteButton(isStarred) {
        if (!favoriteDeckBtn) return;
        if (isStarred) {
            favoriteDeckBtn.innerHTML = `<i class="fas fa-star"></i> Đã yêu thích`;
            favoriteDeckBtn.classList.add('active');
            favoriteDeckBtn.style.color = '#f5a623';
        } else {
            favoriteDeckBtn.innerHTML = `<i class="far fa-star"></i> Yêu thích bộ này`;
            favoriteDeckBtn.classList.remove('active');
            favoriteDeckBtn.style.color = '';
        }
    }

    function loadDeckToEdit(deckId) {
        const decks = getDecks();
        const deck = decks.find(d => d.id === deckId);
        if (!deck) return;

        currentEditingDeckId = deck.id;
        if (newDeckName) newDeckName.value = deck.name || '';
        if (deckDesc) deckDesc.value = deck.description || '';
        if (deckCategory) deckCategory.value = deck.category || 'tech';
        if (deckDueDate) deckDueDate.value = deck.dueDate || '';

        pendingCards = deck.flashcards ? deck.flashcards.map(f => ({ ...f })) : [];
        renderPendingCards();

        if (deleteDeckBtn) deleteDeckBtn.style.display = 'inline-block';
        if (newDeckGroup) newDeckGroup.style.display = 'none';

        // Cập nhật nút yêu thích
        updateFavoriteButton(deck.starred || false);
    }

    // Sự kiện trên dropdown
    function initManualEvents() {
        if (deckSelect) {
            deckSelect.addEventListener('change', function() {
                const val = this.value;
                if (val === 'new_deck') {
                    if (newDeckGroup) newDeckGroup.style.display = 'block';
                    if (deleteDeckBtn) deleteDeckBtn.style.display = 'none';
                    currentEditingDeckId = null;
                    pendingCards = [];
                    renderPendingCards();
                    clearFormFields();
                    updateFavoriteButton(false);
                } else if (val) {
                    loadDeckToEdit(val);
                } else {
                    if (newDeckGroup) newDeckGroup.style.display = 'none';
                    if (deleteDeckBtn) deleteDeckBtn.style.display = 'none';
                    currentEditingDeckId = null;
                    pendingCards = [];
                    renderPendingCards();
                    clearFormFields();
                    updateFavoriteButton(false);
                }
            });
        }

        // Thêm thẻ
        if (addCardBtn) {
            addCardBtn.addEventListener('click', function() {
                const front = cardFront ? cardFront.value.trim() : '';
                const back = cardBack ? cardBack.value.trim() : '';
                if (!front && !back) {
                    showToast('Vui lòng nhập ít nhất một mặt của thẻ!', 'warning');
                    return;
                }
                const newCard = {
                    id: 'card_' + Date.now() + Math.random().toString(36).slice(2, 6),
                    question: front,
                    answer: back
                };
                pendingCards.push(newCard);
                renderPendingCards();
                if (cardFront) cardFront.value = '';
                if (cardBack) cardBack.value = '';
                if (cardFront) cardFront.focus();
            });
        }

        // Xóa trắng: xóa tất cả thẻ đang có trong danh sách tạm
        if (clearCardBtn) {
            clearCardBtn.addEventListener('click', function() {
                pendingCards = [];
                renderPendingCards();
                showToast('Đã xóa tất cả thẻ trong danh sách hiện tại.', 'info');
            });
        }

        // Lưu bộ thẻ
        if (saveDeckBtn) {
            saveDeckBtn.addEventListener('click', saveDeck);
        }

        // Xóa bộ thẻ
        if (deleteDeckBtn) {
            deleteDeckBtn.addEventListener('click', function() {
                if (!currentEditingDeckId) return;
                if (confirm('Bạn có chắc chắn muốn xóa bộ thẻ này?')) {
                    let decks = getDecks();
                    decks = decks.filter(d => d.id !== currentEditingDeckId);
                    saveDecks(decks);
                    showToast('Đã xóa bộ thẻ.', 'success');
                    // Load lại danh sách và reset form
                    loadDecksToSelect();
                    // Cập nhật lại kho thẻ nếu đang mở (thông qua localStorage)
                    // Khi quay lại kho thẻ sẽ tự động refresh
                }
            });
        }

        // Nút yêu thích
        if (favoriteDeckBtn) {
            favoriteDeckBtn.addEventListener('click', function() {
                if (!currentEditingDeckId) {
                    showToast('Bạn chưa chọn hoặc tạo bộ thẻ nào.', 'warning');
                    return;
                }
                let decks = getDecks();
                const deck = decks.find(d => d.id === currentEditingDeckId);
                if (!deck) return;
                deck.starred = !deck.starred;
                saveDecks(decks);
                updateFavoriteButton(deck.starred);
                showToast(deck.starred ? 'Đã thêm vào yêu thích!' : 'Đã bỏ yêu thích.', 'success');
            });
        }
    }

    // Render danh sách flashcard tạm
    function renderPendingCards() {
        if (!cardList || !cardCount) return;
        cardList.innerHTML = '';
        cardCount.textContent = pendingCards.length;

        if (pendingCards.length === 0) {
            cardList.innerHTML = '<p class="text-muted" style="padding:8px 0;">Chưa có thẻ nào.</p>';
            return;
        }

        pendingCards.forEach((card, index) => {
            const row = document.createElement('div');
            row.className = 'flashcard-crud-item';
            row.style.cssText = `
                display: flex; gap: 12px; align-items: center;
                background: var(--bg-light); padding: 12px;
                border-radius: 8px; margin-bottom: 10px;
                border: 1px solid var(--border-light);
            `;
            row.innerHTML = `
                <input type="text" class="ta-q-input" value="${escapeHtml(card.question)}" placeholder="Mặt trước" style="flex:1; padding:8px; border-radius:6px; border:1px solid var(--border); font-size:14px;">
                <input type="text" class="ta-a-input" value="${escapeHtml(card.answer)}" placeholder="Mặt sau" style="flex:1; padding:8px; border-radius:6px; border:1px solid var(--border); font-size:14px;">
                <button class="btn btn-outline ta-delete-card" data-index="${index}" style="padding:6px 10px; color:var(--danger); border-color:transparent;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            cardList.appendChild(row);

            const qInput = row.querySelector('.ta-q-input');
            const aInput = row.querySelector('.ta-a-input');
            qInput.addEventListener('input', function() {
                pendingCards[index].question = this.value;
            });
            aInput.addEventListener('input', function() {
                pendingCards[index].answer = this.value;
            });

            row.querySelector('.ta-delete-card').addEventListener('click', function() {
                const idx = parseInt(this.dataset.index);
                pendingCards.splice(idx, 1);
                renderPendingCards();
            });
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Lưu bộ thẻ (tạo mới hoặc cập nhật)
    function saveDeck() {
        const selectVal = deckSelect.value;
        if (!selectVal) {
            showToast('Vui lòng chọn hoặc tạo mới bộ thẻ.', 'warning');
            return;
        }

        const validCards = pendingCards.filter(c => c.question.trim() !== '' || c.answer.trim() !== '');
        if (validCards.length === 0) {
            showToast('Bạn cần có ít nhất một thẻ có nội dung.', 'warning');
            return;
        }

        let decks = getDecks();
        let targetDeck = null;

        if (selectVal === 'new_deck') {
            const name = newDeckName ? newDeckName.value.trim() : '';
            if (!name) {
                showToast('Vui lòng nhập tên bộ thẻ.', 'warning');
                return;
            }
            const category = deckCategory ? deckCategory.value : 'general';
            const dueDate = deckDueDate ? deckDueDate.value : '';
            const desc = deckDesc ? deckDesc.value.trim() : '';

            targetDeck = {
                id: generateId('D_'),
                name: name,
                description: desc || `Bộ thẻ "${name}"`,
                category: category,
                icon: '📚',
                dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                flashcards: [],
                learned: 0,
                starred: false,
                createdAt: new Date().toISOString()
            };
            decks.push(targetDeck);
        } else {
            targetDeck = decks.find(d => d.id === selectVal);
            if (!targetDeck) {
                showToast('Không tìm thấy bộ thẻ.', 'error');
                return;
            }
            if (newDeckName) targetDeck.name = newDeckName.value.trim() || targetDeck.name;
            if (deckDesc) targetDeck.description = deckDesc.value.trim() || targetDeck.description;
            if (deckCategory) targetDeck.category = deckCategory.value;
            if (deckDueDate) targetDeck.dueDate = deckDueDate.value || targetDeck.dueDate;
        }

        targetDeck.flashcards = validCards.map(c => ({
            id: c.id || generateId('F_'),
            question: c.question,
            answer: c.answer
        }));
        targetDeck.totalCards = targetDeck.flashcards.length;

        saveDecks(decks);
        showToast(`Đã lưu bộ thẻ "${targetDeck.name}" với ${targetDeck.totalCards} thẻ.`, 'success');

        // Cập nhật dropdown và hiển thị lại bộ thẻ vừa lưu
        loadDecksToSelect();
        if (deckSelect) {
            deckSelect.value = targetDeck.id;
            loadDeckToEdit(targetDeck.id);
        }
    }

    // --- Phần AI (giữ nguyên) ---
    function initAiEvents() {
        if (!dropZone || !fileInput) return;
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, e => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, e => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
            });
        });
        dropZone.addEventListener('drop', e => {
            const dt = e.dataTransfer;
            handleAiFiles(dt.files);
        });
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', function() {
            handleAiFiles(this.files);
        });

        if (aiGenerateBtn) {
            aiGenerateBtn.addEventListener('click', executeAiExtractionProcess);
        }
    }

    function handleAiFiles(files) {
        if (!fileList) return;
        fileList.innerHTML = '';
        for (let i = 0; i < files.length; i++) {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.style.fontSize = '13px';
            item.style.color = 'var(--text-gray)';
            item.style.marginTop = '4px';
            item.innerHTML = `<i class="fas fa-file-alt text-light"></i> ${files[i].name} (${Math.round(files[i].size / 1024)} KB)`;
            fileList.appendChild(item);
        }
    }

    function executeAiExtractionProcess() {
        const rawText = aiTextRaw ? aiTextRaw.value.trim() : '';
        const filesCount = fileInput && fileInput.files ? fileInput.files.length : 0;
        if (!rawText && filesCount === 0) {
            showToast('Vui lòng cung cấp văn bản hoặc tải tài liệu lên.', 'warning');
            return;
        }

        if (aiGenerateBtn) {
            aiGenerateBtn.disabled = true;
            aiGenerateBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang xử lý AI...`;
        }

        setTimeout(() => {
            let decks = getDecks();
            let targetDeck = decks.find(d => d.id === 'D_ai_generated');
            if (!targetDeck) {
                targetDeck = {
                    id: 'D_ai_generated',
                    name: 'Tài liệu trích xuất bằng AI',
                    description: 'Tự động sinh từ tài liệu tải lên.',
                    category: 'tech',
                    icon: '🤖',
                    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
                    flashcards: [],
                    learned: 0,
                    starred: false,
                    createdAt: new Date().toISOString()
                };
                decks.push(targetDeck);
            }

            const simulatedCards = [
                { question: "OOP là gì?", answer: "Lập trình hướng đối tượng." },
                { question: "4 tính chất OOP?", answer: "Đóng gói, kế thừa, đa hình, trừu tượng." },
                { question: "CRUD là gì?", answer: "Create, Read, Update, Delete." }
            ];
            simulatedCards.forEach(c => {
                targetDeck.flashcards.push({
                    id: generateId('F_'),
                    question: c.question,
                    answer: c.answer
                });
            });
            targetDeck.totalCards = targetDeck.flashcards.length;
            saveDecks(decks);

            if (aiResult) {
                aiResult.style.display = 'block';
                aiResult.style.background = '#eefbf7';
                aiResult.style.border = '1px solid rgba(16,185,129,0.2)';
                aiResult.innerHTML = `
                    <div style="color: var(--success); font-weight:600; margin-bottom:4px;">
                        <i class="fas fa-check-circle"></i> AI đã tạo ${simulatedCards.length} thẻ mới!
                    </div>
                    <p class="text-muted" style="font-size:13px;">Đã thêm vào bộ thẻ "${targetDeck.name}". Bạn có thể kiểm tra trong Kho thẻ.</p>
                `;
            }
            showToast('AI hoàn tất trích xuất!', 'success');

            if (aiGenerateBtn) {
                aiGenerateBtn.disabled = false;
                aiGenerateBtn.innerHTML = `<i class="fas fa-wand-magic-sparkles"></i> Tiến hành quét tài liệu & Khởi tạo bằng AI`;
            }
            if (aiTextRaw) aiTextRaw.value = '';
            if (fileInput) fileInput.value = '';
            if (fileList) fileList.innerHTML = '';

            loadDecksToSelect();
        }, 2200);
    }
});





























// ... (phần import và khởi tạo hiện tại)

// ===== QUẢN LÝ DANH MỤC =====
const CATEGORIES_KEY = 'forgetmenot_categories';

function getCategories() {
    try {
        return JSON.parse(localStorage.getItem(CATEGORIES_KEY)) || [];
    } catch {
        return [];
    }
}

function saveCategories(categories) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

function loadCategoriesToSelect() {
    const select = document.getElementById('deckCategorySelect');
    if (!select) return;
    const categories = getCategories();
    // Giữ lại các option mặc định nếu có
    const defaultOptions = select.querySelectorAll('option[data-default]');
    select.innerHTML = '';
    // Thêm các option mặc định
    const defaults = [
        { value: 'tech', label: 'Công nghệ thông tin & AI Engineering' },
        { value: 'english', label: 'Ngoại ngữ / Tiếng Anh chuyên ngành' },
        { value: 'general', label: 'Kiến thức tổng hợp' }
    ];
    defaults.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.value;
        opt.textContent = d.label;
        opt.dataset.default = 'true';
        select.appendChild(opt);
    });
    // Thêm danh mục từ localStorage
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });
}

function addNewCategory(name) {
    if (!name || name.trim() === '') return false;
    const categories = getCategories();
    if (categories.includes(name.trim())) return false;
    categories.push(name.trim());
    saveCategories(categories);
    loadCategoriesToSelect();
    return true;
}

// ===== MODAL THÊM DANH MỤC =====
function initCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    const openBtn = document.getElementById('addCategoryBtn');
    const closeBtn = document.getElementById('cancelCategoryBtn');
    const confirmBtn = document.getElementById('confirmCategoryBtn');
    const input = document.getElementById('newCategoryInput');

    if (!openBtn || !modal) return;

    openBtn.addEventListener('click', () => {
        modal.classList.add('open');
        input.value = '';
        input.focus();
    });

    const closeModal = () => {
        modal.classList.remove('open');
        input.value = '';
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    confirmBtn.addEventListener('click', () => {
        const name = input.value.trim();
        if (!name) {
            showToast('Vui lòng nhập tên danh mục', 'warning');
            return;
        }
        if (addNewCategory(name)) {
            showToast('Đã thêm danh mục: ' + name, 'success');
            closeModal();
        } else {
            showToast('Danh mục đã tồn tại!', 'warning');
        }
    });

    // Enter để thêm
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmBtn.click();
        }
    });
}

// ===== GỌI KHI DOM LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    // ... phần khởi tạo hiện tại ...
    loadCategoriesToSelect();
    initCategoryModal();
});