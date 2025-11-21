/**
 * Service zum Laden und Cachen der ChurchTools OpenAPI-Spezifikation
 */

interface Endpoint {
  value: string;
  label: string;
}

class OpenApiService {
  private endpoints: Endpoint[] | null = null;
  private loading: Promise<Endpoint[]> | null = null;

  /**
   * Lädt die Endpoints aus der OpenAPI-Spezifikation
   * Cached das Ergebnis für zukünftige Aufrufe
   */
  async getEndpoints(): Promise<Endpoint[]> {
    // Wenn bereits geladen, gib Cache zurück
    if (this.endpoints) {
      return this.endpoints;
    }

    // Wenn gerade am Laden, warte auf bestehendes Promise
    if (this.loading) {
      return this.loading;
    }

    // Starte neuen Ladevorgang
    this.loading = this.loadEndpoints();
    
    try {
      this.endpoints = await this.loading;
      return this.endpoints;
    } finally {
      this.loading = null;
    }
  }

  /**
   * Lädt die Endpoints aus der OpenAPI-Spezifikation
   */
  private async loadEndpoints(): Promise<Endpoint[]> {
    try {
      console.log('[OpenApiService] Loading endpoints from OpenAPI spec...');
      
      // Verwende die konfigurierte ChurchTools-Base-URL
      const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
      
      console.log('[OpenApiService] Base URL:', baseUrl);
      const response = await fetch(`${baseUrl}/system/runtime/swagger/openapi.json`);
      const openapi = await response.json();
      
      const endpoints: Endpoint[] = [];
      
      // Extrahiere alle Pfade aus der OpenAPI-Spezifikation
      if (openapi.paths) {
        Object.keys(openapi.paths).forEach(path => {
          const methods = openapi.paths[path];
          const methodsList = Object.keys(methods).filter(m => 
            ['get', 'post', 'put', 'patch', 'delete'].includes(m.toLowerCase())
          );
          
          // Erstelle Label aus summary oder operationId
          const firstMethod = methods[methodsList[0]];
          const label = firstMethod?.summary || firstMethod?.operationId || path;
          
          endpoints.push({
            value: path,
            label: `${label} (${path})`
          });
        });
      }
      
      // Sortiere alphabetisch
      endpoints.sort((a, b) => a.value.localeCompare(b.value));
      
      console.log(`[OpenApiService] Loaded ${endpoints.length} endpoints`);
      return endpoints;
    } catch (error) {
      console.error('[OpenApiService] Failed to load OpenAPI spec:', error);
      
      // Fallback zu statischen Endpoints
      return [
        { value: '/persons', label: 'Personen' },
        { value: '/persons/{id}', label: 'Person (einzeln)' },
        { value: '/groups', label: 'Gruppen' },
        { value: '/groups/{id}', label: 'Gruppe (einzeln)' },
        { value: '/groups/{id}/members', label: 'Gruppenmitglieder' },
        { value: '/events', label: 'Events' },
        { value: '/events/{id}', label: 'Event (einzeln)' },
        { value: '/custommodules', label: 'Custom Modules' },
        { value: '/whoami', label: 'Aktueller User' },
        { value: '/permissions/global', label: 'Globale Berechtigungen' },
      ];
    }
  }

  /**
   * Löscht den Cache (z.B. nach ChurchTools-Update)
   */
  clearCache(): void {
    this.endpoints = null;
    this.loading = null;
    console.log('[OpenApiService] Cache cleared');
  }
}

// Singleton-Instanz
export const openApiService = new OpenApiService();
