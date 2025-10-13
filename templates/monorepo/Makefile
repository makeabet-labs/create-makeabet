SHELL := /bin/bash

ifneq (,$(wildcard .env))
include .env
export $(shell sed -n 's/=.*//p' .env)
endif

ENV_FILE ?= .env

.PHONY: setup dev chain deploy-local docker-up docker-down contracts-compile contracts-test lint migrate

setup:
	pnpm install

dev:
	pnpm dev

chain:
	pnpm chain

deploy-local:
	pnpm deploy:local

docker-up:
	docker compose --env-file $(ENV_FILE) up -d

docker-down:
	docker compose down

contracts-compile:
	pnpm --filter @makeabet/contracts compile

contracts-test:
	pnpm --filter @makeabet/contracts test

lint:
	turbo run lint

migrate:
	pnpm --filter @makeabet/api run prisma:migrate
