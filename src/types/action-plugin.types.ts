import type { Component } from 'vue';

/**
 * Base interface für alle Action Plugins
 */
export interface ActionPlugin {
  /** Eindeutiger Identifier */
  id: string;

  /** Anzeigename */
  name: string;

  /** Beschreibung der Aktion */
  description: string;

  /** Icon (optional) */
  icon?: string;

  /** Kategorie für Gruppierung */
  category: ActionCategory;

  /** Vue-Komponente für Konfiguration im Editor */
  configComponent: Component;

  /** Vue-Komponente für Ausführung (optional, falls keine UI benötigt) */
  executeComponent?: Component;

  /** Validierungsfunktion für Konfiguration */
  validate?: (config: any) => ValidationResult;

  /** Standard-Konfiguration */
  defaultConfig: Record<string, any>;

  /** Schema für Konfiguration (JSON Schema) */
  configSchema?: object;

  /** Metadaten */
  metadata?: ActionMetadata;
}

/**
 * Metadaten für Action Plugin
 */
export interface ActionMetadata {
  /** Autor */
  author?: string;

  /** Version */
  version?: string;

  /** Tags für Suche */
  tags?: string[];

  /** Dokumentations-URL */
  docsUrl?: string;

  /** Beispiel-Konfiguration */
  example?: Record<string, any>;
}

/**
 * Kontext der an Action-Komponenten übergeben wird
 */
export interface ActionContext {
  /** Workflow-Kontext mit allen Variablen */
  workflowContext: Record<string, any>;

  /** Aktuelle Execution ID */
  executionId: string;

  /** Node ID */
  nodeId: string;

  /** Benutzer ID */
  userId: string;

  /** Hilfsfunktionen */
  helpers: ActionHelpers;
}

/**
 * Hilfsfunktionen für Actions
 */
export interface ActionHelpers {
  /** Variable aus Kontext abrufen */
  getVariable: (key: string) => any;

  /** Variable setzen */
  setVariable: (key: string, value: any) => void;

  /** Mehrere Variablen setzen */
  setVariables: (variables: Record<string, any>) => void;

  /** Prüfen ob Variable existiert */
  hasVariable: (key: string) => boolean;

  /** HTTP Client */
  http: HttpClient;

  /** ChurchTools API Client */
  churchtools: ChurchToolsClient;

  /** Logger */
  log: Logger;
}

/**
 * HTTP Client Interface
 */
export interface HttpClient {
  request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
  get<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
  post<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
  put<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
  delete<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
}

export interface HttpRequestConfig {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  auth?: {
    username: string;
    password: string;
  };
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * ChurchTools API Client Interface
 */
export interface ChurchToolsClient {
  /** Personen abrufen */
  getPersons(params?: ChurchToolsQueryParams): Promise<any[]>;

  /** Person abrufen */
  getPerson(id: number): Promise<any>;

  /** Person erstellen */
  createPerson(data: any): Promise<any>;

  /** Person aktualisieren */
  updatePerson(id: number, data: any): Promise<any>;

  /** Gruppen abrufen */
  getGroups(params?: ChurchToolsQueryParams): Promise<any[]>;

  /** Gruppe abrufen */
  getGroup(id: number): Promise<any>;

  /** Events abrufen */
  getEvents(params?: ChurchToolsQueryParams): Promise<any[]>;

  /** Event erstellen */
  createEvent(data: any): Promise<any>;

  /** Generischer API Call */
  api<T = any>(endpoint: string, options?: HttpRequestConfig): Promise<T>;
}

export interface ChurchToolsQueryParams {
  page?: number;
  limit?: number;
  [key: string]: any;
}

/**
 * Logger Interface
 */
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

/**
 * Rückgabewert einer Action-Ausführung
 */
export interface ActionResult {
  /** Erfolgreich? */
  success: boolean;

  /** Ausgabedaten */
  data?: any;

  /** Fehlermeldung */
  error?: string;

  /** Zusätzliche Metadaten */
  metadata?: Record<string, any>;

  /** Dauer in ms */
  duration?: number;
}

/**
 * Validierungsergebnis
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  field?: string;
  message: string;
  code?: string;
}

/**
 * Action Kategorien
 */
export enum ActionCategory {
  /** Integration mit externen Systemen */
  INTEGRATION = 'integration',

  /** Kommunikation (E-Mail, SMS, etc.) */
  COMMUNICATION = 'communication',

  /** Datenverarbeitung */
  DATA = 'data',

  /** Logik und Bedingungen */
  LOGIC = 'logic',

  /** ChurchTools spezifisch */
  CHURCHTOOLS = 'churchtools',

  /** Benutzerdefiniert */
  CUSTOM = 'custom',
}

/**
 * Action Status während Ausführung
 */
export enum ActionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELLED = 'cancelled',
}

/**
 * Retry Policy für Actions
 */
export interface RetryPolicy {
  /** Maximale Anzahl Versuche */
  maxAttempts: number;

  /** Delay zwischen Versuchen in ms */
  delay: number;

  /** Exponential Backoff? */
  exponentialBackoff?: boolean;

  /** Nur bei bestimmten Fehlern wiederholen */
  retryOn?: string[];
}

/**
 * Action Execution Options
 */
export interface ActionExecutionOptions {
  /** Timeout in ms */
  timeout?: number;

  /** Retry Policy */
  retryPolicy?: RetryPolicy;

  /** Soll Action im Hintergrund laufen? */
  background?: boolean;

  /** Callback bei Fortschritt */
  onProgress?: (progress: number) => void;
}
