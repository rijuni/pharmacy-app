# 🏥 Pharmacy App - Setup & Testing Guide

## ✅ What's Ready

### Backend (Django REST Framework)

- ✅ **68 medicines** across 10 categories loaded
- ✅ **Search via Meilisearch** - Fully synced and searchable
- ✅ **User authentication** with JWT
- ✅ **Shopping cart** system
- ✅ **Address management** for delivery
- ✅ **Stripe payment integration** (card payments)
- ✅ **Prescription validation** - Requires valid Rx for prescription medicines
- ✅ **Order management** with payment tracking
- ✅ **Admin panel** at `/admin/` for medicine management

### Frontend (React + Vite)

- ✅ **Navbar with live search** - Real-time medicine search
- ✅ **Search page with filters** - Category, Rx, availability
- ✅ **Product details page** - Full medicine info with availability
- ✅ **Add to cart** - With out-of-stock handling
- ✅ **Checkout with address selection**
- ✅ **Payment interface** - COD + Card (Stripe)
- ✅ **Order confirmation** screen

### Database

- ✅ **SQLite3** with Django ORM
- ✅ All migrations applied
- ✅ 68 medicines populated with availability tracking

---

## 🚀 Getting Started

### Step 1: Start Meilisearch (if not running)

```bash
# Terminal 1
cd C:\meilisearch
.\meilisearch.exe --master-key="masterKey"
```

### Step 2: Start Django Backend

```bash
# Terminal 2
cd "c:\Users\Lenovo\Desktop\pharmacy app\backend"
python manage.py runserver
```

### Step 3: Start React Frontend

```bash
# Terminal 3
cd "c:\Users\Lenovo\Desktop\pharmacy app\frontend"
npm run dev
```

---

## 🧪 Testing Workflow

### 1. **Register & Login**

- Go to <http://localhost:5173>
- Click "Login/Register"
- Create account or login
- (Superuser: admin / password123)

### 2. **Search Medicines**

- Use **Navbar search** for quick results (top 5 most relevant)
- Use **Medicines page** with filters for detailed search
- Try searching:
  - "Paracetamol" (common OTC)
  - "Amoxicillin" (requires Rx)
  - "Vitamin C" (supplement)

### 3. **Browse & Add to Cart**

- Click any medicine to view details
- Check availability status (Green = In Stock, Red = Out of Stock)
- Check if requires prescription ("Rx Required" badge)
- Click "Add to Cart" (disabled for out-of-stock)

### 4. **Upload Prescription (if needed)**

- Go to **Profile → Prescriptions**
- Upload valid prescription image
- Admin verifies it (set `is_verified=true` in Django admin)
- User can then order Rx medicines

### 5. **Checkout**

- Go to **Cart → Checkout**
- Select delivery address (add one in Profile if none)
- Choose payment method:
  - **COD** (Cash on Delivery) - Next day delivery
  - **Card** (Credit/Debit Card via Stripe)
- Review order summary
- Click "Place Order securely"

### 6. **Card Payment Test**

Use Stripe test card: **4242 4242 4242 4242**

- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)

### 7. **View Order**

- Go to **Profile → My Orders**
- See order status, delivery address, payment method
- Track order progression

---

## 📱 Medicine Categories

1. **Pain Relief** (8) - Paracetamol, Ibuprofen, Aspirin, etc.
2. **Antibiotics** (8) - Amoxicillin, Azithromycin, Cephalexin, etc.
3. **Cold & Cough** (7) - Cough syrup, decongestants, antihistamines
4. **Digestive Health** (7) - Omeprazole, Antacids, Anti-diarrheals
5. **Heart Health** (6) - Statins, Blood pressure meds, Beta blockers
6. **Diabetes** (6) - Metformin, Insulin, Thiazolidinediones
7. **Vitamins & Supplements** (8) - Vitamin C, D3, B12, Multivitamin
8. **Skin Care** (6) - Hydrocortisone, Antifungal, Acne treatments
9. **Anti-Allergy** (6) - Antihistamines, Corticosteroids, Preventives
10. **Sleep & Nerves** (6) - Sleep aids, Anti-anxiety, Antidepressants

