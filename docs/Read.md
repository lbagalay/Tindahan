You are a senior full-stack engineer and product designer.

Build a **modern, reusable POS + business management system MVP** that I can demo to potential clients and later customize for different businesses such as salons, wellness studios, retail shops, motorshops, and small service businesses.

## Main Goal

Do **not** build this as a one-off POS for one specific business.

Build a strong **reusable core system** where branding, business information, products/services, taxes, and some modules can later be customized per client.

The product should look polished enough to present to a real business owner.

## Tech Stack

Use:

* Next.js
* TypeScript
* React
* Tailwind CSS
* PostgreSQL
* Prisma
* Auth.js / NextAuth
* Vercel-ready architecture

Use clean architecture and reusable components.

## MVP Features

### 1. Authentication

* Login page
* Protected dashboard
* Roles:

  * Owner
  * Staff

### 2. Dashboard

Show useful business information such as:

* Today's sales
* Number of transactions
* Total customers
* Low-stock items
* Recent transactions
* Sales chart
* Best-selling products/services

Avoid fake-looking excessive analytics.

### 3. POS / Checkout

Create a fast and simple cashier interface.

Features:

* Search products/services
* Category filters
* Add items to cart
* Change quantity
* Remove items
* Discounts
* Subtotal
* Tax
* Grand total
* Payment method:

  * Cash
  * GCash
  * Card
  * Other
* Amount received
* Change calculation
* Complete transaction
* Generate receipt
* Printable receipt view

The POS interface should prioritize speed and usability.

### 4. Products & Services

Support both physical products and services.

Fields:

* Name
* SKU
* Category
* Type: Product / Service
* Cost
* Selling price
* Stock
* Low-stock threshold
* Status
* Image

Products should affect inventory.

Services should not require inventory.

### 5. Inventory

Include:

* Current stock
* Stock adjustments
* Low-stock warnings
* Stock movement history
* Product restocking
* Inventory value

Every completed product sale should automatically decrease stock.

### 6. Customers

Store:

* Name
* Phone
* Email
* Notes
* Total purchases
* Number of transactions
* Last purchase date

Allow attaching a customer to a POS transaction.

### 7. Transactions

Transaction history should include:

* Receipt number
* Date/time
* Customer
* Staff
* Items
* Payment method
* Subtotal
* Discount
* Tax
* Total

Allow opening a transaction to see the complete receipt.

### 8. Reports

Keep reports useful and understandable.

Include:

* Daily sales
* Weekly sales
* Monthly sales
* Best-selling items
* Sales by category
* Sales by payment method
* Low-stock products

### 9. Settings

Create configurable business settings:

* Business name
* Logo
* Address
* Phone
* Email
* Currency
* Tax percentage
* Receipt footer
* Business type

Default currency should be **PHP (₱)**.

## Reusable Architecture

Design the system so we can later add modules such as:

* Appointment booking
* Staff commissions
* Memberships
* Packages
* Job orders
* Repair/service history
* Supplier management
* Purchase orders
* Multi-branch support
* Online payments
* Online booking
* SMS/email notifications

Do not implement all of these yet.

Create the architecture so adding them later will not require rebuilding the core POS.

## UI / UX Direction

The system should NOT look like a generic AI-generated admin dashboard.

Avoid:

* excessive gradients
* giant rounded cards everywhere
* random decorative elements
* unnecessary animations
* excessive whitespace
* fake statistics
* overly colorful dashboards

Use:

* professional SaaS-style interface
* strong typography
* clear visual hierarchy
* consistent spacing
* practical tables
* good empty states
* clear status indicators
* responsive layouts
* subtle interactions
* accessible contrast

Desktop/tablet usability is the priority because the POS may be used at a cashier counter.

The actual POS screen should feel more like a real working tool than a marketing dashboard.

## Database

Design a proper Prisma schema for:

* User
* Business / Organization
* Membership
* Product
* Category
* InventoryMovement
* Customer
* Transaction
* TransactionItem
* Payment
* BusinessSettings

Every business-owned record should be properly scoped to its organization so the architecture can eventually support multiple businesses.

Use proper relations, indexes, timestamps, enums, and constraints.

## Demo Data

Seed realistic demo data.

Do not use generic names like:

* Product 1
* Customer 1
* Test User

Make the demo feel like a real Philippine small business.

Include enough transactions and products so dashboards and reports actually look useful.

## Development Process

Before writing the entire application:

1. Inspect the existing repository.
2. Create a concise implementation plan.
3. Define the database architecture.
4. Define routes/pages.
5. Define reusable components.
6. Implement the core foundation.
7. Implement each module systematically.
8. Seed realistic demo data.
9. Test critical workflows.
10. Polish the UI.

Do not rewrite working code unnecessarily.

Make reasonable technical decisions independently instead of constantly asking me questions.

## Critical Workflows to Test

Make sure these work end-to-end:

**Sale**
Product → Add to cart → Checkout → Payment → Transaction created → Inventory reduced → Receipt generated

**Inventory**
Create product → Add stock → Sell product → Stock decreases → Movement history updates

**Customer**
Create customer → Attach to sale → Transaction appears in customer history

**Reports**
Transactions → Dashboard/report calculations update correctly

## Final Objective

The finished MVP should be something I can open in front of a real business owner and say:

> “This is the base system. We can customize the branding and workflow specifically for your business.”

Prioritize **working business logic, clean UX, reusable architecture, and professional presentation** over unnecessary features.
