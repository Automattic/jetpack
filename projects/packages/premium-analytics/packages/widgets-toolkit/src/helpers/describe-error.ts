/**
 * External dependencies
 */
import {
	getApiErrorCode,
	isAccessDenied,
	StatsResponseShapeError,
} from '@jetpack-premium-analytics/data';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Types
 */
import type { WidgetStateError } from '../components/widget-state';

export interface DescribeErrorOptions {
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
): WidgetStateError {
	if ( error instanceof StatsResponseShapeError ) {
		return {
			description: __( 'This data is unavailable right now.', 'jetpack-premium-analytics-pkg' ),
		};
	}

	// `stats/author/<id>` refuses an author past its post limit; a retry gets the same answer.
	if ( getApiErrorCode( error ) === 'too_many_posts' ) {
		return {
			description: __(
				'This author has too many posts to count their stats here.',
				'jetpack-premium-analytics-pkg'
			),
		};
	}

	if ( isAccessDenied( error ) ) {
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
