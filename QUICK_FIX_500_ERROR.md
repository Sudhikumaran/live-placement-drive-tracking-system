# 🚀 Quick Fix - 500 Internal Server Error

## 3-Step Instant Fix

### Step 1: Start Fresh

```bash
cd server
npm install
```

### Step 2: Verify MongoDB

```bash
# Check if MongoDB URI is accessible
# The .env file should have MONGODB_URI set correctly
cat .env
```

### Step 3: Restart Server

```bash
npm run dev
```

---

## ⚡ If Still Getting 500 Error

### Option A: Use Local MongoDB

If using cloud MongoDB and it's not working:

1. Install MongoDB locally
2. Start MongoDB service
3. Update `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/placement-tracker
   ```
4. Restart server

### Option B: Check Specific Error

Look at server console output for the exact error. Common ones:

```
Error 1: "Cannot find module 'express'"
→ Solution: npm install

Error 2: "MONGODB_URI is not set"
→ Solution: Add to .env file

Error 3: "connect ECONNREFUSED 127.0.0.1:27017"
→ Solution: Start MongoDB service

Error 4: "Unauthorized: authentication failed"
→ Solution: Check MONGODB_URI credentials
```

### Option C: Test Each Component

```bash
# 1. Test Node
node --version

# 2. Test npm
npm --version

# 3. Test dependencies
npm list express mongoose

# 4. Test server starts
npm run dev
```

---

## 🔍 The Exact Problem

**Most Likely Cause:** MongoDB connection failure

**Why:** The server can't connect to the database, so any request that needs the database returns 500.

**Solution:**

1. Check MONGODB_URI in `.env` is correct
2. Verify MongoDB service is running
3. Check MongoDB credentials (if using cloud)
4. Restart the server

---

## 📝 .env File Checklist

Your `.env` MUST have:

```
MONGODB_URI=<your-connection-string>
JWT_SECRET=<any-random-string>
JWT_REFRESH_SECRET=<any-random-string>
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

✅ Check each one is present!

---

## 🎯 Testing After Fix

1. **Start server**

   ```bash
   npm run dev
   ```

2. **Check health endpoint**

   ```bash
   # In browser or terminal:
   http://localhost:5000
   ```

   Should return:

   ```json
   {
     "success": true,
     "message": "Live Placement Drive Tracker API",
     "version": "1.0.0"
   }
   ```

3. **Test in frontend**
   - Go to login page
   - Try logging in with: `admin@college.edu` / `admin123`
   - Should work now!

---

## 💬 If Still Stuck

Tell me:

1. **What's shown in server console?** (Copy the full error)
2. **What's the failed request?** (Check browser Network tab)
3. **What does `.env` contain?** (Just the keys, not values)

This helps identify the exact issue! 🔧
