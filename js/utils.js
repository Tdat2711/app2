// js/utils.js
export function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  const icon = toast.querySelector('i');
  const msgSpan = toast.querySelector('#toastMessage');
  if (icon) {
    icon.className =
      type === 'success' ? 'fas fa-check-circle' :
      type === 'error' ? 'fas fa-exclamation-circle' :
      type === 'warning' ? 'fas fa-exclamation-triangle' :
      'fas fa-info-circle';
  }
  if (msgSpan) msgSpan.textContent = message;
  toast.className = 'toast show';
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function getCategoryName(cat) {
  const map = {
    general: 'Tổng hợp',
    english: 'Tiếng Anh',
    math: 'Toán học',
    science: 'Khoa học',
    history: 'Lịch sử',
    tech: 'Công nghệ',
    other: 'Khác'
  };
  return map[cat] || cat;
}

export function getDaysLeft(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const due = new Date(dateStr);
  return Math.ceil((due - now) / 86400000);
}

export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isToday(date) {
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
}

export function getData(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  if (window.db && typeof window.db.put === 'function') {
    window.db.put(key, value).catch(() => {});
  }
}

export function getCurrentUserId() {
  const user = getData('forgetmenot_current_user');
  return user ? user.id : null;
}

export function getUserKey(baseKey) {
  const uid = getCurrentUserId();
  return uid ? `${baseKey}_${uid}` : baseKey;
}