import { defineAsyncComponent } from 'vue';
import type { ActionPlugin } from '@/types/action-plugin.types';
import { ActionCategory } from '@/types/action-plugin.types';

export const ManageGroupMembershipAction: ActionPlugin = {
  id: 'ct-manage-group-membership',
  name: 'Gruppenmitgliedschaft verwalten',
  description: 'Legt eine Gruppenmitgliedschaft an oder ändert sie (inkl. Gruppenmitgliedsfelder)',
  icon: 'users',
  category: ActionCategory.CHURCHTOOLS,

  configComponent: defineAsyncComponent(() => import('./ManageGroupMembershipConfig.vue')),

  executeComponent: defineAsyncComponent(() => import('./ManageGroupMembershipExecute.vue')),

  defaultConfig: {
    groupName: '',
    groupId: '',
    roleName: '',
    roleId: '',
    personId: '',
    memberStartDate: '',
    groupMemberStatus: 'active',
    onlyAdd: true,
    memberFields: [], // Array of { referenceName: string, value: string }
  },

  validate: (config) => {
    const errors: Array<{ field?: string; message: string }> = [];

    if (!config.personId) {
      errors.push({
        field: 'personId',
        message: 'Person ID erforderlich',
      });
    }

    if (!config.groupId && !config.groupName) {
      errors.push({
        field: 'groupId',
        message: 'Gruppen ID oder Gruppenname erforderlich',
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
      groupName: {
        type: 'string',
        description: 'Name der Gruppe (alternativ zu groupId)',
      },
      groupId: {
        type: 'string',
        description: 'ID der Gruppe',
      },
      roleName: {
        type: 'string',
        description: 'Name der Rolle (alternativ zu roleId)',
      },
      roleId: {
        type: 'string',
        description: 'ID der Rolle in der Gruppe',
      },
      personId: {
        type: 'string',
        description: 'ID der Person',
      },
      memberStartDate: {
        type: 'string',
        description: 'Startdatum der Mitgliedschaft (YYYY-MM-DD)',
      },
      groupMemberStatus: {
        type: 'string',
        description: 'Status der Mitgliedschaft (z.B. active)',
      },
      onlyAdd: {
        type: 'boolean',
        description: 'Nur hinzufügen, nicht aktualisieren',
      },
      memberFields: {
        type: 'array',
        description: 'Liste von Gruppenmitgliedsfeldern',
        items: {
          type: 'object',
          properties: {
            referenceName: {
              type: 'string',
              description: 'Referenzname des Feldes (wird zu fieldId aufgelöst)',
            },
            value: {
              type: 'string',
              description: 'Wert des Feldes',
            },
          },
        },
      },
    },
    required: ['personId'],
  },

  metadata: {
    author: 'ChurchTools',
    version: '1.0.0',
    tags: ['churchtools', 'person', 'group', 'membership', 'fields'],
    example: {
      groupName: 'Mitarbeiter',
      groupId: '{{groupId}}',
      roleId: '{{roleId}}',
      personId: '{{personId}}',
      memberStartDate: '2025-11-22',
      groupMemberStatus: 'active',
      onlyAdd: true,
      memberFields: [
        { referenceName: 'status', value: '02' },
        { referenceName: '{{fieldName}}', value: '{{value}}' },
      ],
    },
  },
};
