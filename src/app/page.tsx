import StudioFlow from "./studio-flow";

export default function Home() {
  return (
    <>
      <div>
        <h1>Từ một đường dẫn đến video marketing</h1>
        <p className="muted">Dán link sản phẩm. Studio đọc trang, lấy màu thương hiệu, gợi ý loại video theo ma trận use case, để Claude viết kịch bản cho bạn duyệt, rồi render bằng HyperFrames.</p>
      </div>
      <StudioFlow />
    </>
  );
}
