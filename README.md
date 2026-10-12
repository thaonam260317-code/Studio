# Studio

Studio biến một đường dẫn sản phẩm thành video marketing dựng bằng code. App đọc trang, lấy màu thương hiệu, gợi ý loại video theo ma trận use case, để Claude viết kịch bản cho bạn duyệt, rồi render MP4 bằng [HyperFrames](https://github.com/heygen-com/hyperframes) và GSAP.

Ma trận use case đầy đủ (15 use case × 15 công cụ) nằm ở trang `/matrix` và trong `src/lib/matrix.ts`.

## Chạy thử

Cần Node 22+, FFmpeg và Chrome hoặc Chromium.

```bash
npm install
cp .env.example .env.local   # điền ANTHROPIC_API_KEY để Claude viết kịch bản
npm run dev                  # mở http://localhost:3000
```

Không có API key, app vẫn chạy với kịch bản dựng sẵn từ nội dung trang.

Render cả 3 template với kịch bản mẫu, không cần mạng hay API key:

```bash
npm run render:sample                          # 16:9 và 9:16, chất lượng nháp, ra thư mục renders/
npm run render:sample -- --only teaser --aspect 1:1
```

Nếu HyperFrames không tự tìm được Chrome, đặt `HYPERFRAMES_BROWSER_PATH` tới file chạy Chrome headless, hoặc chạy `npx hyperframes browser ensure`.

## Luồng làm việc

1. **Phân tích** (`POST /api/analyze`): tải trang, lấy tiêu đề, mô tả, heading, đoạn văn, số liệu và màu thương hiệu.
2. **Gợi ý** (`recommend` trong `src/lib/analyze.ts`): chọn use case trong ma trận phù hợp với những gì trang có.
3. **Kịch bản** (`POST /api/script`): Claude Opus 5.5 viết kịch bản theo schema `VideoScript`, chỉ dùng dữ kiện có trên trang. Người dùng sửa từng cảnh và số liệu trước khi render.
4. **Render** (`POST /api/jobs`): dựng một dự án HyperFrames trong `.studio/jobs/<id>/project`, chạy CLI `hyperframes render` ở tiến trình con, trả MP4 qua `GET /api/jobs/<id>/video`.

## Template

| Template | Dài | Dùng cho |
| --- | --- | --- |
| `launch-film` | 20–30 giây | Ra mắt sản phẩm: mở tên, 3–5 cảnh thông điệp, số liệu, end card |
| `teaser` | 8–12 giây | Reels, TikTok, Shorts: cắt theo lưới 120 BPM, chữ lớn, nền đổi màu |
| `stat-reveal` | 8–12 giây | Số liệu, milestone: trường điểm hút về tâm, số đếm lên trong vòng tròn |

Mỗi template là một file HTML trong `templates/<id>/index.html`, đọc kịch bản từ thẻ `<script id="studio-data">` và dựng toàn bộ chuyển động trên một timeline GSAP để HyperFrames tua từng khung. Mọi template hỗ trợ 16:9, 9:16, 1:1 và 4:5. GSAP được copy vào từng job nên render không cần mạng.

## Kiểm tra

```bash
npm test          # parser, màu thương hiệu, kịch bản dự phòng, dựng dự án
npm run typecheck
npm run build
```

## Giới hạn hiện tại

- Job render chạy trong tiến trình Next.js và lưu trên đĩa, phù hợp chạy trên một máy chủ. Khi triển khai serverless cần tách worker (HyperFrames hỗ trợ AWS Lambda).
- Chưa có nhạc, voiceover và SFX. Đây là bước tiếp theo theo ma trận (sound engine của claude-motion, word timing của product-launch-motion).
- Dựng footage, demo UI, hoạt hình explainer thuộc giai đoạn 2 và 3.

## License

MIT. HyperFrames dùng Apache-2.0, GSAP dùng [giấy phép chuẩn của GreenSock](https://gsap.com/licensing/) (miễn phí kể cả thương mại).
