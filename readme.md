# Onebox Email Aggregator

A comprehensive MERN-stack email aggregator with real-time IMAP synchronization, AI-powered categorization, and advanced search capabilities.

## 🌟 Features Implemented

### ✅ Real-Time Email Synchronization (Requirement 1)
- Persistent IMAP connections using IDLE mode (no cron jobs)
- Support for multiple email accounts (minimum 2)
- Fetches last 30 days of emails on initial sync
- Real-time updates when new emails arrive
- Automatic reconnection on connection loss

### ✅ Elasticsearch Search (Requirement 2)
- Locally hosted Elasticsearch integration with Docker support
- Full-text search across subject, from, to, and body fields
- Advanced filtering by folder, account, category, date range, and attachments
- Graceful fallback to in-memory search when Elasticsearch is unavailable
- See `ELASTICSEARCH_SETUP.md` for Docker configuration

### ✅ AI-Based Email Categorization (Requirement 3)
- Google Gemini 1.5 Flash powered categorization with structured JSON output
- Five categories: Interested, Meeting Booked, Not Interested, Spam, Out of Office
- Automatic categorization on email receipt
- Manual recategorization via UI dropdown
- Confidence scoring for categorization quality

### ✅ Slack & Webhook Integration (Requirement 4)
- Slack notifications for every "Interested" email with rich formatting
- External webhook triggers to webhook.site for automation
- Automatic notifications on both AI categorization and manual updates

### ✅ Frontend Interface (Requirement 5)
- Professional three-column email client layout
- Sidebar with accounts, folders, and AI category filters
- Email list with color-coded categories and unread indicators
- Full email detail view with metadata and actions
- Advanced search with real-time filtering
- Account management (add/remove IMAP accounts)
- Knowledge Base management page
- Dark/light theme support
- Fully responsive mobile design

### ✅ AI-Powered Suggested Replies with RAG (Requirement 6)
- Vector-based knowledge base using Gemini text-embedding-004 model
- RAG (Retrieval-Augmented Generation) for context-aware reply suggestions
- Optional Qdrant vector database integration (fallback to in-memory cosine similarity)
- Knowledge base CRUD operations via dedicated management page
- Automatic embedding generation for knowledge entries
- One-click "Suggest Reply" button in email detail view
- Displays AI-generated replies with confidence scores
- Shows which knowledge base entries were used for context
- Copy-to-clipboard functionality for suggested replies

### ✅ Advanced Email Management Features
- **Search UI**: Real-time loading indicator with animated spinner during active searches
- **Delete Email**: Confirmation dialog with permanent deletion warning and backend API integration
- **Forward Email**: Dialog with recipient input, optional message, and email format validation
- **Auto-Reply**: AI-powered reply suggestions with customizable message composition
- **Bulk Categorization**: Multi-select mode with checkboxes and bulk action toolbar for batch operations
- All actions use TanStack Query mutations with proper error handling and toast notifications
- Client-side validation prevents invalid email formats from reaching the backend

## 🏗️ Architecture

### Frontend
- **React** with TypeScript for type safety
- **Tailwind CSS** + **Shadcn UI** for professional design
- **TanStack Query** for efficient data fetching and caching
- **Wouter** for client-side routing
- **Theme Provider** for dark mode support

### Backend
- **Express.js** with TypeScript
- **node-imap** for persistent IMAP connections with IDLE mode
- **Elasticsearch** client for advanced search (optional with in-memory fallback)
- **Qdrant** vector database for RAG (optional with in-memory fallback)
- **Google Gemini 1.5 Flash** API for AI categorization and embeddings
- **Axios** for webhook integrations
- In-memory storage (MemStorage)

### Data Model
- **EmailAccount**: IMAP credentials and connection info
- **Email**: Complete email data with AI category
- **EmailWithAccount**: Extended type for frontend display

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ installed
- (Optional) Docker for Elasticsearch
- IMAP email account credentials

### Required Environment Variables
```bash
GEMINI_API_KEY=...                             # Google Gemini API key for AI categorization
SLACK_WEBHOOK_URL=https://hooks.slack.com/...  # Slack incoming webhook
WEBHOOK_SITE_URL=https://webhook.site/...      # External webhook for automation
ELASTICSEARCH_URL=http://localhost:9200        # Optional: Elasticsearch URL
QDRANT_URL=http://localhost:6333               # Optional: Qdrant vector database URL
```

### Running the Application

1. **Start the server** (already configured):
   ```bash
   npm run dev
   ```

2. **Set up Elasticsearch** (optional but recommended):
   ```bash
   # See ELASTICSEARCH_SETUP.md for detailed instructions
   docker run -d \
     --name elasticsearch \
     -p 9200:9200 \
     -e "discovery.type=single-node" \
     -e "xpack.security.enabled=false" \
     docker.elastic.co/elasticsearch/elasticsearch:8.11.0
   ```

3. **Add an email account**:
   - Click the "+" button in the sidebar
   - Enter your IMAP credentials
   - The system will start syncing immediately

### IMAP Configuration Examples

