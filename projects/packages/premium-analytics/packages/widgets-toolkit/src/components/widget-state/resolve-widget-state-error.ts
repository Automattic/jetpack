/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { WidgetStateError } from './widget-state';

/**
 * The error state a widget kind renders: the widget's own, or the generic message with a Retry
 * bound to `refetch` when the widget passes none.
 *
 * @param error   - The widget's own error, as `describeError()` builds it.
 * @param refetch - Re-runs the request.
 * @return The error state, or undefined when there is neither.
 */
export function resolveWidgetStateError(
	error: WidgetStateError | undefined,
	refetch: ( () => unknown ) | undefined
): WidgetStateError | undefined {
	// A widget's own error already says whether a retry can help: only the default offers one.
	if ( error || ! refetch ) {
		return error;
	}

	return {
		description: __(
			"We couldn't load this data. Please try again in a moment.",
			'jetpack-premium-analytics-pkg'
		),
		actions: [
			{
				label: __( 'Retry', 'jetpack-premium-analytics-pkg' ),
				onClick: () => {
					void refetch();
				},
			},
		],
	};
}
