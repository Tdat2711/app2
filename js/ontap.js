// js/ontap.js
import { showToast, getDaysLeft, generateId } from './utils.js';
import { getUserDecks, saveUserDecks } from './data.js';

// ===================== CẤU HÌNH =====================
const CRAM_DAYS_THRESHOLD = 7; // Tự động kích hoạt Cram Mode khi còn <= 7 ngày

// ===================== STATE =====================
let decks = [];
let currentDeck = null;
let studyCards = [];          // Danh sách thẻ sẽ học trong phiên này (đã lọc)
let currentIndex = 0;
let isFlipped = false;
let isCramMode = false;

// DOM elements
const decksGrid = document.getElementById('decksGrid');
const emptyState = document.getElementById('emptyState');
const totalDecksCount = document.getElementById('totalDecksCount');
const studyContainer = document.getElementById('studyContainer');
const cramBanner = document.getElementById('cramBanner');
const cramDaysLeft = document.getElementById('cramDaysLeft');
const cramDueCount = document.getElementById('cramDueCount');
const cramLearnedCount = document.getElementById('cramLearnedCount');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const questionText = document.getElementById('questionText');
const answerText = document.getElementById('answerText');
const cardCounter = document.getElementById('cardCounter');
const flashcardInner = document.getElementById('flashcardInner');
const flashcardWrapper = document.getElementById('flashcardWrapper');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const backToDeckBtn = document.getElementById('backToDeckBtn');
const ratingBtns = document.querySelectorAll('.rating-btn');

// ===================== KHỞI TẠO =====================
document.addEventListener('DOMContentLoaded', init);

function init() {
    loadDecks();
    renderDeckList();
    bindEvents();
    // Kiểm tra nếu có deck được chọn từ nơi khác (ví dụ từ kho thẻ)
    const selectedId = localStorage.getItem('forgetmenot_current_study_deck');
    if (selectedId) {
        const deck = decks.find(d => d.id === selectedId);
        if (deck) startStudy(deck);
        localStorage.removeItem('forgetmenot_current_study_deck');
    }
}

// ===================== LOAD DỮ LIỆU =====================
function loadDecks() {
    decks = getUserDecks();
    if (!decks) decks = [];
    // Đảm bảo mỗi flashcard có thuộc tính Spaced Repetition nếu chưa có
    decks.forEach(deck => {
        if (deck.flashcards) {
            deck.flashcards.forEach(card => {
                if (!card.repetition) {
                    card.repetition = {
                        level: 0,           // 0=chưa học, 1-5
                        easeFactor: 2.5,
                        interval: 0,
                        lastReviewed: null,
                        nextReviewDate: null
                    };
                }
            });
        }
    });
}

// ===================== RENDER DANH SÁCH BỘ THẺ =====================
function renderDeckList() {
    if (decks.length === 0) {
        decksGrid.style.display = 'none';
        emptyState.style.display = 'flex';
        totalDecksCount.textContent = '0';
        return;
    }
    decksGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    totalDecksCount.textContent = decks.length;

    let html = '';
    decks.forEach(deck => {
        const today = new Date();
        const dueDate = deck.dueDate ? new Date(deck.dueDate) : null;
        const daysLeft = dueDate ? Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)) : null;
        const isCram = (daysLeft !== null && daysLeft <= CRAM_DAYS_THRESHOLD);

        // Đếm số thẻ cần ôn hôm nay (nextReviewDate <= today)
        let dueCards = 0;
        if (deck.flashcards) {
            dueCards = deck.flashcards.filter(c => {
                if (!c.repetition || c.repetition.level === 0) return true; // Chưa học
                if (!c.repetition.nextReviewDate) return true;
                return new Date(c.repetition.nextReviewDate) <= today;
            }).length;
        }

        const totalCards = deck.flashcards ? deck.flashcards.length : 0;
        const learned = deck.flashcards ? deck.flashcards.filter(c => c.repetition && c.repetition.level > 0).length : 0;

        html += `
            <div class="deck-item ${isCram ? 'cram-warning' : ''}" data-id="${deck.id}">
                <div class="deck-icon">${deck.icon || '📁'}</div>
                <div class="deck-info">
                    <div class="deck-name">${deck.name}</div>
                    <div class="deck-meta">
                        <span><i class="fas fa-layer-group"></i> ${totalCards} thẻ</span>
                        <span><i class="fas fa-check-circle"></i> ${learned} đã học</span>
                        <span><i class="fas fa-clock"></i> ${dueCards} cần ôn</span>
                        ${dueDate ? `<span class="due-badge ${daysLeft <= 0 ? 'overdue' : daysLeft <= 3 ? 'soon' : ''}">
                            ${daysLeft <= 0 ? '⚠️ Quá hạn' : `📅 ${daysLeft} ngày`}
                        </span>` : ''}
                    </div>
                </div>
                <button class="btn btn-primary btn-study" data-id="${deck.id}">
                    <i class="fas fa-book-open"></i> Ôn luyện
                </button>
            </div>
        `;
    });
    decksGrid.innerHTML = html;

    // Gắn sự kiện click cho nút "Ôn luyện"
    document.querySelectorAll('.btn-study').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            const deck = decks.find(d => d.id === id);
            if (deck) startStudy(deck);
        });
    });
}

