function showPlaceDetail(place, inputField) {
  const panel = document.querySelector(".panel");
  const inputRow = inputField.closest(".input-row");
  const role = inputRow?.getAttribute("data-role");

  // 마커 생성
  const latlng = new kakao.maps.LatLng(place.y, place.x);
  window.mapUtils.addMarker(role, latlng, place.name);

  // 상세 카드 생성
  const card = document.createElement("div");
  card.className = "place-detail-card route-card";

  card.innerHTML = `
    <img src="${place.image}" alt="${place.name}" class="place-image"/>
    <div class="place-info">
      <strong>${place.name}</strong>
      <div class="button-group">
        <button class="confirm-btn">확인</button>
        <button class="cancel-btn">취소</button>
      </div>
    </div>
  `;

  if (inputRow) {
    inputRow.after(card);
  } else {
    panel.appendChild(card);
  }

  // 취소 버튼
  card.querySelector(".cancel-btn").addEventListener("click", () => {
    inputField.value = "";
    inputField.blur();
    card.remove();

    // 역할별 마커 제거
    if (role === "start") window.mapUtils.removeMarker("start", window.routeMarkers.start);
    else if (role === "end") window.mapUtils.removeMarker("end", window.routeMarkers.end);
    else {
      const lastMarker = window.routeMarkers.waypoints[window.routeMarkers.waypoints.length - 1];
      window.mapUtils.removeMarker("waypoint", lastMarker);
    }
  });

  // 확인 버튼
  card.querySelector(".confirm-btn").addEventListener("click", () => {
    inputField.value = place.name;
    inputField.blur();
    card.remove();
  });
}
