//테스트코드: 장소 입력없이 submit 버튼 누르면 백응답 없을 시 mockData로 렌더링
// 경로 카드 렌더링
function renderRouteCardsFromAPI(data) {
  const panel = document.querySelector(".panel");
  panel.querySelectorAll(".route-card").forEach((card) => card.remove());

  const steps = data.steps;
  const totalTime = data.totalTime;

  const dotSteps = []; // 최종 dot 렌더링용 배열

  // 0번은 무조건 출발지
  if (steps.length === 0) return;
  dotSteps.push(steps[0]);

  let i = 1;
  while (i < steps.length - 1) {
    const current = steps[i];
    const next1 = steps[i + 1];
    const next2 = steps[i + 2];

    // 다음 두 개가 SUBWAY/BUS 쌍인 경우
    if (
      next1 &&
      next2 &&
      (next1.type === "SUBWAY_STATION" || next1.type === "BUS_STATION") &&
      (next2.type === "SUBWAY_STATION" || next2.type === "BUS_STATION")
    ) {
      dotSteps.push(next1);
      dotSteps.push(next2);
      dotSteps.push(current); // 그 뒤 PLACE
      i += 3;
    } else if (current.type === "PLACE") {
      dotSteps.push(current);
      i++;
    } else {
      // fallback: 그냥 하나만 넣음
      dotSteps.push(current);
      i++;
    }
  }

  // 마지막은 도착지
  if (steps.length >= 2) {
    const last = steps[steps.length - 1];
    if (!dotSteps.includes(last)) dotSteps.push(last);
  }

  // 렌더링
  const total = dotSteps.length;
  let dotHtml = "";
  let labelHtml = "";
  let labelNumber = 1;

  dotSteps.forEach((step, i) => {
    const leftPercent = total > 1 ? (i / (total - 1)) * 90 + 5 : 50;
    const isPlace = step.type === "PLACE";

    let dotContent = "";
    if (isPlace) {
      dotContent = `<div class="dot bold">${labelNumber++}</div>`;
    } else {
      const icon = step.type === "SUBWAY_STATION"
        ? '<i class="fa-solid fa-train-subway"></i>'
        : '<i class="fa-solid fa-bus"></i>';
      dotContent = `<div class="dot transport">${icon}</div>`;
    }

    dotHtml += `
      <div class="dot-wrapper" style="left: ${leftPercent}%;">
        ${dotContent}
      </div>
    `;

    labelHtml += `
      <div class="dot-label" style="left: ${leftPercent}%; transform: translateX(-50%); font-weight: ${isPlace ? "bold" : "normal"};">
        ${step.name}
      </div>
    `;
  });

  // 카드 생성
  const card = document.createElement("div");
  card.className = "route-card";
  card.innerHTML = `
    <div style="font-weight:bold; font-size: 20px; margin-bottom: 15px;">
      ${totalTime}분 
      <span
        class="details-btn"
        data-role="open-popup"
        style="font-size: 14px; font-weight: normal; cursor: pointer;"
      >
        상세보기 >
      </span>
    </div>
    <div class="progress-labels" style="position: relative; height: 20px; margin-bottom: 8px;">
      ${labelHtml}
    </div>
    <div class="progress-bar" style="position: relative; height: 4px; background: #ddd;">
      ${dotHtml}
    </div>
  `;

  card.querySelector(".details-btn").addEventListener("click", () => {
    populatePopup({ ...data, steps: dotSteps }); // 팝업도 재정렬된 순서로
    document.getElementById("popupOverlay").style.display = "block";
  });

  panel.appendChild(card);
}



