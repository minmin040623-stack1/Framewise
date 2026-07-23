# FrameWise 사진 구도 가이드 초안

> 목적: 사진마다 지정된 **목표 구도**와 사용자의 크롭이 얼마나 잘 맞는지 설명 가능한 기준으로 평가한다.
> 조사일: 2026-07-23
> 상태: 연구·설계 초안. 이 문서는 아직 `photos.json`이나 점수 코드를 변경하지 않는다.

---

## 1. 설계 원칙

사진 구도는 절대적인 정답이 아니라 사진가의 의도를 전달하기 위한 지침이다. 따라서 FrameWise는 다음 원칙을 따른다.

1. 모든 사진에 같은 구도 규칙을 적용하지 않는다.
2. 사진마다 `targetCompositions`로 목표 구도를 지정한다.
3. 목표로 지정되지 않은 규칙을 따르지 않았다는 이유로 감점하지 않는다.
4. 하나의 정답 크롭만 강요하지 않고 복수의 `referenceCrops`를 허용한다.
5. 점수마다 “무엇이 어디에 배치되었는지”를 수치와 문장으로 설명한다.
6. 이미지 분석 모델이 없는 현재 버전에서는 자동으로 피사체나 시선을 찾았다고 표현하지 않는다.
7. 사람이 미리 입력한 좌표를 사용하면 결과 화면에 “사진별 사전 주석 기준”임을 명시한다.
8. 창의적인 규칙 파괴를 틀렸다고 단정하지 않는다. 목표 구도와 거리가 멀면 “다른 의도의 구도”로 설명한다.

