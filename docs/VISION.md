Tindahan — Product Vision & Architecture

1. Product Overview

Tindahan is a customizable business management platform that combines a Point-of-Sale (POS) system with a Shopify-like setup experience.

Instead of giving every business the exact same POS interface, Tindahan allows business owners to:

Create their business account.

Choose their business type.

Select a premade business template.

Customize products, services, prices, branding, staff, and workflows.

Start using the system as their POS and business management platform.

The goal is to make Tindahan flexible enough for different types of businesses without creating a separate codebase for every niche.

2. Core Product Idea

Tindahan should be:

One platform built around your business.

A business owner should be able to set up their system similarly to how someone creates a Shopify store.

However, instead of focusing mainly on e-commerce, Tindahan focuses on:

POS

Products and services

Inventory

Customers

Staff

Transactions

Reports

Business operations

The business owner should be able to customize the system without needing a developer to manually change the code.

3. Example User Experience

Cafe Example

A cafe owner creates a Tindahan account.

During onboarding:

Create Account
      ↓
Create Business
      ↓
Choose Business Type

[ Retail ]
[ Cafe ]
[ Salon ]
[ Motorshop ]
[ Service Business ]
[ Start From Scratch ]

      ↓
Choose Template
      ↓
Customize Business
      ↓
Launch POS

If the owner chooses Cafe, Tindahan automatically configures the workspace with cafe-related features.

Example modules:

POS Checkout

Menu

Menu Categories

Product Variants

Add-ons / Modifiers

Inventory

Customers

Staff

Transactions

Reports

Receipts

The owner can then add a product such as:

Spanish Latte

Price: ₱150
Category: Coffee
Image: spanish-latte.jpg
Status: Active

Optional variants:

Small  — ₱130
Medium — ₱150
Large  — ₱170

Optional modifiers:

Extra Shot     +₱30
Oat Milk       +₱40
Caramel Syrup  +₱20

The same product information can later be reused across:

POS
Inventory
Reports
Online Menu
Online Storefront

4. Main Product Principle

Do NOT Create Separate Apps

Avoid building completely separate systems such as:

CafePOS
SalonPOS
RetailPOS
MotorShopPOS

This creates unnecessary maintenance and duplicated code.

Instead, build:

                    Tindahan
                        │
       ┌────────────────┴────────────────┐
       │                                 │
   Core Platform                  Business Templates
       │                                 │
       ├── POS                           ├── Retail
       ├── Products                      ├── Cafe
       ├── Customers                     ├── Salon
       ├── Transactions                  ├── Motorshop
       ├── Payments                      ├── Service Business
       ├── Staff                         └── Custom
       ├── Reports
       └── Settings

Every business uses the same core platform.

Templates only determine:

Enabled modules

Default terminology

Default settings

Default categories

Recommended workflows

Optional features

Dashboard widgets

5. Core Modules

These modules should exist in the base Tindahan platform.

Authentication

Secure owner login

Staff login

Role-based permissions

Secure sign-out

Dashboard

Today's sales

Transaction count

Customers

Low-stock products

Recent transactions

Sales chart

Best-selling items

Customizable widgets

POS

Product search

Service search

Categories

Cart

Quantity controls

Discounts

Taxes

Customer selection

Payment methods

Change calculation

Receipt generation

Products & Services

Business owners can manage:

Name

SKU

Description

Image

Category

Product / Service type

Cost

Selling price

Variants

Modifiers

Stock quantity

Low-stock threshold

Status

Custom fields

Inventory

Current stock

Stock adjustments

Restocking

Inventory movements

Low-stock alerts

Inventory valuation

Automatic stock deduction after sale

Customers

Name

Phone

Email

Address

Notes

Custom fields

Purchase history

Total spending

Transaction count

Last purchase

Transactions

Receipt number

Date and time

Customer

Staff member

Items

Discounts

Taxes

Payment method

Payment reference number

Total

Receipt reprinting

Payments

Initial supported payment types:

Cash

GCash

Card

Other

Future possibilities:

Maya

QR payments

Online payments

Payment gateway integrations

Reports

Daily sales

Weekly sales

Monthly sales

Best-selling products

Sales by category

Sales by payment method

Inventory reports

Low-stock reports

CSV export

Settings

Business name

Logo

Workspace name

Tagline

Business type

Address

Phone

Email

Currency

Tax settings

Receipt footer

Receipt layout

Brand colors

Sidebar color

Enabled modules

6. Business Templates

Templates should configure the system instead of creating separate applications.

Cafe Template

POS
Menu
Menu Categories
Product Variants
Modifiers / Add-ons
Inventory
Customers
Staff
Transactions
Reports
Receipts

Suggested terminology:

Products   → Menu Items
Categories → Menu Categories

Features:

variants: true
modifiers: true
appointments: false
jobOrders: false

