# LAN Testing Guide 📱

This guide explains how to test the Food Delivery app on mobile devices connected to the same Wi-Fi network.

## Prerequisites

- Backend and Frontend running on your computer
- Mobile device connected to the **same Wi-Fi** as your computer
- Windows Firewall may need to allow Node.js/Vite through

---

## Quick Start

### 1. Start Backend Server

```bash
cd backend
npm run server
```

**Look for the Network IP in the console:**

```
========================================
🚀 Server Started Successfully!
========================================
📍 Local:    http://localhost:4000
📍 Network:  http://192.168.x.x:4000    <-- Use this IP!
========================================
📱 For Mobile Testing, use: http://192.168.x.x:4000
========================================
```

### 2. Update Frontend `.env`

Create or update `frontend/.env`:

```env
VITE_API_URL=http://192.168.x.x:4000
```

(Replace `192.168.x.x` with the actual IP from step 1)

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

Vite will show:

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/  <-- Use this on mobile!
```

### 4. Access on Mobile

Open your mobile browser and go to:

```
http://192.168.x.x:5173
```

---

## Troubleshooting

### "Connection Refused" on Mobile

1. **Check Windows Firewall:**

   - Allow Node.js through firewall
   - Allow ports 4000 and 5173

2. **Restart the servers** after `.env` changes

3. **Verify same Wi-Fi:**
   - Computer and mobile must be on the same network
   - Some routers have "Client Isolation" that blocks this

### IP Address Changed?

Your local IP may change when:

- Reconnecting to Wi-Fi
- Router restarts
- Switching networks

**Safe Workflow:**

1. Press `Ctrl+C` to stop backend
2. Check new IP printed when restarting
3. Update `VITE_API_URL` in `.env`
4. Restart frontend (`npm run dev`)

---

## Security Notes

⚠️ **Development Only Settings:**

The current configuration uses:

- `CORS: origin: "*"` (allows all origins)
- `host: "0.0.0.0"` (listens on all interfaces)

**Before Production:**

1. Restrict CORS to specific domains
2. Use environment-based configuration
3. Remove `0.0.0.0` binding

---

## Commands Summary

| Action         | Command                        |
| -------------- | ------------------------------ |
| Start Backend  | `cd backend && npm run server` |
| Start Frontend | `cd frontend && npm run dev`   |
| Start Admin    | `cd admin && npm run dev`      |
| Stop Server    | `Ctrl+C` (graceful shutdown)   |
