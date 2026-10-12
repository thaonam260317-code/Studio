// Bộ công cụ nhỏ dùng chung: đọc dữ liệu kịch bản, tách chữ, đếm số. Mọi chuyển động đều nằm trên timeline GSAP để tua được.
window.Studio = {
  data: JSON.parse(document.getElementById("studio-data").textContent),
  el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  },
  /** Bọc từng từ trong mặt nạ để lộ chữ từ dưới chân dòng. Trả về danh sách .word. */
  words(target, text) {
    target.textContent = "";
    const out = [];
    text.split(/\s+/).filter(Boolean).forEach((w, i, arr) => {
      const mask = this.el("span", "word-mask");
      const inner = this.el("span", "word", w);
      mask.appendChild(inner);
      target.appendChild(mask);
      if (i < arr.length - 1) target.appendChild(document.createTextNode(" "));
      out.push(inner);
    });
    return out;
  },
  /** Định dạng số theo giá trị đích, giữ đúng số chữ số thập phân. */
  format(value, target) {
    const decimals = Number.isInteger(target) ? 0 : Math.min(2, (String(target).split(".")[1] || "").length);
    return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  },
  /** Thêm tween đếm số vào timeline. Giá trị được tính từ thời gian nên tua tới đâu cũng đúng. */
  counter(tl, node, stat, at, duration) {
    const state = { v: 0 };
    node.textContent = (stat.prefix || "") + this.format(0, stat.value) + (stat.suffix || "");
    tl.to(state, {
      v: stat.value,
      duration,
      ease: "power3.out",
      onUpdate: () => { node.textContent = (stat.prefix || "") + this.format(state.v, stat.value) + (stat.suffix || ""); },
    }, at);
  },
};
