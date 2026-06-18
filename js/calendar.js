// js/calendar.js
import { showToast, formatDateKey, isToday } from './utils.js';
import { getUserCalendar, saveUserCalendar } from './data.js';

export function getCalendarData() {
  return getUserCalendar();
}

export function saveCalendarData(data) {
  saveUserCalendar(data);
}

export function renderCalendar() {
  var grid = document.getElementById('calendarGridDates');
  var header = document.getElementById('calendarHeaderTitle');
  if (!grid) return;

  var today = new Date();
  var month = today.getMonth();
  var year = today.getFullYear();
  var data = getCalendarData();

  var monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                    'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  if (header) header.textContent = monthNames[month] + ' ' + year;

  grid.innerHTML = '';
  var dayNames = ['T2','T3','T4','T5','T6','T7','CN'];
  for (var i = 0; i < dayNames.length; i++) {
    var el = document.createElement('div');
    el.className = 'calendar-day-name';
    el.textContent = dayNames[i];
    grid.appendChild(el);
  }

  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();

  for (var k = 0; k < firstDay; k++) {
    var empty = document.createElement('div');
    empty.className = 'calendar-empty';
    grid.appendChild(empty);
  }

  for (var day = 1; day <= daysInMonth; day++) {
    var elDay = document.createElement('div');
    elDay.className = 'calendar-day';
    elDay.textContent = day;
    var dateKey = year + '-' + String(month+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
    if (data.checkedDates.indexOf(dateKey) !== -1) elDay.classList.add('checked');
    if (isToday(new Date(year, month, day))) elDay.classList.add('today');
    elDay.dataset.date = dateKey;
    elDay.addEventListener('click', function() {
      showDayDetail(this.dataset.date);
    });
    grid.appendChild(elDay);
  }

  updateStreakDisplay();
}

export function updateStreakDisplay() {
  var data = getCalendarData();
  var el = document.getElementById('streakCount');
  if (el) el.textContent = data.streak || 0;
  var banner = document.getElementById('streakCountBanner');
  if (banner) banner.textContent = data.streak || 0;
}

export function showDayDetail(dateKey) {
  var data = getCalendarData();
  var stats = data.studyStats[dateKey] || { decks: 0, cards: 0, time: 0 };
  var elDate = document.getElementById('detailDate');
  var elCheckin = document.getElementById('detailCheckin');
  var elDecks = document.getElementById('detailDecks');
  var elCards = document.getElementById('detailCards');
  var elTime = document.getElementById('detailTime');
  if (elDate) elDate.textContent = dateKey;
  if (elCheckin) {
    var checked = data.checkedDates.indexOf(dateKey) !== -1;
    elCheckin.textContent = checked ? '✅ Đã điểm danh' : '⏳ Chưa điểm danh';
    elCheckin.style.color = checked ? 'var(--success)' : 'var(--text-gray)';
  }
  if (elDecks) elDecks.textContent = stats.decks || 0;
  if (elCards) elCards.textContent = stats.cards || 0;
  if (elTime) elTime.textContent = (stats.time || 0) + ' phút';
}

export function triggerStreakCheckin() {
  var today = new Date();
  var dateKey = formatDateKey(today);
  var data = getCalendarData();

  if (data.checkedDates.indexOf(dateKey) !== -1) {
    showToast('Hôm nay bạn đã điểm danh rồi! 🔥', 'warning');
    return;
  }

  var yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  var yesterdayKey = formatDateKey(yesterday);
  var isConsecutive = data.checkedDates.indexOf(yesterdayKey) !== -1 || data.checkedDates.length === 0;

  data.checkedDates.push(dateKey);
  data.streak = isConsecutive ? (data.streak || 0) + 1 : 1;

  if (!data.studyStats[dateKey]) {
    data.studyStats[dateKey] = { decks: 0, cards: 0, time: 0 };
  }
  data.studyStats[dateKey].time = (data.studyStats[dateKey].time || 0) + 5;

  saveCalendarData(data);
  renderCalendar();
  showToast('Điểm danh thành công! 🔥 Streak: ' + data.streak + ' ngày', 'success');
}

var currentMonth = new Date().getMonth();
var currentYear = new Date().getFullYear();

export function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendarWithMonth(currentMonth, currentYear);
}

function renderCalendarWithMonth(month, year) {
  var grid = document.getElementById('calendarGridDates');
  var header = document.getElementById('calendarHeaderTitle');
  if (!grid) return;

  var monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                    'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  if (header) header.textContent = monthNames[month] + ' ' + year;

  grid.innerHTML = '';
  var dayNames = ['T2','T3','T4','T5','T6','T7','CN'];
  for (var i = 0; i < dayNames.length; i++) {
    var el = document.createElement('div');
    el.className = 'calendar-day-name';
    el.textContent = dayNames[i];
    grid.appendChild(el);
  }

  var data = getCalendarData();
  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();

  for (var k = 0; k < firstDay; k++) {
    var empty = document.createElement('div');
    empty.className = 'calendar-empty';
    grid.appendChild(empty);
  }

  var today = new Date();
  for (var day = 1; day <= daysInMonth; day++) {
    var elDay = document.createElement('div');
    elDay.className = 'calendar-day';
    elDay.textContent = day;
    var dateKey = year + '-' + String(month+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
    if (data.checkedDates.indexOf(dateKey) !== -1) elDay.classList.add('checked');
    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      elDay.classList.add('today');
    }
    elDay.dataset.date = dateKey;
    elDay.addEventListener('click', function() {
      showDayDetail(this.dataset.date);
    });
    grid.appendChild(elDay);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('calendarGridDates')) {
    renderCalendar();
    var prevBtn = document.getElementById('prevMonth');
    if (prevBtn) prevBtn.addEventListener('click', function() { changeMonth(-1); });
    var nextBtn = document.getElementById('nextMonth');
    if (nextBtn) nextBtn.addEventListener('click', function() { changeMonth(1); });
    var checkBtn = document.getElementById('btnStreakCheck');
    if (checkBtn) checkBtn.addEventListener('click', triggerStreakCheckin);
  }
});