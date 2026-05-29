# Port Inventory Management System (PIMS) - NMPA Terminal

An enterprise-grade, role-based logistics dashboard simulating operations at **New Mangalore Port Authority (NMPA)**. The system models ship cargo manifests, weighbridge truck logs, automated customs clearance holds, warehouse bay allocations, demurrage calculations, invoice payment receipts, and security audit logging.

---

## 🏗️ Relational Architecture

The database manages 13 relational entities using Sequelize ORM:
- **User & Role**: Secure RBAC token mapping.
- **Cargo**: Tracks vessels, weights, category (Container, Bulk, Liquid, Break Bulk), and status.
- **Warehouse & YardLocation**: Allocates storage rack coordinates based on capacity limit checks.
- **CustomsClearance**: Logs phytosanitary certifications, inspection schedules, and officer approvals.
- **GatePass & Truck**: Generates unique QR pass references for weighed trucks.
- **Invoice & Payment**: Automates demurrage calculations (free storage tier limit of 3 days).
- **Notification & AuditLog**: Broadcasts system-wide alerts and logs all staff actions.

## ⚡ Quick Start Instructions

Follow these steps to run the application locally on Windows (Powershell):

### 1. Database Setup (PostgreSQL)
Ensure you have a PostgreSQL server running locally or remotely:
1. Create a database named `port_inventory` inside PostgreSQL.
2. Open `backend/.env` and update the connection details (`DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`) to match your PostgreSQL server.

### 2. Launch the Backend REST Server
```powershell
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Start the API server (will automatically seed the PostgreSQL database if empty)
npm start
```
*The server will run on `http://localhost:5000`.*
*Health Check: `http://localhost:5000/api/health`*

### 2. Launch the Frontend React App
```powershell
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run the developer server
npm run dev
```
*The React UI will run on `http://localhost:5173`.*

---

## 🔐 Sandbox Test Accounts (One-Click Login)

For ease of testing, the Login page features an **Autofill testing widget**. Click on any role to login instantly:

| Role Name | Username | Password | clearanced Modules |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `password123` | Full access to all components and user directories |
| **Port Operations Officer** | `ops` | `password123` | Upload Manifests, Log Cargo Unloading tasks |
| **Warehouse Manager** | `warehouse` | `password123` | Allocate warehouse zones, log damaged cargo |
| **Customs Officer** | `customs` | `password123` | Schedule physical inspections, Approve/Reject releases |
| **Gate Officer** | `gate` | `password123` | Scan truck passes, verify weighbridge checks |
| **Finance Officer** | `finance` | `password123` | Collect storage invoices and demurrage fees |
| **Shipping Agent** | `shipping` | `password123` | Submit manifestations, request gate passes, pay bills |

---

## 🔄 Core End-to-End Operational Workflow

To test the system integrity, you can simulate a cargo's journey through NMPA:

1. **Manifest Registration**:
   - Log in as **Shipping Agent** or **Super Admin**.
   - Go to **Cargo Inventory** and click **Upload Cargo Manifest**.
   - Input vessel name (e.g., *MT Swarna Krishna*), consignee client, category, and weight, and upload a file. The status begins as `Manifest Uploaded`.

2. **Cargo Unloading**:
   - Log in as **Port Operations Officer**.
   - In **Cargo Inventory**, find the cargo and click **Unload Cargo** to register physical dock arrival. Status becomes `Unloaded`.

3. **Yard Allocation**:
   - Log in as **Warehouse Manager**.
   - In **Cargo Inventory**, click **Allocate Storage**. Choose a warehouse bay and zone slot. Status becomes `Allocated`.

4. **Customs Clearance**:
   - Log in as **Customs Officer**.
   - Go to **Customs Clearance**. Click **Process Review** on your cargo.
   - Schedule an inspection time, type remarks, and click **Release Authorized**.
   - Status becomes `Customs Approved`. This action *automatically* triggers invoice generation.

5. **Billing Settlement**:
   - Log in as **Finance Officer**.
   - Go to **Billing & Invoices**. Locate the newly created invoice.
   - Click **Collect Fee**. Choose a payment method (UPI, Card, Ledger) and settle the ledger.
   - Click **Print Bill** to view or print the paper receipt (optimized layout hiding UI sidebars).

6. **Gate Pass Issuance**:
   - Log in as **Shipping Agent**.
   - Go to **Gate Operations** -> click **Generate Gate Pass QR**.
   - Enter your cargo reference, truck license, driver name, and carrier.
   - Status becomes `Gate Pass Active` (only if Customs is approved and Invoice is paid).

7. **Weighbridge Scanner Verification**:
   - Log in as **Gate Officer**.
   - In **Gate Operations**, the **Weighbridge Scanner Simulator** console on the left will allow you to scan the Gate Pass.
   - Click **Verify Entry** to check the truck in. Status becomes `Entered`.
   - Click **Verify Exit & Dispatch** to release the truck. Status becomes `Dispatched`.
   - The system automatically decrements warehouse space and completes the inventory run.

---

## 🛠️ Verification & Quality Assurance

You can execute integration tests on endpoints by running:
```powershell
cd backend
node test_api.js
```
*All tests verify server health, credentials authentication, and database KPI queries.*
