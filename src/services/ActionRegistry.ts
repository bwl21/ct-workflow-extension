import type { ActionPlugin, ActionCategory } from '@/types/action-plugin.types';

/**
 * Registry für Action Plugins
 * Singleton Pattern für zentrale Verwaltung aller verfügbaren Actions
 */
class ActionRegistry {
  private actions: Map<string, ActionPlugin> = new Map();
  private initialized = false;

  /**
   * Registriert eine neue Action
   * @param action Action Plugin
   * @throws Error wenn Action ID bereits existiert und overwrite=false
   */
  register(action: ActionPlugin, overwrite = false): void {
    if (this.actions.has(action.id) && !overwrite) {
      console.warn(
        `Action '${action.id}' is already registered. Use overwrite=true to replace it.`
      );
      return;
    }

    // Validiere Action
    this.validateAction(action);

    this.actions.set(action.id, action);
    if (import.meta.env.DEV) {
      console.info(`✓ Registered action: ${action.id} (${action.name})`);
    }
  }

  /**
   * Registriert mehrere Actions
   * @param actions Array von Action Plugins
   */
  registerMany(actions: ActionPlugin[]): void {
    actions.forEach((action) => this.register(action));
  }

  /**
   * Gibt eine Action zurück
   * @param id Action ID
   * @returns Action Plugin oder undefined
   */
  get(id: string): ActionPlugin | undefined {
    return this.actions.get(id);
  }

  /**
   * Gibt alle Actions zurück
   * @returns Array aller registrierten Actions
   */
  getAll(): ActionPlugin[] {
    return Array.from(this.actions.values());
  }

  /**
   * Gibt Actions nach Kategorie zurück
   * @param category Action Kategorie
   * @returns Array von Actions der Kategorie
   */
  getByCategory(category: ActionCategory): ActionPlugin[] {
    return this.getAll().filter((action) => action.category === category);
  }

  /**
   * Gibt Actions nach Tags zurück
   * @param tags Array von Tags
   * @returns Actions die mindestens einen der Tags haben
   */
  getByTags(tags: string[]): ActionPlugin[] {
    return this.getAll().filter((action) => {
      const actionTags = action.metadata?.tags || [];
      return tags.some((tag) => actionTags.includes(tag));
    });
  }

  /**
   * Sucht Actions nach Name oder Beschreibung
   * @param query Suchbegriff
   * @returns Gefundene Actions
   */
  search(query: string): ActionPlugin[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(
      (action) =>
        action.name.toLowerCase().includes(lowerQuery) ||
        action.description.toLowerCase().includes(lowerQuery) ||
        action.metadata?.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Prüft ob Action existiert
   * @param id Action ID
   * @returns true wenn Action registriert ist
   */
  has(id: string): boolean {
    return this.actions.has(id);
  }

  /**
   * Entfernt eine Action
   * @param id Action ID
   * @returns true wenn Action entfernt wurde
   */
  unregister(id: string): boolean {
    const deleted = this.actions.delete(id);
    if (deleted && import.meta.env.DEV) {
      console.info(`✓ Unregistered action: ${id}`);
    }
    return deleted;
  }

  /**
   * Entfernt alle Actions
   */
  clear(): void {
    this.actions.clear();
    this.initialized = false;
    if (import.meta.env.DEV) {
      console.info('✓ Cleared all actions');
    }
  }

  /**
   * Gibt Anzahl registrierter Actions zurück
   */
  get count(): number {
    return this.actions.size;
  }

  /**
   * Gibt alle Kategorien zurück
   */
  getCategories(): ActionCategory[] {
    const categories = new Set<ActionCategory>();
    this.getAll().forEach((action) => categories.add(action.category));
    return Array.from(categories);
  }

  /**
   * Gibt Actions gruppiert nach Kategorie zurück
   */
  getGroupedByCategory(): Record<ActionCategory, ActionPlugin[]> {
    const grouped: Record<string, ActionPlugin[]> = {};

    this.getAll().forEach((action) => {
      if (!grouped[action.category]) {
        grouped[action.category] = [];
      }
      grouped[action.category].push(action);
    });

    return grouped as Record<ActionCategory, ActionPlugin[]>;
  }

  /**
   * Validiert eine Action
   * @param action Action Plugin
   * @throws Error wenn Action ungültig ist
   */
  private validateAction(action: ActionPlugin): void {
    if (!action.id) {
      throw new Error('Action must have an id');
    }

    if (!action.name) {
      throw new Error(`Action '${action.id}' must have a name`);
    }

    if (!action.configComponent) {
      throw new Error(`Action '${action.id}' must have a configComponent`);
    }

    if (!action.category) {
      throw new Error(`Action '${action.id}' must have a category`);
    }

    if (action.defaultConfig === undefined) {
      throw new Error(`Action '${action.id}' must have defaultConfig`);
    }
  }

  /**
   * Markiert Registry als initialisiert
   */
  markInitialized(): void {
    this.initialized = true;
    if (import.meta.env.DEV) {
      console.info(`✓ Action Registry initialized with ${this.count} actions`);
    }
  }

  /**
   * Prüft ob Registry initialisiert ist
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Gibt Debug-Informationen zurück
   */
  getDebugInfo(): {
    count: number;
    categories: ActionCategory[];
    actions: Array<{ id: string; name: string; category: ActionCategory }>;
  } {
    return {
      count: this.count,
      categories: this.getCategories(),
      actions: this.getAll().map((action) => ({
        id: action.id,
        name: action.name,
        category: action.category,
      })),
    };
  }
}

// Singleton Instance exportieren
export const actionRegistry = new ActionRegistry();

// Für Tests: Factory-Funktion
export function createActionRegistry(): ActionRegistry {
  return new ActionRegistry();
}
