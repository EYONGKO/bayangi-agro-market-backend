# local-roots-api

Express + MongoDB (Mongoose) API for Local Roots.

## Setup
1. Copy `.env.example` to `.env` and set values.
2. Ensure MongoDB is running and `MONGODB_URI` is correct.
3. Install deps:
   - `npm install`
4. Start server:
   - `npm start`

## Endpoints
- `GET /health`
- `POST /api/auth/register` { name, email, password }
- `POST /api/auth/login` { email, password }

Products:
- `GET /api/products` (public)
- `GET /api/products/:id` (public)
- `POST /api/products` (admin)
- `PUT /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)

Admin access is email-allowlisted via `ADMIN_EMAILS`.
