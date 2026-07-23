# FrameWise 구도 학습용 사진 후보 — 2차 조사

> 조사일: 2026-07-23
> 기준: 크롭 전후 차이, 구도 이론의 직관성, 수동 좌표 주석 가능성, 재사용 라이선스.

## 우선 후보

| 우선순위 | 사진 | 목표 구도 | 권장 크롭 `(x, y, w, h)` | 남기는 면적 | 라이선스 |
|---|---|---|---|---:|---|
| 1 | [Snow tree](https://www.flickr.com/photos/angel_ina/11341534884/) | 여백, 삼등분할, 시각적 균형 | `(0.131, 0.272, 0.695, 0.592)` | 41.1% | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| 2 | [Balloon](https://www.flickr.com/photos/akdetrick/7186342794/) | 채우기, 중앙 구도, 여백 | `(0.209, 0.000, 0.625, 0.578)` | 36.1% | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) |
| 3 | [Beach Walk](https://www.flickr.com/photos/betchaboy/8455922255/) | 곡선·S자, 수평선 위치, 삼등분할 | `(0.005, 0.132, 0.992, 0.408)` | 40.5% | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) |
| 4 | [Cabo da Roca Sintra](https://www.flickr.com/photos/sey_alg9/4932170466/) | 리딩 라인, 대각선, 수평선 위치 | `(0.000, 0.166, 0.996, 0.763)` | 76.0% | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) |
| 5 | [White Egret Eating Fish](https://www.flickr.com/photos/adrusi/4973476179/) | 삼등분할, 시선 여백, 채우기 | `(0.016, 0.281, 0.787, 0.717)` | 56.5% | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) |

좌표는 원본 이미지 기준 0~1 정규화 `(x, y, width, height)`다.

## 선정 이유

### 1. Snow tree

- 원본의 위·아래 빈 공간을 줄이면 나무가 오른쪽 삼등분 영역의 명확한 주제가 된다.
- 눈밭은 여백으로 유지되므로 “여백을 무조건 없애는 것이 아니라 정돈한다”는 점을 설명하기 좋다.
- 측정 항목: 나무 앵커와 오른쪽 교차점 거리, 피사체 면적 비율, 좌우 여백 비율.

### 2. Balloon

- 아래쪽 건물과 지붕을 제거하면 복잡한 거리 사진이 단순한 하늘 속 열기구 사진으로 바뀐다.
- 세로 방향을 유지하면서 피사체 크기를 크게 만드는 채우기 구도를 설명하기 좋다.
- 측정 항목: 열기구 중심과 중앙선 거리, 피사체 보존율, 피사체 면적 비율.

### 3. Beach Walk

- 긴 해안 곡선을 가로 파노라마에 남기고 과도한 전경 모래를 제거한다.
- 수평선과 해안선의 역할을 분리해 설명할 수 있다.
- 측정 항목: 수평선의 크롭 내부 위치, 주석 곡선 보존율, 인물·강아지 포함 여부.

### 4. Cabo da Roca Sintra

- 울타리와 길이 오른쪽의 등대 방향으로 흐르는 리딩 라인이 뚜렷하다.
- 변화량은 다른 후보보다 작으므로 리딩 라인의 방향을 읽는 중급 문제에 적합하다.
- 측정 항목: 울타리 선분 보존율, 소실 방향과 등대 앵커 거리, 수평선 위치.

### 5. White Egret Eating Fish

- 과도한 수면을 줄이면 백로가 분명한 주 피사체가 된다.
- 부리 방향의 공간을 보존해 채우기와 시선 여백의 차이를 함께 가르칠 수 있다.
- 측정 항목: 백로 바운딩 박스 보존율, 앞·뒤 여백 비율, 피사체 면적 비율.

## 참고 전용으로 제외한 강한 후보

| 사진 | 장점 | 제외 이유 |
|---|---|---|
| [Wat Chedi Luang](https://www.flickr.com/photos/ccpc2008/8747633714/) | 세로 원본의 넓은 바닥을 제거하면 중앙·대칭 구도가 극적으로 나타남 | CC BY-NC-SA 2.0의 비상업 조건 |
| [Camino2](https://www.flickr.com/photos/r_soffia/23325240806/) | 숲길과 울타리가 두 사람에게 이어지는 리딩 라인과 자연 프레임 | CC BY-NC 2.0의 비상업 조건 |

두 사진은 구도 연구 참고에는 좋지만 공개 서비스의 기본 자산으로는 우선 사용하지 않는다.

## 라이선스 적용 메모

- CC BY: 작가, 원본 URL, 라이선스, 크롭 변경 사실을 표시한다.
- CC BY-SA: 위 조건과 함께 크롭 결과물에 동일조건변경허락 조건을 적용한다.
- 실제 추가 직전에 Flickr 사진 페이지에서 라이선스를 다시 확인한다.
- 이 조사에서는 후보 이미지를 임시 비교용으로만 내려받았고 프로젝트 자산에는 복사하지 않았다.

## 조사 기반

권장 크롭은 [Flickr Cropping Dataset](https://yiling-chen.github.io/flickr-cropping-dataset/)의 사진 애호가 주석과 사람 선호 평가를 출발점으로 삼았다. 구도 분류는 [FrameWise 사진 구도 가이드](./COMPOSITION_GUIDE.md)의 기준을 적용했다.
