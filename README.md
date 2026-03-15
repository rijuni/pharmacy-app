# Pharmacy App - Complete Pharmacy E-Commerce Platform

A modern, full-stack e-commerce platform built for online pharmacy operations with advanced product search, prescription management, and order fulfillment capabilities.

## 🏗️ Project Architecture

```
pharmacy-app/
├── backend/                 # Django REST API (Python)
│   ├── backend_project/     # Core Django settings
│   ├── products/            # Product catalog & Meilisearch search
│   ├── orders/              # Shopping cart, checkout, orders
│   ├── users/               # User authentication & profiles
│   ├── requirements.txt      # Python dependencies
│   └── db.sqlite3           # Development database
│
└── frontend/                # React + Vite (JavaScript)
    ├── src/
    │   ├── components/      # Reusable UI components
    │   ├── pages/           # Page components
    │   ├── store/           # Redux state management
    │   ├── api/             # Axios HTTP client
    │   └── assets/          # Images, logos, etc.
    ├── package.json         # Node dependencies
    └── vite.config.js       # Vite configuration
```

## 🚀 Features

### ✅ Core Features Completed

#### User Management

- **Authentication System**
  - JWT-based authentication with refresh tokens
  - Login/Signup with email validation
  - Password reset functionality
  - Custom user model with phone number
  - Address management (multiple addresses per user)

#### Product Catalog

- **Product Management**
  - Category-based organization
  - Product images and descriptions
  - Stock tracking
  - Prescription requirement flags
  - Price management

- **Advanced Search & Filtering**
  - Meilisearch integration for lightning-fast searches
  - Filter by category
  - Filter by prescription requirements
  - Real-time search results with autocomplete
  - Full-text search across product names & descriptions

#### Shopping & Checkout

- **Shopping Cart**
  - Add/remove products
  - Quantity management
  - Cart persistence with Redux
  - Real-time price calculation

- **Checkout System**
  - Multiple address selection
  - Order summary
  - Prescription upload for regulated items

#### Order Management

- **Order Tracking**
  - Order status: Pending → Processing → Shipped → Delivered
  - Order history per user
  - Order details with itemized list
  - Price tracking

#### Prescription Management

- **Prescription Upload**
  - Image upload for prescription verification
  - Status tracking (Pending/Approved/Rejected)
  - Timestamp recording

#### Enhanced UI/UX

- **Frontend Framework**
  - React 19 with Vite for fast development
  - Tailwind CSS for responsive design
  - Framer Motion for smooth animations
  - React Router v7 for navigation
  - Redux Toolkit for state management

- **Visual Features**
  - 3D scene on homepage (Three.js + React-Three/Fiber)
  - Smooth page transitions
  - Responsive design (mobile, tablet, desktop)
  - Lucide React icons
  - Glass-morphism effects

---

## 🛠️ Tech Stack

### Backend

- **Framework**: Django 6.0.3, Django REST Framework 3.16.1
- **Authentication**: djangorestframework-simplejwt (JWT tokens)
- **Search Engine**: Meilisearch 0.40.0
- **Database**: SQLite3 (dev), PostgreSQL (prod-ready)
- **CORS**: django-cors-headers 4.9.0

### Frontend

- **Framework**: React 19.2.0 with Vite
- **State Management**: Redux Toolkit 2.11.2
- **Styling**: Tailwind CSS 4.2.1
- **Routing**: React Router DOM 7.13.1
- **HTTP Client**: Axios 1.13.6
- **Animations**: Framer Motion 12.36.0
- **3D Graphics**: Three.js + @react-three/fiber
- **UI Library**: Lucide React icons (577 icons)

### Development Tools

- **Linting**: ESLint
- **Build Tool**: Vite
- **Package Manager**: npm (Node.js)

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- Meilisearch (for search functionality)

### Backend Setup

1. **Install Python dependencies**

```bash
cd backend
pip install -r requirements.txt
```

1. **Configure environment variables**

```bash
# Add to backend_project/settings.py or create .env file
MEILISEARCH_HOST = 'http://localhost:7700'
MEILISEARCH_API_KEY = 'masterKey'  # Change in production
```

1. **Run migrations**

```bash
python manage.py migrate
python manage.py createsuperuser
```

1. **Sync data to Meilisearch** (after adding sample data)

```bash
python manage.py shell
>>> from products.meilisearch_utils import sync_products_to_meilisearch
>>> sync_products_to_meilisearch()
```

1. **Start Django development server**

```bash
python manage.py runserver
# Server runs on http://localhost:8000
```

### Frontend Setup

1. **Install Node dependencies**

```bash
cd frontend
npm install
```

1. **Start development server**

```bash
npm run dev
# Frontend runs on http://localhost:5173
```

1. **Build for production**

```bash
npm run build
npm run preview
```

---

## 📡 API Endpoints

### Authentication

- `POST /api/users/login/` - User login
- `POST /api/users/register/` - User registration
- `POST /api/users/refresh/` - Refresh JWT token
- `GET /api/users/profile/` - Get user profile

### Products

- `GET /api/products/products/` - List all products
- `GET /api/products/products/{id}/` - Get product details
- `GET /api/products/categories/` - List categories
- `GET /api/products/search/?q=query` - Search products
  - Query Parameters: `q` (search query), `category`, `requires_prescription`

### Cart & Orders

