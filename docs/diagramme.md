# Workflow-Assistent - Diagramme

## 1. Komponentendiagramm

```mermaid
graph TB
    subgraph "Frontend (Vue 3)"
        subgraph "Admin-Bereich"
            WE[WorkflowEditor]
            NE[NodeEditor]
            WM[WorkflowManager]
        end
        
        subgraph "Benutzer-Bereich"
            WX[WorkflowExecutor]
            SW[StepWorkspace]
            WH[WorkflowHistory]
        end
        
        subgraph "Gemeinsame Komponenten"
            WD[WorkflowDiagram]
            NR[NodeRenderer]
            FV[FormValidator]
        end
        
        subgraph "State Management (Pinia)"
            WS[workflowStore]
            ES[executionStore]
            US[userStore]
        end
    end
    
    subgraph "Backend / API"
        API[REST API]
        WE_API[Workflow Engine]
        INT[Integration Service]
        AUTH[Auth Service]
    end
    
    subgraph "Externe Systeme"
        CT[ChurchTools API]
        EMAIL[E-Mail Service]
        WH_EXT[Webhooks]
        EXT[Externe APIs]
    end
    
    subgraph "Persistierung"
        DB[(Datenbank)]
        CACHE[(Cache)]
    end
    
    %% Admin-Bereich Verbindungen
    WE --> NE
    WE --> WD
    WE --> WS
    NE --> WS
    WM --> WS
    WM --> API
    
    %% Benutzer-Bereich Verbindungen
    WX --> SW
    WX --> WD
    WX --> WH
    WX --> ES
    SW --> FV
    SW --> ES
    WH --> ES
    
    %% Gemeinsame Komponenten
    WD --> NR
    WD --> WS
    WD --> ES
    
    %% State zu API
    WS --> API
    ES --> API
    US --> AUTH
    
    %% Backend Verbindungen
    API --> WE_API
    API --> AUTH
    API --> DB
    WE_API --> INT
    WE_API --> DB
    WE_API --> CACHE
    
    %% Integration Service
    INT --> CT
    INT --> EMAIL
    INT --> WH_EXT
    INT --> EXT
    
    %% Styling
    classDef frontend fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef backend fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef external fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef storage fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    
    class WE,NE,WM,WX,SW,WH,WD,NR,FV,WS,ES,US frontend
    class API,WE_API,INT,AUTH backend
    class CT,EMAIL,WH_EXT,EXT external
    class DB,CACHE storage
```

## 2. Systemarchitektur

```mermaid
C4Context
    title Systemarchitektur - Workflow-Assistent

    Person(admin, "Administrator", "Erstellt und verwaltet Workflows")
    Person(user, "Benutzer", "Führt Workflows aus")
    
    System_Boundary(wf_system, "Workflow-Assistent") {
        Container(frontend, "Frontend", "Vue 3, TypeScript", "Benutzeroberfläche für Workflow-Editor und -Ausführung")
        Container(api, "REST API", "Node.js/Express", "Backend-API für Workflow-Verwaltung")
        Container(engine, "Workflow Engine", "TypeScript", "Ausführungslogik und Zustandsverwaltung")
        ContainerDb(db, "Datenbank", "PostgreSQL/MySQL", "Speichert Workflows und Executions")
    }
    
    System_Ext(ct, "ChurchTools", "ChurchTools API für Personen, Gruppen, Events")
    System_Ext(email, "E-Mail Service", "SMTP für Benachrichtigungen")
    System_Ext(external, "Externe APIs", "Drittanbieter-Integrationen")
    
    Rel(admin, frontend, "Erstellt Workflows", "HTTPS")
    Rel(user, frontend, "Führt Workflows aus", "HTTPS")
    Rel(frontend, api, "API Calls", "REST/JSON")
    Rel(api, engine, "Workflow-Ausführung")
    Rel(api, db, "Lesen/Schreiben")
    Rel(engine, db, "Persistierung")
    Rel(engine, ct, "API Calls", "REST")
    Rel(engine, email, "Sendet E-Mails", "SMTP")
    Rel(engine, external, "Integration", "REST/Webhooks")
```