[Canon Europe](https://www.canon-europe.com/get-inspired/tips-and-techniques/better-composition/)과 [Adobe](https://www.adobe.com/creativecloud/photography/technique/composition.html)는 구도 규칙이 기초이자 의사결정 지침이며, 익힌 뒤에는 의도적으로 변형하거나 깰 수 있다고 설명한다.

---

## 2. 현재 프로젝트 구조 요약

### 현재 데이터 흐름

1. `js/game.js`가 `assets/data/photos.json`을 읽는다.
2. 사진 한 장을 무작위로 선택한다.
3. Cropper.js가 픽셀 좌표의 `cropData`를 반환한다.
4. `calculateScore()`가 중심 위치, 크롭 면적, 1.5 가로세로 비율, 가장자리 여백을 모든 사진에 동일하게 적용한다.
5. `cropData`, `score`, `photoInfo`를 LocalStorage에 저장한다.
6. `js/result.js`가 사용자의 크롭과 복수의 `referenceCrops`를 표시한다.

### 이미 마련된 좋은 기반

- `referenceCrops`가 복수 추천안을 지원한다.
- 추천 좌표가 이미지 크기에 독립적인 0~1 정규화 좌표다.
- 각 추천안에 `reason`이 있어 구체적인 설명을 표시할 수 있다.
- `photoInfo` 전체가 결과 화면에 전달되므로 선택적 메타데이터를 추가하기 쉽다.

### 현재 점수 방식의 문제

- 중앙 구도가 목표가 아닌 사진도 중앙에 가까울수록 높은 점수를 받는다.
- 모든 사진에 1.5 비율을 선호하여 세로, 정사각, 파노라마 의도를 평가하지 못한다.
- 이미지 가장자리에 닿는 크롭을 일괄 감점하여 전체 너비를 활용한 정상적인 크롭도 불리하다.
- 피사체, 수평선, 시선 방향을 실제로 인식하지 않는다.
- 점수의 세부 항목과 계산 근거가 결과 화면에 연결되어 있지 않다.

---

## 3. FrameWise 우선순위

| 등급 | 구도 | 권장 시점 | 이유 |
|---|---|---|---|
| 1차 | 삼등분할, 중앙, 대칭, 시선 여백, 피사체 보존, 수평선 위치 | 현재 버전 | 사전 좌표 주석으로 비교적 명확하게 측정 가능 |
| 1차 | 기준 크롭 유사도, 채우기, 여백 비율 | 현재 버전 | 크롭 사각형과 주석된 피사체 영역으로 계산 가능 |
| 2차 | 리딩 라인, 대각선, 프레임 속 프레임, 전·중·배경, 삼각형, S자 | 수동 주석 확장 후 | 선·점·영역을 사람이 지정하면 기하 평가 가능 |
| 2차 | 반복과 패턴 | 수동 패턴 영역 주석 후 | 패턴 경계 보존 여부는 계산 가능 |
| 3차 | 황금나선, 시각적 균형 | 이미지 분석 또는 연구 단계 | 단일 수치가 실제 시선 흐름이나 심미성을 보장하지 못함 |

---

## 4. 구도별 가이드

## 4.1 삼등분할 구도 — Rule of Thirds

- **한 문장 정의:** 화면을 3×3으로 나누고 주요 피사체나 경계선을 교차점 또는 분할선 가까이에 배치한다.
- **언제 좋은가:** 인물, 동물, 단일 피사체가 있는 풍경, 하늘과 땅의 비중을 선택해야 하는 장면.
- **사진에서 찾을 것:** 얼굴·눈·건물·나무 같은 핵심점, 수평선, 근경·중경·원경 경계.
- **좋은 크롭 예시:**
  - 바다 사진에서 수평선을 아래쪽 1/3 선에 두어 하늘을 2/3만큼 강조한다.
  - 오른쪽을 보는 인물을 왼쪽 위 교차점 부근에 두고 오른쪽에 시선 여백을 남긴다.
  - 꽃·산·하늘을 각각 약 1/3씩 나누어 근경·중경·원경을 보여준다.
- **좋지 않은 크롭 예시:** 인물의 눈이 교차점에서 멀고, 의미 없는 하늘과 바닥이 비슷하게 남아 주제가 불분명하다.
- **짧은 피드백:** “피사체가 오른쪽 위 교차점에서 6% 이내에 놓였습니다.”
- **오버레이:** 3×3 격자, 네 교차점, 선택된 목표선 강조.
- **기하학적 측정:** 피사체 앵커와 가장 가까운 교차점의 정규화 거리, 수평선과 1/3·2/3 선의 거리, 세 영역 비율.
- **피사체 인식 필요:** 얼굴·눈·주 피사체 위치, 수평선과 장면 층의 자동 검출.
- **자동 평가가 어려운 부분:** 네 교차점 중 어느 점이 사진의 의도에 적합한지, 1:1:1과 1:2 중 무엇이 더 나은지.
- **출처:** [캐논코리아](https://kr.canon/magazine/detail/2866), [Canon Europe](https://www.canon-europe.com/get-inspired/tips-and-techniques/better-composition/), [Adobe](https://www.adobe.com/creativecloud/photography/technique/composition.html)

## 4.2 중앙 구도 — Centered Composition

- **한 문장 정의:** 주 피사체의 중심을 화면의 가로·세로 중심 가까이에 배치한다.
- **언제 좋은가:** 정면 인물, 하나의 강한 피사체, 원형 구조물, 터널, 대칭 장면.
- **사진에서 찾을 것:** 얼굴·건물 입구·원형 구조의 중심점과 주변 여백.
- **좋은 크롭 예시:**
  - 정면을 보는 얼굴의 중심을 화면 중심에 맞추고 좌우 어깨 여백을 비슷하게 남긴다.
  - 원형 천장의 중심과 사진 중심을 맞추어 반복되는 곡선을 강조한다.
- **좋지 않은 크롭 예시:** 피사체는 중앙에 있지만 왼쪽 여백이 오른쪽보다 크게 남아 의도하지 않은 치우침이 생긴다.
- **짧은 피드백:** “피사체 중심이 화면 중심에서 오른쪽으로 4% 벗어났습니다.”
- **오버레이:** 가로·세로 중앙선, 중심점, 피사체 앵커.
- **기하학적 측정:** 피사체 중심과 `(0.5, 0.5)`의 거리, 좌우·상하 여백 차이.
- **피사체 인식 필요:** 피사체 또는 얼굴 바운딩 박스.
- **자동 평가가 어려운 부분:** 피사체가 중앙을 차지할 만큼 시각적으로 강한지, 의도적인 비대칭인지.
- **출처:** [Canon Europe](https://www.canon-europe.com/get-inspired/tips-and-techniques/better-composition/), [Nikon USA](https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/when-center-composition-can-elevate-a-portrait)

## 4.3 대칭 구도 — Symmetry

- **한 문장 정의:** 좌우, 상하 또는 반영 요소가 하나의 축을 기준으로 대응하도록 구성한다.
- **언제 좋은가:** 복도, 계단, 터널, 건물 정면, 물에 비친 반영.
- **사진에서 찾을 것:** 대칭축, 소실점, 대응하는 모서리와 형태.
- **좋은 크롭 예시:**
  - 복도의 소실점과 수직 대칭축을 화면 중앙선에 맞춘다.
  - 건물과 물속 반영의 경계를 중앙 가로선에 두어 상하 대칭을 만든다.
- **좋지 않은 크롭 예시:** 건축물의 대칭축이 중앙에서 벗어나 한쪽 기둥만 더 많이 보인다.
- **짧은 피드백:** “대칭축이 화면 중심에서 왼쪽으로 3% 치우쳤습니다.”
- **오버레이:** 수직·수평 대칭축, 대응점 연결선.
- **기하학적 측정:** 주석된 대칭축과 크롭 중심선의 거리, 양쪽 여백 차이.
- **피사체 인식 필요:** 자동 대칭축과 반복 구조 검출.
- **자동 평가가 어려운 부분:** 완벽하지 않은 자연 대칭이 의도적으로 균형을 이루는지.
- **출처:** [Canon Europe 도시 사진 가이드](https://www.canon-europe.com/get-inspired/tips-and-techniques/composition-tips-urban-cityscapes/), [Adobe](https://www.adobe.com/creativecloud/photography/technique/composition.html)

## 4.4 리딩 라인 — Leading Lines

- **한 문장 정의:** 도로, 철길, 난간, 강, 그림자 등의 선이 시선을 주 피사체나 소실점으로 유도한다.
- **언제 좋은가:** 거리, 건축, 풍경, 다리, 계단처럼 선이 뚜렷한 장면.
- **사진에서 찾을 것:** 선의 시작점, 진행 방향, 수렴점, 주 피사체와의 연결.
- **좋은 크롭 예시:**
  - 화면 왼쪽 아래에서 시작한 도로 경계가 멀리 있는 사람에게 수렴하도록 남긴다.
  - 양쪽 수영장 모서리가 중앙 뒤편의 인물로 모이도록 크롭한다.
- **좋지 않은 크롭 예시:** 강한 난간선이 피사체를 지나 화면 오른쪽 밖으로 빠져나간다.
- **짧은 피드백:** “도로의 두 선이 피사체 주변에서 만나 시선을 안쪽으로 이끕니다.”
- **오버레이:** 주석 선분, 방향 화살표, 소실점, 피사체점.
- **기하학적 측정:** 선분 보존율, 선의 교차점과 목표점 거리, 진입점과 이탈점.
- **피사체 인식 필요:** 선·곡선·소실점·피사체 자동 검출.
- **자동 평가가 어려운 부분:** 선이 실제로 시선을 유도하는 강도와 배경 대비.
- **출처:** [Canon Europe](https://www.canon-europe.com/get-inspired/tips-and-techniques/better-composition/), [Adobe 리딩 라인 가이드](https://www.adobe.com/creativecloud/photography/technique/leading-lines.html)

## 4.5 대각선 구도 — Diagonal Composition

- **한 문장 정의:** 주요 선이나 피사체 배열을 한쪽 모서리에서 반대쪽 방향으로 흐르게 구성한다.
- **언제 좋은가:** 계단, 다리, 경사면, 스포츠, 움직임과 긴장감을 강조하는 장면.
- **사진에서 찾을 것:** 약 30~60도 기울기의 주요 선, 모서리 간 흐름, 피사체와의 관계.
- **좋은 크롭 예시:**
  - 계단이 왼쪽 아래에서 오른쪽 위로 이어지며 끝의 인물에 도달하게 한다.
  - 산등성이가 화면을 대각선으로 나누고 밝은 영역과 어두운 영역을 구분하게 한다.
- **좋지 않은 크롭 예시:** 수평선까지 애매하게 기울어 단순한 촬영 실수처럼 보인다.
- **짧은 피드백:** “다리의 주선이 왼쪽 아래에서 오른쪽 위로 프레임을 가로지릅니다.”
- **오버레이:** 두 대각선, 주석된 주요 선, 각도 표시.
- **기하학적 측정:** 선의 각도, 대각선과의 거리, 선분 보존율.
- **피사체 인식 필요:** 주요 선과 의도적인 기울기 자동 구분.
- **자동 평가가 어려운 부분:** 역동적인 대각선과 잘못 기운 수평선의 의미 차이.
- **출처:** [Canon Europe](https://www.canon-europe.com/get-inspired/tips-and-techniques/better-composition/)

## 4.6 황금비·황금나선 — Golden Ratio / Golden Spiral

- **한 문장 정의:** 약 1:1.618의 분할 또는 피보나치 나선을 따라 시선이 큰 요소에서 핵심 피사체로 흐르게 한다.
- **언제 좋은가:** 나선 계단, 굽은 해안, 식물, 인물 주변에 큰 곡선이 있는 장면.
- **사진에서 찾을 것:** 연속 곡선, 큰 형태에서 작은 핵심점으로 줄어드는 흐름.
- **좋은 크롭 예시:**
  - 나선 계단의 외곽 곡선을 살리고 나선 중심에 사람을 둔다.
  - 굽은 해안선이 프레임 외곽에서 시작해 작은 등대로 감겨 들어가게 한다.
- **좋지 않은 크롭 예시:** 피사체만 황금분할점에 억지로 맞췄지만 실제 곡선이나 시선 흐름이 없다.
- **짧은 피드백:** “곡선은 나선 중심으로 향하지만 핵심 피사체가 중심에서 12% 떨어져 있습니다.”
- **오버레이:** 방향 전환이 가능한 황금나선, 0.382·0.618 분할선.
- **기하학적 측정:** 주석 곡선과 나선의 근사 거리, 목표점과 나선 중심 거리.
- **피사체 인식 필요:** 곡선과 시각적 초점 자동 검출.
- **자동 평가가 어려운 부분:** 나선과 비슷한 모양이 실제로 시선을 유도하는지, 삼등분할보다 적합한지.
- **출처:** [Canon Europe](https://www.canon-europe.com/get-inspired/tips-and-techniques/better-composition/), [Canon Europe 도시 사진 가이드](https://www.canon-europe.com/get-inspired/tips-and-techniques/composition-tips-urban-cityscapes/)

## 4.7 프레임 속 프레임 — Frame Within a Frame

- **한 문장 정의:** 문, 창, 아치, 터널, 나뭇가지 등이 주 피사체 주변의 자연스러운 경계를 만든다.
- **언제 좋은가:** 건축물 입구, 창밖 풍경, 터널 끝 인물, 숲 사이 피사체.
- **사진에서 찾을 것:** 외부 프레임의 네 변 또는 곡선, 안쪽 피사체, 가려지는 영역.
- **좋은 크롭 예시:**
  - 열린 창틀 네 변을 남기고 창밖 인물을 가운데 둔다.
  - 나뭇가지가 위와 양옆에서 동물을 둘러싸되 얼굴을 가리지 않게 한다.
- **좋지 않은 크롭 예시:** 아치 한쪽이 어색하게 잘리고 외부 프레임이 피사체 얼굴을 가린다.
- **짧은 피드백:** “아치의 좌우 경계가 모두 남아 피사체를 둘러싸고 있습니다.”
- **오버레이:** 외부 프레임 폴리곤 또는 사각형, 피사체 영역.
- **기하학적 측정:** 프레임 경계 보존율, 피사체 포함률, 프레임과 피사체 간 최소 여백.
- **피사체 인식 필요:** 자연 프레임과 피사체 분할.
- **자동 평가가 어려운 부분:** 불완전한 프레임도 충분히 자연스러운지.
- **출처:** [Canon Europe](https://www.canon-europe.com/get-inspired/tips-and-techniques/better-composition/), [Nikon USA 중앙 구도 가이드](https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/when-center-composition-can-elevate-a-portrait)

## 4.8 여백 구도 — Negative Space

- **한 문장 정의:** 주 피사체 주변의 단순한 빈 공간을 의도적으로 크게 남겨 피사체와 분위기를 강조한다.
- **언제 좋은가:** 작은 인물, 새, 배, 단순한 건축물, 미니멀한 풍경.
- **사진에서 찾을 것:** 피사체 면적, 비어 있는 영역, 여백 속 방해 요소.
- **좋은 크롭 예시:**
  - 넓은 하늘 아래 작은 인물을 아래쪽 교차점에 두어 고립감을 표현한다.
  - 단색 벽 앞 작은 자전거를 한쪽에 두고 반대쪽을 깨끗한 여백으로 남긴다.
- **좋지 않은 크롭 예시:** 여백 안의 밝은 표지판이 작은 주 피사체보다 더 눈에 띈다.
- **짧은 피드백:** “피사체는 화면의 12%를 차지하고 오른쪽에 깨끗한 여백이 남았습니다.”
- **오버레이:** 피사체 마스크, 여백 영역 반투명 표시, 방해 요소 표시.
- **기하학적 측정:** 피사체 면적 비율, 피사체와 가장자리 거리, 주석된 여백 영역 보존율.
- **피사체 인식 필요:** 피사체 분할, 살리언시와 방해 요소 검출.
- **자동 평가가 어려운 부분:** 빈 공간이 고요한지 지루한지, 감정적 효과.
- **출처:** [Canon Europe](https://www.canon-europe.com/get-inspired/tips-and-techniques/better-composition/), [Adobe](https://www.adobe.com/creativecloud/photography/technique/composition.html)

## 4.9 시선·진행 방향 여백 — Look Room / Lead Room

- **한 문장 정의:** 사람·동물이 바라보는 방향 또는 움직이는 피사체의 앞쪽에 뒤쪽보다 넓은 공간을 남긴다.
- **언제 좋은가:** 옆얼굴, 동물, 자동차, 달리는 사람, 나는 새.
- **사진에서 찾을 것:** 얼굴 또는 물체 방향, 앞쪽 경계, 뒤쪽 경계, headroom.
- **좋은 크롭 예시:**
  - 오른쪽을 보는 인물을 왼쪽에 두어 얼굴 앞 오른쪽 공간을 넓게 남긴다.
  - 왼쪽으로 달리는 자동차를 오른쪽에 두고 왼쪽 도로를 보여준다.
- **좋지 않은 크롭 예시:** 인물이 오른쪽을 바라보지만 코 바로 앞에서 프레임이 끝난다.
- **짧은 피드백:** “시선 앞 여백이 뒤 여백의 1.4배로 확보되었습니다.”
- **오버레이:** 피사체 바운딩 박스, 방향 화살표, 앞·뒤 여백 띠.
- **기하학적 측정:** 앞쪽 여백/뒤쪽 여백 비율, 얼굴과 프레임 경계 거리, headroom.
- **피사체 인식 필요:** 얼굴·동물·차량 검출과 시선·이동 방향 추정.
- **자동 평가가 어려운 부분:** 뒤쪽 여백으로 탈출·속도감을 표현하는 의도적인 예외.
- **출처:** [Canon Europe 야생동물 가이드](https://www.canon-europe.com/get-inspired/tips-and-techniques/wildlife-photography-tips/), [Canon Europe](https://www.canon-europe.com/get-inspired/tips-and-techniques/better-composition/), [Nikon USA](https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/5-easy-composition-guidelines)

## 4.10 전경·중경·배경 — Foreground, Middle Ground, Background

- **한 문장 정의:** 가까운 요소, 중간 거리의 주제, 먼 배경을 층으로 구성해 깊이와 공간감을 만든다.
- **언제 좋은가:** 산, 호수, 들판, 도시 전망처럼 거리 층이 분명한 풍경.
- **사진에서 찾을 것:** 전경의 꽃·바위, 중경의 호수·건물, 배경의 산·하늘.
- **좋은 크롭 예시:**
  - 전경 꽃, 중경 호수, 배경 산이 각각 약 1/3씩 남도록 구성한다.
  - 전경 바위를 아래 1/4에 남겨 화면 안쪽의 폭포로 시선을 연결한다.
- **좋지 않은 크롭 예시:** 전경 바위가 절반 이상을 차지해 중경의 주 피사체를 가린다.
- **짧은 피드백:** “전경 28%, 중경 36%, 배경 36%로 세 거리 층이 모두 남았습니다.”
- **오버레이:** 세 영역을 구분하는 반투명 띠 또는 폴리곤.
- **기하학적 측정:** 각 주석 영역과 크롭의 교차 면적, 각 층 보존율.
- **피사체 인식 필요:** 장면 깊이 추정과 의미 영역 분할.
- **자동 평가가 어려운 부분:** 어느 층이 더 중요해야 하는지와 깊이감의 실제 강도.
- **출처:** [캐논코리아](https://kr.canon/magazine/detail/2866), [Adobe 전·중·배경 가이드](https://www.adobe.com/creativecloud/photography/hub/guides/foreground-middleground-background.html)

## 4.11 삼각형 구도 — Triangle Composition

- **한 문장 정의:** 세 피사체 또는 선이 삼각형의 꼭짓점이나 변을 이루도록 배치한다.
- **언제 좋은가:** 세 사람, 정물 세 개, 팔과 얼굴의 포즈, 원근감 있는 거리.
- **사진에서 찾을 것:** 세 핵심점, 두 대각선과 한 수평선, 삼각형의 방향.
- **좋은 크롭 예시:**
  - 세 사람의 얼굴이 넓은 밑변과 높은 꼭짓점을 이루도록 모두 포함한다.
  - 양팔과 얼굴이 안정적인 정삼각형에 가깝게 보이도록 크롭한다.
- **좋지 않은 크롭 예시:** 세 번째 피사체가 가장자리에서 잘려 삼각형 관계가 무너진다.
- **짧은 피드백:** “세 핵심점이 모두 남아 아래가 넓은 삼각형을 이룹니다.”
- **오버레이:** 세 점과 연결선, 삼각형 면.
- **기하학적 측정:** 세 점 포함 여부, 삼각형 면적, 꼭짓점의 가장자리 거리.
- **피사체 인식 필요:** 여러 피사체와 시각적 핵심점 검출.
- **자동 평가가 어려운 부분:** 어떤 세 요소가 하나의 시각적 집단인지.
- **출처:** [Canon Europe](https://www.canon-europe.com/get-inspired/tips-and-techniques/better-composition/)

## 4.12 곡선·S자 구도 — Curves / S-Curve

- **한 문장 정의:** 강, 길, 해안선 같은 곡선이 전경에서 배경 또는 핵심 피사체까지 부드럽게 시선을 이끈다.
- **언제 좋은가:** 굽은 강, 산길, 해안선, 계단, 식물 줄기.
- **사진에서 찾을 것:** 곡선 시작점, 방향 전환, 끝점과 피사체의 연결.
- **좋은 크롭 예시:**
  - S자 강이 아래쪽에서 시작해 중앙 마을을 지나 먼 산으로 이어지게 한다.
  - 굽은 길의 시작과 끝을 모두 남겨 작은 인물까지 시선이 이어지게 한다.
- **좋지 않은 크롭 예시:** 곡선의 시작 부분을 잘라 길이 화면 중간에서 갑자기 나타난다.
- **짧은 피드백:** “곡선의 진입점과 두 번의 방향 전환이 모두 프레임 안에 남았습니다.”
- **오버레이:** 주석 폴리라인, 진행 화살표, 시작·끝점.
- **기하학적 측정:** 곡선 길이 보존율, 시작·끝점 포함 여부, 목표점 거리.
- **피사체 인식 필요:** 자연 곡선과 주 피사체 자동 검출.
- **자동 평가가 어려운 부분:** 곡선의 부드러움과 실제 시선 유도 효과.
- **출처:** [Adobe 리딩 라인 가이드](https://www.adobe.com/creativecloud/photography/technique/leading-lines.html), [Nikon USA](https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/5-easy-composition-guidelines)

## 4.13 반복과 패턴 — Repetition and Pattern

- **한 문장 정의:** 반복되는 창문, 기둥, 타일, 나무, 색과 형태로 리듬을 만들고 필요하면 하나의 예외를 강조한다.
- **언제 좋은가:** 건축 외벽, 좌석, 과일, 계단, 식물 군락.
- **사진에서 찾을 것:** 반복 단위, 간격, 패턴 영역의 경계, 다른 하나.
- **좋은 크롭 예시:**
  - 같은 크기의 창문 행과 열이 프레임 가장자리에서 일정하게 끝나도록 한다.
  - 붉은 사과 사이의 노란 사과 하나를 삼등분 교차점에 둔다.
- **좋지 않은 크롭 예시:** 마지막 반복 단위의 절반만 가장자리에 남아 리듬이 우연히 끊긴다.
- **짧은 피드백:** “네 개의 반복 열이 온전히 남고 오른쪽 위의 예외 요소가 강조되었습니다.”
- **오버레이:** 반복 단위 바운딩 박스, 패턴 영역, 예외 요소 강조.
- **기하학적 측정:** 완전히 포함된 반복 단위 수, 잘린 단위 비율, 간격 규칙성.
- **피사체 인식 필요:** 패턴·반복·예외 요소 검출.
- **자동 평가가 어려운 부분:** 가장자리의 부분 반복이 의도적인 확장감을 만드는지.
- **출처:** [Nikon USA](https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/5-easy-composition-guidelines)

## 4.14 채우기 구도 — Fill the Frame

- **한 문장 정의:** 불필요한 배경을 줄이고 주 피사체가 화면 대부분을 차지하게 한다.
- **언제 좋은가:** 얼굴, 꽃, 음식, 동물, 질감, 작은 사물.
- **사진에서 찾을 것:** 피사체 바운딩 박스, 중요한 형태, 관절과 얼굴 경계, 배경 방해 요소.
- **좋은 크롭 예시:**
  - 꽃잎 끝을 보존하면서 꽃이 화면 면적의 약 70%를 차지하게 한다.
  - 얼굴과 머리카락을 충분히 포함하고 복잡한 주변 사람을 제거한다.
- **좋지 않은 크롭 예시:** 턱, 손목, 동물 귀처럼 의미 있는 형태를 프레임 경계에서 어색하게 자른다.
- **짧은 피드백:** “피사체가 화면의 68%를 차지하며 중요한 경계는 모두 남았습니다.”
- **오버레이:** 피사체 마스크·바운딩 박스, 잘린 경계 경고.
- **기하학적 측정:** 크롭 안 피사체 면적 비율, 피사체 보존율, 중요점과 가장자리 거리.
- **피사체 인식 필요:** 피사체 분할과 얼굴·관절·중요 부위 검출.
- **자동 평가가 어려운 부분:** 어느 정도의 타이트함이 사진의 목적에 적합한지.
- **출처:** [Adobe Fill the Frame](https://www.adobe.com/creativecloud/photography/technique/fill-the-frame.html), [Nikon USA](https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/top-10-photo-tips-for-better-images)

## 4.15 균형 구도 — Visual Balance

- **한 문장 정의:** 크기, 위치, 밝기, 색, 대비가 만드는 시각적 무게가 화면 한쪽으로 우연히 쏠리지 않도록 구성한다.
- **언제 좋은가:** 서로 크기가 다른 두 피사체, 한쪽의 큰 인물과 반대쪽 여백, 밝고 어두운 요소가 공존하는 장면.
- **사진에서 찾을 것:** 큰 요소, 밝은 요소, 채도가 높은 색, 강한 대비, 여백.
- **좋은 크롭 예시:**
  - 왼쪽의 큰 인물을 오른쪽의 작은 밝은 간판과 여백이 보완하도록 한다.
  - 아래쪽의 어두운 바위를 위쪽의 넓고 밝은 하늘과 균형 있게 나눈다.
- **좋지 않은 크롭 예시:** 왼쪽에 큰 피사체와 밝은 물체가 모두 몰리고 오른쪽에는 의미 없는 작은 공간만 남는다.
- **짧은 피드백:** “왼쪽의 큰 피사체를 오른쪽의 밝은 요소와 여백이 보완합니다.”
- **오버레이:** 사분면, 주석된 시각적 무게점, 좌우 무게 막대.
- **기하학적 측정:** 사람이 지정한 무게점의 모멘트, 사분면별 주석 가중치.
- **피사체 인식 필요:** 살리언시, 밝기·색 대비, 객체 중요도 추정.
- **자동 평가가 어려운 부분:** 색과 감정이 만드는 시각적 무게, 비대칭 균형의 심미성.
- **출처:** [Adobe](https://www.adobe.com/creativecloud/photography/technique/composition.html)

## 4.16 수평·수직 정렬 — Horizon and Vertical Alignment

- **한 문장 정의:** 바다·호수의 수평선과 건축물의 수직선이 의도 없이 기울어 보이지 않게 한다.
- **언제 좋은가:** 바다, 호수, 평야, 건물 정면, 실내 건축.
- **사진에서 찾을 것:** 긴 수평선, 주요 기둥과 벽, 의도적인 대각선 여부.
- **좋은 크롭 예시:**
  - 바다 수평선을 0도에 가깝게 유지하면서 아래쪽 1/3 선에 둔다.
  - 건물 중앙 기둥을 수직으로 보존하고 대칭축을 화면 중앙에 맞춘다.
- **좋지 않은 크롭 예시:** 바다가 2도 기울었지만 다른 선에는 대각선 의도가 없어 물이 흐르는 듯 보인다.
- **짧은 피드백:** “수평선 위치는 아래쪽 1/3에 가깝지만 원본이 2.1° 기울어져 있습니다.”
- **오버레이:** 주석 또는 검출 수평선, 중앙 수직선, 각도 숫자.
- **기하학적 측정:** 수평·수직선 각도, 목표선 위치, 크롭 중심과의 관계.
- **피사체 인식 필요:** 수평선·건축선 자동 검출과 의도적 대각선 분류.
- **자동 평가가 어려운 부분:** 현재 Cropper.js는 회전을 비활성화했기 때문에 사용자의 크롭만으로 원본 기울기를 고칠 수 없다.
- **출처:** [캐논코리아](https://kr.canon/magazine/detail/2866), [Canon Europe](https://www.canon-europe.com/get-inspired/tips-and-techniques/better-composition/), [Nikon USA](https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/5-easy-composition-guidelines)

---

## 5. 평가 가능성 구분

## A. 현재 기술로 비교적 객관적으로 평가 가능

단, 피사체·수평선 좌표는 사람이 `photos.json`에 미리 지정해야 한다.

- 사용자 크롭과 복수 기준 크롭의 최대 IoU
- 피사체 앵커와 삼등분 교차점 사이의 거리
- 피사체 중심과 이미지 중심 사이의 거리
- 주석된 수평선의 크롭 내부 위치
- 주석된 대칭축과 크롭 중심선의 거리
- 주석된 피사체 바운딩 박스의 보존율
- 주석된 시선 방향을 이용한 앞·뒤 여백 비율
- 주석된 전경·중경·배경의 크롭 후 면적 비율
- 크롭 면적 비율과 목표 범위
- 복수 피사체점의 포함 여부

### 중요한 제한

현재 Cropper 설정은 `rotatable: false`다. 따라서 사용자가 크롭으로 수평선의 **위치**는 바꿀 수 있지만 **기울기**는 바꿀 수 없다. 회전 기능을 추가하기 전에는 수평 기울기를 점수로 감점하지 말고 사진 선택 단계의 품질 조건 또는 정보성 피드백으로만 사용해야 한다.

## B. 이미지 분석 또는 수동 고급 주석이 필요

- 얼굴, 눈, 사람, 동물, 차량 위치
- 시선 및 이동 방향
- 선, 곡선, 소실점
- 자연 프레임
- 패턴과 반복 단위
- 시각적 무게와 방해 요소
- 의미 기반 전경·중경·배경

현재 버전에서 이 항목을 사용하려면 자동 검출이 아니라 사람이 입력한 `annotations`를 쓴다고 명시해야 한다.

## C. 객관적인 단일 점수로 평가하기 어려움

- 사진의 감정과 이야기
- 작가의 실제 의도
- 색채의 심미성
- 창의적인 규칙 파괴
- 황금나선이 실제로 시선을 유도하는 정도
- 비대칭 균형이 주는 미묘한 인상

이 항목은 점수보다 “다른 해석 가능성” 또는 코치 설명으로 제공한다.

---

## 6. 제안 점수 구조

총점은 하나의 고정 공식이 아니라 사진별로 활성화된 항목만 계산한다.

| 점수 항목 | 기본 배점 | 근거 |
|---|---:|---|
| 목표 구도 일치도 | 35 | 해당 사진에 지정된 삼등분, 중앙, 대칭 등의 핵심 목표 |
| 피사체 보존 | 20 | 주 피사체와 중요 부위가 잘리지 않았는지 |
| 수평·정렬 | 15 | 해당 사진에서 사용자가 바꿀 수 있는 위치·축 정렬 |
| 여백과 균형 | 15 | 시선 여백, headroom, 목표 공간 비율 |
| 기준 크롭 유사도 | 15 | 복수 추천 크롭 중 가장 가까운 안과의 IoU |

### 비활성 항목 처리

```text
총점 = Σ(활성 항목 점수 × 가중치) / Σ(활성 가중치)
```

예를 들어 수평선이 없는 인물 사진은 수평 점수를 0점 처리하지 않고 해당 항목을 분모에서 제외한다.

### 기준 크롭 유사도

```text
referenceScore = max(IoU(userCrop, referenceCrop[i]))
```

복수 추천안 중 최고값을 사용한다. IoU는 안전망이지 미학의 정답이 아니므로 총점의 15% 정도만 반영한다.

### 삼등분 거리

크롭 결과 안에서 피사체 앵커를 다시 정규화한다.

```text
localX = (subjectX - cropX) / cropWidth
localY = (subjectY - cropY) / cropHeight
distance = 가장 가까운 (1/3 또는 2/3) 교차점과의 유클리드 거리
```

사진별 허용 오차의 초기값:

- `distance <= 0.06`: 매우 잘 맞음
- `0.06 < distance <= 0.12`: 잘 맞음
- `0.12 < distance <= 0.20`: 개선 가능
- `distance > 0.20`: 목표 구도와 거리가 큼

이 수치는 사용자 테스트 후 조정한다.

### 피사체 보존

```text
subjectPreservation =
  area(intersection(subjectBBox, userCrop)) / area(subjectBBox)
```

얼굴이나 관절처럼 특히 중요한 점은 `criticalPoints`로 별도 검사한다.

### 시선 여백

오른쪽을 보는 피사체라면:

```text
frontSpace = cropRight - subjectRight
backSpace = subjectLeft - cropLeft
leadRoomRatio = frontSpace / max(backSpace, epsilon)
```

전역 기준을 강제하지 않고 사진별 `target.frontBackRatio`를 사용한다.

### 설명 가능한 결과 예

- “강아지 중심이 오른쪽 삼등분선에서 4% 떨어져 목표 범위 안에 있습니다.”
- “강아지 앞쪽 여백은 뒤쪽의 1.3배입니다.”
- “주 피사체의 98%가 남았지만 꼬리 끝이 프레임에 가깝습니다.”
- “세 추천안 중 환경형 크롭과 IoU 0.76으로 가장 비슷합니다.”

---

## 7. `photos.json` 하위 호환 확장안

기존 필드는 유지하고 새 필드를 모두 선택 사항으로 추가한다. 아래 값은 구조 설명용 예시이며 실제 sample2 주석값으로 확정한 것이 아니다.

```json
{
  "id": 2,
  "image": "sample2.jpg",
  "mission": "Rule of Thirds & Lead Room",
  "difficulty": 2,
  "tip": "Place the dog near the right-third line and leave open beach in its gaze direction.",

  "targetCompositions": [
    {
      "type": "rule-of-thirds",
      "weight": 0.55,
      "target": {
        "anchors": ["top-right", "bottom-right"],
        "tolerance": 0.12
      }
    },
    {
      "type": "look-room",
      "weight": 0.45,
      "target": {
        "frontBackRatio": 1.25,
        "tolerance": 0.20
      }
    }
  ],

  "referenceCrops": [
    {
      "x": 0.0,
      "y": 0.255,
      "width": 0.929,
      "height": 0.606,
      "reason": "The dog sits near the right third with open beach in its gaze direction."
    }
  ],

  "annotations": {
    "subjects": [
      {
        "id": "dog",
        "role": "primary",
        "bbox": {
          "x": 0.45,
          "y": 0.39,
          "width": 0.44,
          "height": 0.52
        },
        "anchor": { "x": 0.66, "y": 0.55 },
        "lookDirection": "left",
        "criticalPoints": []
      }
    ],
    "horizon": {
      "y": 0.40,
      "angleDegrees": 0.0,
      "source": "manual"
    },
    "symmetryAxisX": null,
    "layers": [],
    "lines": [],
    "frames": [],
    "reviewStatus": "manual-draft"
  },

  "evaluation": {
    "weights": {
      "targetComposition": 35,
      "subjectPreservation": 20,
      "alignment": 0,
      "spaceAndBalance": 30,
      "referenceSimilarity": 15
    },
    "referenceMode": "best-match",
    "allowAlternativeComposition": true
  },

  "feedback": {
    "success": [
      "강아지를 오른쪽 삼등분선 가까이에 두고 시선 방향의 해변을 남겼습니다."
    ],
    "improve": [
      "강아지 얼굴 앞쪽 공간을 조금 더 남겨 보세요."
    ]
  },

  "sources": [
    {
      "name": "Flickr photo page",
      "url": "https://www.flickr.com/photos/juanmarin/6356033521/",
      "role": "image"
    },
    {
      "name": "Canon wildlife photography tips",
      "url": "https://www.canon-europe.com/get-inspired/tips-and-techniques/wildlife-photography-tips/",
      "role": "composition-guidance"
    }
  ]
}
```

### 좌표 규칙

- 저장: 원본 이미지 기준 0~1 정규화 좌표.
- Cropper.js 입력: 현재처럼 원본 픽셀 좌표.
- 평가 직전 변환:

```js
function normalizeCrop(cropData, imageWidth, imageHeight) {
    return {
        x: cropData.x / imageWidth,
        y: cropData.y / imageHeight,
        width: cropData.width / imageWidth,
        height: cropData.height / imageHeight
    };
}
```

### 기존 데이터와의 호환

- `targetCompositions`가 없으면 기존 또는 기준 크롭 중심의 폴백 평가를 사용한다.
- `annotations`가 없는 항목은 계산하지 않고 가중치를 재정규화한다.
- 현재 `referenceCrops`는 그대로 사용한다.
- 기존 `mission`, `difficulty`, `tip`은 화면 표시용으로 유지한다.

---

## 8. UI 오버레이 제안

| 구도 | 오버레이 | 현재 구현 난도 |
|---|---|---|
| 삼등분할 | 3×3 격자와 네 교차점 | 낮음 |
| 중앙 | 중앙선과 중심점 | 낮음 |
| 대칭 | 사진별 대칭축 | 낮음, 수동 주석 필요 |
| 리딩 라인 | 선분·화살표·소실점 | 중간, 수동 주석 필요 |
| 대각선 | 양 대각선과 주선 | 낮음 |
| 황금비 | 회전 가능한 황금나선 | 중간 |
| 프레임 속 프레임 | 외부 프레임 윤곽 | 중간, 수동 주석 필요 |
| 여백 | 피사체와 여백 영역 | 중간, 수동 주석 필요 |
| 시선 여백 | 방향 화살표와 앞·뒤 여백 | 낮음, 수동 주석 필요 |
| 전·중·배경 | 세 영역 반투명 표시 | 중간, 수동 주석 필요 |
| 삼각형 | 세 점과 연결선 | 낮음, 수동 주석 필요 |
| S자 | 폴리라인과 방향 화살표 | 중간, 수동 주석 필요 |
| 패턴 | 반복 단위 박스 | 중간, 수동 주석 필요 |
| 채우기 | 피사체 박스와 잘림 경고 | 낮음, 수동 주석 필요 |
| 균형 | 사분면과 무게점 | 높음 |
| 수평·수직 | 기준선과 각도 | 낮음, 선 주석 필요 |

### 결과 화면 권장 순서

1. 총점
2. 세부 점수 3~5개
3. 가장 잘한 점 한 문장
4. 가장 먼저 고칠 점 한 문장
5. 사용자 크롭 위 목표 오버레이
6. 복수 코치 크롭과 각 이유
7. “다른 구도도 가능함” 안내

---

## 9. 사진 선정 기준

구도별 게임 사진을 찾을 때 다음 조건을 우선한다.

1. 원본에서 개선할 문제가 한눈에 보인다.
2. 크롭만으로 목표 구도가 만들어진다.
3. 목표 구도를 좌표·선·영역으로 주석할 수 있다.
4. 크롭 전후의 변화가 충분하지만 해상도가 지나치게 낮아지지 않는다.
5. 여러 구도 규칙을 동시에 억지로 평가하지 않는다.
6. 사용 허가와 재배포 조건이 명확하다.
7. 출처·작가·라이선스·변경 사실을 사진 데이터와 연결한다.

### 현재 샘플과 잘 맞는 목표

| 샘플 | 우선 목표 | 보조 목표 |
|---|---|---|
| sample2 강아지 | 시선 여백 | 삼등분할, 피사체 보존 |
| sample3 인물 | 중앙 구도 | 수평 정렬 |
| sample4 아트리움 | 프레임 속 프레임 | 중앙, 반복 |
| sample6 바다 | 여백 구도 | 수평선 위치 |
| sample7 산 풍경 | 삼등분할 | 수평선·산등성이 위치 |
| sample8 빨간 오두막 | 피사체 분리·채우기 | 삼등분할, 전경 비율 |

---

## 10. 저작권 및 시각 자료 정책

- Canon, Adobe, Nikon 페이지의 사진은 조사 참고용으로만 본다.
- 공식 페이지 이미지를 프로젝트에 복사하거나 hotlink하지 않는다.
- 구도 설명에는 핵심 원리를 요약하고 원문 URL을 연결한다.
- 게임용 사진은 직접 촬영, 명시적 사용 허가, CC BY·CC BY-SA·CC0 등 조건이 확인된 자료만 사용한다.
- 크롭은 변형에 해당할 수 있으므로 작가, 원본 URL, 라이선스, 변경 사실을 표시한다.
- 라이선스가 불명확한 이미지는 `reference-only`로 분류하고 게임 자산에 넣지 않는다.
- 구도 시각화는 기존 게임 자산 위에 Canvas/CSS 오버레이를 그리는 방식을 우선한다.

이번 조사에서는 공식 페이지의 사진을 프로젝트로 다운로드하지 않았다.

---

## 11. 다음 구현 단계에서 수정될 파일

이 목록은 제안이며 아직 적용하지 않는다.

| 파일 | 예정 변경 |
|---|---|
| `assets/data/photos.json` | 선택적 `targetCompositions`, `annotations`, `evaluation`, `feedback`, `sources` 추가 |
| `js/game.js` | 픽셀→정규화 변환, 사진별 평가기 호출, 세부 점수 저장 |
| `js/composition-score.js` | 순수 함수 기반 구도 평가 모듈 신설 |
| `js/result.js` | 세부 점수·근거·오버레이 렌더링 |
| `result.html` | 세부 점수와 오버레이 컨테이너 |
| `css/result.css` | 세부 점수 및 오버레이 스타일 |
| `tests/composition-score.test.js` | 구도별 기하 평가 단위 테스트 |

### 단계별 구현 계획

1. 공통 좌표 변환과 사각형 IoU를 순수 함수로 분리한다.
2. `sample2`, `sample3`, `sample6`, `sample8` 네 장만 수동 주석한다.
3. 삼등분할, 중앙, 피사체 보존, 시선 여백, 수평선 위치, 기준 크롭 유사도만 구현한다.
4. 사진별 활성 항목의 가중치를 재정규화한다.
5. 결과 화면에 총점보다 세부 근거를 먼저 연결한다.
6. 기존 메타데이터가 없는 사진은 현재 점수 또는 기준 크롭 폴백을 사용한다.
7. 1차 사용자 테스트 후 허용 오차와 가중치를 조정한다.
8. 리딩 라인·프레임·패턴·황금나선은 별도 단계로 추가한다.

---

## 12. 최소 테스트 설계

구현 단계에서 각 규칙은 적어도 성공 1개와 실패 1개를 확인한다.

| 구도 | 성공 사례 | 실패 사례 |
|---|---|---|
| 삼등분할 | 앵커가 교차점 0.06 이내 | 앵커가 모든 목표점에서 0.20 초과 |
| 중앙 | 중심 거리 0.05 이내 | 중심 거리 0.20 초과 |
| 대칭 | 대칭축과 중앙선 거의 일치 | 축이 한쪽으로 크게 이동 |
| 리딩 라인 | 선과 목표점 모두 보존 | 선 끝 또는 목표점 잘림 |
| 대각선 | 주선 보존율 90% 이상 | 주선 대부분 잘림 |
| 황금나선 | 주석 중심점 근접 | 중심점은 맞지만 곡선 없음 |
| 프레임 | 외곽 프레임과 피사체 보존 | 프레임 한 변 또는 얼굴 잘림 |
| 여백 | 목표 피사체 면적·여백 범위 충족 | 방해 요소 또는 과도한 잘림 |
| 시선 여백 | 앞/뒤 비율 목표 충족 | 얼굴 앞 공간이 뒤보다 좁음 |
| 전·중·배경 | 세 영역 최소 보존율 충족 | 한 층 완전 제거 |
| 삼각형 | 세 점 모두 포함 | 한 점 잘림 |
| S자 | 시작·끝·굴곡 보존 | 시작점 잘림 |
| 패턴 | 완전한 반복 단위 유지 | 경계에서 여러 단위 잘림 |
| 채우기 | 면적 목표와 보존율 모두 충족 | 중요 부위 잘림 |
| 균형 | 수동 무게점 모멘트 범위 충족 | 한쪽 무게 과도 |
| 수평·수직 | 목표 위치 충족 | 목표선이 중앙에 애매하게 위치 |

수평 **기울기** 테스트는 회전 기능을 추가할 때 별도로 작성한다.

---

## 13. 핵심 참고 자료

- [캐논코리아 — 삼등분할 구도를 활용한 풍경사진 촬영 노하우](https://kr.canon/magazine/detail/2866)
- [Canon Europe — Improve the composition of your photos](https://www.canon-europe.com/get-inspired/tips-and-techniques/better-composition/)
- [Canon Europe — Composition tips for city photography](https://www.canon-europe.com/get-inspired/tips-and-techniques/composition-tips-urban-cityscapes/)
- [Canon Europe — Wildlife photography tips](https://www.canon-europe.com/get-inspired/tips-and-techniques/wildlife-photography-tips/)
- [Adobe — The basics of photography composition](https://www.adobe.com/creativecloud/photography/technique/composition.html)
- [Adobe — A guide to leading lines in photography](https://www.adobe.com/creativecloud/photography/technique/leading-lines.html)
- [Adobe — Foreground, middle ground, and background](https://www.adobe.com/creativecloud/photography/hub/guides/foreground-middleground-background.html)
- [Adobe — Fill the frame photography](https://www.adobe.com/creativecloud/photography/technique/fill-the-frame.html)
- [Nikon USA — 5 Easy Composition Guidelines](https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/5-easy-composition-guidelines)
- [Nikon USA — When Center Composition can Elevate a Portrait](https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/when-center-composition-can-elevate-a-portrait)
- [Nikon USA — Top 10 Photo Tips For Better Images](https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/top-10-photo-tips-for-better-images)
