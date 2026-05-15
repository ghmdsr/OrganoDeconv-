# OrganoDeconv Frontend

Organ-specific bulk RNA-seq deconvolution 웹 UI (React + Vite).

## 요구 사항

- Node.js 18+
- npm

## 설치 및 실행

```bash
npm install
cp .env.example .env   # 필요 시 VITE_API_URL 수정
npm run dev
```

개발 서버 기본 포트: **5173**. API는 `/api` 경로로 Vite 프록시를 통해 백엔드(`localhost:5188`)에 연결됩니다.

## 환경 변수

| 변수 | 설명 |
|------|------|
| `VITE_API_URL` | 비우면 `/api` (프록시). 설정 시 해당 URL로 API 요청 |

## 빌드

```bash
npm run build
npm run preview
```

## 백엔드

FastAPI 백엔드는 별도 저장소/경로에서 실행합니다. 로컬 개발 시 백엔드를 `5188` 포트에서 띄운 뒤 프론트를 실행하세요.