## 3. Datenmodell

```mermaid
erDiagram
    WORKFLOW ||--o{ WORKFLOW_NODE : contains
    WORKFLOW ||--o{ WORKFLOW_EDGE : contains
    WORKFLOW ||--o{ WORKFLOW_EXECUTION : instantiates
    WORKFLOW ||--o{ PERMISSION : has
    WORKFLOW_EXECUTION ||--o{ STEP_HISTORY : tracks
    WORKFLOW_NODE ||--o{ NODE_CONFIG : has
    WORKFLOW_NODE ||--o{ ACTION_CONFIG : has
    
    WORKFLOW {
        string id PK
        string name
        string description
        string createdBy
        datetime createdAt
        datetime updatedAt
        string status
    }
    
    WORKFLOW_NODE {
        string id PK
        string workflowId FK
        string type
        string label
        string description
        json position
        int order
    }
    
    WORKFLOW_EDGE {
        string id PK
        string workflowId FK
        string sourceNodeId FK
        string targetNodeId FK
        string condition
        string label
    }
    
    NODE_CONFIG {
        string id PK
        string nodeId FK
        string fieldName
        string fieldType
        boolean required
        json validation
        json defaultValue
    }
    
    ACTION_CONFIG {
        string id PK
        string nodeId FK
        string actionType
        string endpoint
        string method
        json headers
        json body
        json responseMapping
    }
    
    WORKFLOW_EXECUTION {
        string id PK
        string workflowId FK
        string userId
        string currentNodeId FK
        json context
        string status
        datetime startedAt
        datetime completedAt
    }
    
    STEP_HISTORY {
        string id PK
        string executionId FK
        string nodeId FK
        datetime timestamp
        json inputs
        json outputs
        string status
        string error
    }
    
    PERMISSION {
        string id PK
        string workflowId FK
        string userId
        string role
        boolean canExecute
        boolean canEdit
    }
```

## 4. Workflow-Ausführung Sequenzdiagramm

```mermaid
sequenceDiagram
    actor User as Benutzer
    participant UI as WorkflowExecutor
    participant Store as executionStore
    participant API as REST API
    participant Engine as Workflow Engine
    participant DB as Datenbank
    participant Ext as Externe Systeme
    
    User->>UI: Workflow starten
    UI->>Store: startExecution(workflowId)
    Store->>API: POST /api/workflows/:id/execute
    API->>Engine: createExecution()
    Engine->>DB: Execution speichern
    DB-->>Engine: Execution ID
    Engine-->>API: Execution Objekt
    API-->>Store: Execution Daten
    Store-->>UI: Aktualisiere UI
    UI-->>User: Zeige ersten Schritt
    
    loop Für jeden Schritt
        User->>UI: Eingaben machen
        User->>UI: "Weiter" klicken
        UI->>Store: completeStep(inputs)
        Store->>API: POST /api/executions/:id/step
        API->>Engine: processStep(inputs)
        
        alt Schritt hat Aktion
            Engine->>Ext: API Call / Webhook
            Ext-->>Engine: Response
            Engine->>Engine: Response verarbeiten
        end
        
        Engine->>DB: Historie speichern
        Engine->>Engine: Nächsten Schritt ermitteln
        
        alt Bedingung prüfen
            Engine->>Engine: Bedingung auswerten
            Engine->>Engine: Ziel-Knoten bestimmen
        end
        
        Engine->>DB: Execution aktualisieren
        Engine-->>API: Nächster Schritt
        API-->>Store: Aktualisierte Execution
        Store-->>UI: UI aktualisieren
        UI-->>User: Nächsten Schritt anzeigen
    end
    
    Engine->>DB: Execution als completed markieren
    Engine-->>API: Workflow abgeschlossen
    API-->>Store: Status Update
    Store-->>UI: Abschluss anzeigen
    UI-->>User: Erfolgsmeldung
```

## 5. Workflow-Editor Sequenzdiagramm

