// js/data.js
import { setData, getData } from './utils.js';

export const KEYS = {
  USERS: 'forgetmenot_users',
  CURRENT_USER: 'forgetmenot_current_user',
  SETTINGS: 'forgetmenot_settings',
  DECKS: 'forgetmenot_decks',
  CALENDAR: 'forgetmenot_calendar',
  FRIENDS: 'forgetmenot_friends',
  GROUPS: 'forgetmenot_groups'
};

// Khởi tạo dữ liệu rỗng cho user mới
export function initUserData(userId) {
  setData(`${KEYS.DECKS}_${userId}`, []);
  setData(`${KEYS.CALENDAR}_${userId}`, { checkedDates: [], streak: 0, studyStats: {} });
  setData(`${KEYS.FRIENDS}_${userId}`, []);
  setData(`${KEYS.GROUPS}_${userId}`, []);
}

// Lấy userId hiện tại
export function getCurrentUserId() {
  const user = getData(KEYS.CURRENT_USER);
  return user ? user.id : null;
}

// Tạo key cho user
export function getUserKey(baseKey) {
  const uid = getCurrentUserId();
  return uid ? `${baseKey}_${uid}` : baseKey;
}

// --- Decks ---
export function getUserDecks() {
  const key = getUserKey(KEYS.DECKS);
  return getData(key, []);
}
export function saveUserDecks(decks) {
  const key = getUserKey(KEYS.DECKS);
  setData(key, decks);
}

// --- Calendar ---
export function getUserCalendar() {
  const key = getUserKey(KEYS.CALENDAR);
  return getData(key, { checkedDates: [], streak: 0, studyStats: {} });
}
export function saveUserCalendar(data) {
  const key = getUserKey(KEYS.CALENDAR);
  setData(key, data);
}

// --- Friends ---
export function getUserFriends() {
  const key = getUserKey(KEYS.FRIENDS);
  return getData(key, []);
}
export function saveUserFriends(friends) {
  const key = getUserKey(KEYS.FRIENDS);
  setData(key, friends);
}

// --- Groups ---
export function getUserGroups() {
  const key = getUserKey(KEYS.GROUPS);
  return getData(key, []);
}
export function saveUserGroups(groups) {
  const key = getUserKey(KEYS.GROUPS);
  setData(key, groups);
}

// --- Settings (dùng chung) ---
export function getSettings() {
  return getData(KEYS.SETTINGS, {
    darkMode: false,
    language: 'vi',
    reminder: true,
    cardsPerSession: 10,
    shareProgress: true,
    publicDecks: false
  });
}
export function saveSettings(settings) {
  setData(KEYS.SETTINGS, settings);
}