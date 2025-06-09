// 전체 팝업 동작 스크립트

window.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popupOverlay");
  const closeBtn = document.getElementById("closePopupBtn");

  // 상세보기 버튼 클릭 → 팝업 열기 + 데이터 채우기
  document.addEventListener("click", (e) => {
    if (e.target.matches('[data-role="open-popup"]')) {
      const index = e.target.dataset.index;
      if (index !== undefined && window.allRoutes) {
        const routeData = window.allRoutes[parseInt(index)];
        if (routeData) {
          populatePopup(routeData);
        }
      }
      popup.style.display = "block";
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      popup.style.display = "none";
    });
  }
});

// 현재 팝업에서 보여주는 route 저장용
let currentPopupRoute = null;

function populatePopup(route) {
  const stepLine = document.querySelector(".step-line");
  const popupList = document.querySelector(".popup-list");
  const popupTime = document.querySelector(".popup-time");

  currentPopupRoute = route;
  const total = route.steps.length;

  popupTime.textContent = `${route.totalTime}분`;
  stepLine.innerHTML = "";
  popupList.innerHTML = "";

  route.steps.forEach((step, i) => {
    const isLast = i === total - 1;
    const leftPercent = total > 1 ? (i / (total - 1)) * 90 + 5 : 50;

    // step 위에 dot + label 표시
    stepLine.innerHTML += `
      <div class="dot-wrapper" style="left: ${leftPercent}%">
        <div class="step ${isLast ? "end" : ""}">
          ${isLast ? '<i class="fa-solid fa-location-dot"></i>' : i + 1}
        </div>
        <div class="dot-label">${step.name}</div>
      </div>
    `;

    if (!isLast) {
      stepLine.innerHTML += `<div class="progress"></div>`;
    }

    // 하차 구분
    const prevStep = route.steps[i - 1];
    const isTransitPair =
      (step.type === "BUS_STATION" && prevStep?.type === "BUS_STATION") ||
      (step.type === "SUBWAY_STATION" && prevStep?.type === "SUBWAY_STATION");

    // 이동 설명 텍스트
    const moveText = isLast
      ? " 도착"
      : isTransitPair
        ? "에서 하차"
        : makeMoveText(step);

    // 아이콘 설정
    let iconClass = "fa-arrow-up";
    const mode = step.transportInfo?.mode;

    if (isLast) {
      iconClass = "fa-location-dot";
    } else if (mode === "walking") {
      iconClass = "fa-person-walking";
    } else if (mode === "bus") {
      iconClass = "fa-bus";
    } else if (mode === "subway") {
      iconClass = "fa-train-subway";
    }

    popupList.innerHTML += `
      <li>
        <i class="fa-solid ${iconClass}"></i>
        <span><strong>${step.name}</strong>${moveText}</span>
      </li>
    `;
  });

  attachStepClickEvent();
}



function makeMoveText(step) {
  const mode = step.transportInfo?.mode || "";
  const lineName = step.transportInfo?.lineName || "";

  if (mode === "walking") {
    return "에서 걸어서 이동";
  }

  if (mode === "bus") {
    return lineName
      ? `에서 ${lineName}번 버스로 이동`
      : `에서 버스로 이동`;
  }

  if (mode === "subway") {
    return lineName
      ? `에서 ${lineName} 지하철로 이동`
      : `에서 지하철로 이동`;
  }

  return "으로 이동"; // fallback
}


// 드래그 기능
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let clickPrevented = false;

window.addEventListener("DOMContentLoaded", () => {
  const popupBox = document.querySelector(".popup-box");
  const header = popupBox.querySelector(".popup-header");

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    clickPrevented = false;
    dragOffset.x = e.clientX - popupBox.offsetLeft;
    dragOffset.y = e.clientY - popupBox.offsetTop;
    popupBox.classList.add("dragging");
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    clickPrevented = true;
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    popupBox.style.left = `${x}px`;
    popupBox.style.top = `${y}px`;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    clickPrevented = false;
    popupBox.classList.remove("dragging");
  });
});

function attachStepClickEvent() {
  const stepLine = document.querySelector(".step-line");
  const popupList = document.querySelector(".popup-list");

  stepLine.addEventListener("click", (e) => {
    if (clickPrevented) return;

    const target = e.target.closest(".step");
    if (!target) return;

    const index = [...stepLine.querySelectorAll(".step")].indexOf(target);
    activateStepsUpTo(index);
    activateListItem(index);
    moveMapToStep(index);
  });
}

function activateStepsUpTo(index) {
  const steps = document.querySelectorAll(".step");
  const progresses = document.querySelectorAll(".progress");

  steps.forEach((step, i) => {
    step.classList.toggle("active", i <= index);
  });
  progresses.forEach((bar, i) => {
    bar.classList.toggle("active", i < index);
  });
}

function activateListItem(index) {
  const items = document.querySelectorAll(".popup-list li");
  items.forEach((item, i) => {
    const strong = item.querySelector("strong");
    if (strong) {
      strong.style.color = i === index ? "#007bff" : "#000";
    }
  });
}

function moveMapToStep(index) {
  if (!window.globalMap || !currentPopupRoute) return;
  const step = currentPopupRoute.steps[index];
  if (!step || step.latitude === undefined || step.longitude === undefined) return;

  const latlng = new kakao.maps.LatLng(step.latitude, step.longitude);
  window.globalMap.setCenter(latlng);
}
