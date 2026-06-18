# BSCRI API Documentation
## Botswana Supply Chain Readiness Index

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api`  
**Content-Type:** `application/json`

---

## Overview

This document describes all API endpoints for the BSCRI platform. The API is organized into public and protected routes.

- **Public Routes:** Accessible without authentication
- **Protected Routes:** Require a valid JWT token (admin only)

---

## Authentication

### Admin Login

**Endpoint:** `POST /api/admin/login`

Authenticates an admin user and returns a JWT token.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Admin username |
| password | string | Yes | Admin password |

**Request Example:**

```json
{
  "username": "admin",
  "password": "admin123"
}