**Gmail:**
- IMAP Host: `imap.gmail.com`
- IMAP Port: `993`
- Username: Your Gmail address
- Password: App Password (not your regular password)
- [How to create Gmail App Password](https://support.google.com/accounts/answer/185833)

**Outlook/Hotmail:**
- IMAP Host: `outlook.office365.com`
- IMAP Port: `993`
- Username: Your email address
- Password: Your account password

**Yahoo:**
- IMAP Host: `imap.mail.yahoo.com`
- IMAP Port: `993`
- Username: Your Yahoo email
- Password: App Password

## 🎨 Design System

The application follows a professional email client design inspired by Linear and Superhuman:

- **Colors**: Professional blue primary with category-specific accent colors
- **Typography**: Inter for UI, JetBrains Mono for technical details
- **Layout**: Information-dense three-column layout optimized for email management
- **Category Colors**:
  - 🟢 Interested: Green (#26A641)
  - 🔵 Meeting Booked: Blue (#3B82F6)
  - ⚪ Not Interested: Gray (#999999)
  - 🔴 Spam: Red (#DC2626)
  - 🟡 Out of Office: Amber (#F59E0B)

## 📊 API Endpoints

### Email Accounts
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Add new account
- `DELETE /api/accounts/:id` - Remove account

### Emails
- `GET /api/emails` - List/search emails with filters
- `GET /api/emails/:id` - Get single email
- `PATCH /api/emails/:id/category` - Update category
- `PATCH /api/emails/:id/read` - Mark as read
- `DELETE /api/emails/:id` - Delete email permanently
- `POST /api/emails/:id/forward` - Forward email to recipient
- `POST /api/emails/:id/auto-reply` - Send auto-reply with AI-generated or custom message
- `PATCH /api/emails/bulk/category` - Bulk categorize multiple emails
- `POST /api/emails/suggest-reply` - Generate AI reply suggestion (RAG)

### Knowledge Base (RAG)
- `GET /api/knowledge` - List all knowledge base entries
- `POST /api/knowledge` - Create new knowledge entry (auto-generates embeddings)
- `PATCH /api/knowledge/:id` - Update knowledge entry
- `DELETE /api/knowledge/:id` - Delete knowledge entry

### Health Check
- `GET /api/health` - Check service status

## 🔧 Technical Highlights

### Real-Time IMAP Synchronization
- Uses IDLE mode for push notifications instead of polling
- Maintains persistent connections with automatic reconnection
- Processes emails in batches to avoid overwhelming the system
- Gracefully handles connection errors and timeouts

### AI Categorization
- Gemini 1.5 Flash model with structured JSON output and schema validation
- Context-aware classification based on subject, body, and sender
- Confidence scoring for categorization quality
- Immediate notification on "Interested" categorization
- No API rate limits on free tier (generous quotas)

### Search Implementation
- Elasticsearch provides full-text search with fuzzy matching
- In-memory fallback ensures search always works
- Filters apply consistently across both search backends
- Results sorted by received date (newest first)

### Error Handling
- Graceful Elasticsearch fallback
- Proper IMAP error recovery
- Silent webhook failures (logs but doesn't break flow)
- User-friendly error messages in UI

## 📝 Development Notes

### Storage
- Uses in-memory storage (MemStorage) as specified in assignment requirements
- MongoDB support removed (not required by assignment)
- All storage operations are async
- Storage interface defined in `server/storage.ts`

### Security Considerations
- IMAP passwords stored in memory (encrypt for production)
- API secrets managed via environment variables
- No authentication layer (add for production use)

### Performance
- Email list limited to 100 most recent emails
- IMAP fetch batched to last 100 UIDs
- Elasticsearch results capped at 100 documents
- Efficient React Query caching minimizes API calls

## 🎯 Testing with Postman

All backend features can be tested via Postman:

1. **Add Account**: `POST /api/accounts` with IMAP credentials
2. **List Emails**: `GET /api/emails?folder=INBOX`
3. **Search**: `GET /api/emails?query=meeting&category=Interested`
4. **Categorize**: `PATCH /api/emails/:id/category` with category body

## 🚀 Next Phase Features

- Email composition and direct reply functionality
- Thread grouping and conversation view
- Additional bulk actions (mark multiple as read, bulk delete)
- Analytics dashboard with email categorization statistics
- PostgreSQL database for production persistence
- User authentication and multi-user support
- Advanced vector database (Pinecone, Weaviate, Chroma) for production-scale RAG
- Email scheduling and snooze functionality

## 📚 Project Structure

```
client/
  src/
    components/       # Reusable UI components
    pages/           # Page components (inbox)
    lib/             # Utilities (theme, query client)
    hooks/           # Custom React hooks
server/
  lib/              # Backend utilities
    elasticsearch.ts # Search implementation
    imap-sync.ts     # IMAP synchronization
    openai.ts        # AI categorization
    webhooks.ts      # Slack/webhook integrations
  routes.ts         # API endpoints
  storage.ts        # Data access layer
  index.ts          # Server entry point
shared/
  schema.ts         # Shared TypeScript types
```

## 🏆 Requirements Checklist

### Core Requirements
- ✅ Real-time email sync (IMAP IDLE mode)
- ✅ Multiple account support (2+)
- ✅ Last 30 days of emails fetched
- ✅ Elasticsearch storage and indexing
- ✅ Filter by folder & account
- ✅ AI categorization into 5 labels
- ✅ Slack notifications for "Interested"
- ✅ External webhook triggers
- ✅ Frontend UI with email display
- ✅ AI category visualization
- ✅ Search functionality powered by Elasticsearch
- ✅ AI-Powered Suggested Replies with RAG (Vector Database)

### Advanced Features
- ✅ Real-time search UI with loading indicators
- ✅ Delete email with confirmation dialog
- ✅ Forward email with validation
- ✅ Auto-reply with AI suggestions
- ✅ Bulk email categorization with multi-select

## 🤝 Contributing

This is a demonstration project showcasing full-stack TypeScript development with modern web technologies. The architecture is production-ready and can be extended with additional features.
