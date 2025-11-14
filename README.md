# Curium Item Master Quality Check

A Next.js 14 application for validating Item Master Excel files with AI-powered summary generation.

## Features

- Upload and validate Item Master Excel files (.xlsx)
- Rule-based data quality validation
- AI-generated executive summaries
- Clean, modern dashboard UI

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Validation**: ExcelJS
- **AI**: DeepSeek API (configurable)

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```env
DEEPSEEK_API_KEY=your_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3005](http://localhost:3005) in your browser.

## Deployment to Vercel

### Prerequisites

- A GitHub account
- A Vercel account (sign up at [vercel.com](https://vercel.com))

### Steps

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/Boyi-Wang-washu/Item_Master_Data_Agent.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**:
   - In your Vercel project settings, go to "Environment Variables"
   - Add the following variable:
     - **Name**: `DEEPSEEK_API_KEY`
     - **Value**: Your DeepSeek API key
   - Make sure to add it for all environments (Production, Preview, Development)

4. **Deploy**:
   - Vercel will automatically deploy on every push to the main branch
   - Or click "Deploy" to trigger a manual deployment

### Important Notes for Vercel

- ✅ The `start` script has been configured to work with Vercel (no hardcoded port)
- ✅ All API routes are compatible with Vercel's serverless functions
- ✅ Environment variables are read from Vercel's environment settings
- ✅ The build process uses standard Next.js commands

## Project Structure

```
.
├── app/
│   ├── api/
│   │   ├── validate/      # Validation API endpoint
│   │   └── summary/        # AI summary API endpoint
│   ├── login/              # Login page
│   ├── rules/              # Rules catalog page
│   ├── roadmap/            # Roadmap page
│   ├── layout.tsx          # Root layout with navigation
│   ├── page.tsx            # Main dashboard
│   └── globals.css         # Global styles
├── src/
│   └── lib/
│       ├── itemMasterValidation.ts  # Validation engine
│       └── summaryAgent.ts          # AI summary generator
└── package.json
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DEEPSEEK_API_KEY` | DeepSeek API key for AI summaries | Yes (for AI features) |

## License

Private - Internal use only
