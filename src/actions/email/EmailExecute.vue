<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { ActionContext, ActionResult } from '@/types/action-plugin.types';

interface Props {
  config: {
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    body: string;
    isHtml: boolean;
  };
  context: ActionContext;
}

interface Emits {
  (e: 'complete', result: ActionResult): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const loading = ref(false);
const status = ref<'pending' | 'success' | 'error'>('pending');
const message = ref('');

const replaceVariables = (str: string): string => {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return props.context.helpers.getVariable(key) || '';
  });
};

const sendEmail = async () => {
  loading.value = true;
  status.value = 'pending';
  message.value = 'Sende E-Mail...';

  const startTime = Date.now();

  try {
    const to = replaceVariables(props.config.to);
    const cc = props.config.cc ? replaceVariables(props.config.cc) : undefined;
    const bcc = props.config.bcc ? replaceVariables(props.config.bcc) : undefined;
    const subject = replaceVariables(props.config.subject);
    const body = replaceVariables(props.config.body);

    props.context.helpers.log.info(`Sending email to: ${to}`);

    // Simulate email sending (in real implementation, call email service)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In real implementation:
    // await props.context.helpers.http.post('/api/email/send', {
    //   to,
    //   cc,
    //   bcc,
    //   subject,
    //   body,
    //   isHtml: props.config.isHtml
    // });

    const duration = Date.now() - startTime;

    status.value = 'success';
    message.value = `E-Mail erfolgreich gesendet an ${to}`;

    props.context.helpers.log.info(`Email sent successfully`);

    emit('complete', {
      success: true,
      data: {
        to,
        cc,
        bcc,
        subject,
        sentAt: new Date().toISOString(),
      },
      duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    status.value = 'error';
    message.value = `Fehler beim Senden: ${error.message}`;

    props.context.helpers.log.error(`Email sending failed: ${error.message}`);

    emit('complete', {
      success: false,
      error: error.message,
      duration,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  sendEmail();
});
</script>

<template>
  <div class="email-execute">
    <div v-if="loading" class="status-indicator loading">
      <div class="spinner"></div>
      <p>{{ message }}</p>
    </div>

    <div v-else-if="status === 'success'" class="status-indicator success">
      <div class="icon">✓</div>
      <p>{{ message }}</p>
    </div>

    <div v-else-if="status === 'error'" class="status-indicator error">
      <div class="icon">✕</div>
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.email-execute {
  padding: 2rem;
}

.status-indicator {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--ct-secondary);
  border-top-color: var(--ct-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.success .icon {
  color: #4caf50;
}

.error .icon {
  color: #f44336;
}
</style>
