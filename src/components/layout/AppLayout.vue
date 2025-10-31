<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { UserRole } from '@/types/user.types';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const isAdmin = computed(() => userStore.isAdmin);

const navItems = computed(() => {
  const items = [
    {
      name: 'workflows',
      label: 'Meine Workflows',
      icon: '📋',
      show: true,
    },
  ];

  if (isAdmin.value) {
    items.push({
      name: 'admin',
      label: 'Verwaltung',
      icon: '⚙️',
      show: true,
    });
  }

  return items.filter((item) => item.show);
});

function navigateTo(name: string) {
  router.push({ name });
}

function toggleRole() {
  const newRole = isAdmin.value ? UserRole.USER : UserRole.ADMIN;
  userStore.setUserRole(newRole);
}

onMounted(async () => {
  // Load current user from ChurchTools
  await userStore.fetchCurrentUser();
  
  // Load permissions from ChurchTools
  await userStore.fetchPermissions();
});
</script>

<template>
  <div class="app-layout">
    <!-- Header -->
    <header class="app-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="app-title">Workflow-Assistent</h1>
        </div>
        <div class="header-right">
          <div class="user-info">
            <span class="user-name">{{ userStore.currentUser.name }}</span>
            <span class="user-role" :class="{ 'role-admin': isAdmin }">
              {{ isAdmin ? 'Administrator' : 'Benutzer' }}
            </span>
          </div>
          <!-- Demo: Role Toggle -->
          <button class="ct-btn ct-btn-sm ct-btn-secondary" title="Rolle wechseln (Demo)" @click="toggleRole">
            {{ isAdmin ? '👤 Als Benutzer' : '⚙️ Als Admin' }}
          </button>
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="app-nav">
      <div class="nav-content">
        <ul class="ct-nav ct-nav-pills">
          <li v-for="item in navItems" :key="item.name" class="nav-item">
            <a
              :class="['ct-nav-link', { active: route.name === item.name }]"
              @click.prevent="navigateTo(item.name)"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="app-main">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-content">
        <p class="ct-text-muted ct-mb-0">
          <small>Workflow-Assistent für ChurchTools &copy; 2025</small>
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--ct-bg-secondary);
}

/* Header */
.app-header {
  background: var(--ct-primary);
  color: var(--ct-text-white);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.app-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--ct-text-white);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
}

.user-name {
  font-weight: 500;
  font-size: 0.9rem;
}

.user-role {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
}

.role-admin {
  background: var(--ct-warning);
  color: var(--ct-text-primary);
  font-weight: 500;
}

/* Navigation */
.app-nav {
  background: var(--ct-bg-primary);
  border-bottom: 1px solid var(--ct-border-color);
  position: sticky;
  top: 73px;
  z-index: 99;
}

.nav-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.ct-nav {
  margin: 0;
}

.nav-item {
  list-style: none;
}

.ct-nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
}

.nav-icon {
  font-size: 1.25rem;
}

.nav-label {
  font-weight: 500;
}

/* Main Content */
.app-main {
  flex: 1;
  background: var(--ct-bg-secondary);
}

/* Footer */
.app-footer {
  background: var(--ct-bg-primary);
  border-top: 1px solid var(--ct-border-color);
  margin-top: auto;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content,
  .nav-content,
  .footer-content {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .app-title {
    font-size: 1.25rem;
  }

  .user-info {
    display: none;
  }

  .nav-label {
    display: none;
  }

  .ct-nav-link {
    padding: 0.75rem;
  }
}
</style>
