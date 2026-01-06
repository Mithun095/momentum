# Docker Setup and Usage

This guide explains how to build and run the Momentum application using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system.
- A populated `.env` file (see `SETUP_GUIDE.md` or `.env.example`).

## Configuration

The `docker-compose.prod.yml` is configured to use your existing Supabase database.
Ensure your `.env` file contains the correct `DATABASE_URL` pointing to Supabase.

## Quick Start

To build and start the application in production mode:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Useful Commands

### Stop the container
```bash
docker compose -f docker-compose.prod.yml down
```

### View logs
```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Rebuild the container
If you make changes to the code, you need to rebuild the container:
```bash
docker compose -f docker-compose.prod.yml up --build -d
```