- `GET /api/orders/cart/` - Get user's cart
- `POST /api/orders/cart/items/` - Add item to cart
- `DELETE /api/orders/cart/items/{id}/` - Remove from cart
- `POST /api/orders/orders/` - Create order
- `GET /api/orders/orders/` - List user's orders

### Prescriptions

- `GET /api/users/prescriptions/` - List user's prescriptions
- `POST /api/users/prescriptions/` - Upload prescription

---

## 🔒 Security Features

✅ **Implemented:**

- JWT authentication with access/refresh tokens
- CORS configuration for trusted domains
- Password validation and hashing
- Custom user model with extended fields
- Permission-based access control

⚠️ **To Implement (Production):**

- Environment variables for sensitive data (SECRET_KEY, API keys)
- HTTPS enforcement
- Rate limiting on API endpoints
- Input validation and sanitization
- CSRF protection
- SQL injection prevention
- API versioning

---

## 📦 Database Models

### Users App

User (extends AbstractUser)
├── phone_number
└── Address (many-to-one)
    ├── street
    ├── city
    ├── state
    └── zip_code

### Products App

Product
├── name
├── description
├── price
├── stock
├── image
├── requires_prescription
└── Category (foreign key)
    ├── name
    └── description

### Orders App

Cart
├── user
└── CartItem (many-to-one)
    ├── product
    └── quantity

Order
├── user
├── address
├── total_price
├── status (Pending, Processing, Shipped, Delivered, Cancelled)
└── OrderItem (many-to-one)
    ├── product
    ├── quantity
    └── price

Prescription
├── user
├── image
├── status
└── created_at

## 🔍 Meilisearch Configuration

### Search Index Setup

The `meilisearch_utils.py` file handles:

- **Searchable Attributes**: name, description, category
- **Filterable Attributes**: category, requires_prescription
- **Sortable Attributes**: price

### Example Search Queries

GET /api/products/search/?q=paracetamol

GET /api/products/search/?q=antibiotics&category=Antibiotics

GET /api/products/search/?q=&requires_prescription=true

GET /api/products/search/?q=pain&category=Pain%20Relief&requires_prescription=false

## 📊 Performance Optimizations

✅ **Implemented:**

- Meilisearch for O(1) search performance
- CORS enabled for efficient frontend-backend communication
- JWT tokens to reduce database queries on every request
- React lazy loading and code splitting (via Vite)
- CSS minification and optimization (Tailwind)

🔄 **To Add:**

- Database indexing for frequently queried fields
- Caching layer (Redis) for frequently accessed data
- Image optimization and CDN
- Database connection pooling
- API response pagination

---

## 🗓️ Development Roadmap

### Phase 1: Foundation ✅

- [x] Django + React project setup
- [x] User authentication system
- [x] Product catalog with Meilisearch
- [x] Shopping cart functionality
- [x] Order management
- [x] Prescription upload

### Phase 2: Production Ready (Next)

- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Email notifications (order confirmation, password reset)
- [ ] Admin dashboard
- [ ] Prescription verification workflow
- [ ] Inventory management with alerts
- [ ] Order tracking notifications
- [ ] SSL certificate & HTTPS

### Phase 3: Advanced Features

- [ ] User reviews and ratings
- [ ] Recommendation engine
- [ ] Promotional codes and discounts
- [ ] Subscription orders for regular medications
- [ ] Pharmacy network integration
- [ ] Analytics and reporting dashboard

### Phase 4: Mobile & Scale

- [ ] Native iOS/Android app
- [ ] Push notifications
- [ ] Offline mode
- [ ] Microservices architecture
- [ ] GraphQL API (optional)

---

## 🧪 Testing

### Backend Testing

```bash
cd backend
python manage.py test
```

### Frontend Testing

```bash
cd frontend
npm run test
```

---

## 📝 Environment Variables

### Backend (.env)

DJANGO_SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

DATABASE_URL=postgresql://user:password@localhost/db_name

MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=your-api-key

CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Payment gateway (upcoming)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLIC_KEY=pk_live_xxx
```

### Frontend (.env)

```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_MEILISEARCH_HOST=https://search.yourdomain.com
VITE_MEILISEARCH_API_KEY=your-search-key
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Support

For issues, questions, or suggestions, please create an issue in the repository.

---

## 🎯 Key Milestones Achieved

| Milestone | Status | Date |

| Project Setup | ✅ Complete | - |
| User Authentication | ✅ Complete | - |
| Product Catalog | ✅ Complete | - |
| **Meilisearch Integration** | ✅ Complete | - |
| Shopping Cart | ✅ Complete | - |
| Order Management | ✅ Complete | - |
| Prescription System | ✅ Complete | - |
| Frontend UI/UX | ✅ Complete | - |
| Payment Integration | ⏳ Pending | Next |
| Email Notifications | ⏳ Pending | Next |
| Admin Dashboard | ⏳ Pending | Phase 2 |
| Deployment | ⏳ Pending | Phase 2 |

---

## 💡 Notes for Developers

1. **Meilisearch Server**: Ensure Meilisearch is running on `http://localhost:7700` during development
2. **CORS**: Update CORS settings in `settings.py` when moving to production
3. **Security**: Change SECRET_KEY and MEILISEARCH_API_KEY before deploying to production
4. **Database**: Switch from SQLite to PostgreSQL for production
5. **Static Files**: Configure proper static file serving (AWS S3, Cloudinary, etc.)
6. **Media Files**: Set up proper media file storage and CDN

---

**Last Updated**: March 15, 2026
**Version**: 1.0.0