// ===================== BẮT ĐẦU HỌC =====================
function startStudy(deck) {
    currentDeck = deck;
    currentIndex = 0;
    isFlipped = false;
    isCramMode = false;

    // Lọc danh sách thẻ cần học trong phiên này:
    // - Ưu tiên thẻ có nextReviewDate <= hôm nay hoặc chưa học
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let cards = deck.flashcards ? [...deck.flashcards] : [];
    // Sắp xếp: thẻ chưa học lên trước, sau đó đến thẻ cần ôn, rồi đến thẻ đã học gần đây
    cards.sort((a, b) => {
        const aDue = a.repetition && a.repetition.nextReviewDate ? new Date(a.repetition.nextReviewDate) : new Date(0);
        const bDue = b.repetition && b.repetition.nextReviewDate ? new Date(b.repetition.nextReviewDate) : new Date(0);
        if (a.repetition && a.repetition.level === 0) return -1;
        if (b.repetition && b.repetition.level === 0) return 1;
        return aDue - bDue;
    });

    // Chỉ lấy các thẻ cần học hôm nay (nextReviewDate <= today hoặc chưa học)
    // Nhưng nếu ít thẻ, có thể lấy thêm để đủ số lượng (tối đa 20 thẻ)
    studyCards = cards.filter(c => {
        if (!c.repetition || c.repetition.level === 0) return true;
        if (!c.repetition.nextReviewDate) return true;
        return new Date(c.repetition.nextReviewDate) <= today;
    });
    // Nếu không có thẻ nào cần học, lấy tất cả (để ôn lại)
    if (studyCards.length === 0) {
        studyCards = cards.slice(0, 20); // Giới hạn 20 thẻ cho 1 phiên
    }

    // Kiểm tra Cram Mode
    const dueDate = deck.dueDate ? new Date(deck.dueDate) : null;
    const daysLeft = dueDate ? Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)) : null;
    if (daysLeft !== null && daysLeft <= CRAM_DAYS_THRESHOLD) {
        isCramMode = true;
        // Trong Cram Mode, ưu tiên các thẻ chưa học hoặc sắp quá hạn
        studyCards = cards.filter(c => {
            if (!c.repetition || c.repetition.level === 0) return true;
            if (!c.repetition.nextReviewDate) return true;
            return new Date(c.repetition.nextReviewDate) <= today;
        });
        if (studyCards.length === 0) {
            // Nếu tất cả đã học, lấy thẻ gần nhất
            studyCards = cards.slice(0, 20);
        }
        // Cập nhật banner Cram
        cramBanner.style.display = 'flex';
        cramDaysLeft.textContent = daysLeft;
        cramDueCount.textContent = studyCards.length;
        const learned = deck.flashcards ? deck.flashcards.filter(c => c.repetition && c.repetition.level > 0).length : 0;
        cramLearnedCount.textContent = learned;
    } else {
        cramBanner.style.display = 'none';
    }

    // Ẩn danh sách, hiện study container
    decksGrid.style.display = 'none';
    emptyState.style.display = 'none';
    studyContainer.style.display = 'block';

    // Render thẻ đầu tiên
    renderCard();
}

// ===================== RENDER THẺ HIỆN TẠI =====================
function renderCard() {
    if (!studyCards || studyCards.length === 0) {
        showToast('Không có thẻ nào để học!', 'warning');
        backToDeckList();
        return;
    }
    if (currentIndex >= studyCards.length) {
        // Hoàn thành phiên học
        showToast('🎉 Hoàn thành! Bạn đã học xong tất cả thẻ trong phiên này.', 'success');
        backToDeckList();
        return;
    }

    const card = studyCards[currentIndex];
    questionText.textContent = card.question || '(Không có câu hỏi)';
    answerText.textContent = card.answer || '(Không có đáp án)';
    cardCounter.textContent = `${currentIndex + 1} / ${studyCards.length}`;

    // Reset flip
    if (isFlipped) {
        flashcardInner.classList.remove('flipped');
        isFlipped = false;
    }

    updateProgress();
}

function updateProgress() {
    const total = studyCards.length;
    const current = currentIndex + 1;
    const progress = total > 0 ? (current / total) * 100 : 0;
    progressText.textContent = `${current}/${total}`;
    progressFill.style.width = `${Math.min(progress, 100)}%`;
}

