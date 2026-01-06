# Makefile for Momentum Docker Setup

# Configuration
COMPOSE_FILE := docker-compose.prod.yml
CONTAINER_NAME := momentum-app

.PHONY: help build up down logs restart check status

help:
	@echo "Momentum Docker Management"
	@echo "--------------------------"
	@echo "make build    - Build the Docker image (with host network support)"
	@echo "make up       - Start the container in detached mode"
	@echo "make down     - Stop and remove the container"
	@echo "make logs     - View container logs"
	@echo "make restart  - Restart the container"
	@echo "make check    - Check database connectivity from within container"
	@echo "make status   - Show container status"

build:
	docker compose -f $(COMPOSE_FILE) build

up:
	docker compose -f $(COMPOSE_FILE) up -d
	@echo "App available at http://localhost:3000"

down:
	docker compose -f $(COMPOSE_FILE) down

logs:
	docker compose -f $(COMPOSE_FILE) logs -f

restart: down up

status:
	docker compose -f $(COMPOSE_FILE) ps

check:
	@echo "Checking connectivity to Supabase..."
	docker exec $(CONTAINER_NAME) node -e 'const dns = require("dns"); const net = require("net"); const host = "db.ovoozbzqndsaedvkdwpk.supabase.co"; console.log("Resolving " + host + "..."); dns.lookup(host, (err, address) => { if (err) { console.error("DNS Error:", err); process.exit(1); } console.log("Resolved to:", address); const client = new net.Socket(); client.setTimeout(5000); client.connect(5432, address, () => { console.log("✅ TCP Connection Success!"); client.destroy(); }); client.on("error", (e) => { console.error("❌ Connection Failed:", e.message); process.exit(1); }); client.on("timeout", () => { console.error("❌ Connection Timed Out"); client.destroy(); process.exit(1); }); });'
