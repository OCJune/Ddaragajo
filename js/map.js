document.addEventListener("DOMContentLoaded", function () {
  kakao.maps.load(function () {
    const mapContainer = document.getElementById("map");
    const mapOption = {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 3,
    };
    const map = new kakao.maps.Map(mapContainer, mapOption);

    window.globalMap = map;
    window.routeMarkers = { start: null, waypoints: [], end: null };

    window.mapUtils = {
      addMarker: function (role, latlng, name) {
        const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
        const markerImage = new kakao.maps.MarkerImage(imageSrc, new kakao.maps.Size(24, 35));

        const marker = new kakao.maps.Marker({
          map: globalMap,
          position: latlng,
          title: name,
          image: markerImage,
        });

        if (role === "start") {
          if (window.routeMarkers.start) window.routeMarkers.start.setMap(null);
          window.routeMarkers.start = marker;
        } else if (role === "end") {
          if (window.routeMarkers.end) window.routeMarkers.end.setMap(null);
          window.routeMarkers.end = marker;
        } else {
          window.routeMarkers.waypoints.push(marker);
        }

        this.fitToMarkers();
      },

      removeMarker: function (role, marker) {
        if (!marker) return;
        marker.setMap(null);

        if (role === "start") {
          window.routeMarkers.start = null;
        } else if (role === "end") {
          window.routeMarkers.end = null;
        } else {
          const index = window.routeMarkers.waypoints.indexOf(marker);
          if (index !== -1) {
            window.routeMarkers.waypoints.splice(index, 1);
          }
        }

        this.fitToMarkers();
      },

      fitToMarkers: function () {
        const bounds = new kakao.maps.LatLngBounds();
        if (window.routeMarkers.start) bounds.extend(window.routeMarkers.start.getPosition());
        if (window.routeMarkers.end) bounds.extend(window.routeMarkers.end.getPosition());
        window.routeMarkers.waypoints.forEach(m => bounds.extend(m.getPosition()));
        if (!bounds.isEmpty()) window.globalMap.setBounds(bounds);
      }
    };

    function showPlaceMarker(place, inputField) {
      const inputRow = inputField.closest(".input-row");
      const role = inputRow?.getAttribute("data-role");

      const latlng = new kakao.maps.LatLng(place.y, place.x);
      window.mapUtils.addMarker(role, latlng, place.name);

      inputField.value = place.name;
      inputField.blur();
    }

    const ps = new kakao.maps.services.Places();
    const inputContainer = document.querySelector(".input-container");

    inputContainer.addEventListener("keypress", function (e) {
      const inputField = e.target;
      if (e.key !== "Enter" || inputField.tagName !== "INPUT") return;

      const keyword = inputField.value.trim();
      if (!keyword) return;

      const resultBox = inputField.parentElement.querySelector(".result-box");
      resultBox.innerHTML = "";
      resultBox.style.display = "block";

      ps.keywordSearch(keyword, function (data, status) {
        if (status === kakao.maps.services.Status.OK) {
          data.forEach((place) => {
            const item = document.createElement("div");
            item.textContent = `${place.place_name} (${place.address_name})`;
            item.style.cursor = "pointer";
            item.style.padding = "8px 10px";
            item.style.borderBottom = "1px solid #eee";

            item.addEventListener("click", () => {
              const latlng = new kakao.maps.LatLng(place.y, place.x);
              map.setCenter(latlng);

              resultBox.innerHTML = "";
              resultBox.style.display = "none";

              showPlaceMarker({
                name: place.place_name,
                x: place.x,
                y: place.y,
              }, inputField);
            });

            resultBox.appendChild(item);
          });
        } else {
          resultBox.innerHTML = "<div>검색 결과가 없습니다.</div>";
        }
      });
    });

    inputContainer.addEventListener("click", function (e) {
      if (e.target.tagName === "INPUT") {
        const resultBox = e.target.parentElement.querySelector(".result-box");
        if (resultBox) resultBox.style.display = "none";
      }
    });
  });
});

// ===============================
// 경로 폴리라인 표시 기능 수정 (dotSteps 기준)
// ===============================
window.routePolyline = null;

window.addEventListener("routeResult", (e) => {
  const data = e.detail;
  if (!data || !data.steps || data.steps.length === 0) return;

  // dotSteps 재정렬 로직 복붙 (route.js와 동일)
  const steps = data.steps;
  const dotSteps = [];
  dotSteps.push(steps[0]);
  let i = 1;
  while (i < steps.length - 1) {
    const current = steps[i];
    const next1 = steps[i + 1];
    const next2 = steps[i + 2];
    if (
      next1 &&
      next2 &&
      (next1.type === "SUBWAY_STATION" || next1.type === "BUS_STATION") &&
      (next2.type === "SUBWAY_STATION" || next2.type === "BUS_STATION")
    ) {
      dotSteps.push(next1);
      dotSteps.push(next2);
      dotSteps.push(current);
      i += 3;
    } else if (current.type === "PLACE") {
      dotSteps.push(current);
      i++;
    } else {
      dotSteps.push(current);
      i++;
    }
  }
  if (steps.length >= 2) {
    const last = steps[steps.length - 1];
    if (!dotSteps.includes(last)) dotSteps.push(last);
  }

  const linePath = dotSteps.map(step => new kakao.maps.LatLng(step.latitude, step.longitude));
  if (window.routePolyline) {
    window.routePolyline.setMap(null);
  }
  const smoothedPath = smoothPath(linePath);
  window.routePolyline = new kakao.maps.Polyline({
    path: smoothedPath,
    strokeWeight: 5,
    strokeColor: '#007bff',
    strokeOpacity: 0.8,
    strokeStyle: 'solid',
    map: window.globalMap,
  });
  const bounds = new kakao.maps.LatLngBounds();
  smoothedPath.forEach(p => bounds.extend(p));
  window.globalMap.setBounds(bounds);
});

function smoothPath(points) {
  const smoothed = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    smoothed.push(p1);
    const midLat = (p1.getLat() * 2 + p2.getLat()) / 3;
    const midLng = (p1.getLng() * 2 + p2.getLng()) / 3;
    smoothed.push(new kakao.maps.LatLng(midLat, midLng));
  }
  smoothed.push(points[points.length - 1]);
  return smoothed;
}
