# 500 Internal Server Error - Troubleshooting Guide

## Quick Diagnosis

### Step 1: Check Server Console

Run the server and look for error messages:

```bash
cd server
npm run dev
```

Look for messages like:

- `❌ MongoDB Connection Error` - Database not connected
- `Error: Cannot find module` - Missing dependency
- Specific error stack traces

### Step 2: Check Browser Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Reproduce the error
4. Click on the failing request
5. Go to Response tab to see the error message

### Step 3: Run Diagnostic

```bash
cd server
node diagnostic.js
```

This will check:

- ✅ Environment variables
- ✅ MongoDB connection
- ✅ Required dependencies
- ✅ File structure

---

## Common Issues & Solutions

### Issue 1: MongoDB Connection Failed

**Error Message:** `❌ MongoDB Connection Error`

**Solutions:**

1. **MongoDB not running locally**

   ```bash
   # On Windows - Start MongoDB
   mongod

   # Or check if service is running
   ```

2. **Cloud MongoDB connection issue**

   - Check `MONGODB_URI` in `.env`
   - Verify credentials are correct
   - Check IP whitelist in MongoDB Atlas
   - Ensure network access is allowed

3. **Connection string format**
   ```
   ✅ Correct: mongodb+srv://user:pass@cluster.mongodb.net/dbname
   ❌ Wrong: mongodb+srv://user:pass@cluster/dbname
   ```

### Issue 2: Missing Dependencies

**Error Message:** `Error: Cannot find module 'express'`

**Solution:**

```bash
cd server
npm install
```

If issue persists:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue 3: Missing Environment Variables

**Error Message:** `undefined` in responses or `Cannot read property of undefined`

**Solution:**

1. Create `.env` file in server directory
2. Add all required variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret
   PORT=5000
   NODE_ENV=development
   ```

### Issue 4: Port Already in Use

**Error Message:** `Port 5000 already in use`

**Solutions:**

```bash
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (Windows)
taskkill /PID <process-id> /F

# Or use a different port
# Add to .env: PORT=5001
```

### Issue 5: CORS Error

**Error:** Response blocked by CORS policy

**Solution:**
Ensure `.env` has correct `CLIENT_URL`:

```
CLIENT_URL=http://localhost:5173
```

And verify `server.js` CORS config uses it correctly.

### Issue 6: JWT Secret Not Set

**Error:** `JWT payload is invalid`

**Solution:**
Add to `.env`:

```
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-key-min-32-chars
```

---

## Specific Endpoint Issues

### Login Returns 500

**Possible causes:**

1. MongoDB down
2. User model not loaded
3. Password comparison failing

**Debug:**

```javascript
// Add console logs to authController.js
console.log("Login attempt:", { email });
console.log("User found:", user ? "yes" : "no");
console.log("Password match:", isPasswordCorrect);
```

### Register Returns 500

**Possible causes:**

1. Duplicate email (but should return 409)
2. Validation error
3. MongoDB save failure

**Debug:**

```javascript
console.log("Register data:", { name, email, department, cgpa });
console.log("User creation started");
```

### API Routes Return 404 → 500

**Possible causes:**

1. Wrong route path
2. Middleware not set up
3. Route not imported

**Check:**

```javascript
// In server.js
console.log("Routes loaded:");
console.log("  /api/auth");
console.log("  /api/drives");
console.log("  /api/applications");
// etc.
```

---

## Testing Endpoints with cURL

Test if server is working:

```bash
# Health check
curl http://localhost:5000

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "department": "Computer Science",
    "cgpa": 8.5
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## Enable Detailed Logging

### 1. Update Error Handler

Edit `middleware/errorHandler.js`:

```javascript
export const errorHandler = (err, req, res, next) => {
  console.error("❌ Error Details:");
  console.error("  Route:", req.method, req.originalUrl);
  console.error("  Message:", err.message);
  console.error("  Stack:", err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err.toString(),
    }),
  });
};
```

### 2. Add Request Logging

Edit `server.js`:

```javascript
// Add after middleware setup
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  next();
});
```

### 3. Check Each Route

Add logging to route files:

```javascript
router.post("/login", (req, res, next) => {
  console.log("🔐 Login route hit");
  // ... rest of handler
});
```

---

## Database Issues

### Test MongoDB Connection

```bash
# Connect to MongoDB
mongo "mongodb+srv://user:pass@cluster.mongodb.net"

# List databases
show databases

# Use placement-tracker db
use placement-tracker

# Check users collection
db.users.find()
```

### Reset Database

```bash
# Delete all data
db.users.deleteMany({})
db.placementdrives.deleteMany({})
db.applications.deleteMany({})

# Create indexes
db.users.createIndex({ email: 1 }, { unique: true })
```

---

## Step-by-Step Recovery

If nothing above works:

1. **Stop all services**

   ```bash
   # Kill server
   Ctrl+C
   ```

2. **Check logs**

   ```bash
   # Look at latest error messages in console
   ```

3. **Restart clean**

   ```bash
   cd server
   rm -rf node_modules
   npm install
   npm run dev
   ```

4. **Verify in browser**

   - Go to http://localhost:5000
   - Should see: `{ success: true, message: "...", version: "1.0.0" }`

5. **Test registration**
   - Go to http://localhost:5173/register
   - Fill form and submit
   - Check both console and network tab

---

## Getting Help

When reporting issues, include:

- [ ] Error message from browser console
- [ ] Error message from server console
- [ ] Request URL from Network tab
- [ ] Response body from Network tab
- [ ] Output from `npm run dev`
- [ ] Output from `node diagnostic.js`

---

## Quick Checklist

- [ ] MongoDB is running
- [ ] `.env` file exists with all variables
- [ ] `npm install` was run
- [ ] Port 5000 is free
- [ ] No syntax errors in server code
- [ ] NODE_ENV is set to development
- [ ] CLIENT_URL is correct
- [ ] JWT secrets are set

---

**Last Updated:** January 6, 2026
