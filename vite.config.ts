import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  // 👇 THÊM PHẦN NÀY ĐỂ FIX LỖI VERCEL VÀ ẨN CODE
  build: {
    outDir: 'build',   // Đổi tên thư mục xuất ra từ 'dist' thành 'build' cho Vercel hiểu
    sourcemap: false,  // Tắt tạo file map để ẩn source code
    minify: 'esbuild', // Nén code gọn nhẹ
  },
})