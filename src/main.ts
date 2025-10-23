import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { createPinia } from 'pinia';
import { churchtoolsClient } from '@churchtools/churchtools-client';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { router } from './router';
import { initializeActions } from './actions';
import { setupDemoData } from './utils/demo-setup';

declare const window: Window &
    typeof globalThis & {
        settings: {
            base_url?: string;
        };
    };

const baseUrl = window.settings?.base_url ?? import.meta.env.VITE_BASE_URL;
churchtoolsClient.setBaseUrl(baseUrl);

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(VueQueryPlugin, {
    queryClientConfig: {
        defaultOptions: {
            queries: {
                staleTime: 20 * 1000, // 20 Sekunden
                gcTime: 10 * 60 * 1000, // 10 Minuten
            },
        },
    },
});
app.use(router);

// Initialize action plugins
initializeActions();

// Setup demo data
setupDemoData();

app.mount('#app');

const username = import.meta.env.VITE_USERNAME;
const password = import.meta.env.VITE_PASSWORD;
if (import.meta.env.MODE === 'development' && username && password) {
    await churchtoolsClient.post('/login', { username, password });
}

const KEY = import.meta.env.VITE_KEY;
export { KEY };
