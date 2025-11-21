export interface ValidationError {
  fieldId: string;
  message: string;
  messageKey?: string;
  args?: Record<string, any>;
}

export interface ApiErrorInfo {
  message: string;
  translatedMessage?: string;
  validationErrors?: ValidationError[];
  hasValidationErrors: boolean;
}

/**
 * Extrahiert vollständige Fehlerinformationen aus einem API-Error
 * 
 * ChurchTools API Fehler können verschiedene Strukturen haben:
 * - error.response.data.message
 * - error.response.data.errors (Array mit Validierungsfehlern)
 * - error.response.data.translatedMessage
 * - error.message (Fallback)
 */
export function extractApiErrorInfo(error: any): ApiErrorInfo {
  // Kein Error-Objekt
  if (!error) {
    return JSON.parse(JSON.stringify({
      message: 'Unbekannter Fehler',
      hasValidationErrors: false,
    }));
  }

  // Direkter String
  if (typeof error === 'string') {
    return JSON.parse(JSON.stringify({
      message: error,
      hasValidationErrors: false,
    }));
  }

  // API Response vorhanden
  if (error.response?.data) {
    const data = error.response.data;

    // Validierungsfehler vorhanden
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const validationErrors: ValidationError[] = data.errors
        .map((err: any) => {
          if (typeof err === 'object' && err.fieldId) {
            // Konvertiere zu Plain Object (kein Proxy)
            return {
              fieldId: String(err.fieldId),
              message: String(err.message || 'Validierungsfehler'),
              messageKey: err.messageKey ? String(err.messageKey) : undefined,
              args: err.args ? JSON.parse(JSON.stringify(err.args)) : undefined,
            };
          }
          return null;
        })
        .filter((err: ValidationError | null): err is ValidationError => err !== null);

      if (validationErrors.length > 0) {
        // Konvertiere zu Plain Object (kein Proxy)
        return JSON.parse(JSON.stringify({
          message: data.translatedMessage || data.message || 'Validierungsfehler',
          translatedMessage: data.translatedMessage,
          validationErrors,
          hasValidationErrors: true,
        }));
      }
    }

    // Translated Message (bevorzugt)
    if (data.translatedMessage && typeof data.translatedMessage === 'string') {
      return JSON.parse(JSON.stringify({
        message: data.translatedMessage,
        translatedMessage: data.translatedMessage,
        hasValidationErrors: false,
      }));
    }

    // Message
    if (data.message && typeof data.message === 'string') {
      return JSON.parse(JSON.stringify({
        message: data.message,
        hasValidationErrors: false,
      }));
    }

    // Gesamtes data-Objekt als String (wenn es ein einfacher String ist)
    if (typeof data === 'string') {
      return JSON.parse(JSON.stringify({
        message: data,
        hasValidationErrors: false,
      }));
    }
  }

  // HTTP Status Code + Status Text
  if (error.response?.status) {
    const status = error.response.status;
    const statusText = error.response.statusText || '';
    
    const message = statusText ? `HTTP ${status}: ${statusText}` : `HTTP ${status}`;
    return JSON.parse(JSON.stringify({
      message,
      hasValidationErrors: false,
    }));
  }

  // Fallback: error.message
  if (error.message && typeof error.message === 'string') {
    return JSON.parse(JSON.stringify({
      message: error.message,
      hasValidationErrors: false,
    }));
  }

  // Letzter Fallback
  return JSON.parse(JSON.stringify({
    message: 'Unbekannter Fehler',
    hasValidationErrors: false,
  }));
}

/**
 * Extrahiert eine einfache Fehlermeldung (Rückwärtskompatibilität)
 */
export function extractApiErrorMessage(error: any): string {
  return extractApiErrorInfo(error).message;
}

/**
 * Extrahiert zusätzliche Debug-Informationen aus einem API-Error
 */
export function extractApiErrorDetails(error: any): {
  status?: number;
  statusText?: string;
  url?: string;
  method?: string;
  data?: any;
} {
  if (!error?.response) {
    return {};
  }

  return {
    status: error.response.status,
    statusText: error.response.statusText,
    url: error.response.config?.url,
    method: error.response.config?.method?.toUpperCase(),
    data: error.response.data,
  };
}
