// js/dashboard.js
import { getDecks, getRecentDecks, getTotalCards, getTotalStudyTime, getAppData } from './data.js';
import { getCalendarData, triggerStreakCheckin, renderCalendar } from './calendar.js';
import { showToast } from './utils.js';
import { getCurrentUser } from './app.js';

export function updateDashboardStats() {
  const data = getAppData();
  const decks = data.decks || [];
  const calendar = getCalendarData();
  const user = getCurrentUser();

  const streakEl = document.getElementById('streakCount');
  if (streakEl) streakEl.textContent = calendar.streak || 0;

  const totalDecksEl = document.getElementById('totalDecks');
  if (totalDecksEl) totalDecksEl.textContent = decks.length;

  const totalCardsLearnedEl = document.getElementById('totalCardsLearned');
  if (totalCardsLearnedEl) {
    const total = getTotalCards();
    totalCardsLearnedEl.textContent = total;
  }

  const totalTimeEl = document.getElementById('totalTime');
  if (totalTimeEl) {
    const time = getTotalStudyTime();
    totalTimeEl.textContent = time;
  }

  const welcomeName = document.getElementById('welcomeName');
  if (welcomeName && user) {
    welcomeName.textContent = user.displayName || user.name || 'Người Dùng';
  }

  // Cập nhật streak banner
  const streakBanner = document.getElementById('streakCountBanner');
  if (streakBanner) streakBanner.textContent = calendar.streak || 0;
}

export function renderRecentDecks() {
  const container = document.getElementById('recentDecksList');
  if (!container) return;

  const decks = getRecentDecks(5);

  if (!decks || decks.length === 0) {
    container.innerHTML = `
      <div class="empty-recent">
        <i class="fas fa-box-open"></i>
        <p>Bạn chưa có bộ thẻ nào.</p>
        <a href="taothe.html" class="btn btn-primary btn-sm">Tạo bộ thẻ đầu tiên</a>
      </div>
    `;
    return;
  }

  container.innerHTML = decks.map(deck => {
    const cardCount = deck.flashcards ? deck.flashcards.length : 0;
    const learnedCount = deck.learned || 0;
    const dueCount = Math.min(Math.round(cardCount * 0.3), cardCount);
    const icon = deck.icon || '📚';
    const progress = cardCount > 0 ? Math.round((learnedCount / cardCount) * 100) : 0;

    return `
      <div class="deck-item" data-id="${deck.id}">
        <div class="deck-item-left">
          <div class="deck-icon">${icon}</div>
          <div class="deck-info">
            <div class="deck-name">${escapeHtml(deck.name)}</div>
            <div class="deck-meta">
              <span><i class="fas fa-layer-group"></i> ${cardCount} thẻ</span>
              <span><i class="fas fa-check-circle"></i> ${learnedCount} đã học</span>
              <span class="due-badge"><i class="fas fa-clock"></i> ${dueCount} cần ôn</span>
            </div>
          </div>
        </div>
        <div class="deck-item-right">
          <div class="deck-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width:${progress}%;"></div>
            </div>
            <span class="progress-text">${progress}%</span>
          </div>
          <button class="btn btn-primary btn-sm study-btn" data-id="${deck.id}">
            <i class="fas fa-play"></i> Học
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Sự kiện cho nút Học
  container.querySelectorAll('.study-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const deckId = this.dataset.id;
      localStorage.setItem('forgetmenot_current_study_deck', deckId);
      window.location.href = 'ontap.html';
    });
  });

  // Click vào item để xem chi tiết
  container.querySelectorAll('.deck-item').forEach(item => {
    item.addEventListener('click', function() {
      const deckId = this.dataset.id;
      window.location.href = `khothe.html?deck=${deckId}`;
    });
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Tạo dữ liệu mẫu nếu chưa có
function seedSampleDecks() {
  const decks = getDecks();
  if (decks.length > 0) return;

  const sampleDecks = [
    {
      id: 'deck_sample_1',
      name: 'Kiến trúc CRUD trong Database',
      description: 'Tổng hợp kiến thức về Create, Read, Update, Delete',
      icon: '💾',
      category: 'tech',
      flashcards: [
        { id: 'card_1', question: 'CRUD là viết tắt của gì?', answer: 'Create, Read, Update, Delete' },
        { id: 'card_2', question: 'Lệnh SQL để tạo bảng mới?', answer: 'CREATE TABLE' },
        { id: 'card_3', question: 'Thao tác Read tương ứng với lệnh SQL nào?', answer: 'SELECT' }
      ],
      learned: 1,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'deck_sample_2',
      name: 'Ngữ pháp tiếng Anh cơ bản',
      description: 'Các thì cơ bản trong tiếng Anh',
      icon: '📖',
      category: 'english',
      flashcards: [
        { id: 'card_4', question: 'Thì hiện tại đơn dùng để làm gì?', answer: 'Diễn tả sự thật hiển nhiên, thói quen' },
        { id: 'card_5', question: 'Cấu trúc thì quá khứ đơn?', answer: 'S + V-ed / V2' }
      ],
      learned: 2,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'deck_sample_3',
      name: 'Công thức Toán học',
      description: 'Các công thức quan trọng',
      icon: '📐',
      category: 'math',
      flashcards: [
        { id: 'card_6', question: 'Diện tích hình tròn?', answer: 'S = πr²' },
        { id: 'card_7', question: 'Định lý Pythagoras?', answer: 'a² + b² = c²' }
      ],
      learned: 0,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const data = getAppData();
  data.decks = sampleDecks;
  localStorage.setItem('forgetmenot_data', JSON.stringify(data));
  console.log('✅ Đã tạo dữ liệu mẫu cho bộ thẻ!');
}

export function initDashboard() {
  seedSampleDecks();
  updateDashboardStats();
  renderRecentDecks();
  renderCalendar();

  window.updateDashboardStats = updateDashboardStats;

  // Nút ôn tập
  const reviewBtn = document.getElementById('reviewNowBtn');
  if (reviewBtn) {
    reviewBtn.addEventListener('click', () => window.location.href = 'ontap.html');
  }

  // Nút tạo AI
  const aiBtn = document.getElementById('aiCreateBtn');
  if (aiBtn) {
    aiBtn.addEventListener('click', () => window.location.href = 'taothe.html?mode=ai');
  }

  // Nút điểm danh streak
  const streakBtn = document.getElementById('btnStreakCheck');
  if (streakBtn) {
    streakBtn.addEventListener('click', () => {
      triggerStreakCheckin();
      updateDashboardStats();
    });
  }

  // Điều hướng lịch
  const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');
  if (prevBtn && nextBtn && window.changeMonth) {
    prevBtn.addEventListener('click', () => window.changeMonth(-1));
    nextBtn.addEventListener('click', () => window.changeMonth(1));
  }
}

document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('recentDecksList')) {
    initDashboard();
  }
});