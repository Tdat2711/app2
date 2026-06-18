// js/sidebar.js
(function() {
  const STORAGE_KEY = 'sidebarCollapsed';

  function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    if (!sidebar || !toggleBtn) return;

    // Khôi phục trạng thái từ localStorage (chỉ trên desktop)
    if (window.innerWidth > 768) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'true') {
        sidebar.classList.add('collapsed');
      } else {
        sidebar.classList.remove('collapsed');
      }
    } else {
      // Trên mobile, luôn mở rộng khi hiển thị (không collapsed)
      sidebar.classList.remove('collapsed');
    }

    // Xử lý sự kiện click toggle
    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (window.innerWidth <= 768) {
        // Mobile: toggle class 'open'
        sidebar.classList.toggle('open');
        return;
      }
      // Desktop: toggle collapsed
      const isCollapsed = sidebar.classList.toggle('collapsed');
      localStorage.setItem(STORAGE_KEY, isCollapsed);
      // Broadcast để đồng bộ các tab
      if (window.BroadcastChannel) {
        const channel = new BroadcastChannel('forgetmenot_channel');
        channel.postMessage({ sidebarCollapsed: isCollapsed });
      }
    });

    // Đóng sidebar khi click ra ngoài (mobile)
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 768) {
        if (sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            e.target !== toggleBtn) {
          sidebar.classList.remove('open');
        }
      }
    });

    // Lắng nghe thay đổi từ tab khác (BroadcastChannel)
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel('forgetmenot_channel');
      channel.onmessage = function(e) {
        if (e.data && typeof e.data.sidebarCollapsed !== 'undefined') {
          if (window.innerWidth > 768) {
            if (e.data.sidebarCollapsed) {
              sidebar.classList.add('collapsed');
            } else {
              sidebar.classList.remove('collapsed');
            }
          }
        }
      };
    }

    // Đồng bộ khi storage thay đổi (trong cùng tab hoặc tab khác)
    window.addEventListener('storage', function(e) {
      if (e.key === STORAGE_KEY && window.innerWidth > 768) {
        if (e.newValue === 'true') {
          sidebar.classList.add('collapsed');
        } else {
          sidebar.classList.remove('collapsed');
        }
      }
    });

    // Khi resize window, nếu chuyển từ desktop sang mobile,
    // loại bỏ class collapsed để hiển thị đầy đủ (nhưng vẫn giữ trạng thái trong localStorage)
    window.addEventListener('resize', function() {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('collapsed');
        // Không mở tự động, giữ trạng thái open do người dùng
      } else {
        // Khi chuyển sang desktop, áp dụng lại trạng thái từ localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'true') {
          sidebar.classList.add('collapsed');
        } else {
          sidebar.classList.remove('collapsed');
        }
        // Đảm bảo đóng mobile nếu đang mở
        if (sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
  } else {
    initSidebar();
  }
})();