- **56 In Stock** ✅
- **12 Out of Stock** ❌
- **34 Require Prescription** 🔒

---

## 🔐 Admin Panel

### Access

- URL: <http://localhost:8000/admin/>
- Username: `admin`
- Password: `password123`

### Manage Medicines

1. Go to **Products → Products**
2. Add new medicine with:
   - Name & Generic name
   - Category
   - Price, Stock
   - Availability status (in_stock / out_of_stock)
   - Requires prescription (checkbox)
   - Strength, Form, Manufacturer

### Verify Prescriptions

1. Go to **Orders → Prescriptions**
2. Click prescription to view image
3. Check `is_verified` checkbox if valid
4. Save

### View Orders

1. Go to **Orders → Orders**
2. See all customer orders
3. Update status (Pending → Processing → Shipped → Delivered)
4. View payment method and status

---

## 🛠️ API Endpoints

### Products

- `GET /api/products/products/` - All products
- `GET /api/products/products/{id}/` - Product details
- `GET /api/products/search/?q=name` - Search medicines
- `GET /api/products/search/?q=name&requires_prescription=true` - Filter by Rx
- `GET /api/products/categories/` - All categories

### Cart

- `GET /api/orders/cart/` - Get current cart
- `POST /api/orders/cart/add/` - Add to cart
- `POST /api/orders/cart/remove/` - Remove from cart

### Orders

- `POST /api/orders/orders/` - Create order
- `GET /api/orders/orders/` - User's orders
- `POST /api/orders/payment/create-intent/` - Create Stripe payment intent

### Auth

- `POST /api/users/register/` - Register new user
- `POST /api/users/login/` - Login (JWT token)
- `GET /api/users/addresses/` - User addresses
- `POST /api/users/addresses/` - Add address

---

## 🐛 Troubleshooting

### Medicine not showing in search?

1. Check Meilisearch is running: <http://localhost:7700>
2. Verify medicine is in database:

   ```bash
   python manage.py shell
   from products.models import Product
   Product.objects.count()  # Should show 68
   ```

3. Manually sync: `python sync_meilisearch.py`

### Checkout says "Order failed"?

1. Check you have added an address in Profile
2. For Rx medicines, verify prescription is marked as `is_verified=true` in admin
3. Check Django console for error messages

### Cards not working?

1. Use test card: 4242 4242 4242 4242
2. Future expiry date (e.g., 12/25)
3. Any 3-digit CVC
4. Check `.env` has correct `STRIPE_SECRET_KEY`

### Search returning old results?

1. Stop backend: Ctrl+C
2. Sync again: `python sync_meilisearch.py`
3. Restart: `python manage.py runserver`

---

## 📊 Next Steps (Priority)

1. **Email Notifications** - Order confirmation, shipment tracking
2. **Payment Webhooks** - Real-time payment status updates
3. **SMS Notifications** - OTP, order updates
4. **Advanced Admin** - Analytics, sales reports, inventory management
5. **Production Deployment** - Azure, Docker containerization
6. **User Reviews** - Medicine ratings and feedback

---

## 📞 API Test Examples

### Search Medicines

```javascript
fetch('http://localhost:8000/api/products/search/?q=paracetamol')
  .then(r => r.json())
  .then(data => console.log(data))
```

### Add to Cart

```javascript
fetch('http://localhost:8000/api/orders/cart/add/', {
  method: 'POST',
  headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer YOUR_TOKEN'},
  body: JSON.stringify({product_id: 1, quantity: 2})
})
```

### Create Order

```javascript
fetch('http://localhost:8000/api/orders/orders/', {
  method: 'POST',
  headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer YOUR_TOKEN'},
  body: JSON.stringify({
    delivery_address: 1,  // Address ID
    payment_method: 'cod'
  })
})
```

---