Retail Template

POS
Products
Categories
Inventory
Customers
Staff
Transactions
Reports
Receipts

Features:

variants: true
modifiers: false
appointments: false
jobOrders: false

Salon / Wellness Template

POS
Services
Products
Appointments
Customers
Staff
Staff Commissions
Transactions
Reports
Packages
Memberships

Suggested terminology:

Products & Services
Appointments
Stylists / Staff

Features:

variants: false
modifiers: false
appointments: true
commissions: true
jobOrders: false

Motorshop Template

POS
Products
Inventory
Customers
Vehicles
Job Orders
Technicians
Parts Used
Service History
Transactions
Reports

Features:

vehicles: true
jobOrders: true
appointments: optional
serviceHistory: true

Service Business Template

POS
Services
Customers
Appointments
Staff
Transactions
Reports
Invoices / Receipts

Start From Scratch

Advanced users should also be able to create their own workspace.

They can manually enable:

POS
Products
Services
Inventory
Appointments
Job Orders
Customers
Staff
Reports

7. Suggested Template Configuration

A template can be stored as configuration instead of hardcoded pages.

Example:

const cafeTemplate = {
  id: "cafe",
  name: "Cafe",
  modules: [
    "dashboard",
    "pos",
    "products",
    "inventory",
    "customers",
    "staff",
    "transactions",
    "reports",
  ],
  terminology: {
    products: "Menu Items",
    categories: "Menu Categories",
  },
  features: {
    variants: true,
    modifiers: true,
    appointments: false,
    jobOrders: false,
    commissions: false,
  },
};

Salon:

const salonTemplate = {
  id: "salon",
  name: "Salon & Wellness",
  modules: [
    "dashboard",
    "pos",
    "services",
    "products",
    "appointments",
    "customers",
    "staff",
    "transactions",
    "reports",
  ],
  terminology: {
    products: "Products",
    services: "Services",
    staff: "Team",
  },
  features: {
    variants: false,
    modifiers: false,
    appointments: true,
    commissions: true,
    jobOrders: false,
  },
};

8. Business Customization

After selecting a template, the business owner should still be able to modify the workspace.

Branding

Allow customization of:

Logo

Business name

Workspace name

Tagline

Primary brand color

Sidebar color

Receipt logo

Receipt footer

Products

Allow owners to:

Add products

Edit products

Upload images

Set prices

Create categories

Create variants

Create modifiers

Change stock

Archive products

Services

Allow owners to:

Add services

Set service prices

Set duration

Assign staff

Add descriptions

Enable booking

Modules

Owners should be able to enable or disable optional modules.

Example:

Appointments    [ ON ]
Job Orders      [ OFF ]
Memberships     [ OFF ]
Inventory       [ ON ]
Customer CRM    [ ON ]

9. Shared Product Database

A major advantage of Tindahan should be that the owner enters information once and the same data can power multiple parts of the business.

Example:

Product
   │
   ├── POS
   ├── Inventory
   ├── Reports
   ├── Customer Purchases
   ├── Online Menu
   └── Online Storefront

For example:

Spanish Latte
₱150

The business owner should not need to recreate that product separately for:

POS

Website

Inventory

Reports

Everything should come from the same product record.

10. Future Online Storefront

After the POS platform is stable, Tindahan can add a customer-facing storefront.

A business could enable:

Online Storefront [ ON ]

Tindahan could generate:

business-name.tindahan.app

The storefront could automatically use:

Business logo

Brand colors

Products

Services

Categories

Prices

Product images

This creates the Shopify-like side of the platform.

11. Cafe Online Menu Example

A cafe owner could enable:

Online Menu [ ON ]

Customers could view:

Coffee
──────
Spanish Latte      ₱150
Americano           ₱100
Caramel Macchiato   ₱165

Pastries
────────
Croissant            ₱90
Chocolate Muffin     ₱110

Later versions could support:

QR menu

Online ordering

Pickup orders

Delivery integrations

12. Multi-Tenant Architecture

Tindahan should be built as a multi-tenant SaaS.

Every business belongs to an organization.

Example:

Organization
    │
    ├── Members
    ├── Products
    ├── Customers
    ├── Transactions
    ├── Inventory
    ├── Staff
    └── Settings

Business-owned records should contain:

organizationId

Example Prisma model:

model Product {
  id             String @id @default(cuid())
  organizationId String

  name           String
  description    String?
  sku            String?
  price          Decimal
  cost           Decimal?
  stock          Int?
  imageUrl       String?
  status         ProductStatus

  organization Organization @relation(
    fields: [organizationId],
    references: [id]
  )

  @@index([organizationId])
}

This allows multiple companies to use the same Tindahan application while keeping their data isolated.

13. Suggested Main Entities

