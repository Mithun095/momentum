# 🚀 Quick Start Checklist

Complete these steps in order to get Momentum running:

## ⚡ Quick Actions (5 minutes)

### 1. Generate NEXTAUTH_SECRET
```bash
cd ~/Desktop/projects/momentum
openssl rand -base64 32
```
**→ Copy the output and paste it in `.env` file**

---

### 2. Get Your Supabase Password

Since you already have Supabase set up, get your database password:

1. Go to: https://app.supabase.com/project/ovoozbzqndsaedvkdwpk/settings/database
2. Find "Database password" or "Connection String"
3. Copy your password

**→ Update `.env` file:**
```bash
DATABASE_URL="postgresql://postgres:YOUR-ACTUAL-PASSWORD@db.ovoozbzqndsaedvkdwpk.supabase.co:5432/postgres"
```

Replace `YOUR-ACTUAL-PASSWORD` with your actual password!

---

### 3. Get Gemini API Key (FREE - 2 minutes)

1. Go to: https://aistudio.google.com/app/apikey
2. Click "Get API Key"
3. Click "Create API key in new project"
4. Copy the key (starts with `AIza...`)

**→ Update `.env` file:**
```bash
GEMINI_API_KEY="AIza...paste-your-key-here"
```

---

### 4. Run Database Setup

```bash
cd ~/Desktop/projects/momentum

# Generate Prisma client
npm run db:generate

# Create tables in Supabase
npm run db:push
```

You should see: ✅ "Your database is now in sync with your Prisma schema."

---

### 5. Start the App!

```bash
npm run dev
```

Open: http://localhost:3000

---

## ✅ Your `.env` Should Look Like This:

```bash
# Supabase Database
DATABASE_URL="postgresql://postgres:your-real-password@db.ovoozbzqndsaedvkdwpk.supabase.co:5432/postgres"

# NextAuth (generated with openssl)
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"

# Google Gemini (FREE)
GEMINI_API_KEY="AIza...your-key-here"

# Optional for now
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GROK_API_KEY=""
```

---

## 🆘 Common Issues

### "Can't reach database server"
- Check your Supabase password is correct
- Make sure the connection string format is exact

### "NEXTAUTH_SECRET is not set"
- Run: `openssl rand -base64 32`
- Copy output to `.env`

### Port 3000 in use
```bash
lsof -ti:3000 | xargs kill -9
```

---

## 📝 Optional (Can Do Later)

- [ ] Set up Google OAuth (for Google Sign In)
- [ ] Get Grok API key (alternative AI)
- [ ] Set up vector database (for advanced AI features)

See **SETUP_GUIDE.md** for detailed instructions!

---

## ✅ You're Ready When:

- [ ] `.env` has DATABASE_URL with real password
- [ ] `.env` has NEXTAUTH_SECRET
- [ ] `.env` has GEMINI_API_KEY
- [ ] `npm run db:push` completed successfully
- [ ] `npm run dev` starts without errors
- [ ] http://localhost:3000 loads

**Let me know once you're at this point and I'll continue building!** 🚀
