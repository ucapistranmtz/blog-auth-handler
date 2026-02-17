# 🚀 blog-auth-handler

Este repositorio contiene la función **AWS Lambda** escrita en **Python** que gestiona la persistencia de usuarios en la base de datos **Neon (PostgreSQL)**. Funciona como un disparador (Trigger) de **Amazon Cognito** dentro del flujo de autenticación de **Better-Auth**.

## 🏗️ Arquitectura: Identity-First Flow

Siguiendo las mejores prácticas, la base de datos solo se actualiza una vez que la identidad ha sido confirmada por el proveedor (Cognito).

```mermaid
graph TD
    %% Definición de Nodos
    User["💻 User (Next.js + Better-Auth)"]
    Cog["🆔 Amazon Cognito (Identity Provider)"]
    L["⚡ Lambda: blog-auth-handler"]
    DB["💎 Neon PostgreSQL (Users Table)"]
    Sec["🔐 Secrets Manager (DB_URL)"]

    %% Flujo de la Verdad
    User -- "1. Intent: Signup/Login" --> Cog
    Cog -- "2. Success: Post-Confirmation" --> L

    %% Sincronización
    L -- "3. Fetch Credentials" --> Sec
    L -- "4. Persistent Sync (INSERT/UPDATE)" --> DB

    %% Estilos Pro (Dark Mode + Red)
    style L fill:#000,stroke:#ff0000,stroke-width:3px,color:#ff0000
    style Cog fill:#1a1a1a,stroke:#f44336,stroke-width:1px,color:#ffffff
    style DB fill:#1a1a1a,stroke:#ffffff,stroke-width:1px,color:#ffffff
    style User fill:#1a1a1a,stroke:#ffffff,stroke-width:1px,color:#ffffff
    style Sec fill:#1a1a1a,stroke:#fbc02d,stroke-width:1px,color:#ffffff
```