// API 요청 함수
async function requestRouteAPI({
  depName,
  arrName,
  waypointNames = [],
  userCondition,
}) {
  const placeCoords = {
    서울역: { latitude: 37.5547, longitude: 126.9706 },
    강남역: { latitude: 37.4979, longitude: 127.0276 },
    서울도서관: { latitude: 37.5663, longitude: 126.9779 },
    남산타워: { latitude: 37.5512, longitude: 126.9882 },
  };

  async function getPlaceObjAsync(name) {
    if (!name) return null;
    if (placeCoords[name]) {
      return {
        name,
        latitude: placeCoords[name].latitude,
        longitude: placeCoords[name].longitude,
      };
    }
    return new Promise((resolve, reject) => {
      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
        alert("Kakao 지도 API가 로드되지 않았습니다.");
        reject("Kakao API not loaded");
        return;
      }
      const ps = new kakao.maps.services.Places();
      ps.keywordSearch(name, function (result, status) {
        if (status === kakao.maps.services.Status.OK && result.length > 0) {
          resolve({
            name,
            latitude: parseFloat(result[0].y),
            longitude: parseFloat(result[0].x),
          });
        } else {
          alert(`'${name}'의 좌표를 찾을 수 없습니다.`);
          reject("좌표 없음");
        }
      });
    });
  }

  let departure,
    arrival,
    waypoints = [];
  try {
    // 모든 입력창(input-row)에서 값을 읽어옴
    const rows = Array.from(
      document.querySelectorAll(".input-container .input-row")
    );
    if (rows.length < 2) return null;
    const depInput = rows[0].querySelector("input");
    const arrInput = rows[rows.length - 1].querySelector("input");
    departure = await getPlaceObjAsync(depInput.value.trim());
    arrival = await getPlaceObjAsync(arrInput.value.trim());
    // 출발지/도착지 제외 나머지(경유지) 입력값을 waypoints로
    for (let i = 1; i < rows.length - 1; i++) {
      const wpInput = rows[i].querySelector("input");
      const name = wpInput.value.trim();
      if (name) {
        const wp = await getPlaceObjAsync(name);
        if (wp) waypoints.push(wp);
      }
    }
  } catch (e) {
    return null;
  }

  if (!departure || !arrival) {
    alert("출발지와 도착지를 정확히 입력하세요.");
    return null;
  }

  const reqBody = { departure, arrival, waypoints, userCondition };
  console.log("[경로탐색 API 요청]", reqBody);

  try {
    const res = await fetch("https://bananavoteback.com/api/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });
    if (!res.ok) throw new Error("API 요청 실패: " + res.status);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("[경로탐색 API 오류]", err);
    return null;
  }
}

window.requestRouteAPI = requestRouteAPI;

function getConditionBool(type) {
  const el = document.querySelector(
    `.custom-select[data-type="${type}"] .custom-select__selected-text`
  );
  if (!el) return false;
  const val = el.textContent.trim();
  if (type === "계단") return val === "없음" || val === "없으면 불편함";
  if (type === "엘리베이터") return val === "있음" || val === "있으면 좋음";
  if (type === "경사로") return val === "있음" || val === "있으면 좋음";
  if (type === "혼잡도") return val === "없음" || val === "없으면 불편함";
  return false;
}

async function fetchRouteFromAPI() {
  const depName = document.getElementById("departure-input").value.trim();
  const arrName = document.getElementById("arrival-input").value.trim();
  const waypointInput = document.getElementById("waypoint-input");
  let waypointNames = [];
  if (waypointInput && waypointInput.value.trim()) {
    waypointNames = waypointInput.value
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
  }

  const userCondition = {
    avoidCongestion: getConditionBool("혼잡도"),
    requireElevator: getConditionBool("엘리베이터"),
    avoidStairs: getConditionBool("계단"),
  };

  const data = await requestRouteAPI({
    depName,
    arrName,
    waypointNames,
    userCondition,
  });

  if (data) {
    console.log("[경로탐색 API 응답]", data);
    window.lastRouteResult = data;
    renderRouteCardsFromAPI(data);
    window.dispatchEvent(new CustomEvent("routeResult", { detail: data }));
  } else {
    console.warn("[백엔드 응답 없음] mock 데이터로 카드 생성");
    renderRouteCardsFromAPI(mockRouteData);
  }
}

const submitBtn = document.querySelector("#submit-btn");
if (submitBtn) {
  submitBtn.addEventListener("click", fetchRouteFromAPI);
}

// mock 데이터 정의
const mockRouteData = {
  totalTime: 37,
  steps: [
    {
      stepOrder: 1,
      type: "PLACE",
      name: "서울역",
      latitude: 37.5547,
      longitude: 126.9706,
    },
    {
      stepOrder: 2,
      type: "WAYPOINT",
      name: "남산타워",
      latitude: 37.5512,
      longitude: 126.9882,
    },
    {
      stepOrder: 3,
      type: "PLACE",
      name: "강남역",
      latitude: 37.4979,
      longitude: 127.0276,
    },
  ],
};
