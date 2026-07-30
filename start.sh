#!/bin/bash

echo "🏥 Starting NIGHTINGALE..."

# Start backend
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Start frontend
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Backend: http://localhost:8000"
echo "✅ Frontend: http://localhost:3000"
echo ""
echo "📱 To open iOS simulator:"
echo "   cd frontend && npx cap open ios"
echo ""
echo "Press Ctrl+C to stop everything"

wait
