
# Contributing to Momentum

Thank you for your interest in contributing to Momentum! We welcome contributions from the community to help make this the best life management platform.

## 🛠️ Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/momentum.git
   cd momentum
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env` and configure your database and API keys.

4. **Initialize Database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🧪 Testing

Please ensure all tests pass before submitting a PR.
```bash
npm test
npm run lint
```

## 📝 Code Style
- We use **TypeScript** for strict type safety.
- **Tailwind CSS** for styling.
- **Prettier** for formatting.

## 🤝 Pull Request Process
1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes.
4. Make sure your code lints.
5. Create the Pull Request.

## 🐞 Bug Reports
Please include:
- A clear title and description.
- Steps to reproduce.
- Expected vs actual behavior.
- Screenshots if applicable.

Happy Coding! 🚀