// ===================== FLIP CARD =====================
function flipCard() {
    if (!studyCards || studyCards.length === 0) return;
    isFlipped = !isFlipped;
    flashcardInner.classList.toggle('flipped');
}

// ===================== ĐIỀU HƯỚNG THẺ =====================
function nextCard() {
    if (!studyCards || studyCards.length === 0) return;
    if (currentIndex < studyCards.length - 1) {
        currentIndex++;
        renderCard();
    } else {
        // Nếu đang ở thẻ cuối, coi như hoàn thành
        showToast('🎉 Hoàn thành phiên học!', 'success');
        backToDeckList();
    }
}

function prevCard() {
    if (!studyCards || studyCards.length === 0) return;
    if (currentIndex > 0) {
        currentIndex--;
        renderCard();
    }
}

// ===================== ĐÁNH GIÁ MỨC ĐỘ NHỚ (SPACED REPETITION) =====================
function rateCard(level) {
    if (!currentDeck || !studyCards || studyCards.length === 0) return;
    if (currentIndex >= studyCards.length) return;

    const card = studyCards[currentIndex];
    // Cập nhật thông tin repetition cho card
    if (!card.repetition) {
        card.repetition = { level: 0, easeFactor: 2.5, interval: 0, lastReviewed: null, nextReviewDate: null };
    }

    // Áp dụng thuật toán SM-2 đơn giản
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let newLevel = card.repetition.level || 0;
    let easeFactor = card.repetition.easeFactor || 2.5;
    let interval = card.repetition.interval || 0;

    if (level === 1) { // Quên
        newLevel = 0;
        interval = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else if (level === 2) { // Khó
        newLevel = Math.max(1, newLevel);
        interval = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.15);
    } else if (level === 3) { // Tốt
        newLevel = Math.min(5, newLevel + 1);
        if (newLevel === 1) interval = 1;
        else if (newLevel === 2) interval = 3;
        else if (newLevel === 3) interval = 7;
        else if (newLevel === 4) interval = 14;
        else if (newLevel === 5) interval = 30;
        // Không thay đổi easeFactor
    } else if (level === 4) { // Dễ
        newLevel = Math.min(5, newLevel + 2);
        if (newLevel === 1) interval = 1;
        else if (newLevel === 2) interval = 4;
        else if (newLevel === 3) interval = 10;
        else if (newLevel === 4) interval = 20;
        else if (newLevel === 5) interval = 45;
        easeFactor = Math.min(4.0, easeFactor + 0.15);
    }

    // Tính ngày ôn tiếp theo
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + interval);

    card.repetition.level = newLevel;
    card.repetition.easeFactor = easeFactor;
    card.repetition.interval = interval;
    card.repetition.lastReviewed = today.toISOString();
    card.repetition.nextReviewDate = nextDate.toISOString();

    // Lưu vào deck
    saveDecks();

    // Hiển thị thông báo
    const labels = ['', 'Quên', 'Khó', 'Tốt', 'Dễ'];
    showToast(`Đánh giá: ${labels[level]} ✅`, 'success');

    // Chuyển sang thẻ tiếp theo
    if (currentIndex < studyCards.length - 1) {
        currentIndex++;
        renderCard();
    } else {
        // Hết thẻ
        showToast('🎉 Hoàn thành phiên học!', 'success');
        backToDeckList();
    }
}

// ===================== LƯU DỮ LIỆU =====================
function saveDecks() {
    saveUserDecks(decks);
}

// ===================== QUAY LẠI DANH SÁCH =====================
function backToDeckList() {
    studyContainer.style.display = 'none';
    cramBanner.style.display = 'none';
    decksGrid.style.display = 'grid';
    currentDeck = null;
    studyCards = [];
    currentIndex = 0;
    isFlipped = false;
    isCramMode = false;
    renderDeckList();
}

// ===================== SỰ KIỆN =====================
function bindEvents() {
    // Flashcard click để lật
    flashcardWrapper.addEventListener('click', flipCard);

    // Nút điều hướng
    prevBtn.addEventListener('click', prevCard);
    nextBtn.addEventListener('click', nextCard);
    backToDeckBtn.addEventListener('click', backToDeckList);

    // Nút đánh giá
    ratingBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const level = parseInt(this.dataset.level);
            rateCard(level);
        });
    });

    // Phím tắt
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!studyContainer || studyContainer.style.display === 'none') return;
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            flipCard();
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextCard();
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevCard();
        }
        if (e.key >= '1' && e.key <= '4') {
            rateCard(parseInt(e.key));
        }
    });
}

// ===================== EXPORT (cho window) =====================
window.startStudy = startStudy;
window.backToDeckList = backToDeckList;