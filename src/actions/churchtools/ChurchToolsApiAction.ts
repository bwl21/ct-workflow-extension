import type { ActionPlugin } from '@/types/action-plugin.types';
import { ActionCategory } from '@/types/action-plugin.types';
import ChurchToolsApiConfig from './ChurchToolsApiConfig.vue';
import ChurchToolsApiExecute from './ChurchToolsApiExecute.vue';

export const ChurchToolsApiAction: ActionPlugin = {
  id: 'ct-api-call',
  name: 'ChurchTools API Call',
  description: 'Führt einen ChurchTools API-Call aus',
  icon: 'church',
  category: ActionCategory.CHURCHTOOLS,

  configComponent: ChurchToolsApiConfig,

  executeComponent: ChurchToolsApiExecute,

  defaultConfig: {
    method: 'GET',
    endpoint: '/persons',
    params: {},
    body: null,
    responseMapping: {},
  },

  validate: (config) => {
    const errors: Array<{ field?: string; message: string }> = [];

    if (!config.endpoint) {
      errors.push({
        field: 'endpoint',
        message: 'Endpoint ist erforderlich',
      });
    }

    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method)) {
      errors.push({
        field: 'method',
        message: 'Ungültige HTTP-Methode',
      });
    }

    // Prüfe ob Endpoint mit / beginnt
    if (config.endpoint && !config.endpoint.startsWith('/')) {
      errors.push({
        field: 'endpoint',
        message: 'Endpoint muss mit / beginnen',
      });
    }

    // Warnung wenn /api im Endpoint (wird automatisch hinzugefügt)
    if (config.endpoint && config.endpoint.includes('/api')) {
      errors.push({
        field: 'endpoint',
        message: '/api wird automatisch hinzugefügt - bitte entfernen',
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
      endpoint: {
        type: 'string',
      },
      params: {
        type: 'object',
      },
      body: {
        type: ['object', 'null'],
      },
      responseMapping: {
        type: 'object',
      },
    },
    required: ['method', 'endpoint'],
  },

  metadata: {
    author: 'ChurchTools',
    version: '1.0.0',
    tags: ['churchtools', 'api', 'integration'],
    example: {
      method: 'POST',
      endpoint: '/groups/{{groupId}}/members',
      body: {
        personId: '{{personId}}',
        groupTypeRoleId: 1,
      },
      responseMapping: {
        'data.id': 'membershipId',
      },
    },
  },
};
