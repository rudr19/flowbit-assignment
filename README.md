# Flowbit Multi-Tenant Support Ticket System

A production-ready multi-tenant support ticket system featuring secure tenant isolation, dynamic micro-frontend architecture, automated workflow integration, and real-time updates. Built with modern full-stack technologies and enterprise-grade security practices.

##  Key Features

###  Secure Authentication & Authorization
- **JWT-based Authentication**: Email/password login with `jsonwebtoken` and `bcrypt` password hashing
- **Role-based Access Control**: Admin/User roles with middleware-enforced route protection
- **Tenant-aware Security**: JWT tokens carry `userId`, `customerId`, and `role` for complete context
- **Protected Admin Routes**: `/admin/*` endpoints restricted to Admin users only

###  Complete Tenant Isolation
- **Database-level Isolation**: Every MongoDB collection includes `customerId` for strict tenant separation
- **Verified Security**: Jest unit tests prove cross-tenant data protection
- **Tenant-filtered Queries**: All database operations automatically filter by tenant context
- **Secure Multi-tenancy**: Complete isolation between LogisticsCo and RetailGmbH tenants

###  Dynamic Micro-frontend Architecture
- **Module Federation**: Webpack Module Federation for dynamic micro-frontend loading
- **Tenant-specific Screens**: Registry-based screen configuration per tenant
- **Lazy Loading**: React shell dynamically loads `SupportTicketsApp` based on tenant
- **Responsive Navigation**: Sidebar fetches `/api/me/screens` for tenant-specific routing

###  Workflow Automation with n8n
- **Seamless Integration**: Complete n8n workflow engine integration via Docker
- **Automated Triggers**: Ticket creation automatically triggers n8n workflows
- **Secure Webhooks**: n8n callbacks verified with shared secret headers
- **Real-time Updates**: Workflow status changes instantly update UI via Socket.IO

###  Production-ready Containerization
- **Complete Docker Environment**: Single-command deployment with `docker-compose up --build`
- **Auto-configuration**: All services self-configure without manual intervention
- **Full Stack**: MongoDB, API, React Shell, MFE, n8n, and Ngrok tunnel
- **Development Ready**: Optimized for local development with hot reload

###  Advanced Monitoring & Logging
- **Comprehensive Audit Trail**: Complete logging of all user actions with tenant context
- **Structured Logging**: `{action, userId, customerId, ticketId, timestamp}` format
- **Real-time Tracking**: All ticket operations logged to MongoDB
- **Security Monitoring**: User actions tracked across tenant boundaries

###  Enterprise Testing & CI/CD
- **End-to-End Testing**: Cypress smoke tests covering complete user journeys
- **Unit Testing**: Jest tests for critical security and business logic
- **Automated CI/CD**: GitHub Actions pipeline with linting and testing
- **Quality Assurance**: Continuous integration ensures code quality

##  Demo Accounts

| Tenant | Email | Password | Role |
|---------|-------|----------|------|
| **LogisticsCo** | admin@logisticsco.com | StrongDemo@2025! | Admin |
| **RetailGmbH** | admin@retailgmbh.com | StrongDemo@2025! | Admin |

##  Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for testing)

### Launch Complete System
```bash
# Clone repository
git clone <repository-url>
cd flowbit-multi-tenant

# Start all services
docker-compose up --build
```

### Access Applications
- **React Shell (Host)**: http://localhost:3000
- **Support Tickets MFE**: http://localhost:3002
- **API Server**: http://localhost:3001
- **n8n Workflow Engine**: http://localhost:5678
- **Ngrok Tunnel**: http://localhost:4040

### Test Multi-tenancy
1. **Login as LogisticsCo**: Use admin@logisticsco.com
2. **Create Support Ticket**: Watch n8n workflow trigger
3. **Real-time Updates**: See status changes via Socket.IO
4. **Switch Tenants**: Login as RetailGmbH and verify data isolation
5. **Audit Trail**: Check MongoDB for complete action logging

##  Project Architecture

