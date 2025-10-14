import type { StorageService } from './StorageService';
import { LocalStorageService } from './LocalStorageService';
import { ChurchToolsStorageService } from './ChurchToolsStorageService';

/**
 * Factory für StorageService
 * Wählt automatisch die richtige Implementation basierend auf Umgebungsvariablen
 */
export class StorageFactory {
  private static instance: StorageService | null = null;

  /**
   * Erstellt oder gibt die Singleton-Instanz des StorageService zurück
   */
  static async create(): Promise<StorageService> {
    if (this.instance) {
      return this.instance;
    }

    const useChurchTools = import.meta.env.VITE_USE_CHURCHTOOLS_STORAGE === 'true';

    if (useChurchTools) {
      console.info('Using ChurchTools Storage');
      const apiBaseUrl = import.meta.env.VITE_BASE_URL || '';
      this.instance = new ChurchToolsStorageService(apiBaseUrl);
    } else {
      console.info('Using LocalStorage (Development Mode)');
      this.instance = new LocalStorageService();
    }

    await this.instance.initialize();
    return this.instance;
  }

  /**
   * Setzt die Instanz zurück (für Tests)
   */
  static reset(): void {
    this.instance = null;
  }

  /**
   * Gibt die aktuelle Instanz zurück (ohne zu erstellen)
   */
  static getInstance(): StorageService | null {
    return this.instance;
  }
}
