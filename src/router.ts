import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import AdminView from './views/AdminView.vue';
import UserView from './views/UserView.vue';

const routes: RouteRecordRaw[] = [
    { path: '/workflows', name: 'workflows', component: UserView },
    { path: '/admin', name: 'admin', component: AdminView },
    { path: '', redirect: { name: 'workflows' } },
];

export const router = createRouter({
    routes,
    history: createWebHistory(`/ccm/${import.meta.env.VITE_KEY}/`),
    scrollBehavior(to, from, savedPosition) {
        if (to.hash) {
            return { el: to.hash, left: 0, top: 70 };
        } else if (savedPosition) {
            return savedPosition;
        } else if (to.name !== from.name) {
            return { left: 0, top: 0 };
        }
        return {};
    },
});
