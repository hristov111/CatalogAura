# Starting the AI Backend

## ✅ CORS Fixed!

I've updated the `.env` file in your AI Service to allow requests from `http://localhost:4200`.

**Updated CORS Origins:**
```
CORS_ORIGINS=http://localhost:4200,http://localhost:3000,http://localhost:8080,http://66.42.93.128
```

---

## 🚀 Start the AI Backend

### Option 1: Using Python directly
```bash
cd "/home/bean12/Desktop/AI Service"
source venv/bin/activate   # Activate virtual environment
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Option 2: Using the startup script (if you have one)
```bash
cd "/home/bean12/Desktop/AI Service"
./start.sh   # Or whatever your startup script is called
```

### Option 3: Using docker (if configured)
```bash
cd "/home/bean12/Desktop/AI Service"
docker-compose up
```

---

## ✅ Verify It's Running

Once started, you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

Test the health endpoint:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": true,
  "llm": true,
  "timestamp": "2024-03-01T10:30:00Z"
}
```

---

## 🎯 Next Steps

After starting the AI backend:

1. **Keep it running** in a terminal
2. **Refresh your Angular frontend** at `http://localhost:4200`
3. **Login** and navigate to `/user/profile`
4. **Open the chat** and send a message
5. **Watch it work!** ✨

---

## 🐛 Still Getting CORS Errors?

If you still see CORS errors after restarting:

1. **Hard refresh** the browser: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. **Clear browser cache** for localhost
3. **Check the AI backend logs** for startup messages
4. **Verify** the backend is listening on port 8000:
   ```bash
   lsof -i :8000
   ```

---

## 📝 Environment Variables

Make sure these are set in `/home/bean12/Desktop/AI Service/.env`:

- `CORS_ORIGINS` - ✅ Already updated!
- `JWT_SECRET_KEY` - Your JWT secret
- `OPENAI_API_KEY` - Your OpenAI API key (or LM Studio config)
- `POSTGRES_URL` - Your database connection string

---

**You're almost there!** 🎉


