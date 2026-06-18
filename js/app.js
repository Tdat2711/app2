// js/app.js
import { getData, setData, showToast } from './utils.js';
import { KEYS } from './data.js';
import './auth.js';
import './calendar.js';
import './khothe.js';
import './ontap.js';
import './thongke.js';
import './congdong.js';
import './caidat.js';

export function getCurrentUser() {
  return getData(KEYS.CURRENT_USER);
}

export function setCurrentUser(user) {
  setData(KEYS.CURRENT_USER, user);
}

export function clearCurrentUser() {
  localStorage.removeItem(KEYS.CURRENT_USER);
  if (window.db && typeof window.db.remove === 'function') {
    window.db.remove(KEYS.CURRENT_USER);
  }
}

export function requireAuth() {
  if (!getCurrentUser()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

export function requireGuest() {
  if (getCurrentUser()) {
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

export function loadUserInfo() {
  const user = getCurrentUser();
  if (!user) return;
  document.querySelectorAll('#userName, .user-name, #welcomeName').forEach(el => {
    if (el) el.textContent = user.name;
  });
  document.querySelectorAll('#userEmail, .user-email').forEach(el => {
    if (el) el.textContent = user.email;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearCurrentUser();
      showToast('Đã đăng xuất', 'success');
      setTimeout(() => window.location.href = '../index.html', 500);
    });
  }
  if (document.getElementById('sidebar')) {
    if (!requireAuth()) return;
    loadUserInfo();
  }
});