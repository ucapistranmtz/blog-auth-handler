# 🚀 blog-auth-handler

This repository contains the **AWS Lambda** function (Python) responsible for synchronizing users with the **Neon (PostgreSQL)** database. It acts as an **Amazon Cognito Post-Confirmation Trigger** within the **Better-Auth** authentication workflow.

## 🏗️ Architecture: Identity-First Flow

Following industry best practices, the database is only updated once the user's identity has been verified and confirmed by the Identity Provider (Cognito).

```mermaid
graph TD
    %% Node Definitions
    User["💻 User (Next.js + Better-Auth)"]
    Cog["🆔 Amazon Cognito (Identity Provider)"]
    L["⚡ Lambda: blog-auth-handler"]
    DB["💎 Neon PostgreSQL (Users Table)"]
    Sec["🔐 Secrets Manager (DB_URL)"]

    %% Truth Flow
    User -- "1. Intent: Signup/Login" --> Cog
    Cog -- "2. Success: Post-Confirmation" --> L

    %% Synchronization
    L -- "3. Fetch Credentials" --> Sec
    L -- "4. Persistent Sync (INSERT/UPDATE)" --> DB

    %% Pro Styles (Dark Mode + Red)
    style L fill:#000,stroke:#ff0000,stroke-width:3px,color:#ff0000
    style GW fill:#1a1a1a,stroke:#f44336,stroke-width:1px,color:#ffffff
    style Cog fill:#1a1a1a,stroke:#ffffff,stroke-width:1px,color:#ffffff
    style DB fill:#1a1a1a,stroke:#ffffff,stroke-width:1px,color:#ffffff
    style User fill:#1a1a1a,stroke:#ffffff,stroke-width:1px,color:#ffffff
    style Sec fill:#1a1a1a,stroke:#fbc02d,stroke-width:1px,color:#ffffff
```
