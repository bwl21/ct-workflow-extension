import type { SimpleRules, SimpleCondition } from '@/types/workflow.types';
import { ConditionOperator } from '@/types/workflow.types';

/**
 * Evaluates simple rules against a context
 */
export function evaluateSimpleRules(
  rules: SimpleRules,
  context: Record<string, any>
): boolean {
  if (!rules.conditions || rules.conditions.length === 0) {
    return true; // No conditions = always true
  }

  const results = rules.conditions.map(condition => 
    evaluateCondition(condition, context)
  );

  if (rules.logic === 'AND') {
    return results.every(r => r === true);
  } else {
    return results.some(r => r === true);
  }
}

/**
 * Evaluates a single condition
 */
function evaluateCondition(
  condition: SimpleCondition,
  context: Record<string, any>
): boolean {
  const fieldValue = context[condition.field];
  const compareValue = condition.value;

  switch (condition.operator) {
    case ConditionOperator.EQUALS:
      return fieldValue == compareValue; // Loose equality

    case ConditionOperator.NOT_EQUALS:
      return fieldValue != compareValue;

    case ConditionOperator.GREATER_THAN:
      return Number(fieldValue) > Number(compareValue);

    case ConditionOperator.LESS_THAN:
      return Number(fieldValue) < Number(compareValue);

    case ConditionOperator.GREATER_THAN_OR_EQUAL:
      return Number(fieldValue) >= Number(compareValue);

    case ConditionOperator.LESS_THAN_OR_EQUAL:
      return Number(fieldValue) <= Number(compareValue);

    case ConditionOperator.CONTAINS:
      return String(fieldValue).includes(String(compareValue));

    case ConditionOperator.NOT_CONTAINS:
      return !String(fieldValue).includes(String(compareValue));

    case ConditionOperator.STARTS_WITH:
      return String(fieldValue).startsWith(String(compareValue));

    case ConditionOperator.ENDS_WITH:
      return String(fieldValue).endsWith(String(compareValue));

    case ConditionOperator.IS_EMPTY:
      return !fieldValue || fieldValue === '' || 
             (Array.isArray(fieldValue) && fieldValue.length === 0);

    case ConditionOperator.IS_NOT_EMPTY:
      return !!fieldValue && fieldValue !== '' && 
             (!Array.isArray(fieldValue) || fieldValue.length > 0);

    default:
      console.warn(`Unknown operator: ${condition.operator}`);
      return false;
  }
}

/**
 * Evaluates rules based on engine type
 */
export function evaluateRules(
  engine: string,
  rule: any,
  context: Record<string, any>
): boolean {
  switch (engine) {
    case 'simple':
      return evaluateSimpleRules(rule, context);
    
    case 'jsonlogic':
      // TODO: Implement JSONLogic evaluation
      console.warn('JSONLogic not yet implemented');
      return false;
    
    case 'custom':
      // TODO: Implement custom expression evaluation
      console.warn('Custom expressions not yet implemented');
      return false;
    
    default:
      console.warn(`Unknown rule engine: ${engine}`);
      return false;
  }
}
