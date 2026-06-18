// js/main.js

// ============================================================
//  DARK MODE TOÀN CỤC (không phụ thuộc i18n)
// ============================================================
function applyGlobalDarkMode() {
  try {
    const settings = JSON.parse(localStorage.getItem('forgetmenot_settings') || '{}');
    const isDark = settings.darkMode || false;
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  } catch (e) {
    // Bỏ qua lỗi
  }
}

// ============================================================
//  KHỞI TẠO TRANG
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  // ---- Loading screen ----
  const loading = document.getElementById('loadingScreen');
  if (loading) {
    setTimeout(() => {
      loading.style.opacity = '0';
      setTimeout(() => loading.style.display = 'none', 500);
    }, 500);
  }

  // ---- Navbar scroll ----
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // ---- Mobile menu ----
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');
  const navButtons = document.getElementById('navButtons');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      navMenu?.classList.toggle('active');
      navButtons?.classList.toggle('active');
    });
  }

  // ---- Smooth scroll ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ---- Áp dụng dark mode khi tải trang ----
  applyGlobalDarkMode();
});

// ============================================================
//  ĐỒNG BỘ DARK MODE KHI THAY ĐỔI TỪ TAB KHÁC
// ============================================================
window.addEventListener('storage', function(e) {
  if (e.key === 'forgetmenot_settings') {
    applyGlobalDarkMode();
  }
});