```mermaid
sequenceDiagram
    actor Admin as Administrator
    participant UI as WorkflowEditor
    participant Diagram as WorkflowDiagram
    participant NodeEdit as NodeEditor
    participant Store as workflowStore
    participant API as REST API
    participant DB as Datenbank
    
    Admin->>UI: Editor öffnen
    UI->>Store: loadWorkflows()
    Store->>API: GET /api/workflows
    API->>DB: Workflows abrufen
    DB-->>API: Workflow-Liste
    API-->>Store: Workflows
    Store-->>UI: Workflows geladen
    UI-->>Admin: Workflow-Liste anzeigen
    
    Admin->>UI: Neuen Workflow erstellen
    UI->>Diagram: Leeres Diagramm initialisieren
    Diagram-->>Admin: Leere Arbeitsfläche
    
    Admin->>Diagram: Knoten hinzufügen (Drag & Drop)
    Diagram->>Store: addNode(nodeData)
    Store-->>Diagram: Knoten hinzugefügt
    Diagram-->>Admin: Knoten anzeigen
    
    Admin->>Diagram: Knoten doppelklicken
    Diagram->>NodeEdit: openNodeEditor(nodeId)
    NodeEdit-->>Admin: Editor-Dialog öffnen
    
    Admin->>NodeEdit: Eigenschaften konfigurieren
    Admin->>NodeEdit: Felder definieren
    Admin->>NodeEdit: Aktionen hinzufügen
    Admin->>NodeEdit: Speichern
    NodeEdit->>Store: updateNode(nodeId, config)
    Store-->>NodeEdit: Knoten aktualisiert
    NodeEdit-->>Diagram: Dialog schließen
    Diagram-->>Admin: Aktualisierter Knoten
    
    Admin->>Diagram: Knoten verbinden
    Diagram->>Store: addEdge(edgeData)
    Store-->>Diagram: Verbindung hinzugefügt
    Diagram-->>Admin: Verbindung anzeigen
    
    Admin->>UI: Workflow speichern
    UI->>Store: saveWorkflow()
    Store->>API: POST /api/workflows
    API->>DB: Workflow speichern
    DB-->>API: Gespeichert
    API-->>Store: Workflow ID
    Store-->>UI: Erfolgsmeldung
    UI-->>Admin: "Workflow gespeichert"
```

## 6. Zustandsdiagramm - Workflow-Execution

```mermaid
stateDiagram-v2
    [*] --> Created: Workflow starten
    
    Created --> Running: Ersten Schritt laden
    
    Running --> ProcessingStep: Schritt bearbeiten
    ProcessingStep --> ValidatingInput: Eingaben validieren
    
    ValidatingInput --> ExecutingAction: Validierung OK
    ValidatingInput --> Running: Validierung fehlgeschlagen
    
    ExecutingAction --> EvaluatingCondition: Aktion erfolgreich
    ExecutingAction --> Error: Aktion fehlgeschlagen
    
    EvaluatingCondition --> Running: Nächster Schritt
    EvaluatingCondition --> Completed: Letzter Schritt
    
    Running --> Paused: Benutzer pausiert
    Paused --> Running: Fortsetzen
    Paused --> Cancelled: Abbrechen
    
    Error --> Running: Fehler behoben
    Error --> Failed: Nicht behebbar
    
    Completed --> [*]
    Cancelled --> [*]
    Failed --> [*]
    
    note right of Running
        Aktueller Schritt wird
        dem Benutzer angezeigt
    end note
    
    note right of ExecutingAction
        Externe API-Calls,
        Webhooks, etc.
    end note
    
    note right of EvaluatingCondition
        Bedingungen prüfen für
        Verzweigungen
    end note
```

## 7. Deployment-Diagramm

