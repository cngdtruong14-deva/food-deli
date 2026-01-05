# Development Documentation (`docs-dev`)

This folder contains the **System Specifications** for the active development of the Food Delivery project.

The purpose of this documentation is to bridge the gap between the original high-level design (found in `docs/`) and the **current actual implementation** (React/Vite Frontend + Express/Mongoose Backend).

## Terminology

- **Original Docs (`docs/`)**: The source of truth for high-level concepts.
- **Current Architecture**: The actual code in `frontend/` (React/Vite) and `backend/` (Express/MongoDB).
- **Target State**: A fully featured application implementing the specifications below.

## Contents

1.  [**Current Architecture**](./current-architecture.md):

    - Details the existing MERN stack and project structure.

2.  [**System Feature Specifications**](./feature-specs.md):

    - **The Master List** of all functional requirements.
    - Describes Multi-Branch logic, Table Management, QR Ordering, and Real-time workflows.
    - Replaces the phased "roadmap" with a complete definition of done.

3.  [**Database Schema Plan**](./database-schema-plan.md):

    - **Mongoose Schemas** for the complete system.
    - Includes new models: `Branch`, `Table`, `Category`, and updated `Order`/`User`.

4.  [**API Endpoints**](./api-endpoints.md):
    - List of proposed API routes to support the new features.
