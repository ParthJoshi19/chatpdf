# ChatPDF - Chat with Your PDF Documents Using AI

A modern Next.js application that allows you to upload PDF documents and have intelligent conversations with them using AI. Get instant answers from your documents with the power of Google's Generative AI, Pinecone vector database, and real-time updates via Socket.io.

## 🚀 Features

- **PDF Upload & Processing**: Upload PDFs and automatically extract and process text
- **Intelligent Chat**: Ask questions and get accurate answers from your documents
- **Real-time Updates**: Socket.io integration for live chat updates
- **User Authentication**: Secure authentication with Clerk
- **Vector Search**: Efficient semantic search using Pinecone
- **Cloud Storage**: PDF storage with Cloudinary
- **Responsive Design**: Beautiful UI with Tailwind CSS and Radix UI components

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: Clerk
- **Database**: Supabase
- **Vector Database**: Pinecone
- **AI**: Google Generative AI
- **Storage**: Cloudinary
- **Real-time**: Socket.io
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager
- Accounts and API keys for:
  - [Clerk](https://clerk.com) (Authentication)
  - [Supabase](https://supabase.com) (Database)
  - [Pinecone](https://www.pinecone.io) (Vector Database)
  - [Cloudinary](https://cloudinary.com) (File Storage)
  - [Google AI Studio](https://makersuite.google.com/app/apikey) (Generative AI)

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx

# Pinecone
PINECONE_API_KEY=xxxxx
PINECONE_ENVIRONMENT=xxxxx
PINECONE_INDEX_NAME=chatpdf

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# Google Generative AI
GOOGLE_API_KEY=xxxxx

# Server
PORT=3000
```

## 🚀 Quick Start

1. **Clone the repository**

```bash
git clone https://github.com/ParthJoshi19/chatpdf.git
cd chatpdf
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**

Copy the `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

4. **Set up Supabase Database**

Create the following tables in your Supabase database:

```sql
-- Profiles table for user data
create table if not exists profiles (
  id text primary key,
  email text,
  first_name text,
  last_name text,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chats table
create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  user_id text references profiles(id) on delete cascade,
  pdf_name text,
  pdf_url text,
  created_at timestamptz default now()
);

-- Messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade,
  content text,
  role text check (role in ('user', 'assistant')),
  created_at timestamptz default now()
);

-- Add indexes for better performance
create index if not exists idx_chats_user_id on chats(user_id);
create index if not exists idx_messages_chat_id on messages(chat_id);
```

5. **Set up Clerk Webhooks**

In your [Clerk Dashboard](https://dashboard.clerk.com):

- Navigate to **Webhooks** → **Add Endpoint**
- **Endpoint URL**: 
  - Local: `http://localhost:3000/api/webhooks/clerk` (use ngrok for testing)
  - Production: `https://your-domain.com/api/webhooks/clerk`
- **Subscribe to events**: `user.created`, `user.updated`, `user.deleted`
- Copy the **Signing Secret** to your `CLERK_WEBHOOK_SECRET` env variable

6. **Set up Pinecone Index**

In your [Pinecone Dashboard](https://app.pinecone.io):

- Create a new index named `chatpdf` (or match your `PINECONE_INDEX_NAME`)
- Dimension: `768` (for text-embedding-004 model)
- Metric: `cosine`
- Cloud: Choose your preferred region

7. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Project Structure

```
chatpdf/
├── app/
│   ├── api/              # API routes
│   │   ├── chats/        # Chat management
│   │   ├── messages/     # Message handling
│   │   ├── socket/       # Socket.io setup
│   │   ├── store-pdf/    # PDF upload & processing
│   │   └── webhooks/     # Clerk webhooks
│   ├── chat/[...id]/     # Chat interface
│   ├── new-chat/         # New chat creation
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Landing page
│   └── globals.css       # Global styles
├── components/
│   └── ui/               # Reusable UI components
├── lib/
│   ├── chunks-clean.ts   # Text chunking utilities
│   ├── cloudinary.ts     # Cloudinary configuration
│   ├── embedding.ts      # Text embedding functions
│   ├── pinecone.ts       # Pinecone client
│   ├── responseGenerator.ts # AI response generation
│   └── supabase.ts       # Supabase client
├── public/               # Static assets
├── server.js             # Custom server with Socket.io
└── package.json
```

## 🔧 Available Scripts

```bash
# Development with Socket.io server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

## 🌐 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy!

**Note**: The Socket.io functionality requires a custom server, so standard Vercel deployment may need adjustments. Consider:
- Deploying Socket.io server separately (Railway, Render, etc.)
- Using Vercel's serverless functions for HTTP endpoints
- Updating Socket.io client to connect to the separate server

### Deploy Custom Server

For platforms like Railway, Render, or DigitalOcean:

```bash
# Build the app
npm run build

# Start the production server
npm run start
```

Make sure to:
- Set `NODE_ENV=production`
- Configure all environment variables
- Expose the correct PORT (default: 3000)

## 🐛 Troubleshooting

### Socket.io Connection Issues

- Ensure `server.js` is running (it's started with `npm run dev`)
- Check CORS configuration in `server.js`
- Verify the client is connecting to the correct URL

### Clerk Webhook Not Receiving Events

- For local testing, use [ngrok](https://ngrok.com) to expose your localhost
- Verify the webhook signing secret matches your env variable
- Check that you've subscribed to the correct events in Clerk Dashboard

### Pinecone Errors

- Verify your index name matches `PINECONE_INDEX_NAME`
- Ensure the index dimension is `768` for the embedding model
- Check your Pinecone API key and environment are correct

### PDF Upload Failures

- Check Cloudinary credentials are correct
- Verify file size limits (default: 10MB)
- Ensure PDF is not corrupted or password-protected

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Pinecone Documentation](https://docs.pinecone.io)
- [Socket.io Documentation](https://socket.io/docs)
- [Google AI Documentation](https://ai.google.dev/docs)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Parth Joshi**
- GitHub: [@ParthJoshi19](https://github.com/ParthJoshi19)

---

Built with ❤️ using Next.js, Clerk, and AI
