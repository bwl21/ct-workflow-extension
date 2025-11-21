import { defineAsyncComponent } from 'vue';
import type { ActionPlugin } from '@/types/action-plugin.types';
import { ActionCategory } from '@/types/action-plugin.types';

export const AddToGroupAction: ActionPlugin = {
  id: 'ct-add-to-group',
  name: 'Person zu Gruppe hinzufügen',
  description: 'Fügt eine Person einer ChurchTools-Gruppe hinzu',
  icon: 'user-plus',
  category: ActionCategory.CHURCHTOOLS,

  configComponent: defineAsyncComponent(() => import('./AddToGroupConfig.vue')),

  executeComponent: defineAsyncComponent(() => import('./AddToGroupExecute.vue')),

  defaultConfig: {
    personId: null,
    groupId: null,
    roleId: null,
    personIdVariable: '',
    groupIdVariable: '',
  },

  validate: (config) => {
    const errors: Array<{ field?: string; message: string }> = [];

    if (!config.personId && !config.personIdVariable) {
      errors.push({
        field: 'personId',
        message: 'Person ID oder Variable erforderlich',
      });
    }

    if (!config.groupId && !config.groupIdVariable) {
      errors.push({
        field: 'groupId',
        message: 'Gruppen ID oder Variable erforderlich',
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
      personId: {
        type: ['number', 'null'],
      },
      groupId: {
        type: ['number', 'null'],
      },
      roleId: {
        type: ['number', 'null'],
      },
      personIdVariable: {
        type: 'string',
      },
      groupIdVariable: {
        type: 'string',
      },
    },
  },

  metadata: {
    author: 'ChurchTools',
    version: '1.0.0',
    tags: ['churchtools', 'person', 'group', 'membership'],
    example: {
      personId: 123,
      groupId: 42,
      roleId: 1,
    },
  },
};
