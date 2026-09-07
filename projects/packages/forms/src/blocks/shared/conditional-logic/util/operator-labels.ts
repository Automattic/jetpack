/*
 * Translated operator labels for the conditional-logic rule builder.
 *
 * Separate from ./field-types.ts because that module is shared with the front-end form
 * runtime, which builds as a WordPress script module and cannot import `@wordpress/i18n`.
 * Only the editor imports this file.
 */

import { __ } from '@wordpress/i18n';
import { OPERATORS } from './field-types';
import type { Operator } from './field-types';

/**
 * Human-readable label for every operator, keyed by wire string.
 */
export const OPERATOR_LABELS: Record< Operator, string > = {
	[ OPERATORS.IS ]: __( 'is', 'jetpack-forms' ),
	[ OPERATORS.IS_NOT ]: __( 'is not', 'jetpack-forms' ),
	[ OPERATORS.CONTAINS ]: __( 'contains', 'jetpack-forms' ),
	[ OPERATORS.DOES_NOT_CONTAIN ]: __( 'does not contain', 'jetpack-forms' ),
	[ OPERATORS.IS_EMPTY ]: __( 'is empty', 'jetpack-forms' ),
	[ OPERATORS.IS_NOT_EMPTY ]: __( 'is not empty', 'jetpack-forms' ),
	[ OPERATORS.EQUALS ]: __( 'equals', 'jetpack-forms' ),
	[ OPERATORS.NOT_EQUALS ]: __( 'does not equal', 'jetpack-forms' ),
	[ OPERATORS.GREATER_THAN ]: __( 'is greater than', 'jetpack-forms' ),
	[ OPERATORS.LESS_THAN ]: __( 'is less than', 'jetpack-forms' ),
	[ OPERATORS.GTE ]: __( 'is at least', 'jetpack-forms' ),
	[ OPERATORS.LTE ]: __( 'is at most', 'jetpack-forms' ),
	[ OPERATORS.BEFORE ]: __( 'is before', 'jetpack-forms' ),
	[ OPERATORS.AFTER ]: __( 'is after', 'jetpack-forms' ),
	[ OPERATORS.IS_CHECKED ]: __( 'is checked', 'jetpack-forms' ),
	[ OPERATORS.IS_NOT_CHECKED ]: __( 'is not checked', 'jetpack-forms' ),
};

/**
 * Label for an operator, falling back to the raw wire string for forward compatibility.
 *
 * @param operator - The operator wire string.
 * @return Translated label.
 */
export const getOperatorLabel = ( operator: Operator | string ): string =>
	OPERATOR_LABELS[ operator as Operator ] ?? operator;
