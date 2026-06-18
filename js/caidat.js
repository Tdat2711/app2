// js/caidat.js
import { getSettings, saveSettings } from './data.js';
import { showToast } from './utils.js';
import { getCurrentUser, logout, deleteAccount, updateUserProfile } from './app.js';

let currentUser = null;

// DOM refs
const darkModeToggle = document.getElementById('darkModeToggle');
const languageSelect = document.getElementById('languageSelect');
const reminderToggle = document.getElementById('reminderToggle');
const dueDateToggle = document.getElementById('dueDateToggle');
const achievementToggle = document.getElementById('achievementToggle');
const communityToggle = document.getElementById('communityToggle');
const emailToggle = document.getElementById('emailToggle');
const soundToggle = document.getElementById('soundToggle');
const twoFactorToggle = document.getElementById('twoFactorToggle');
const displayNameInput = document.getElementById('displayNameInput');
const emailInput = document.getElementById('emailInput');
const joinDateInput = document.getElementById('joinDateInput');
const avatarDisplay = document.getElementById('avatarDisplay');
const saveBtn = document.getElementById('saveSettings');
const logoutAllBtn = document.getElementById('logoutAllBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const changePasswordBtn2 = document.getElementById('changePasswordBtn2');
const manageSessionsBtn = document.getElementById('manageSessionsBtn');
const manageSessionsBtn2 = document.getElementById('manageSessionsBtn2');
const changeAvatarBtn = document.getElementById('changeAvatarBtn');
const displayNameLabel = document.getElementById('displayNameLabel');
const emailLabel = document.getElementById('emailLabel');
const joinDateLabel = document.getElementById('joinDateLabel');

// Dark mode apply
function applyDarkMode(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }
}

// Load user info
function loadUserInfo() {
  currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }
  const displayName = currentUser.displayName || currentUser.name || 'Người Dùng';
  displayNameLabel.textContent = displayName;
  displayNameInput.value = displayName;

  emailLabel.textContent = currentUser.email || '';
  emailInput.value = currentUser.email || '';

  const joinDate = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('vi-VN')
    : '--/--/----';
  joinDateLabel.textContent = joinDate;
  joinDateInput.value = joinDate;

  if (currentUser.avatar) {
    avatarDisplay.innerHTML = `<img src="${currentUser.avatar}" alt="Avatar" />`;
  } else {
    avatarDisplay.innerHTML = `<i class="fas fa-user"></i>`;
  }
}

// Load settings
function loadSettings() {
  const settings = getSettings();
  darkModeToggle.checked = settings.darkMode || false;
  applyDarkMode(settings.darkMode);

  languageSelect.value = settings.language || 'vi';
  reminderToggle.checked = settings.reminder !== false;
  dueDateToggle.checked = settings.dueDate !== false;
  achievementToggle.checked = settings.achievement !== false;
  communityToggle.checked = settings.community || false;
  emailToggle.checked = settings.email || false;
  soundToggle.checked = settings.sound !== false;
  twoFactorToggle.checked = settings.twoFactor || false;
}

// Save settings
function saveSettingsData() {
  const settings = {
    darkMode: darkModeToggle.checked,
    language: languageSelect.value,
    reminder: reminderToggle.checked,
    dueDate: dueDateToggle.checked,
    achievement: achievementToggle.checked,
    community: communityToggle.checked,
    email: emailToggle.checked,
    sound: soundToggle.checked,
    twoFactor: twoFactorToggle.checked,
  };
  saveSettings(settings);
  applyDarkMode(settings.darkMode);

  // Update display name
  const newDisplayName = displayNameInput.value.trim();
  if (newDisplayName && newDisplayName !== (currentUser.displayName || currentUser.name)) {
    updateUserProfile({ displayName: newDisplayName });
    currentUser.displayName = newDisplayName;
    displayNameLabel.textContent = newDisplayName;
  }

  showToast('Đã lưu cài đặt!', 'success');
}

// Tabs
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = {
    general: document.getElementById('tab-general'),
    notifications: document.getElementById('tab-notifications'),
    security: document.getElementById('tab-security'),
    account: document.getElementById('tab-account'),
  };
  tabs.forEach((tab) => {
    tab.addEventListener('click', function () {
      tabs.forEach((t) => t.classList.remove('active'));
      this.classList.add('active');
      Object.values(contents).forEach((content) => {
        if (content) content.classList.remove('active');
      });
      const target = this.dataset.tab;
      if (contents[target]) contents[target].classList.add('active');
    });
  });
}

// Event handlers
function handleLogoutAll() {
  if (confirm('Bạn có chắc muốn đăng xuất khỏi tất cả thiết bị?')) {
    localStorage.removeItem('authToken');
    showToast('Đã đăng xuất tất cả', 'info');
    window.location.href = 'login.html';
  }
}
function handleDeleteAccount() {
  if (confirm('Bạn có chắc muốn xóa tài khoản? Hành động này không thể hoàn tác!')) {
    if (confirm('Xác nhận xóa tài khoản?')) {
      deleteAccount();
      setTimeout(() => (window.location.href = 'login.html'), 1500);
    }
  }
}
function handleChangePassword() {
  showToast('Chức năng đang phát triển', 'info');
}
function handleManageSessions() {
  showToast('Chức năng đang phát triển', 'info');
}
function handleChangeAvatar() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      const avatarData = ev.target.result;
      avatarDisplay.innerHTML = `<img src="${avatarData}" alt="Avatar" />`;
      updateUserProfile({ avatar: avatarData });
      currentUser.avatar = avatarData;
      showToast('Đã cập nhật ảnh đại diện', 'success');
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// Init
document.addEventListener('DOMContentLoaded', function () {
  if (!document.getElementById('darkModeToggle')) return;
  loadUserInfo();
  loadSettings();
  initTabs();

  darkModeToggle.addEventListener('change', function () {
    applyDarkMode(this.checked);
    const settings = getSettings();
    settings.darkMode = this.checked;
    saveSettings(settings);
  });

  languageSelect.addEventListener('change', function () {
    const lang = this.value;
    const settings = getSettings();
    settings.language = lang;
    saveSettings(settings);
    showToast('Đã đổi ngôn ngữ', 'success');
  });

  saveBtn.addEventListener('click', saveSettingsData);
  logoutAllBtn.addEventListener('click', handleLogoutAll);
  deleteAccountBtn.addEventListener('click', handleDeleteAccount);
  changePasswordBtn.addEventListener('click', handleChangePassword);
  changePasswordBtn2.addEventListener('click', handleChangePassword);
  manageSessionsBtn.addEventListener('click', handleManageSessions);
  manageSessionsBtn2.addEventListener('click', handleManageSessions);
  changeAvatarBtn.addEventListener('click', handleChangeAvatar);
});