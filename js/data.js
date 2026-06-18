// js/data.js
import { setData, getData } from './utils.js';

// ============================================================
//  KEYS
// ============================================================
export const KEYS = {
  USERS: 'forgetmenot_users',
  CURRENT_USER: 'forgetmenot_current_user',
  SETTINGS: 'forgetmenot_settings',
  DECKS: 'forgetmenot_decks',
  CALENDAR: 'forgetmenot_calendar',
  FRIENDS: 'forgetmenot_friends',
  GROUPS: 'forgetmenot_groups'
};

// ============================================================
//  USER ID HELPERS
// ============================================================
export function getCurrentUserId() {
  const user = getData(KEYS.CURRENT_USER);
  return user ? user.id : null;
}

export function getUserKey(baseKey) {
  const uid = getCurrentUserId();
  return uid ? `${baseKey}_${uid}` : baseKey;
}

// ============================================================
//  INIT NEW USER DATA
// ============================================================
export function initUserData(userId) {
  setData(`${KEYS.DECKS}_${userId}`, []);
  setData(`${KEYS.CALENDAR}_${userId}`, { checkedDates: [], streak: 0, studyStats: {} });
  setData(`${KEYS.FRIENDS}_${userId}`, []);
  setData(`${KEYS.GROUPS}_${userId}`, []);
}

// ============================================================
//  DECKS
// ============================================================
export function getUserDecks() {
  const key = getUserKey(KEYS.DECKS);
  return getData(key, []);
}
export function saveUserDecks(decks) {
  const key = getUserKey(KEYS.DECKS);
  setData(key, decks);
}
export function getDecks() {
  return getUserDecks();
}
export function saveDecks(decks) {
  saveUserDecks(decks);
}
export function addDeck(deck) {
  const decks = getUserDecks();
  deck.id = deck.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
  deck.createdAt = deck.createdAt || new Date().toISOString();
  deck.updatedAt = new Date().toISOString();
  decks.push(deck);
  saveUserDecks(decks);
  return deck;
}
export function getRecentDecks(limit = 5) {
  const decks = getUserDecks();
  return decks
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, limit);
}
export function getTotalCards() {
  const decks = getUserDecks();
  return decks.reduce((total, deck) => total + (deck.cards ? deck.cards.length : 0), 0);
}

// ============================================================
//  CALENDAR
// ============================================================
export function getUserCalendar() {
  const key = getUserKey(KEYS.CALENDAR);
  return getData(key, { checkedDates: [], streak: 0, studyStats: {} });
}
export function saveUserCalendar(calendarData) {
  const key = getUserKey(KEYS.CALENDAR);
  setData(key, calendarData);
}

// ============================================================
//  FRIENDS
// ============================================================
export function getUserFriends() {
  const key = getUserKey(KEYS.FRIENDS);
  return getData(key, []);
}
export function saveUserFriends(friends) {
  const key = getUserKey(KEYS.FRIENDS);
  setData(key, friends);
}

// ============================================================
//  GROUPS
// ============================================================
export function getUserGroups() {
  const key = getUserKey(KEYS.GROUPS);
  return getData(key, []);
}
export function saveUserGroups(groups) {
  const key = getUserKey(KEYS.GROUPS);
  setData(key, groups);
}

// ============================================================
//  SETTINGS (dùng chung cho toàn bộ ứng dụng)
// ============================================================
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

// ============================================================
//  TỔNG THỜI GIAN HỌC (tính từ calendar)
// ============================================================
export function getTotalStudyTime() {
  const calendar = getUserCalendar();
  const stats = calendar.studyStats || {};
  let total = 0;
  for (const key in stats) {
    total += stats[key].time || 0;
  }
  return total;
}

// ============================================================
//  (TÙY CHỌN) ĐỒNG BỘ VỚI CÁCH LƯU CŨ (nếu có code cũ dùng STORAGE_KEY)
//  KHÔNG CẦN THIẾT, NHƯNG GIỮ ĐỂ TƯƠNG THÍCH NGƯỢC
// ============================================================
// Nếu bạn có file khác vẫn dùng `getAppData()` hoặc `saveAppData()`,
// hãy thêm chúng để chuyển tiếp sang hệ thống mới.
export function getAppData() {
  // Trả về object tổng hợp từ các nguồn
  return {
    decks: getUserDecks(),
    checkedDates: getUserCalendar().checkedDates,
    streak: getUserCalendar().streak,
    studyStats: getUserCalendar().studyStats,
    friends: getUserFriends(),
    groups: getUserGroups()
  };
}

export function saveAppData(data) {
  if (data.decks !== undefined) saveUserDecks(data.decks);
  if (data.checkedDates !== undefined || data.streak !== undefined || data.studyStats !== undefined) {
    saveUserCalendar({
      checkedDates: data.checkedDates || getUserCalendar().checkedDates,
      streak: data.streak || getUserCalendar().streak,
      studyStats: data.studyStats || getUserCalendar().studyStats
    });
  }
  if (data.friends !== undefined) saveUserFriends(data.friends);
  if (data.groups !== undefined) saveUserGroups(data.groups);
}