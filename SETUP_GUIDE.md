# Momentum Setup Guide - FREE/LOW-COST Version

> Complete step-by-step guide to set up Momentum using **FREE** services

## 🎯 What You Need (All FREE)

- ✅ **Supabase** - PostgreSQL Database (FREE tier: unlimited API requests)
- ✅ **Google Gemini** - AI Assistant (FREE tier: 15 requests/min)
- ✅ **Grok API** - Alternative AI (if available)
- ⚡ **Google OAuth** - Social Login (Optional, FREE)
- 🔊 **Web Speech API** - Voice-to-text (Built-in browser, FREE)

---

## Step 1: Supabase Database Setup ✅

You already have Supabase! Let's get the database URL.

### 1.1 Get Your Database Connection String

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `ovoozbzqndsaedvkdwpk`
3. Click **Settings** (gear icon in sidebar)
4. Click **Database**
5. Scroll to **Connection String** section
6. Select **URI** tab
7. Copy the connection string that looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.ovoozbzqndsaedvkdwpk.supabase.co:5432/postgres
   ```

8. **Important**: Replace `[YOUR-PASSWORD]` with your actual database password

### 1.2 Update Your .env File

Open `/home/mithun/Desktop/projects/momentum/.env` and update:

```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.ovoozbzqndsaedvkdwpk.supabase.co:5432/postgres"
```

---

## Step 2: Generate NEXTAUTH_SECRET 🔐

This is for secure authentication sessions.

### Run this command in terminal:

```bash
cd ~/Desktop/projects/momentum
openssl rand -base64 32
```

**Copy the output** and add to `.env`:

```bash
NEXTAUTH_SECRET="paste-the-output-here"
```

---

## Step 3: Google Gemini API (FREE) 🤖

Google Gemini is **FREE** with generous limits!

### 3.1 Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Click **"Create API key in new project"**
5. Copy the API key (starts with `AIza...`)

### 3.2 Add to .env

```bash
GEMINI_API_KEY="AIza...your-key-here"
```

**Gemini Free Tier Limits**:
- ✅ 15 requests per minute
- ✅ 1,500 requests per day
- ✅ 1 million tokens per minute
- **Cost**: $0 (completely FREE!)

---

## Step 4: Grok API (Optional) 🚀

Grok is from xAI and may have free tier or credits.

### 4.1 Get Grok API Access

1. Go to [xAI Console](https://console.x.ai/) or [xAI Developer Portal](https://x.ai/)
2. Sign up/Sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key

### 4.2 Add to .env

```bash
GROK_API_KEY="xai-...your-key-here"
```

> **Note**: If Grok requires payment or you can't access it, **skip this step**. Gemini alone is sufficient!

---

## Step 5: Google OAuth (Optional but Recommended) 🔑

This allows users to sign in with Google. **FREE** to set up.

### 5.1 Create Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** > **Credentials**
4. Click **"Create Credentials"** > **"OAuth 2.0 Client ID"**
5. If prompted, configure **OAuth consent screen**:
   - User Type: **External**
   - App name: **Momentum**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Click **Save and Continue** (no scopes needed)
   - Test users: Add your email
   - Click **Save and Continue**

6. Back to **Create OAuth Client ID**:
   - Application type: **Web application**
   - Name: **Momentum Web**
   - Authorized JavaScript origins:
     - `http://localhost:3000`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
   - Click **Create**

7. Copy **Client ID** and **Client Secret**

### 5.2 Add to .env

```bash
GOOGLE_CLIENT_ID="123456789-abcdef.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxx"
```

> **Skip this step** if you want email/password only. You can add it later!

---

## Step 6: Your Complete .env File 📝

Here's what your `.env` file should look like:

```bash
# Database (Supabase - FREE)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.ovoozbzqndsaedvkdwpk.supabase.co:5432/postgres"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-from-openssl"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-client-id-here"
GOOGLE_CLIENT_SECRET="your-client-secret-here"

# AI - Google Gemini (FREE)
GEMINI_API_KEY="AIza...your-key-here"

# AI - Grok (Optional)
GROK_API_KEY="xai-...your-key-here"

# App Configuration
NODE_ENV="development"
```

---

## Step 7: Install Dependencies & Run Migrations 🚀

Now let's set up the database and start the app!

### 7.1 Install Dependencies (if not done)

```bash
cd ~/Desktop/projects/momentum
npm install
```

### 7.2 Generate Prisma Client

```bash
npm run db:generate
```

### 7.3 Push Schema to Database

This creates all tables in your Supabase database:

```bash
npm run db:push
```

You should see output like:
```
✔ Generated Prisma Client
🚀 Applying schema changes to database...
✅ Database synchronized successfully
```

### 7.4 (Optional) View Database in Prisma Studio

```bash
npm run db:studio
```

This opens a GUI at `http://localhost:5555` to view your database.

---

## Step 8: Start Development Server 🎉

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🎯 Verification Checklist

Run through this checklist to make sure everything works:

- [ ] `.env` file has all required values
- [ ] `npm install` completed successfully
- [ ] `npm run db:generate` worked
- [ ] `npm run db:push` synchronized database
- [ ] `npm run dev` starts without errors
- [ ] Can access http://localhost:3000

---

## 🆓 Cost Breakdown

| Service | Free Tier | What We Use | Cost |
|---------|-----------|-------------|------|
| **Supabase** | 500MB database, Unlimited API | PostgreSQL database | **$0** |
| **Google Gemini** | 1500 requests/day | AI assistant & chat | **$0** |
| **Grok** | TBD (may have free tier) | Alternative AI | **$0-?** |
| **Google OAuth** | Unlimited | Social login | **$0** |
| **Web Speech API** | Built-in browser | Voice-to-text | **$0** |
| **Vercel** | Hobby plan | Deployment (later) | **$0** |

**Total Cost**: **$0** 🎉

---

## 🚨 Troubleshooting

### Database Connection Error
```
Error: P1001: Can't reach database server
```
**Solution**: Check your `DATABASE_URL` password is correct

### Prisma Generate Error
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm run db:generate
```

### Port 3000 Already in Use
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9
# Or use different port
npm run dev -- -p 3001
```

---

## 📚 What's Next?

After setup is complete, I'll build:
1. **Checkpoint 2**: Authentication UI (Sign In, Sign Up pages)
2. **Checkpoint 3**: Main Dashboard with navigation
3. **Checkpoint 4**: Habit tracking calendar
4. **Checkpoint 5**: Journal editor with voice input
5. And more...

---

## 🆘 Need Help?

If you get stuck on any step, let me know:
- What command you ran
- What error you're seeing
- Screenshot if helpful

I'm here to help! 🚀