```
flowbit-multi-tenant/
├── backend/
│   ├── routes/
│   │   ├── auth.js          # JWT authentication
│   │   ├── tickets.js       # Ticket CRUD operations
│   │   ├── webhook.js       # n8n webhook handling
│   │   └── screens.js       # Tenant screen configuration
│   ├── models/
│   │   ├── User.js          # User model with tenant isolation
│   │   ├── Ticket.js        # Ticket model with tenant filtering
│   │   └── AuditLog.js      # Audit trail model
│   ├── middleware/
│   │   ├── auth.js          # JWT verification
│   │   └── tenant.js        # Tenant isolation middleware
│   └── app.js               # Express server with Socket.IO
├── frontend/
│   ├── shell/               # Host React application
│   │   ├── src/
│   │   │   ├── components/  # Login, Sidebar, Layout
│   │   │   └── utils/       # API client, auth helpers
│   │   └── webpack.config.js # Module Federation config
│   └── support-tickets/     # Microfrontend module
│       ├── src/
│       │   ├── components/  # Ticket components
│       │   └── services/    # API services
│       └── webpack.config.js # MFE configuration
├── shared/
│   ├── api/                 # Axios API wrapper
│   └── auth/                # Authentication utilities
├── seed-data/               # MongoDB seed scripts
├── cypress/
│   └── e2e/smoke.cy.js      # End-to-end tests
├── .github/workflows/
│   └── ci.yml               # GitHub Actions CI/CD
├── registry.json            # Tenant screen configurations
├── docker-compose.yml       # Complete container orchestration
└── README.md
```

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Production Docker Environment               │
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐ │
│  │ React Shell │◄───┤ Backend API  │────┤ SupportTickets  │ │
│  │   (Host)    │    │ (Auth/RBAC)  │    │     (MFE)       │ │
│  └─────────────┘    └──────┬───────┘    └─────────────────┘ │
│         │                  │                               │
│         │ Module Fed.      │ Socket.IO                     │
│         ▼                  ▼                               │
│  ┌─────────────┐    ┌──────────────┐                      │
│  │     n8n     │    │   MongoDB    │                      │
│  │ (Workflows) │◄───┤(Multi-Tenant)│                      │
│  └─────────────┘    └──────────────┘                      │
│         │                                                 │
│         └─── Secure Webhooks ─────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

## Complete Workflow Process

1. **User Authentication**: JWT login with tenant-aware token generation
2. **Dynamic Loading**: Shell fetches tenant screens and loads appropriate MFE
3. **Ticket Creation**: User creates ticket → MongoDB → triggers n8n workflow
4. **Workflow Processing**: n8n processes with tenant context and calls webhook
5. **Security Verification**: Backend validates shared secret from n8n
6. **Data Update**: Ticket status updated in MongoDB with audit logging
7. **Real-time Sync**: Socket.IO broadcasts updates to all tenant clients
8. **Audit Trail**: Complete action logging for compliance and monitoring

## Testing & Quality Assurance

### Run Complete Test Suite
```bash
# End-to-end testing
npx cypress run

# Unit testing with coverage
npm run test

# Lint code quality
npm run lint
```

### Automated CI/CD
- **GitHub Actions**: Automated testing on every push
- **Code Quality**: ESLint and Prettier integration
- **Security Testing**: Tenant isolation verification
- **Performance**: Load testing for multi-tenant scenarios

##  Security & Compliance

### Multi-tenant Security
- **Complete Data Isolation**: Verified through automated testing
- **Role-based Access**: Admin/User permissions with route protection
- **JWT Security**: Secure token-based authentication with tenant context
- **Webhook Security**: Shared secret validation for external integrations

### Compliance Features
- **Audit Logging**: Complete action trail for regulatory compliance
- **Data Encryption**: Secure password hashing and JWT tokens
- **Tenant Boundaries**: Strict enforcement of data access controls
- **Security Testing**: Automated tests verify cross-tenant protection

## Technical Highlights

### Modern Stack
- **Frontend**: React 18, Webpack Module Federation, Socket.IO client
- **Backend**: Node.js, Express, MongoDB, JWT, Socket.IO
- **DevOps**: Docker Compose, GitHub Actions, Cypress, Jest
- **Integration**: n8n workflow automation, Ngrok tunneling

### Performance Optimizations
- **Lazy Loading**: Micro-frontends loaded on demand
- **Real-time Updates**: Socket.IO for instant UI synchronization
- **Efficient Queries**: Tenant-filtered database operations
- **Containerized**: Optimized Docker setup for development

### Scalability Features
- **Micro-frontend Architecture**: Independently deployable modules
- **Tenant Isolation**: Horizontal scaling per tenant
- **Workflow Automation**: Scalable n8n integration
- **API Design**: RESTful endpoints with proper error handling


Thank you for reviewing my submission — I look forward to the opportunity to join the Flowbit team!


---
