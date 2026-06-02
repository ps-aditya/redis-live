# Architecture

## Overview

Redis State Explorer (RSE) is an experimentation environment designed to make Redis observable.

Users interact with Redis through a web interface and receive real-time feedback in the form of state changes, explanations, and visualizations.

The system consists of three primary components:

1. Frontend
2. Backend API
3. Redis Instance

---

# High-Level Flow

User Input

↓

Frontend

↓

Backend API

↓

Redis

↓

State Extraction

↓

Visualization Engine

↓

User Interface

---

# Frontend

## Purpose

Provide an interactive environment for experimentation and visualization.

## Responsibilities

* Command input
* State viewer
* Experiment interface
* Visualization display
* User interaction

## Planned Technologies

* React
* TypeScript
* Tailwind CSS

---

# Backend API

## Purpose

Act as the bridge between the frontend and Redis.

## Responsibilities

* Execute Redis commands
* Validate requests
* Query Redis state
* Return structured responses
* Support future visualization features

## Planned Technologies

* Node.js
* Express

---

# Redis Instance

## Purpose

Serve as the experimental environment.

## Responsibilities

* Store data
* Execute commands
* Simulate real Redis behavior

## Deployment Strategy

Development:

* Docker container

Production:

* Managed Redis service

---

# Visualization Engine

## Purpose

Translate Redis state into understandable visual representations.

## Initial Support

* Strings
* Lists
* Sets
* Hashes
* TTL

## Future Support

* Pub/Sub
* Streams
* Persistence
* Replication
* Clustering

---

# Example Interaction

User Command:

SET user John

↓

Redis Update:

Key created

↓

State Snapshot:

{
"user": "John"
}

↓

Visualization:

user → John

↓

Explanation:

A new string key was created.

---

# Design Principles

* Redis should never feel like a black box.
* Every action should produce visible feedback.
* Visualization should support experimentation.
* Simplicity is preferred over complexity.

