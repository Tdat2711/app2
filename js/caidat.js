// js/caidat.js
import { getSettings, saveSettings } from './data.js';
import { showToast } from './utils.js';

function loadSettings() {
  return getSettings();
}

function saveSettingsData(settings) {
  saveSettings(settings);
}

function applySettings(settings) {
  document.getElementById('darkModeToggle').checked = settings.darkMode || false;
  document.getElementById('languageSelect').value = settings.language || 'vi';
  document.getElementById('reminderToggle').checked = settings.reminder !== false;
  document.getElementById('cardsPerSession').value = settings.cardsPerSession || 10;
  document.getElementById('shareProgress').checked = settings.shareProgress !== false;
  document.getElementById('publicDecks').checked = settings.publicDecks || false;
}

function getSettingsFromUI() {
  return {
    darkMode: document.getElementById('darkModeToggle').checked,
    language: document.getElementById('languageSelect').value,
    reminder: document.getElementById('reminderToggle').checked,
    cardsPerSession: parseInt(document.getElementById('cardsPerSession').value),
    shareProgress: document.getElementById('shareProgress').checked,
    publicDecks: document.getElementById('publicDecks').checked
  };
}

function applyDarkMode(isDark) {
  if (isDark) {
    document.documentElement.style.setProperty('--bg-main', '#0f172a');
    document.documentElement.style.setProperty('--bg-light', '#1e293b');
    document.documentElement.style.setProperty('--text-dark', '#f1f5f9');
    document.documentElement.style.setProperty('--text-gray', '#94a3b8');
    document.documentElement.style.setProperty('--border', '#334155');
    document.documentElement.style.setProperty('--white', '#1e293b');
  } else {
    document.documentElement.style.setProperty('--bg-main', '#f8fafc');
    document.documentElement.style.setProperty('--bg-light', '#f1f5f9');
    document.documentElement.style.setProperty('--text-dark', '#0f172a');
    document.documentElement.style.setProperty('--text-gray', '#64748b');
    document.documentElement.style.setProperty('--border', '#e2e8f0');
    document.documentElement.style.setProperty('--white', '#ffffff');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('darkModeToggle')) {
    var settings = loadSettings();
    applySettings(settings);
    applyDarkMode(settings.darkMode);

    document.getElementById('darkModeToggle').addEventListener('change', function() {
      applyDarkMode(this.checked);
    });

    document.getElementById('saveSettings').addEventListener('click', function() {
      var newSettings = getSettingsFromUI();
      saveSettingsData(newSettings);
      showToast('Đã lưu cài đặt thành công!', 'success');
    });
  }
});