```mermaid
graph TB
    subgraph "Client Browser"
        Browser[Web Browser]
    end
    
    subgraph "ChurchTools Server"
        subgraph "Extension Container"
            Frontend[Vue 3 Frontend<br/>Workflow-Assistent]
        end
        
        subgraph "ChurchTools Core"
            CT_API[ChurchTools API]
            CT_DB[(ChurchTools DB)]
        end
        
        subgraph "Extension Backend"
            WF_API[Workflow API]
            WF_Engine[Workflow Engine]
            WF_DB[(Workflow DB)]
        end
    end
    
    subgraph "Externe Services"
        SMTP[SMTP Server]
        External[Externe APIs]
        Webhooks[Webhook Endpoints]
    end
    
    Browser -->|HTTPS| Frontend
    Frontend -->|REST| WF_API
    Frontend -->|REST| CT_API
    
    WF_API --> WF_Engine
    WF_API --> WF_DB
    WF_Engine --> WF_DB
    
    WF_Engine -->|Integration| CT_API
    CT_API --> CT_DB
    
    WF_Engine -->|E-Mail| SMTP
    WF_Engine -->|HTTP| External
    WF_Engine -->|POST| Webhooks
    
    classDef client fill:#e3f2fd,stroke:#1976d2
    classDef server fill:#fff3e0,stroke:#f57c00
    classDef external fill:#f3e5f5,stroke:#7b1fa2
    classDef storage fill:#e8f5e9,stroke:#388e3c
    
    class Browser client
    class Frontend,CT_API,WF_API,WF_Engine server
    class SMTP,External,Webhooks external
    class CT_DB,WF_DB storage
```

## 8. Aktivitätsdiagramm - Workflow-Schritt mit Verzweigung

```mermaid
flowchart TD
    Start([Schritt starten]) --> LoadStep[Schritt-Definition laden]
    LoadStep --> RenderUI[UI rendern]
    RenderUI --> WaitInput[Auf Benutzereingabe warten]
    
    WaitInput --> ValidateInput{Eingabe<br/>validieren}
    ValidateInput -->|Ungültig| ShowError[Fehlermeldung anzeigen]
    ShowError --> WaitInput
    
    ValidateInput -->|Gültig| SaveInput[Eingabe speichern]
    SaveInput --> HasAction{Hat Schritt<br/>Aktion?}
    
    HasAction -->|Ja| ExecuteAction[Aktion ausführen]
    ExecuteAction --> ActionSuccess{Aktion<br/>erfolgreich?}
    
    ActionSuccess -->|Nein| HandleError[Fehler behandeln]
    HandleError --> ShowActionError[Fehlermeldung]
    ShowActionError --> WaitInput
    
    ActionSuccess -->|Ja| SaveResponse[Response speichern]
    SaveResponse --> HasCondition{Hat Schritt<br/>Bedingung?}
    
    HasAction -->|Nein| HasCondition
    
    HasCondition -->|Ja| EvaluateCondition[Bedingung auswerten]
    EvaluateCondition --> DetermineNext[Nächsten Schritt bestimmen]
    
    HasCondition -->|Nein| GetNextStep[Standard nächster Schritt]
    GetNextStep --> DetermineNext
    
    DetermineNext --> UpdateHistory[Historie aktualisieren]
    UpdateHistory --> IsLastStep{Letzter<br/>Schritt?}
    
    IsLastStep -->|Ja| Complete([Workflow abschließen])
    IsLastStep -->|Nein| NextStep([Nächsten Schritt laden])
    
    style Start fill:#4caf50,stroke:#2e7d32,color:#fff
    style Complete fill:#2196f3,stroke:#1565c0,color:#fff
    style NextStep fill:#2196f3,stroke:#1565c0,color:#fff
    style ShowError fill:#f44336,stroke:#c62828,color:#fff
    style ShowActionError fill:#f44336,stroke:#c62828,color:#fff
```

## 9. Use Case Diagramm

