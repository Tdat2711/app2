// js/ontap.js
import { showToast, getDaysLeft, generateId } from './utils.js';
import { getUserDecks, saveUserDecks } from './data.js';

// ===================== CẤU HÌNH =====================
const CRAM_DAYS_THRESHOLD = 7; // Tự động kích hoạt Cram Mode khi còn <= 7 ngày

// ===================== STATE =====================
let decks = [];
let currentDeck = null;
let studyCards = [];
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
    decks.forEach(deck => {
        if (deck.flashcards) {
            deck.flashcards.forEach(card => {
                if (!card.repetition) {
                    card.repetition = {
                        level: 0,
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ===== SẮP XẾP: Cram Mode lên đầu =====
    const sortedDecks = [...decks].sort((a, b) => {
        const aDue = a.dueDate ? new Date(a.dueDate) : null;
        const bDue = b.dueDate ? new Date(b.dueDate) : null;
        if (!aDue && !bDue) return 0;
        if (!aDue) return 1;
        if (!bDue) return -1;
        const aDays = Math.ceil((aDue - today) / (1000 * 60 * 60 * 24));
        const bDays = Math.ceil((bDue - today) / (1000 * 60 * 60 * 24));
        return aDays - bDays;
    });

    let html = '';
    sortedDecks.forEach(deck => {
        // Sử dụng hàm getDaysLeft chuẩn từ utils.js để tránh sai số
        const daysLeft = getDaysLeft(deck.dueDate);
        const isCram = (daysLeft !== null && daysLeft <= CRAM_DAYS_THRESHOLD);

        let dueCards = 0;
        if (deck.flashcards) {
            dueCards = deck.flashcards.filter(c => {
                if (!c.repetition || c.repetition.level === 0) return true;
                if (!c.repetition.nextReviewDate) return true;
                return new Date(c.repetition.nextReviewDate) <= today;
            }).length;
        }

        const totalCards = deck.flashcards ? deck.flashcards.length : 0;
        const learned = deck.flashcards ? deck.flashcards.filter(c => c.repetition && c.repetition.level > 0).length : 0;

        const cramClass = isCram ? 'cram-mode' : '';
        const dueBadgeClass = daysLeft !== null && daysLeft <= 0 ? 'overdue' : (daysLeft !== null && daysLeft <= 3 ? 'soon' : '');

        html += `
            <div class="deck-item ${cramClass}" data-id="${deck.id}">
                <div class="deck-icon">${deck.icon || '📁'}</div>
                <div class="deck-info">
                    <div class="deck-name">
                        ${escapeHtml(deck.name)}
                        ${isCram ? `<span class="cram-badge"><i class="fas fa-clock"></i> CẤP TỐC</span>` : ''}
                    </div>
                    <div class="deck-meta">
                        <span><i class="fas fa-layer-group"></i> ${totalCards} thẻ</span>
                        <span><i class="fas fa-check-circle"></i> ${learned} đã học</span>
                        <span><i class="fas fa-clock"></i> ${dueCards} cần ôn</span>
                        ${deck.dueDate ? `<span class="due-badge ${dueBadgeClass}">
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

    document.querySelectorAll('.btn-study').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            const deck = decks.find(d => d.id === id);
            if (deck) startStudy(deck);
        });
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ===================== BẮT ĐẦU HỌC =====================
function startStudy(deck) {
    currentDeck = deck;
    currentIndex = 0;
    isFlipped = false;
    isCramMode = false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let cards = deck.flashcards ? [...deck.flashcards] : [];
    cards.sort((a, b) => {
        const aDue = a.repetition && a.repetition.nextReviewDate ? new Date(a.repetition.nextReviewDate) : new Date(0);
        const bDue = b.repetition && b.repetition.nextReviewDate ? new Date(b.repetition.nextReviewDate) : new Date(0);
        if (a.repetition && a.repetition.level === 0) return -1;
        if (b.repetition && b.repetition.level === 0) return 1;
        return aDue - bDue;
    });

    studyCards = cards.filter(c => {
        if (!c.repetition || c.repetition.level === 0) return true;
        if (!c.repetition.nextReviewDate) return true;
        return new Date(c.repetition.nextReviewDate) <= today;
    });
    if (studyCards.length === 0) {
        studyCards = cards.slice(0, 20);
    }

    const daysLeft = getDaysLeft(deck.dueDate);
    if (daysLeft !== null && daysLeft <= CRAM_DAYS_THRESHOLD) {
        isCramMode = true;
        studyCards = cards.filter(c => {
            if (!c.repetition || c.repetition.level === 0) return true;
            if (!c.repetition.nextReviewDate) return true;
            return new Date(c.repetition.nextReviewDate) <= today;
        });
        if (studyCards.length === 0) {
            studyCards = cards.slice(0, 20);
        }
        cramBanner.style.display = 'flex';
        cramDaysLeft.textContent = daysLeft;
        cramDueCount.textContent = studyCards.length;
        const learned = deck.flashcards ? deck.flashcards.filter(c => c.repetition && c.repetition.level > 0).length : 0;
        cramLearnedCount.textContent = learned;
    } else {
        cramBanner.style.display = 'none';
    }

    decksGrid.style.display = 'none';
    emptyState.style.display = 'none';
    studyContainer.style.display = 'block';
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
        showToast('🎉 Hoàn thành! Bạn đã học xong tất cả thẻ trong phiên này.', 'success');
        backToDeckList();
        return;
    }

    const card = studyCards[currentIndex];
    questionText.textContent = card.question || '(Không có câu hỏi)';
    answerText.textContent = card.answer || '(Không có đáp án)';
    cardCounter.textContent = `${currentIndex + 1} / ${studyCards.length}`;

    if (isFlipped) {
        flashcardInner.classList.remove('flipped');
        isFlipped = false;
    }
    updateProgress();


    
const intervalEl = document.querySelector('.study-interval .interval-value');
if (intervalEl && card.repetition) {
    const interval = card.repetition.interval || 0;
    intervalEl.textContent = interval > 0 ? `${interval} ngày` : 'Chưa học';
}
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

// ===================== ĐÁNH GIÁ MỨC ĐỘ NHỚ =====================
function rateCard(level) {
    if (!currentDeck || !studyCards || studyCards.length === 0) return;
    if (currentIndex >= studyCards.length) return;

    const card = studyCards[currentIndex];
    if (!card.repetition) {
        card.repetition = { level: 0, easeFactor: 2.5, interval: 0, lastReviewed: null, nextReviewDate: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newLevel = card.repetition.level || 0;
    let easeFactor = card.repetition.easeFactor || 2.5;
    let interval = card.repetition.interval || 0;

    if (level === 1) {
        newLevel = 0;
        interval = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else if (level === 2) {
        newLevel = Math.max(1, newLevel);
        interval = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.15);
    } else if (level === 3) {
        newLevel = Math.min(5, newLevel + 1);
        if (newLevel === 1) interval = 1;
        else if (newLevel === 2) interval = 3;
        else if (newLevel === 3) interval = 7;
        else if (newLevel === 4) interval = 14;
        else if (newLevel === 5) interval = 30;
    } else if (level === 4) {
        newLevel = Math.min(5, newLevel + 2);
        if (newLevel === 1) interval = 1;
        else if (newLevel === 2) interval = 4;
        else if (newLevel === 3) interval = 10;
        else if (newLevel === 4) interval = 20;
        else if (newLevel === 5) interval = 45;
        easeFactor = Math.min(4.0, easeFactor + 0.15);
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + interval);

    card.repetition.level = newLevel;
    card.repetition.easeFactor = easeFactor;
    card.repetition.interval = interval;
    card.repetition.lastReviewed = today.toISOString();
    card.repetition.nextReviewDate = nextDate.toISOString();

    saveDecks();

    const labels = ['', 'Quên', 'Khó', 'Tốt', 'Dễ'];
    showToast(`Đánh giá: ${labels[level]} ✅`, 'success');

    if (currentIndex < studyCards.length - 1) {
        currentIndex++;
        renderCard();
    } else {
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
    flashcardWrapper.addEventListener('click', flipCard);
    prevBtn.addEventListener('click', prevCard);
    nextBtn.addEventListener('click', nextCard);
    backToDeckBtn.addEventListener('click', backToDeckList);

    ratingBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const level = parseInt(this.dataset.level);
            rateCard(level);
        });
    });

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

window.startStudy = startStudy;
window.backToDeckList = backToDeckList;