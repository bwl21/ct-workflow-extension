# Person Field Implementation Guide

## Overview

This document describes how to add a **Person field type** to the workflow system that allows users to select a person from ChurchTools and stores the person's ID.

## Current State Analysis

### Existing Field Types

The workflow system currently supports the following field types (defined in `src/types/workflow.types.ts`):

```typescript
export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  EMAIL = 'email',
  TEL = 'tel',
  URL = 'url',
  DATE = 'date',
  DATETIME = 'datetime-local',
  TIME = 'time',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  RANGE = 'range',
  COLOR = 'color',
  FILE = 'file',
  DISPLAY = 'display',
}
```

### ChurchTools API Integration

The project uses `@churchtools/churchtools-client` (version ^1.3.7) for API integration. The client is configured in `src/main.ts`:

```typescript
import { churchtoolsClient } from '@churchtools/churchtools-client';
churchtoolsClient.setBaseUrl(baseUrl);
```

### Person API Methods

The ChurchTools API interface (defined in `src/types/action-plugin.types.ts`) includes person-related methods:

```typescript
export interface ChurchToolsClient {
  /** Personen abrufen */
  getPersons(params?: ChurchToolsQueryParams): Promise<any[]>;

  /** Person abrufen */
  getPerson(id: number): Promise<any>;

  /** Person erstellen */
  createPerson(data: any): Promise<any>;

  /** Person aktualisieren */
  updatePerson(id: number, data: any): Promise<any>;
}
```

## Implementation Plan

### 1. Add PERSON Field Type

**File:** `src/types/workflow.types.ts`

Add a new field type to the `FieldType` enum:

```typescript
export enum FieldType {
  // ... existing types
  PERSON = 'person',        // Single person selection
  PERSON_MULTI = 'person-multi',  // Multiple person selection (optional)
}
```

Update the `FormField` interface to support person-specific options:

```typescript
export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
  
  // For SELECT, MULTISELECT, RADIO
  options?: string[];
  
  // For RANGE
  min?: number;
  max?: number;
  step?: number;
  
  // For FILE
  accept?: string;
  multiple?: boolean;
  
  // For PERSON, PERSON_MULTI
  personFilter?: {
    groupIds?: number[];      // Filter by group membership
    statusIds?: number[];     // Filter by person status
    campusIds?: number[];     // Filter by campus
  };
}
```

### 2. Create Person Service

**File:** `src/services/PersonService.ts` (new file)

Create a service to handle person-related API calls:

```typescript
import { churchtoolsClient } from '@churchtools/churchtools-client';

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  nickname?: string;
  email?: string;
  imageUrl?: string;
}

export interface PersonSearchParams {
  query?: string;
  groupIds?: number[];
  statusIds?: number[];
  campusIds?: number[];
  limit?: number;
}

export class PersonService {
  /**
   * Search for persons in ChurchTools
   */
  static async searchPersons(params: PersonSearchParams = {}): Promise<Person[]> {
    try {
      const queryParams: any = {};
      
      if (params.query) {
        queryParams.query = params.query;
      }
      
      if (params.groupIds && params.groupIds.length > 0) {
        queryParams.group_ids = params.groupIds.join(',');
      }
      
      if (params.statusIds && params.statusIds.length > 0) {
        queryParams.status_ids = params.statusIds.join(',');
      }
      
      if (params.campusIds && params.campusIds.length > 0) {
        queryParams.campus_ids = params.campusIds.join(',');
      }
      
      if (params.limit) {
        queryParams.limit = params.limit;
      }
      
      const response = await churchtoolsClient.get('/api/persons', { params: queryParams });
      const data = response.data || response;
      
      return (data.data || data).map((p: any) => ({
        id: p.id,
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        nickname: p.nickname,
        email: p.email,
        imageUrl: p.imageUrl,
      }));
    } catch (error) {
      console.error('Failed to search persons:', error);
      return [];
    }
  }

  /**
   * Get a single person by ID
   */
  static async getPerson(id: number): Promise<Person | null> {
    try {
      const response = await churchtoolsClient.get(`/api/persons/${id}`);
      const data = response.data || response;
      const p = data.data || data;
      
      return {
        id: p.id,
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        nickname: p.nickname,
        email: p.email,
        imageUrl: p.imageUrl,
      };
    } catch (error) {
      console.error(`Failed to get person ${id}:`, error);
      return null;
    }
  }

  /**
   * Format person name for display
   */
  static formatPersonName(person: Person): string {
    if (person.nickname) {
      return `${person.firstName} "${person.nickname}" ${person.lastName}`;
    }
    return `${person.firstName} ${person.lastName}`;
  }
}
```

### 3. Create Person Selector Component

**File:** `src/components/common/PersonSelector.vue` (new file)

Create a reusable component for person selection:

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { PersonService, type Person } from '@/services/PersonService';

const props = defineProps<{
  modelValue: number | number[] | null;
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
  'update:modelValue': [value: number | number[] | null];
}>();

const searchQuery = ref('');
const persons = ref<Person[]>([]);
const selectedPersons = ref<Person[]>([]);
const isLoading = ref(false);
const showDropdown = ref(false);

// Load initial persons
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

// Search with debounce
let searchTimeout: number | null = null;
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadPersons();
  }, 300);
});

// Load selected persons on mount
watch(() => props.modelValue, async (value) => {
  if (!value) {
    selectedPersons.value = [];
    return;
  }
  
  const ids = Array.isArray(value) ? value : [value];
  const loaded = await Promise.all(
    ids.map(id => PersonService.getPerson(id))
  );
  selectedPersons.value = loaded.filter(p => p !== null) as Person[];
}, { immediate: true });

