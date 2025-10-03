import { defineAsyncComponent } from 'vue';
import type { ActionPlugin } from '@/types/action-plugin.types';
import { ActionCategory } from '@/types/action-plugin.types';

export const EmailAction: ActionPlugin = {
  id: 'email',
  name: 'E-Mail senden',
  description: 'Sendet eine E-Mail an einen oder mehrere Empfänger',
  icon: 'envelope',
  category: ActionCategory.COMMUNICATION,

  configComponent: defineAsyncComponent(() => import('./EmailConfig.vue')),

  executeComponent: defineAsyncComponent(() => import('./EmailExecute.vue')),

  defaultConfig: {
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    isHtml: false,
    attachments: [],
  },

  validate: (config) => {
    const errors: Array<{ field?: string; message: string }> = [];

    if (!config.to) {
      errors.push({
        field: 'to',
        message: 'Empfänger ist erforderlich',
      });
    }

    if (!config.subject) {
      errors.push({
        field: 'subject',
        message: 'Betreff ist erforderlich',
      });
    }

    if (!config.body) {
      errors.push({
        field: 'body',
        message: 'Nachricht ist erforderlich',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validateEmails = (emails: string, field: string) => {
      if (emails) {
        const emailList = emails.split(',').map((e) => e.trim());
        emailList.forEach((email) => {
          if (email && !email.includes('{{') && !emailRegex.test(email)) {
            errors.push({
              field,
              message: `Ungültige E-Mail-Adresse: ${email}`,
            });
          }
        });
      }
    };

    validateEmails(config.to, 'to');
    validateEmails(config.cc, 'cc');
    validateEmails(config.bcc, 'bcc');

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  configSchema: {
    type: 'object',
    properties: {
      to: {
        type: 'string',
      },
      cc: {
        type: 'string',
      },
      bcc: {
        type: 'string',
      },
      subject: {
        type: 'string',
      },
      body: {
        type: 'string',
      },
      isHtml: {
        type: 'boolean',
      },
      attachments: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    required: ['to', 'subject', 'body'],
  },

  metadata: {
    author: 'ChurchTools',
    version: '1.0.0',
    tags: ['email', 'communication', 'notification'],
    example: {
      to: '{{userEmail}}',
      cc: 'admin@church.com',
      subject: 'Willkommen {{userName}}',
      body: 'Hallo {{userName}},\n\nwillkommen in unserer Gemeinde!',
      isHtml: false,
    },
  },
};
