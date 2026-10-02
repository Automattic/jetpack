/**
 * External dependencies
 */
import { isAccessDenied, StatsResponseShapeError } from '@jetpack-premium-analytics/data';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Types
 */
import type { WidgetStateError } from '../components/widget-state';

/** `error` when something failed; `info` when the request answered and the answer is a fact, such as no access. */
export type DescribedErrorIntent = 'error' | 'info';

export interface DescribedError extends WidgetStateError {
	intent: DescribedErrorIntent;
}

interface DescribeErrorOptions {
	retryDescription: string;
	onRetry: () => void;
}

/**
 * Maps an API error to a Stats widget error descriptor, using `isAccessDenied`
 * (shared with the dashboard's stale-data notice) so a widget and the banner
 * above it cannot disagree about offering a Retry.
 *
 * @param error                    - The failed query error.
 * @param options                  - Error-state copy and retry options.
 * @param options.retryDescription - The full-sentence copy for the retryable error state.
 * @param options.onRetry          - Callback used by the retry action.
 * @return The widget error descriptor.
 */
export function describeError(
	error: unknown,
	{ retryDescription, onRetry }: DescribeErrorOptions
): DescribedError {
	if ( error instanceof StatsResponseShapeError ) {
		return {
			intent: 'error',
			description: __( 'This data is unavailable right now.', 'jetpack-premium-analytics-pkg' ),
		};
	}

	if ( isAccessDenied( error ) ) {
		return {
			intent: 'info',
			description: __( "You don't have access to this data.", 'jetpack-premium-analytics-pkg' ),
		};
	}

	return {
		intent: 'error',
		description: retryDescription,
		actions: [
			{
				label: __( 'Retry', 'jetpack-premium-analytics-pkg' ),
				onClick: onRetry,
			},
		],
	};
}
