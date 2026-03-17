# 🏥 OmniCare Pharmacy - Complete System Manual
> **Last Updated:** March 16, 2026  
> **Status:** Version 2.0 (End-to-End Workflow Complete)

---

## 🌟 1. Core Platform Overview
OmniCare is a high-end, end-to-end pharmacy solution built with **Django (Backend)**, **React (Frontend)**, and **Meilisearch (Search Engine)**. It features a modern Glassmorphism UI and a robust medical-grade fulfillment workflow.

---

## 🛍️ 2. Customer Features (The Shopping Flow)

### 🔍 Smart Search & Categorization (Tata 1mg Style)
- **Meilisearch Integration**: Instant, typo-tolerant search across 68+ medicines.
- **Medicine Substitutes (Cheapest Alternatives)**: Users can now see cheaper alternatives with the exact same salt composition, helping them save money.
- **Detailed Medical Info**: Product pages now include Salt Composition, Side Effects, Expert Tips, and Safety Warnings.
- **Dynamic Filters**: Filter by Category (Heart Health, Antibiotics, etc.), Availability, or Prescription requirements.

### 🛒 Checkout & Payments
- **Address Management**: Customers can save multiple delivery addresses with GPS coordinate support for geofencing.
- **Modern Payment Options**:
    - **Razorpay (UPI/Scan)**: Instant domestic payments via UPI, Google Pay, PhonePe, and Netbanking.
    - **Stripe (Cards)**: Global card processing for Credit/Debit cards.
    - **Cash on Delivery (COD)**: For traditional offline settlement.
- **Order Tracking**: A dedicated "My Orders" area to track order status (Pending → Processing → Shipped → Delivered).

### 🔒 Prescription System
- **Rx Lock**: Prescription-only medicines are automatically locked until a valid prescription is uploaded.
- **My Prescriptions**: A user-specific gallery to view historical medical uploads and their approval status from the pharmacist.

---

## ⚡ 3. Pharmacist & Admin Features (The Operations)

### 🛡️ Prescription Verification Dashboard
- **Location**: `Manage → Verify Prescriptions`
- **Workflow**: Staff can view high-resolution prescription images, check patient details, and **Approve/Reject** them with one click.
- **Safety**: Approval instantly unlocks the customer's ability to proceed with their order.

### 🚚 Order fulfillment Pipeline
- **Real-time Queue**: A professional dashboard to manage the fulfillment lifecycle.
- **Status Control**: Transition orders through:
    - **Pending**: New orders awaiting payment or initial review.
    - **Processing**: Packing and inventory reservation stage.
    - **Shipped**: Handover to delivery partner.
    - **Delivered**: Final confirmation of receipt.

### 📊 Business Insights (Analytics)
- **Revenue Tracking**: Live visualization of total sales and average order values.
- **Inventory Analytics**: Modern progress bars showing top-selling medicines and stock exhaustion rates.
- **Customer CRM**: View recent customer activities and order frequencies.

---

## 🏗️ 4. Technical Architecture & Safety

### 📦 Inventory Management
- **Atomic Stock Reduction**: Stock is automatically deducted only when an order is successful.
- **Auto-Disable**: When stock hits zero, the product is automatically hidden from search results and disabled for purchase.

### 🔐 Security & Permissions
- **JWT Authentication**: Secure, token-based login.
- **Role-Based Access**: Admins see dashboards; Customers see the store.
- **Database Safety**: Wrapped in `transaction.atomic` to prevent data corruption during high-traffic order placements.

---

## 📝 5. How to Update
This manual is managed by your **Assistant (Antigravity)**. 
- **Auto-Update Policy**: Every time we implement a new feature (e.g., SMS alerts), I will update this document.
- **PDF Generation**: Run `python generate_manual.py` to get the latest PDF version of this guide.
