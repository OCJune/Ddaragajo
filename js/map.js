document.addEventListener("DOMContentLoaded", function () {
  kakao.maps.load(function () {
    // 지도 생성
    const mapContainer = document.getElementById("map");
    const mapOption = {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 3,
    };
    const map = new kakao.maps.Map(mapContainer, mapOption);

    // 전역 참조 저장
    window.globalMap = map;
    window.routeMarkers = { start: null, waypoints: [], end: null };

    // 지도 유틸 함수 모음
    window.mapUtils = {
      // 마커 추가
      addMarker: function (role, latlng, name) {
        const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png"; // 노란 핀
        const markerImage = new kakao.maps.MarkerImage(imageSrc, new kakao.maps.Size(24, 35));

        const marker = new kakao.maps.Marker({
          map: globalMap,
          position: latlng,
          title: name,
          image: markerImage,
        });

        // 역할별로 마커 저장
        if (role === "start") {
          if (window.routeMarkers.start) window.routeMarkers.start.setMap(null);
          window.routeMarkers.start = marker;
        } else if (role === "end") {
          if (window.routeMarkers.end) window.routeMarkers.end.setMap(null);
          window.routeMarkers.end = marker;
        } else {
          window.routeMarkers.waypoints.push(marker);
        }

        this.fitToMarkers(); // 지도 자동 확대/축소
      },

      // 마커 제거
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

        this.fitToMarkers(); // 제거 후 지도 다시 맞춤
      },

      // 마커 전체 보이도록 지도 범위 조절
      fitToMarkers: function () {
        const bounds = new kakao.maps.LatLngBounds();
        if (window.routeMarkers.start) bounds.extend(window.routeMarkers.start.getPosition());
        if (window.routeMarkers.end) bounds.extend(window.routeMarkers.end.getPosition());
        window.routeMarkers.waypoints.forEach(m => bounds.extend(m.getPosition()));
        if (!bounds.isEmpty()) window.globalMap.setBounds(bounds);
      }
    };

    // 장소 검색 기능
    const ps = new kakao.maps.services.Places();
    const inputContainer = document.querySelector(".input-container");

    // input에서 엔터 입력 시 장소 검색
    inputContainer.addEventListener("keypress", function (e) {
      const inputField = e.target;
      if (e.key !== "Enter" || inputField.tagName !== "INPUT") return;

      const keyword = inputField.value.trim();
      if (!keyword) return;

      const resultBox = inputField.parentElement.querySelector(".result-box");
      resultBox.innerHTML = "";
      resultBox.style.display = "block";

      // 장소 검색 API 호출
      ps.keywordSearch(keyword, function (data, status) {
        if (status === kakao.maps.services.Status.OK) {
          data.forEach((place) => {
            const item = document.createElement("div");
            item.textContent = `${place.place_name} (${place.address_name})`;
            item.style.cursor = "pointer";
            item.style.padding = "8px 10px";
            item.style.borderBottom = "1px solid #eee";

            // 검색 결과 항목 클릭 시
            item.addEventListener("click", () => {
              const latlng = new kakao.maps.LatLng(place.y, place.x);
              map.setCenter(latlng);

              inputField.value = place.place_name;
              resultBox.innerHTML = "";
              resultBox.style.display = "none";

              // 장소 정보 전달하여 마커 및 카드 생성
              showPlaceDetail({
                name: place.place_name,
                x: place.x,
                y: place.y,
                image: `https://search1.daumcdn.net/thumb/R1280x0/?fname=https://t1.daumcdn.net/mapsearch/thumbnail/${place.id}`
              }, inputField);
            });

            resultBox.appendChild(item);
          });
        } else {
          resultBox.innerHTML = "<div>검색 결과가 없습니다.</div>";
        }
      });
    });

    // input 클릭 시 기존 결과 숨기기
    inputContainer.addEventListener("click", function (e) {
      if (e.target.tagName === "INPUT") {
        const resultBox = e.target.parentElement.querySelector(".result-box");
        if (resultBox) resultBox.style.display = "none";
      }
    });
  });
});