User
Organization
Membership
BusinessTemplate
BusinessSettings
Category
Product
ProductVariant
ProductModifier
Service
InventoryMovement
Customer
Transaction
TransactionItem
Payment
Appointment
JobOrder
Vehicle
StaffCommission

Not every business needs every entity.

Optional entities should only become visible when the related feature is enabled.

14. Permissions

Suggested roles:

Owner

Full access.

Can manage:

Billing

Business settings

Staff

Products

Reports

Templates

Modules

POS

Inventory

Manager

Can manage:

POS

Products

Inventory

Customers

Staff

Reports

Cannot manage:

Billing

Ownership

Critical organization settings

Staff

Can primarily use:

POS

Customers

Assigned operational modules

Permissions should eventually become customizable.

15. Suggested Onboarding Flow

1. Create account

2. Create business

3. Enter business details
   - Business name
   - Location
   - Contact information

4. Choose business type

   [ Retail ]
   [ Cafe ]
   [ Salon ]
   [ Wellness ]
   [ Motorshop ]
   [ Services ]
   [ Other ]

5. Choose template

6. Customize branding

7. Add products / services

8. Add payment methods

9. Invite staff

10. Configure tax / receipts

11. Preview workspace

12. Launch

16. Product Positioning

Avoid positioning Tindahan as only:

A POS System

This makes the product sound interchangeable with hundreds of existing POS systems.

Instead:

Tindahan — One platform built around your business.

Alternative:

Choose your business. Customize your system. Run everything in one place.

Longer positioning:

Tindahan is a customizable POS and business management platform that adapts to how your business works. Choose a business template, customize your products, services, branding, staff, and workflow, then manage your operations from one system.

17. Key Differentiator

The strongest feature should not simply be:

"We support cafes, salons, and retail stores."

Many POS systems already support multiple industries.

The differentiator should be:

The business owner can configure Tindahan themselves.

Instead of contacting a developer whenever something needs to change:

Choose template
      ↓
Enable modules
      ↓
Customize products/services
      ↓
Customize workflow
      ↓
Customize branding
      ↓
Launch

That turns the product into a platform rather than a collection of custom projects.

18. MVP Scope

Do not attempt to build every industry feature immediately.

Phase 1 — Core SaaS

Build:

Authentication

Organizations

Memberships

Dashboard

POS

Products

Categories

Inventory

Customers

Transactions

Payments

Reports

Business settings

Receipt printing

Role-based access

Phase 2 — Template Engine

Add:

Business template selection

Module configuration

Terminology configuration

Feature flags

Template defaults

Custom dashboard widgets

Initial templates:

Retail
Cafe
Salon

Three strong templates are better than ten incomplete ones.

Phase 3 — Advanced Business Modules

Add:

Appointments
Staff commissions
Job orders
Vehicles
Service history
Memberships
Packages
Suppliers
Purchase orders

Phase 4 — Online Presence

Add:

Online storefront
Online menu
QR menu
Online ordering
Online booking
Customer portal

Phase 5 — Platform Expansion

Possible future additions:

Multi-branch
Advanced analytics
Accounting integrations
Payment gateways
Mobile application
Offline POS
Hardware integration
API access
App marketplace
Third-party integrations

19. Recommended Technology Direction

Suggested initial stack:

Frontend:
Next.js
React
TypeScript
Tailwind CSS

Backend:
Next.js server actions / API routes

Database:
PostgreSQL

ORM:
Prisma

Authentication:
Auth.js / NextAuth

Storage:
Supabase Storage or compatible object storage

Deployment:
Vercel

Database Hosting:
Supabase / managed PostgreSQL

Later infrastructure can be expanded when required.

20. Important Engineering Rule

Do not hardcode business behavior directly inside pages.

Avoid:

if (business.type === "CAFE") {
  // hundreds of cafe-specific UI rules
}

Prefer configuration-driven behavior:

if (features.modifiers) {
  showModifierManagement();
}

if (features.appointments) {
  showAppointments();
}

if (features.jobOrders) {
  showJobOrders();
}

This will make the platform much easier to maintain as more business templates are introduced.

21. Long-Term Product Vision

The final vision for Tindahan can become:

                   TINDAHAN

                     Core
                      │
        ┌─────────────┼─────────────┐
        │             │             │
       POS       Operations     Commerce
        │             │             │
   Transactions   Inventory     Storefront
   Payments       Customers     Online Menu
   Receipts       Staff         Ordering
   Reports        Booking       Booking
                  Job Orders

A business owner should eventually be able to run both their physical and online operations using the same platform.

22. Product Summary

Tindahan should become:

A customizable business operating platform where owners choose a business template, configure their own products, services, workflows, branding, staff, and modules, and then use the same system for POS, inventory, customers, reporting, and eventually their online storefront.

The key architecture principle is:

Build one flexible platform, not separate applications for each industry.

The key product principle is:

Let the business owner customize the system without needing a developer.