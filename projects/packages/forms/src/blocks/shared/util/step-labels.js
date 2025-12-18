import { __, sprintf } from '@wordpress/i18n';

/**
 * Generate a step label for display.
 *
 * @param {number} stepIndex   - Zero-based index of the step
 * @param {string} customLabel - Optional custom label for the step
 * @return {string} Formatted step label
 */
export function getStepLabel( stepIndex, customLabel = '' ) {
	const stepNumber = stepIndex + 1;

	if ( customLabel && customLabel !== '' ) {
		return sprintf(
			/* translators: %1$d is the step number, %2$s is the custom label */
			__( 'Step %1$d – %2$s', 'jetpack-forms' ),
			stepNumber,
			customLabel
		);
	}

	return sprintf(
		/* translators: %d is the step number (1, 2, 3, etc.) */
		__( 'Step %d', 'jetpack-forms' ),
		stepNumber
	);
}
