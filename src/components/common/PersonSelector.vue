<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { PersonService, type Person } from '@/services/PersonService';

const props = defineProps<{
  modelValue: Person | Person[] | null;
  multiple?: boolean;
  required?: boolean;
  placeholder?: string;
  filter?: {
    groupIds?: number[];
    statusIds?: number[];
    campusIds?: number[];
  };
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Person | Person[] | null];
}>();

const searchQuery = ref('');
const persons = ref<Person[]>([]);
const selectedPersons = ref<Person[]>([]);
const isLoading = ref(false);
const showDropdown = ref(false);

// Personen laden
async function loadPersons() {
  isLoading.value = true;
  try {
    persons.value = await PersonService.searchPersons({
      query: searchQuery.value,
      ...props.filter,
      limit: 50,
    });
  } finally {
    isLoading.value = false;
  }
}

// Suche mit Debouncing
let searchTimeout: number | null = null;
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadPersons();
  }, 300) as unknown as number;
});

// Ausgewählte Personen beim Mount laden
watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      selectedPersons.value = [];
      return;
    }

    selectedPersons.value = Array.isArray(value) ? value : [value];
  },
  { immediate: true }
);

function selectPerson(person: Person) {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? props.modelValue : [];
    const isAlreadySelected = current.some((p) => p.id === person.id);
    
    if (isAlreadySelected) {
      emit(
        'update:modelValue',
        current.filter((p) => p.id !== person.id)
      );
    } else {
      emit('update:modelValue', [...current, person]);
    }
  } else {
    emit('update:modelValue', person);
    showDropdown.value = false;
  }
}

function removePerson(personId: number) {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? props.modelValue : [];
    emit(
      'update:modelValue',
      current.filter((p) => p.id !== personId)
    );
  } else {
    emit('update:modelValue', null);
  }
}

function isSelected(personId: number): boolean {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.some((p) => p.id === personId);
  }
  return props.modelValue?.id === personId;
}

const displayText = computed(() => {
  if (selectedPersons.value.length === 0) {
    return props.placeholder || 'Person auswählen...';
  }
  if (props.multiple) {
    return `${selectedPersons.value.length} Person(en) ausgewählt`;
  }
  return PersonService.formatPersonName(selectedPersons.value[0]);
});

// Initialisierung
loadPersons();
</script>

<template>
  <div class="person-selector">
    <!-- Ausgewählte Personen anzeigen (bei Mehrfachauswahl) -->
    <div v-if="selectedPersons.length > 0 && multiple" class="selected-persons">
      <div v-for="person in selectedPersons" :key="person.id" class="selected-person-chip">
        <img
          v-if="person.imageUrl"
          :src="person.imageUrl"
          :alt="PersonService.formatPersonName(person)"
          class="person-avatar"
        />
        <span>{{ PersonService.formatPersonName(person) }}</span>
        <button
          type="button"
          class="remove-btn"
          @click="removePerson(person.id)"
          title="Entfernen"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Dropdown Trigger -->
    <div class="selector-input" @click="showDropdown = !showDropdown">
      <input
        type="text"
        class="ct-form-control"
        :value="displayText"
        readonly
        :required="required && !modelValue"
      />
      <span class="dropdown-arrow">▼</span>
    </div>

    <!-- Dropdown -->
    <div v-if="showDropdown" class="dropdown-overlay" @click="showDropdown = false">
      <div class="dropdown-content" @click.stop>
        <!-- Suchfeld -->
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            class="ct-form-control"
            placeholder="Person suchen..."
            autofocus
          />
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">Lädt...</div>

        <!-- Personen-Liste -->
        <div v-else class="person-list">
          <div
            v-for="person in persons"
            :key="person.id"
            class="person-item"
            :class="{ selected: isSelected(person.id) }"
            @click="selectPerson(person)"
          >
            <img
              v-if="person.imageUrl"
              :src="person.imageUrl"
              :alt="PersonService.formatPersonName(person)"
              class="person-avatar"
            />
            <div class="person-info">
              <div class="person-name">
                {{ PersonService.formatPersonName(person) }}
              </div>
              <div v-if="person.email" class="person-email">
                {{ person.email }}
              </div>
            </div>
            <span v-if="isSelected(person.id)" class="check-mark">✓</span>
          </div>
          <div v-if="persons.length === 0" class="no-results">Keine Personen gefunden</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.person-selector {
  position: relative;
}

.selected-persons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.selected-person-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 16px;
  font-size: 0.875rem;
}

.person-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #666;
  font-size: 1rem;
  line-height: 1;
}

.remove-btn:hover {
  color: #f44336;
}

.selector-input {
  position: relative;
  cursor: pointer;
}

.selector-input input {
  cursor: pointer;
  padding-right: 2rem;
}

.dropdown-arrow {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #666;
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dropdown-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.search-box {
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.loading-state {
  padding: 2rem;
  text-align: center;
  color: #666;
}

.person-list {
  overflow-y: auto;
  max-height: 400px;
}

.person-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.person-item:hover {
  background: #f5f5f5;
}

.person-item.selected {
  background: #e3f2fd;
}

.person-info {
  flex: 1;
}

.person-name {
  font-weight: 500;
  color: #333;
}

.person-email {
  font-size: 0.875rem;
  color: #666;
}

.check-mark {
  color: #4caf50;
  font-weight: bold;
}

.no-results {
  padding: 2rem;
  text-align: center;
  color: #666;
}
</style>
