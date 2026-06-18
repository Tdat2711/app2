// js/auth.js
import { getData, setData, showToast, generateId } from './utils.js';
import { KEYS, initUserData } from './data.js';
import { setCurrentUser } from './app.js';

export function register(event) {
  event.preventDefault();
  const fullname = document.getElementById('fullname')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;
  const confirm = document.getElementById('confirmPassword')?.value;

  document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));

  let valid = true;
  if (!fullname) { showError('fullnameError', 'Vui lòng nhập họ tên'); valid = false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('emailError', 'Email không hợp lệ'); valid = false; }
  if (!password || password.length < 6) { showError('passwordError', 'Mật khẩu ít nhất 6 ký tự'); valid = false; }
  if (password !== confirm) { showError('confirmError', 'Mật khẩu xác nhận không khớp'); valid = false; }
  if (!valid) return;

  const users = getData(KEYS.USERS, []);
  if (users.some(u => u.email === email)) {
    showError('emailError', 'Email đã được đăng ký');
    return;
  }

  const newUser = {
    id: generateId('USR'),
    name: fullname,
    email: email,
    password: password, // Lưu plain text (có thể mã hóa sau)
    createdAt: new Date().toISOString(),
    streak: 0,
    totalCards: 0,
    totalDecks: 0,
    totalTime: 0
  };
  users.push(newUser);
  setData(KEYS.USERS, users);

  // Khởi tạo dữ liệu rỗng cho user
  initUserData(newUser.id);

  showToast('Đăng ký thành công!', 'success');
  setTimeout(() => window.location.href = 'login.html', 1000);
}

export function login(event) {
  event.preventDefault();
  const email = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;
  if (!email || !password) {
    showToast('Vui lòng nhập đầy đủ thông tin', 'error');
    return;
  }
  const users = getData(KEYS.USERS, []);
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    showToast('Email hoặc mật khẩu không đúng', 'error');
    return;
  }
  // Lưu user không có password
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    streak: user.streak,
    totalCards: user.totalCards,
    totalDecks: user.totalDecks,
    totalTime: user.totalTime
  };
  setCurrentUser(safeUser);
  showToast('Đăng nhập thành công!', 'success');
  setTimeout(() => window.location.href = 'dashboard.html', 500);
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add('show'); }
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', login);
  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', register);
});