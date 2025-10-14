import { actionRegistry } from '@/services/ActionRegistry';
import { RestApiAction } from './rest-api/RestApiAction';
import { EmailAction } from './email/EmailAction';

/**
 * Registriert alle Built-in Actions
 */
export function registerBuiltInActions() {
  actionRegistry.registerMany([RestApiAction, EmailAction]);
}

/**
 * Registriert Custom Actions
 * Entwickler können hier ihre eigenen Actions hinzufügen
 *
 * Beispiel:
 * import { MyCustomAction } from './custom/MyCustomAction';
 * actionRegistry.register(MyCustomAction);
 */
export function registerCustomActions() {
  // Hier Custom Actions registrieren
}

/**
 * Initialisiert alle Actions
 */
export function initializeActions() {
  console.info('Initializing actions...');

  registerBuiltInActions();
  registerCustomActions();

  actionRegistry.markInitialized();

  // Debug Info ausgeben
  if (import.meta.env.DEV) {
    console.info('Actions by category:', actionRegistry.getGroupedByCategory());
  }
}
