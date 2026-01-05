# System Feature Specifications

This document outlines the complete functional requirements for the Food Delivery system, adapted for the current MERN stack.

## 1. Multi-Branch Management

The system supports multiple restaurant locations (branches).

- **Create Branch**: Admin can add a new branch with Name, Address, Phone, and Status (Active/Inactive).
- **Branch Selection**:
  - **Staff**: Associated with a specific branch. Login restricts them to their branch's data.
  - **Customer**: Can select a specific branch to order from (or auto-detected via Table QR).
- **Data Isolation**: Orders, Tables, and Staff are scoped to a specific Branch.

## 2. Table Management & QR Ordering

The core "Dine-in" experience.

- **Table CRUD**: Mangers can create tables (e.g., "Table 1", "Table A2") and assign them to a Branch.
- **QR Code Generation**: System generates a unique URL/QR for each table (e.g., `app.com/menu?branch=123&table=456`).
- **Scan to Order**:
  - Customer scans QR code.
  - App opens with correct Branch menu.
  - Cart automatically tagged with `TableID` and `BranchID`.
  - Order is placed with type "Dine-in".

## 3. Advanced Menu Management

- **Categories**: Group items (e.g., "Appetizers", "Drinks").
- **Availability**: Toggle item availability per branch (Out of Stock).
- **Modifiers (Optional/Advanced)**: Add-ons like "Extra Cheese", "No Ice".

## 4. Real-time Order Workflow

Socket.io integration for instant updates.

- **Order Placement**:
  - Customer places order -> Kitchen/Bar screens receive instant alert.
- **Order Processing Stages**:
  - `New` -> `Confirmed` (Kitchen accepts) -> `Cooking` -> `Ready/Serving` -> `Completed`.
- **Status Updates**:
  - Customer receives real-time updates on their device ("Your food is being prepared").

## 5. Staff Roles & Permissions

- **Admin**: Full system access (All branches, all settings).
- **Branch Manager**: Manage their specific branch (Staff, Tables, Menu availability).
- **Kitchen Staff**: View only "Active" orders, update status to "Ready".
- **Waiter**: View tables, take orders manually, update payment status.

## 6. Payment & Checkout

- **Methods**:
  - **COD/Cash**: Pay at counter or to waiter.
  - **Online**: Stripe integration (already partially implemented).
- **Split Bill (Future)**: Ability to split payment by person.

## 7. Analytics & Reporting

- **Daily Sales**: Total revenue per branch.
- **Product Performance**: Most sold items.
- **Peak Hours**: Order volume over time.
