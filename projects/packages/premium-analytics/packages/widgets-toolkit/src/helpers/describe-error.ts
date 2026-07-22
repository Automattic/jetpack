/**
 * External dependencies
 */
import { getApiErrorStatus } from '@jetpack-premium-analytics/data';
/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
/**
 * Types
 */
import type { WidgetStateError } from '../components/widget-state';

interface DescribeErrorOptions {
	subject: string;
	onRetry: () => void;
}

/**
 * Map an API error to a Stats widget error descriptor.
 *
 * @param error           - The failed query error.
 * @param options         - Error-state copy and retry options.
 * @param options.subject - The data subject used in the retryable error copy.
 * @param options.onRetry - Callback used by the retry action.
 * @return The widget error descriptor.
 */
export function describeError(
	error: unknown,
	{ subject, onRetry }: DescribeErrorOptions
): WidgetStateError {
	if ( getApiErrorStatus( error ) === 403 ) {
		return {
			description: __( "You don't have access to this data.", 'jetpack-premium-analytics' ),
		};
	}

	return {
		description: sprintf(
			/* translators: %s is the type of data that could not be loaded. */
			__( "We couldn't load %s. Please try again in a moment.", 'jetpack-premium-analytics' ),
			subject
		),
		actions: [
			{
				label: __( 'Retry', 'jetpack-premium-analytics' ),
				onClick: onRetry,
			},
		],
	};
}
