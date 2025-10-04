/**
 * History Store for Undo/Redo functionality
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Workflow } from '@/types/workflow.types';
import { deepClone } from '@/utils/clone';

const MAX_HISTORY_SIZE = 50;

export const useHistoryStore = defineStore('history', () => {
  // History stacks
  const undoStack = ref<Workflow[]>([]);
  const redoStack = ref<Workflow[]>([]);
  const isUndoRedoOperation = ref(false);
  const currentWorkflowSnapshot = ref<Workflow | null>(null);

  /**
   * Save current state to history
   * On first edit after loading, saves the snapshot as initial state
   */
  function saveState(workflow: Workflow) {
    // Don't save state during undo/redo operations
    if (isUndoRedoOperation.value) {
      console.log('[History] Skipping saveState during undo/redo operation');
      return;
    }
    
    console.log('[History] saveState called, undoStack size:', undoStack.value.length);
    
    // If we have a snapshot, check if this state is identical to it
    if (currentWorkflowSnapshot.value) {
      if (JSON.stringify(currentWorkflowSnapshot.value.definition) === JSON.stringify(workflow.definition)) {
        console.log('[History] State identical to snapshot, skipping save');
        return;
      }
      
      // This is the first real edit - save snapshot first
      console.log('[History] First edit - saving snapshot as initial state');
      undoStack.value.push(deepClone(currentWorkflowSnapshot.value));
      currentWorkflowSnapshot.value = null; // Clear snapshot after using it
    }
    
    // Don't save if state hasn't changed (compare only definition, not timestamps)
    if (undoStack.value.length > 0) {
      const currentState = undoStack.value[undoStack.value.length - 1];
      if (JSON.stringify(currentState.definition) === JSON.stringify(workflow.definition)) {
        console.log('[History] State unchanged, skipping save');
        return;
      }
    }
    
    // Deep clone to prevent reference issues
    const state = deepClone(workflow);
    
    // Add to undo stack
    undoStack.value.push(state);
    console.log('[History] undoStack size:', undoStack.value.length);
    
    // Limit stack size
    if (undoStack.value.length > MAX_HISTORY_SIZE) {
      undoStack.value.shift();
    }
    
    // Clear redo stack when new action is performed
    redoStack.value = [];
    console.log('[History] redoStack cleared');
  }
  
  /**
   * Take a snapshot of the current workflow state
   * This will be used as the initial state on first edit
   */
  function takeSnapshot(workflow: Workflow) {
    console.log('[History] Taking snapshot of current workflow');
    currentWorkflowSnapshot.value = deepClone(workflow);
  }

  /**
   * Undo last action - returns the previous state
   */
  function undo(): Workflow | null {
    if (undoStack.value.length <= 1) return null;
    
    console.log('[History] undo called, undoStack:', undoStack.value.length, 'redoStack:', redoStack.value.length);
    
    isUndoRedoOperation.value = true;
    
    // Pop current state and move to redo stack
    const currentState = undoStack.value.pop()!;
    redoStack.value.push(currentState);
    
    // Get the previous state (now at top of undo stack)
    const previousState = undoStack.value[undoStack.value.length - 1];
    
    console.log('[History] undo done, undoStack:', undoStack.value.length, 'redoStack:', redoStack.value.length);
    
    // Limit redo stack size
    if (redoStack.value.length > MAX_HISTORY_SIZE) {
      redoStack.value.shift();
    }
    
    // Reset flag after a short delay
    setTimeout(() => {
      isUndoRedoOperation.value = false;
    }, 100);
    
    return deepClone(previousState);
  }

  /**
   * Redo last undone action - returns the next state
   */
  function redo(): Workflow | null {
    if (redoStack.value.length === 0) return null;
    
    console.log('[History] redo called, undoStack:', undoStack.value.length, 'redoStack:', redoStack.value.length);
    
    isUndoRedoOperation.value = true;
    
    // Get state from redo stack
    const state = redoStack.value.pop()!;
    
    // Move back to undo stack
    undoStack.value.push(state);
    
    console.log('[History] redo done, undoStack:', undoStack.value.length, 'redoStack:', redoStack.value.length);
    
    // Limit undo stack size
    if (undoStack.value.length > MAX_HISTORY_SIZE) {
      undoStack.value.shift();
    }
    
    // Reset flag after a short delay
    setTimeout(() => {
      isUndoRedoOperation.value = false;
    }, 100);
    
    return deepClone(state);
  }

  /**
   * Clear history for a workflow
   */
  function clearHistory() {
    undoStack.value = [];
    redoStack.value = [];
  }

  /**
   * Check if undo is available (computed for reactivity)
   */
  const canUndo = computed(() => {
    return undoStack.value.length > 1; // Need at least 2 states (before + after)
  });

  /**
   * Check if redo is available (computed for reactivity)
   */
  const canRedo = computed(() => {
    return redoStack.value.length > 0;
  });

  /**
   * Get undo stack size (for debugging)
   */
  const undoStackSize = computed(() => undoStack.value.length);

  /**
   * Get redo stack size (for debugging)
   */
  const redoStackSize = computed(() => redoStack.value.length);

  return {
    saveState,
    takeSnapshot,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
    undoStackSize,
    redoStackSize,
    isUndoRedoOperation,
  };
});
