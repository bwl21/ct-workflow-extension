import { defineAsyncComponent } from 'vue';
import type { ActionPlugin } from '@/types/action-plugin.types';
import { ActionCategory } from '@/types/action-plugin.types';

export const RestApiAction: ActionPlugin = {
  id: 'rest-api',
  name: 'REST API Call',
  description: 'Führt einen HTTP Request zu einer externen API aus',
  icon: 'globe',
  category: ActionCategory.INTEGRATION,

  configComponent: defineAsyncComponent(() => import('./RestApiConfig.vue')),

  executeComponent: defineAsyncComponent(() => import('./RestApiExecute.vue')),

  defaultConfig: {
    method: 'GET',
    url: '',
    headers: {},
    body: null,
    timeout: 30000,
    responseMapping: {},
  },

  validate: (config) => {
    const errors: Array<{ field?: string; message: string }> = [];

    if (!config.url) {
      errors.push({
        field: 'url',
        message: 'URL ist erforderlich',
      });
    }

    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method)) {
      errors.push({
        field: 'method',
        message: 'Ungültige HTTP-Methode',
      });
    }

    try {
      new URL(config.url);
    } catch {
      if (config.url && !config.url.includes('{{')) {
        errors.push({
          field: 'url',
          message: 'Ungültige URL',
        });
      }
    }

    if (config.timeout < 1000 || config.timeout > 300000) {
      errors.push({
        field: 'timeout',
        message: 'Timeout muss zwischen 1000 und 300000 ms liegen',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  configSchema: {
    type: 'object',
    properties: {
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      },
      url: {
        type: 'string',
        format: 'uri',
      },
      headers: {
        type: 'object',
      },
      body: {
        type: ['object', 'null'],
      },
      timeout: {
        type: 'number',
        minimum: 1000,
        maximum: 300000,
      },
      responseMapping: {
        type: 'object',
      },
    },
    required: ['method', 'url'],
  },

  metadata: {
    author: 'ChurchTools',
    version: '1.0.0',
    tags: ['http', 'api', 'rest', 'integration'],
    example: {
      method: 'GET',
      url: 'https://api.example.com/users/{{userId}}',
      headers: {
        Authorization: 'Bearer {{apiToken}}',
      },
      timeout: 30000,
      responseMapping: {
        'data.name': 'userName',
        'data.email': 'userEmail',
      },
    },
  },
};
