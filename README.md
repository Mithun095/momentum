# Momentum

> Your personal life management platform - Track habits, journal your thoughts, plan your days, and achieve your goals with AI assistance.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Features

### ✅ Habit Tracking
- Create unlimited habits with custom frequencies
- Visual calendar interface for tracking completions
- Progress analytics with charts and streak tracking
- Category-based organization

### 📔 Smart Journal & Diary
- Daily journal entries with rich text editor
- Voice-to-text integration for hands-free journaling
- Optional sections:
  - **Mistakes Done**: Reflect and learn
  - **Good Things**: Celebrate wins
  - **Tomorrow's Planner**: Auto-converts to daily tasks

### 📋 Task & Planning System
- Task management with priorities and due dates
- Automatic task creation from journal planner
- Reminders and notifications
- Recurring tasks support

### 🤖 AI Personal Assistant
- Natural language commands
- Full data access (with your consent)
- Create habits, add tasks, set reminders via chat
- Personalized insights and recommendations

### 👥 Collaborative Features
- Team workspaces for shared habit tracking
- Perfect for HR and company wellness programs
- Team analytics and progress reports
- Role-based access control

### 📊 Advanced Analytics
- Weekly/monthly progress reports
- Habit correlation analysis
- Productivity heatmaps
- Customizable dashboards

### 🎨 Theming
- **Light Mode**: Clean and professional
- **Dark Mode**: Easy on the eyes
- **Crazy Mode**: Dynamic animations and vibrant effects

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui, Framer Motion
- **Backend**: tRPC, Next.js API Routes
- **Database**: PostgreSQL (Prisma ORM)
- **Authentication**: NextAuth.js (Google OAuth + Email/Password)
- **AI**: OpenAI GPT-4, LangChain
- **Caching**: Redis
- **Vector DB**: Pinecone (for AI context)

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd momentum
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for development)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: From Google Cloud Console

Optional (for full features):
- `OPENAI_API_KEY`: For AI assistant
- `PINECONE_API_KEY`: For AI context storage
- `DEEPGRAM_API_KEY`: For voice-to-text

### 4. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed the database
npm run db:seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
momentum/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth routes
│   │   │   └── trpc/          # tRPC routes
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   └── auth/              # Auth pages
│   ├── components/            # React components
│   │   ├── ui/                # Base UI components
│   │   ├── habits/            # Habit-related components
│   │   ├── journal/           # Journal components
│   │   └── tasks/             # Task components
│   ├── lib/                   # Utility libraries
│   │   ├── auth.config.ts     # NextAuth configuration
│   │   ├── db.ts              # Prisma client
│   │   ├── encryption.ts      # Encryption utilities
│   │   └── trpc/              # tRPC client setup
│   ├── server/                # Server-side code
│   │   └── api/               # tRPC API definition
│   │       ├── routers/       # Feature routers
│   │       ├── root.ts        # Main router
│   │       └── trpc.ts        # tRPC initialization
│   └── types/                 # TypeScript types
└── public/                    # Static files
```

## 🔒 Security

- **Authentication**: Secure JWT-based sessions with NextAuth.js
- **Encryption**: AES-256-GCM for sensitive data at rest
- **Password Hashing**: bcrypt with 12 rounds
- **HTTPS**: TLS 1.3 for data in transit
- **CSRF Protection**: Built-in with NextAuth
- **XSS Prevention**: React's automatic escaping + CSP headers

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Run all tests
npm run test:all
```

## 🚀 Deployment

### Database Setup
1. Create a PostgreSQL database (Supabase, Neon, or Railway)
2. Update `DATABASE_URL` in production environment

### Deploy with Docker (Self-Hosted)
1. Ensure Docker and Docker Compose are installed.
2. Update `docker-compose.prod.yml` with your production secrets (or use an `.env` file).
3. Run the container:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Deploy to Vercel
```bash
npm run build
vercel --prod
```

## 📝 Environment Variables

See `.env.example` for all available environment variables.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [tRPC](https://trpc.io/)
- [Shadcn/ui](https://ui.shadcn.com/)

## 📞 Support

For support, email support@momentum.app or join our Discord community.

---

Built with ❤️ by the Momentum team
