# BananaWrite Development Guide

## Quick Start

### 1. Start the Flask Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The Flask server will run on `http://localhost:5000`

### 2. Start the Next.js Frontend

```bash
# From the root directory
npm run dev
```

The Next.js server will run on `http://localhost:3000`

## Environment Variables

### Frontend (Next.js)

Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_FLASK_API_URL=http://localhost:5000
```

For production, set this to your Railway backend URL.

## Project Structure

```
BananaWrite/
├── backend/                    # Flask API server
│   ├── app.py                  # Main Flask application
│   ├── routes/
│   │   └── prompt.py           # Prompt generation endpoint
│   ├── services/
│   │   └── ai_service.py       # AI/OpenAI integration
│   ├── requirements.txt        # Python dependencies
│   └── Procfile                # Railway deployment config
│
├── app/                        # Next.js pages
│   ├── dashboard/page.tsx      # User dashboard
│   └── write/page.tsx          # Essay writing interface
│
├── components/                 # React components
│   ├── Dashboard/              # Dashboard UI
│   ├── Loading/                # Interactive loader
│   └── Write/                  # Writing interface
│
├── hooks/                      # React hooks
│   ├── useUserSession.ts       # Firestore session management
│   ├── useStreamingPrompt.ts   # SSE streaming handler
│   └── useAutoSave.ts          # Auto-save functionality
│
├── lib/                        # Utilities
│   ├── firebase.ts             # Firebase configuration
│   └── firestore.ts            # Firestore helpers
│
└── types/                      # TypeScript types
    └── index.ts                # All type definitions
```

## API Endpoints

### Flask Backend

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate-prompt` | Generate essay prompt (SSE stream) |
| GET | `/api/writing-techniques` | Get all writing techniques |
| GET | `/api/technique/<index>` | Get technique by index |
| GET | `/api/health` | Health check |

## Deployment to Railway

### Backend (Flask)

1. Create a new Railway project
2. Connect your GitHub repository
3. Set the root directory to `backend`
4. Railway will auto-detect Python and use the Procfile

### Frontend (Next.js)

1. Create another Railway service in the same project
2. Set the root directory to the project root
3. Set environment variable: `NEXT_PUBLIC_FLASK_API_URL=<backend-url>`
4. Railway will auto-detect Next.js

## Features Implemented

- [x] Flask backend with SSE streaming
- [x] Firebase Authentication (existing)
- [x] Firestore session management
- [x] Dashboard with Start/Continue button
- [x] Interactive loading screen with physics-based orbs
- [x] Streaming prompt generation
- [x] Essay writing interface
- [x] Word counter (300 word minimum)
- [x] Auto-save (every 30 seconds)
- [x] Session persistence
- [x] Submit essay flow

## Future Features (Not Yet Implemented)

- [ ] Essay review by AI
- [ ] Quiz generation
- [ ] Quiz taking interface (one question at a time)
- [ ] Grading system
- [ ] Teacher feedback
- [ ] Lesson progression after quiz





