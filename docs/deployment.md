# BSCRI Deployment Guide
## Botswana Supply Chain Readiness Index

**Version:** 1.0.0  
**Last Updated:** 2026-06-17

---

## Overview

This document provides step-by-step instructions for deploying the BSCRI platform to production.

The platform consists of two main components:

| Component | Technology | Deployment Target |
|-----------|------------|-------------------|
| **Backend API** | Node.js + Express + MongoDB | Render / Railway / AWS |
| **Frontend** | HTML + CSS + JavaScript | Vercel / Netlify / Cloudflare Pages |

---

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account (or self-hosted MongoDB)
- GitHub repository with your BSCRI code
- Render account (for backend)
- Vercel or Netlify account (for frontend)

---

## Step 1: Database Setup

### MongoDB Atlas

1. Create an account at [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier is sufficient to start)
3. Create a database user with read/write permissions
4. Whitelist your IP address (or 0.0.0.0/0 for testing)
5. Get your connection string:

