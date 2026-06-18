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

// ============================================================
//  USER MANAGEMENT
// ============================================================
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

// ============================================================
//  LOAD USER INFO TO UI
// ============================================================
export function loadUserInfo() {
  const user = getCurrentUser();
  if (!user) return;
  const displayName = user.displayName || user.name || 'Người Dùng';
  document.querySelectorAll('#userName, .user-name, #welcomeName').forEach(el => {
    if (el) el.textContent = displayName;
  });
  document.querySelectorAll('#userEmail, .user-email').forEach(el => {
    if (el) el.textContent = user.email || '';
  });
}

// ============================================================
//  ACCOUNT ACTIONS (thêm mới)
// ============================================================
export function logout() {
  clearCurrentUser();
  window.location.href = 'login.html';
}

export function deleteAccount() {
  const user = getCurrentUser();
  if (!user) return;
  // Xóa khỏi danh sách users
  const users = JSON.parse(localStorage.getItem('forgetmenot_users') || '[]');
  const updatedUsers = users.filter(u => u.id !== user.id);
  localStorage.setItem('forgetmenot_users', JSON.stringify(updatedUsers));
  clearCurrentUser();
  // Xóa dữ liệu ứng dụng
  localStorage.removeItem('forgetmenot_data');
  localStorage.removeItem('forgetmenot_settings');
  showToast('Đã xóa tài khoản', 'success');
}

export function updateUserProfile(updates) {
  const user = getCurrentUser();
  if (!user) return;
  // Cập nhật trong danh sách users
  const users = JSON.parse(localStorage.getItem('forgetmenot_users') || '[]');
  const index = users.findIndex(u => u.id === user.id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem('forgetmenot_users', JSON.stringify(users));
  }
  // Cập nhật current user
  const updatedUser = { ...user, ...updates };
  setCurrentUser(updatedUser);
  return updatedUser;
}

// ============================================================
//  INIT ON DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Xử lý nút logout nếu có (dùng trong header hoặc sidebar)
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearCurrentUser();
      showToast('Đã đăng xuất', 'success');
      setTimeout(() => window.location.href = '../index.html', 500);
    });
  }

  // Nếu có sidebar, kiểm tra xác thực và load user info
  if (document.getElementById('sidebar')) {
    if (!requireAuth()) return;
    loadUserInfo();
  }
});