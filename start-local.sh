#!/bin/bash
set -e

APP_ROOT="/workspace/0c85e0dc-1244-40ab-8f84-e11668f857da/sessions/agent_bf4c59d4-471c-4a73-9ce8-d5321b35d12c"

# Environment variables
export APP_DATA_DIRECTORY="${APP_ROOT}/app_data"
export TEMP_DIRECTORY="${APP_ROOT}/tmp/presenton"
export USER_CONFIG_PATH="${APP_DATA_DIRECTORY}/userConfig.json"
export PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"
export CAN_CHANGE_KEYS="true"

# Create required directories
mkdir -p "${APP_DATA_DIRECTORY}"
mkdir -p "${TEMP_DIRECTORY}"

echo "=== Starting Presenton ==="
echo "APP_DATA_DIRECTORY: ${APP_DATA_DIRECTORY}"
echo "TEMP_DIRECTORY: ${TEMP_DIRECTORY}"

# Start nginx
echo "Starting nginx..."
nginx -c "${APP_ROOT}/nginx-local.conf" 2>&1 || echo "nginx may already be running"
echo "nginx started on port 80"

# Start FastAPI server
echo "Starting FastAPI on port 8000..."
cd "${APP_ROOT}/servers/fastapi"
python3.11 server.py --port 8000 --reload false &
FASTAPI_PID=$!
echo "FastAPI PID: ${FASTAPI_PID}"

# Wait for FastAPI to be ready
echo "Waiting for FastAPI to start..."
for i in $(seq 1 30); do
    if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
        echo "FastAPI is ready"
        break
    fi
    sleep 1
done

# Start Next.js server
echo "Starting Next.js on port 3000..."
cd "${APP_ROOT}/servers/nextjs"
PORT=3000 npm run start -- -p 3000 &
NEXTJS_PID=$!
echo "Next.js PID: ${NEXTJS_PID}"

# Wait for Next.js to be ready
echo "Waiting for Next.js to start..."
for i in $(seq 1 60); do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "Next.js is ready"
        break
    fi
    sleep 1
done

echo ""
echo "========================================="
echo "  Presenton is running!"
echo "  Open http://localhost in your browser"
echo "========================================="
echo ""
echo "Services:"
echo "  - nginx:   port 80 (reverse proxy)"
echo "  - Next.js: port 3000"
echo "  - FastAPI: port 8000"
echo ""
echo "PIDs: nginx, FastAPI=${FASTAPI_PID}, Next.js=${NEXTJS_PID}"
echo ""

# Keep the script running and monitor processes
wait -n
EXIT_CODE=$?
echo "A process exited with code: ${EXIT_CODE}"
exit ${EXIT_CODE}