```mermaid
graph LR
    subgraph "Akteure"
        Admin[Administrator]
        User[Benutzer]
        System[Externes System]
    end
    
    subgraph "Workflow-Verwaltung"
        UC1[Workflow erstellen]
        UC2[Workflow bearbeiten]
        UC3[Workflow löschen]
        UC4[Workflow veröffentlichen]
        UC5[Berechtigungen verwalten]
    end
    
    subgraph "Workflow-Ausführung"
        UC6[Workflow starten]
        UC7[Schritt bearbeiten]
        UC8[Workflow pausieren]
        UC9[Workflow fortsetzen]
        UC10[Historie anzeigen]
    end
    
    subgraph "Integration"
        UC11[API-Call ausführen]
        UC12[Webhook senden]
        UC13[E-Mail versenden]
        UC14[ChurchTools-Daten abrufen]
    end
    
    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
    
    UC7 -.-> UC11
    UC7 -.-> UC12
    UC7 -.-> UC13
    UC7 -.-> UC14
    
    UC11 --> System
    UC12 --> System
    UC13 --> System
    UC14 --> System
    
    classDef actor fill:#fff9c4,stroke:#f57f17
    classDef usecase fill:#e1f5fe,stroke:#01579b
    classDef integration fill:#f3e5f5,stroke:#4a148c
    
    class Admin,User,System actor
    class UC1,UC2,UC3,UC4,UC5,UC6,UC7,UC8,UC9,UC10 usecase
    class UC11,UC12,UC13,UC14 integration
```

## 10. Klassendiagramm - Core Entities

```mermaid
classDiagram
    class Workflow {
        +string id
        +string name
        +string description
        +WorkflowNode[] nodes
        +WorkflowEdge[] edges
        +Permission[] permissions
        +Date createdAt
        +Date updatedAt
        +addNode(node: WorkflowNode)
        +removeNode(nodeId: string)
        +addEdge(edge: WorkflowEdge)
        +removeEdge(edgeId: string)
        +validate() bool
    }
    
    class WorkflowNode {
        +string id
        +NodeType type
        +string label
        +string description
        +Position position
        +NodeConfig config
        +ActionConfig[] actions
        +validate() bool
        +execute(context: Context) Result
    }
    
    class WorkflowEdge {
        +string id
        +string sourceId
        +string targetId
        +string condition
        +string label
        +evaluate(context: Context) bool
    }
    
    class WorkflowExecution {
        +string id
        +string workflowId
        +string userId
        +string currentNodeId
        +Context context
        +StepHistory[] history
        +ExecutionStatus status
        +Date startedAt
        +Date completedAt
        +start()
        +processStep(inputs: any)
        +pause()
        +resume()
        +cancel()
    }
    
    class Context {
        +Map~string, any~ variables
        +string userId
        +Date timestamp
        +get(key: string) any
        +set(key: string, value: any)
        +merge(data: object)
    }
    
    class StepHistory {
        +string id
        +string nodeId
        +Date timestamp
        +object inputs
        +object outputs
        +StepStatus status
        +string error
    }
    
    class NodeConfig {
        +FormField[] fields
        +ValidationRule[] validations
        +object defaultValues
        +validate(inputs: any) bool
    }
    
    class ActionConfig {
        +ActionType type
        +string endpoint
        +HttpMethod method
        +object headers
        +object body
        +ResponseMapping responseMapping
        +execute(context: Context) Response
    }
    
    class Permission {
        +string userId
        +Role role
        +bool canExecute
        +bool canEdit
        +bool canDelete
    }
    
    <<enumeration>> NodeType {
        START
        TASK
        DECISION
        ACTION
        END
    }
    
    <<enumeration>> ExecutionStatus {
        CREATED
        RUNNING
        PAUSED
        COMPLETED
        FAILED
        CANCELLED
    }
    
    <<enumeration>> StepStatus {
        SUCCESS
        ERROR
        SKIPPED
    }
    
    <<enumeration>> ActionType {
        REST_API
        WEBHOOK
        EMAIL
        CHURCHTOOLS_API
    }
    
    Workflow "1" --> "*" WorkflowNode
    Workflow "1" --> "*" WorkflowEdge
    Workflow "1" --> "*" Permission
    Workflow "1" --> "*" WorkflowExecution
    
    WorkflowNode "1" --> "1" NodeConfig
    WorkflowNode "1" --> "*" ActionConfig
    
    WorkflowExecution "1" --> "1" Context
    WorkflowExecution "1" --> "*" StepHistory
    
    WorkflowEdge --> WorkflowNode : source
    WorkflowEdge --> WorkflowNode : target
```
