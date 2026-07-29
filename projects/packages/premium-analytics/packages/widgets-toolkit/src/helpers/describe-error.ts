/**
 * External dependencies
 */
import { getApiErrorCode, getApiErrorStatus } from '@jetpack-premium-analytics/data';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Types
 */
import type { WidgetStateError } from '../components/widget-state';

interface DescribeErrorOptions {
	retryDescription: string;
	onRetry: () => void;
}

/**
 * Map an API error to a Stats widget error descriptor.
 *
 * A 403 is a deterministic access failure, so it gets neutral copy and no retry
 * action — except the proxy's `no_connection` 403, which flags a broken Jetpack
 * connection that can heal, so it stays retryable like any other failure.
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
): WidgetStateError {
	if ( getApiErrorStatus( error ) === 403 && getApiErrorCode( error ) !== 'no_connection' ) {
		return {
			description: __( "You don't have access to this data.", 'jetpack-premium-analytics-pkg' ),
		};
	}

	return {
		description: retryDescription,
		actions: [
			{
				label: __( 'Retry', 'jetpack-premium-analytics-pkg' ),
				onClick: onRetry,
			},
		],
	};
}
