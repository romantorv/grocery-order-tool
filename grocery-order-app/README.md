# Grocery Ordering Web Interface

A complete web application for managing grocery orders with automatic batch creation and Chrome extension integration.

## Features

- **Anonymous Access**: Users authenticate with display name + access code
- **Member Interface**: Submit grocery items with URL, quantity, and notes
- **Admin Interface**: Order management and Chrome extension integration
- **Automatic Batching**: System creates batches from items completed on the same date
- **Reorder Feature**: Users can reorder entire batches
- **Status Tracking**: pending → ordered → completed workflow

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with session management

## Prerequisites

- Node.js 18+
- MongoDB (local or cloud)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
cd grocery-order-app
npm install
```

### 2. Environment Configuration

Create `.env.local` file in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/grocery-orders
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 3. Database Setup

Make sure MongoDB is running, then initialize the database:

```bash
# Start MongoDB (if using local installation)
mongod

# Initialize database with default access codes
npm run init-db
```

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

### Access Codes (Default)

- **Members**: `member123`
- **Administrators**: `admin456`

### Member Workflow

1. Go to `http://localhost:3000`
2. Enter display name and member access code
3. Add grocery items with product name, URL, quantity, and notes
4. View items by status (pending, ordered, completed)
5. Browse and reorder from previous batches

### Admin Workflow

1. Access with admin credentials
2. View all pending items from all users
3. Select items and mark as "ordered"
4. Extension data is copied to clipboard for Chrome extension
5. Update item statuses after processing (completed/failed)
6. System automatically creates batches from completed items

### Chrome Extension Integration

1. Admin marks items as "ordered"
2. Extension data is provided in JSON format
3. Copy data to Chrome extension
4. Process orders in grocery website
5. Update statuses in admin panel

## API Endpoints

### Authentication
- `POST /api/auth/access` - Authenticate with access code

### Items Management
- `GET /api/items` - Get user's items
- `POST /api/items` - Create new item
- `POST /api/items/reorder-batch` - Reorder batch

### Admin Operations
- `GET /api/admin/pending-items` - Get all pending items
- `POST /api/admin/mark-ordered` - Mark items as ordered
- `POST /api/admin/update-status` - Update item statuses

### Batch Management
- `GET /api/batches` - Get order batches
- `GET /api/batches/[id]/items` - Get items in batch

## Database Schema

### Collections

- **AppSettings**: Application configuration
- **Users**: User sessions and authentication
- **GroceryItems**: Product items with status tracking
- **OrderBatches**: Auto-generated batches from completed orders

## Development

### Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── dashboard/         # Member dashboard
│   ├── batches/           # Batch history pages
│   └── page.tsx          # Access/login page
├── lib/                   # Utilities and services
│   ├── mongodb.ts        # Database connection
│   ├── auth.ts           # Authentication utilities
│   └── batchService.ts   # Batch creation logic
└── models/                # Mongoose models
    ├── AppSettings.ts
    ├── User.ts
    ├── GroceryItem.ts
    └── OrderBatch.ts
```

### Key Features Implementation

#### Automatic Batch Creation
- Triggered when items are marked as "completed"
- Groups items by completion date
- Creates batches with naming pattern "Order - YYYY-MM-DD"
- Updates item records with batchId

#### Reorder System
- Browse historical batches
- One-click reorder creates new pending items
- Preserves original item details
- New items start with "pending" status

#### Status Workflow
1. **Pending**: User submits item
2. **Ordered**: Admin marks for processing
3. **Completed**: Successfully ordered (triggers batch creation)
4. **Failed**: Order failed with error message

## Deployment

### Production Considerations

1. **Environment Variables**: Set secure values in production
2. **Database**: Use MongoDB Atlas or dedicated instance
3. **JWT Secret**: Use cryptographically secure random string
4. **HTTPS**: Enable SSL/TLS for secure authentication
5. **Rate Limiting**: Consider adding API rate limiting

### Deployment Options

- **Vercel**: Easy deployment with built-in MongoDB integration
- **Railway**: Full-stack deployment with database
- **Docker**: Containerized deployment with docker-compose

## Chrome Extension Integration

The existing Chrome extension in the `extension/` directory can be updated to integrate with this web application:

1. Modify popup.js to fetch data from `/api/admin/mark-ordered`
2. Process order data and submit to grocery website
3. Report back completion status to `/api/admin/update-status`

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure MongoDB is running and URI is correct
2. **Authentication**: Check JWT_SECRET is set in environment
3. **API Errors**: Check browser console and server logs
4. **Chrome Extension**: Verify manifest permissions and URLs

### Logs

Enable detailed logging by setting `NODE_ENV=development` in `.env.local`

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see LICENSE file for details
