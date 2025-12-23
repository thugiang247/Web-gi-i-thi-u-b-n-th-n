# Giới thiệu App

Đây là một trang web portfolio cá nhân của Minh, với chủ đề "Garage × Code". Trang web giới thiệu về bản thân Minh, một chàng trai Gen Z với sở thích sửa xe, đọc sách, học lập trình và các hoạt động khác. Trang web được xây dựng bằng HTML, CSS và JavaScript, với các hiệu ứng động như parallax scroll, dark mode tự động, và animation fade-in khi cuộn.

Cấu trúc trang bao gồm:
- **Hero Section**: Giới thiệu với tiêu đề và biểu tượng xoay vòng.
- **About Section**: Hồ sơ cá nhân và thông số kỹ thuật (specs) về các sở thích.
- **Gallery Section**: Hành trình với hình ảnh và mô tả.
- **CTA Section**: Lời mời kết nối.
- **Contact Section**: Thông tin liên hệ.

Trang web sử dụng Font Awesome cho icon, Google Fonts cho typography, và các hiệu ứng JavaScript để tăng tính tương tác.

# Danh sách File JS

- `scripts/main.js`: File chính, import và khởi tạo các module khác, xử lý logic Easter Egg.
- `scripts/darkMode.js`: Xử lý chế độ tối dựa trên cài đặt hệ thống.
- `scripts/intersectionObserver.js`: Thêm animation fade-in khi các phần tử vào viewport.
- `scripts/parallaxScroll.js`: Tạo hiệu ứng parallax cho background lưới.

# Từng Hàm Trong Mỗi File

## scripts/main.js
- `initDarkMode()`: (imported from darkMode.js) Khởi tạo chế độ tối.
- `initParallaxScroll()`: (imported from parallaxScroll.js) Khởi tạo hiệu ứng parallax.
- `initIntersectionObserver()`: (imported from intersectionObserver.js) Khởi tạo observer cho animation.
- Hàm ẩn danh trong `addEventListener('DOMContentLoaded', ...)`: Xử lý logic Easter Egg cho icon wrench (click 5 lần để hiển thị message).

## scripts/darkMode.js
- `initDarkMode()`: Lắng nghe thay đổi prefers-color-scheme và thêm/xóa class 'dark' cho documentElement.

## scripts/intersectionObserver.js
- `initIntersectionObserver()`: Tạo IntersectionObserver để fade-in các element .intro-card, .spec-card, .gallery-item khi chúng vào viewport.

## scripts/parallaxScroll.js
- `initParallaxScroll()`: Lắng nghe sự kiện scroll và di chuyển .grid-bg với tốc độ 0.5 lần scroll.

# Notes Cho Developer

- **Chạy app**: Đây là trang web tĩnh, có thể mở trực tiếp index.html trong browser. Tuy nhiên, do sử dụng ES modules, cần server local để tránh CORS issues (ví dụ: dùng `python -m http.server` hoặc VS Code Live Server).
- **Dependencies**: 
  - Font Awesome từ CDN.
  - Google Fonts.
  - Không có thư viện JS ngoài, chỉ dùng vanilla JS với ES6 modules.
- **Cấu trúc**: JS được modular hóa, mỗi file xử lý một chức năng riêng. main.js là entry point.
- **Easter Egg**: Click icon wrench 5 lần để hiển thị message (cần có element #easterEggMessage trong HTML, nhưng có thể chưa có).
- **Responsive**: Sử dụng CSS cho responsive, nhưng cần kiểm tra trên mobile.
- **Performance**: Hình ảnh lazy load, animation mượt mà.
- **Customization**: Để thêm tính năng mới, tạo module mới trong scripts/ và import vào main.js.
- **Dark Mode**: Tự động theo system preference, không có toggle manual.
- **Browser Support**: Sử dụng modern APIs như IntersectionObserver, matchMedia, nên cần polyfill cho browser cũ nếu cần.