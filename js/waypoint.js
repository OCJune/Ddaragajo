document.addEventListener("DOMContentLoaded", () => {
  const plusBtn = document.querySelector(".plus-btn");
  const inputContainer = document.querySelector(".input-container");

  // 입력창 생성 함수
  function createInputRow({ value = "", role = "waypoint", index = 0 }) {
    const div = document.createElement("div");
    div.className = "input-row";
    let iconHTML;

    if (role === "start") iconHTML = `<div class="dot-icon"></div>`;
    else if (role === "end") iconHTML = `<i class="fa-solid fa-location-dot fa-lg"></i>`;
    else iconHTML = `<span class="waypoint-number">${index}</span>`;

    const placeholder =
      role === "start"
        ? "출발지 입력"
        : role === "end"
        ? "도착지 입력"
        : "경유지 입력";

    const resultBoxHTML = '<div class="result-box"></div>';

    div.innerHTML = `
      <div class="icon-bg">${iconHTML}</div>
      <div class="input-field">
        <i class="fa-solid fa-magnifying-glass fa-lg"></i>
        <input 
          type="text" 
          placeholder="${placeholder}" 
          value="${value}"
          ${role === "start" ? 'id="departure-input"' : ''}
          ${role === "end" ? 'id="arrival-input"' : ''}
        />
        ${resultBoxHTML}
        <div class="icon-group">
          <i class="fa-solid fa-arrow-up move-up"></i>
          <i class="fa-solid fa-arrow-down move-down"></i>
          <i class="fa-solid fa-eraser remove-waypoint"></i>
        </div>
      </div>
    `;
    return div;
  }

  // 출발지,도착지,경유지 각 입력창에 자동 지정정
  function updateRowUI() {
    const rows = inputContainer.querySelectorAll(".input-row");

    rows.forEach((row, idx) => {
      let role = "waypoint";
      if (idx === 0) role = "start";
      else if (idx === rows.length - 1) role = "end";

      row.setAttribute("data-role", role);

      // 아이콘 설정
      const iconBg = row.querySelector(".icon-bg");
      if (role === "start") iconBg.innerHTML = `<div class="dot-icon"></div>`;
      else if (role === "end") iconBg.innerHTML = `<i class="fa-solid fa-location-dot fa-lg"></i>`;
      else iconBg.innerHTML = `<span class="waypoint-number">${idx}</span>`;

      // placeholder 갱신
      const input = row.querySelector("input");
      if (role === "start") input.setAttribute("placeholder", "출발지 입력");
      else if (role === "end") input.setAttribute("placeholder", "도착지 입력");
      else input.setAttribute("placeholder", "경유지 입력");

      // 버튼 비활성화 제어
      const removeBtn = row.querySelector(".remove-waypoint");
      const upBtn = row.querySelector(".move-up");
      const downBtn = row.querySelector(".move-down");

      if (removeBtn && upBtn && downBtn) {
        removeBtn.classList.remove("icon-disabled");
        upBtn.classList.remove("icon-disabled");
        downBtn.classList.remove("icon-disabled");

        if (rows.length <= 2) removeBtn.classList.add("icon-disabled");
        if (idx === 0) upBtn.classList.add("icon-disabled");
        if (idx === rows.length - 1) downBtn.classList.add("icon-disabled");
      }
    });
  }

  // 초기 입력창 2개 (출발지, 도착지) 설정
  function initRows() {
    inputContainer.innerHTML = "";
    inputContainer.appendChild(createInputRow({ role: "start", index: 0 }));
    inputContainer.appendChild(createInputRow({ role: "end", index: 1 }));
  }

  // 초기 실행
  initRows();
  updateRowUI();

  // + 버튼 클릭 시 경유지 추가
  plusBtn.addEventListener("click", () => {
    const rows = inputContainer.querySelectorAll(".input-row");
    const newRow = createInputRow({
      value: "",
      role: "waypoint",
      index: rows.length - 1,
    });
    inputContainer.insertBefore(newRow, rows[rows.length - 1]); // 도착지 위에 삽입
    updateRowUI();
  });

  // 아이콘 클릭 이벤트 처리 (삭제, 위/아래 이동)
  inputContainer.addEventListener("click", (e) => {
    const btn = e.target;
    const row = btn.closest(".input-row");
    const rows = Array.from(inputContainer.querySelectorAll(".input-row"));
    const idx = rows.indexOf(row);

    if (!row || idx === -1) return;

    // 삭제
    if (btn.classList.contains("remove-waypoint") && !btn.classList.contains("icon-disabled")) {
      if (rows.length > 2) {
        inputContainer.removeChild(row);
        updateRowUI();
      }
      return;
    }

    // 아래로 이동
    if (btn.classList.contains("move-down") && !btn.classList.contains("icon-disabled")) {
      if (idx < rows.length - 1) {
        const inputA = row.querySelector("input");
        const inputB = rows[idx + 1].querySelector("input");
        [inputA.value, inputB.value] = [inputB.value, inputA.value];
        updateRowUI();
      }
      return;
    }

    // 위로 이동
    if (btn.classList.contains("move-up") && !btn.classList.contains("icon-disabled")) {
      if (idx > 0) {
        const inputA = row.querySelector("input");
        const inputB = rows[idx - 1].querySelector("input");
        [inputA.value, inputB.value] = [inputB.value, inputA.value];
        updateRowUI();
      }
      return;
    }
  });
});
