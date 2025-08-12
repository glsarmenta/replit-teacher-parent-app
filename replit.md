# SchoolConnect Platform

## Overview

SchoolConnect is a comprehensive K-12 School Communication Platform built as a multi-tenant SaaS application. The platform serves schools, teachers, administrators, and parents with unified communication, attendance tracking, grading, forms management, and student progression monitoring. The system uses a modern full-stack architecture with React frontend, Express backend, PostgreSQL database via Neon, and real-time WebSocket communication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS v4 with CSS custom properties for theming
- **State Management**: TanStack Query for server state, React Context for auth/WebSocket
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with role-based access control
- **Real-time**: WebSocket server for live messaging and notifications
- **Middleware**: Custom authentication, tenant isolation, and error handling
- **File Structure**: Modular services pattern with separated concerns

### Database Layer
- **Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Multi-tenancy**: Tenant isolation using tenant_id column pattern
- **Schema Design**: Comprehensive tables for users, schools, announcements, attendance, messaging, grades, forms, and progression tracking
- **Migration**: Drizzle Kit for schema management and migrations

### Authentication & Authorization
- **Authentication**: JWT-based token system
- **Password Security**: bcrypt for password hashing
- **Role-based Access**: Three-tier system (admin, teacher, parent)
- **Session Management**: Token-based with middleware validation
- **Multi-tenant Security**: Tenant isolation enforced at middleware level

### Real-time Communication
- **WebSocket Integration**: Custom WebSocket server with authentication
- **Message Broadcasting**: Real-time chat and notifications
- **Connection Management**: Automatic reconnection and error handling
- **Event-driven Updates**: Live updates for attendance, grades, and announcements

### UI/UX Design System
- **Design Language**: shadcn/ui with New York variant
- **Component Library**: Radix UI primitives for accessibility
- **Theming**: CSS custom properties with light/dark mode support
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Icons**: Lucide React icon library

### Development Workflow
- **Type Safety**: Full TypeScript coverage across frontend and backend
- **Code Quality**: ESLint and Prettier configuration
- **Development Server**: Hot reload with Vite dev server
- **Path Aliases**: Simplified imports with @ and @shared aliases
- **Environment Management**: Environment-based configuration

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations and schema management
- **WebSocket (ws)**: Real-time bidirectional communication

### Frontend Libraries
- **React Ecosystem**: React 18, React DOM, TypeScript support
- **UI Components**: Radix UI component primitives for accessibility
- **TanStack Query**: Server state management and caching
- **Wouter**: Lightweight routing solution
- **Tailwind CSS**: Utility-first CSS framework

### Backend Dependencies
- **Express.js**: Web application framework
- **Authentication**: jsonwebtoken for JWT, bcrypt for password hashing
- **Database**: @neondatabase/serverless for database connections
- **WebSocket**: ws library for real-time communication

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production
- **PostCSS**: CSS processing with Tailwind
- **Replit Integration**: Development environment plugins and error handling

### Multi-tenant SaaS Features
- **Tenant Management**: Subdomain-based tenant identification
- **Billing Integration**: Subscription management and payment processing
- **Role-based Permissions**: Granular access control per tenant
- **Audit Logging**: Security and compliance tracking
- **Form Management**: Digital workflows for school operations