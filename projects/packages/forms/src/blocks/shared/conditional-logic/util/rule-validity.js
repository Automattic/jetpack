import { operatorNeedsValue } from './field-types.ts';

/**
 * Whether the author has begun this condition at all.
 *
 * A row with no subject chosen is empty rather than wrong, so nothing complains about it —
 * the builder opens with one of these waiting to be filled in.
 *
 * @param {object} rule - The rule to check.
 * @return {boolean} True once a subject field has been chosen.
 */
export const isRuleStarted = rule => Boolean( rule?.field );

/**
 * Whether a condition says something the evaluator can act on.
 *
 * This mirrors what the evaluators actually skip: a rule with no subject, or one whose
 * operator needs a value it has not been given, is ignored at submit time. Without a signal in
 * the editor that reads as the field simply not reacting, with nothing on screen explaining
 * why -- so the same judgement is made here, where it can be shown.
 *
 * @param {object} rule    - The rule to check.
 * @param {object} subject - The rule's subject field, or undefined when it no longer exists.
 * @return {boolean} True when the condition is complete.
 */
export const isRuleComplete = ( rule, subject ) => {
	if ( ! isRuleStarted( rule ) || ! subject || ! rule.operator ) {
		return false;
	}

	// `is empty`, `is checked` and friends compare nothing, so there is nothing to fill in.
	if ( ! operatorNeedsValue( rule.operator ) ) {
		return true;
	}

	// Anything else needs something to compare against. Deliberately no exception for subjects
	// that render no value input: an operator needing a value it cannot be given is exactly as
	// inert as one the author simply has not filled in, and both evaluators skip it. Treating
	// it as complete here would put the icon back at odds with what actually happens.
	return '' !== String( rule.value ?? '' ).trim();
};

/**
 * Whether every condition in the list is complete.
 *
 * @param {Array}    rules       - The rules to check.
 * @param {Function} findSubject - Resolves a rule's subject field.
 * @return {boolean} True when no condition is left unfinished.
 */
export const areRulesComplete = ( rules, findSubject ) =>
	rules.every( rule => isRuleComplete( rule, findSubject( rule ) ) );
