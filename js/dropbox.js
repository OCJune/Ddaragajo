// 드롭다운 선택 및 토글, 바깥 클릭 시 닫힘
const selects = document.querySelectorAll(".custom-select");

selects.forEach((select) => {
  const btn = select.querySelector(".custom-select__selected");
  const textSpan = btn.querySelector(".custom-select__selected-text");
  const list = select.querySelector(".custom-select__options");

  // 드롭다운 열기/닫기 (토글)
  btn.onclick = (e) => {
    e.stopPropagation();
    selects.forEach((s) => {
      if (s !== select) s.classList.remove("active");
    });
    select.classList.toggle("active");
  };

  // 옵션 선택 시 버튼 텍스트 변경 및 닫기
  list.querySelectorAll("li").forEach((li) => {
    li.onclick = (e) => {
      textSpan.innerText = li.innerText;
      select.classList.remove("active");
    };
  });
});

// 바깥 클릭 시 모든 드롭다운 닫기
document.addEventListener("click", () => {
  document
    .querySelectorAll(".custom-select")
    .forEach((s) => s.classList.remove("active"));
});
