import { defineAsyncComponent } from 'vue';
import type { ActionPlugin } from '@/types/action-plugin.types';
import { ActionCategory } from '@/types/action-plugin.types';

export const ManageGroupMembershipAction: ActionPlugin = {
  id: 'ct-manage-group-membership',
  name: 'Gruppenmitgliedschaft verwalten',
  description: 'Legt eine Gruppenmitgliedschaft an oder ändert sie (inkl. Gruppenmerkmalsfelder)',
  icon: 'users',
  category: ActionCategory.CHURCHTOOLS,

  configComponent: defineAsyncComponent(() => import('./ManageGroupMembershipConfig.vue')),

  executeComponent: defineAsyncComponent(() => import('./ManageGroupMembershipExecute.vue')),

  defaultConfig: {
    groupName: '',
    groupId: '',
    roleId: '',
    gmfReferenceName: '',
    gmfId: '',
    personId: '',
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
      roleId: {
        type: 'string',
        description: 'ID der Rolle in der Gruppe',
      },
      gmfReferenceName: {
        type: 'string',
        description: 'Referenzname des Gruppenmerkmalfelds',
      },
      gmfId: {
        type: 'string',
        description: 'ID des Gruppenmerkmalfelds',
      },
      personId: {
        type: 'string',
        description: 'ID der Person',
      },
    },
    required: ['personId'],
  },

  metadata: {
    author: 'ChurchTools',
    version: '1.0.0',
    tags: ['churchtools', 'person', 'group', 'membership', 'gmf'],
    example: {
      groupName: 'Mitarbeiter',
      groupId: '{{groupId}}',
      roleId: '{{roleId}}',
      gmfReferenceName: 'status',
      gmfId: '{{gmfId}}',
      personId: '{{personId}}',
    },
  },
};