function selectPerson(person: Person) {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? props.modelValue : [];
    if (current.includes(person.id)) {
      emit('update:modelValue', current.filter(id => id !== person.id));
    } else {
      emit('update:modelValue', [...current, person.id]);
    }
  } else {
    emit('update:modelValue', person.id);
    showDropdown.value = false;
  }
}

function removePerson(personId: number) {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? props.modelValue : [];
    emit('update:modelValue', current.filter(id => id !== personId));
  } else {
    emit('update:modelValue', null);
  }
}

function isSelected(personId: number): boolean {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(personId);
  }
  return props.modelValue === personId;
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

// Initialize
loadPersons();
</script>

<template>
  <div class="person-selector">
    <!-- Selected persons display -->
    <div class="selected-persons" v-if="selectedPersons.length > 0 && multiple">
      <div 
        v-for="person in selectedPersons" 
        :key="person.id" 
        class="selected-person-chip"
      >
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

    <!-- Dropdown trigger -->
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
        <!-- Search input -->
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            class="ct-form-control"
            placeholder="Person suchen..."
            autofocus
          />
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-state">
          Lädt...
        </div>

        <!-- Person list -->
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
          <div v-if="persons.length === 0" class="no-results">
            Keine Personen gefunden
          </div>
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
```

### 4. Update WorkflowEditor

**File:** `src/components/workflow/WorkflowEditor.vue`

Add the PERSON field type to the field type selector:

```vue
<!-- In the field type select dropdown -->
<optgroup label="ChurchTools">
  <option :value="FieldType.PERSON">Person</option>
  <option :value="FieldType.PERSON_MULTI">Personen (Mehrfachauswahl)</option>
</optgroup>
```

Add filter configuration for PERSON fields:

```vue
<!-- After the field type selection -->
<div v-if="field.type === FieldType.PERSON || field.type === FieldType.PERSON_MULTI" class="person-filter">
  <label class="ct-form-label">Filter (optional)</label>
  <div class="ct-form-group">
    <label>Gruppen-IDs (kommagetrennt)</label>
    <input 
      v-model="field.personFilter.groupIds" 
      type="text" 
      class="ct-form-control"
      placeholder="z.B. 1,2,3"
    />
  </div>
  <div class="ct-form-group">
    <label>Status-IDs (kommagetrennt)</label>
    <input 
      v-model="field.personFilter.statusIds" 
      type="text" 
      class="ct-form-control"
      placeholder="z.B. 1,2"
    />
  </div>
</div>
```

### 5. Update WorkflowExecutor

**File:** `src/components/workflow/WorkflowExecutor.vue`

Add the PersonSelector component to the field rendering:

```vue
<script setup lang="ts">
// ... existing imports
import PersonSelector from '@/components/common/PersonSelector.vue';
</script>

<template>
  <!-- In the field rendering section -->
  <div v-for="field in currentNode.data.fields" :key="field.name" class="ct-form-group">
    <label class="ct-form-label">
      {{ field.label }}
      <span v-if="field.required" class="required">*</span>
    </label>

    <!-- Person field -->
    <PersonSelector
      v-if="field.type === FieldType.PERSON || field.type === FieldType.PERSON_MULTI"
      v-model="formData[field.name]"
      :multiple="field.type === FieldType.PERSON_MULTI"
      :required="field.required"
      :placeholder="field.placeholder"
      :filter="field.personFilter"
    />

    <!-- ... existing field types -->
  </div>
</template>
```

### 6. Update Field Type Label Helper

**File:** `src/components/workflow/WorkflowEditor.vue`

Update the `getFieldTypeLabel` function:

```typescript
function getFieldTypeLabel(type: FieldType): string {
  const labels: Record<FieldType, string> = {
    // ... existing labels
    [FieldType.PERSON]: 'Person',
    [FieldType.PERSON_MULTI]: 'Personen (Mehrfach)',
  };
  return labels[type] || type;
}
```

## Usage Example

### In Workflow Editor

1. Create a new TASK node
2. Add a field with type "Person"
3. Configure optional filters (group IDs, status IDs)
4. Set as required if needed

### In Workflow Execution

1. User sees a person selector field
2. Can search for persons by name
3. Selects a person from the dropdown
4. The person's ID is stored in the workflow context
5. Can be used in subsequent nodes via template interpolation: `{{personFieldName}}`

### Accessing Person Data in Actions

```typescript
// In an action plugin
const personId = context.variables.assignedPerson; // Field name
const person = await PersonService.getPerson(personId);
console.log(`Assigned to: ${PersonService.formatPersonName(person)}`);
```

## Testing Checklist

- [ ] Person field appears in field type dropdown
- [ ] Person selector loads persons from ChurchTools API
- [ ] Search functionality works
- [ ] Single selection stores person ID correctly
- [ ] Multiple selection stores array of person IDs
- [ ] Required validation works
- [ ] Filters (group, status, campus) work correctly
- [ ] Selected persons display correctly
- [ ] Person data can be accessed in template interpolation
- [ ] Person data persists in workflow context

## Future Enhancements

1. **Caching**: Cache person data to reduce API calls
2. **Lazy Loading**: Load more persons on scroll
3. **Advanced Filters**: Add more filter options (age, gender, etc.)
4. **Person Display Field**: Add a read-only field type that displays person information
5. **Group Selector**: Similar component for group selection
6. **Integration with Actions**: Pre-built actions for person-related operations

## Notes

- The person ID is stored as a number (single selection) or array of numbers (multiple selection)
- Person data should be fetched fresh when needed in actions to ensure up-to-date information
- Consider implementing proper error handling for API failures
- The component should work offline with cached data when possible
