/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getStatsPlanErrorReason } from './api-error';

/**
 * Generic, host-agnostic description of a widget data error: a message plus
 * optional actions. Consumed by `<WidgetState>`, which knows nothing about
 * retry vs upgrade — it just renders the message and buttons.
 */
export interface WidgetErrorDescriptor {
	title?: string;
	description: string;
	actions?: Array< { label: string; onClick: () => void } >;
}

/**
 * Map a thrown API error to a widget error descriptor.
 *
 * - Plan-gated (403 upgrade-required) → an "Upgrade" action.
 * - Otherwise → a recoverable descriptor with a "Retry" action when `onRetry`
 *   is provided.
 *
 * The page-level global tier (auth/network/server) is handled by the caller via
 * `useGlobalError`, not here.
 *
 * @param error             - The thrown error.
 * @param options           - Optional action handlers.
 * @param options.onRetry   - Called when the "Retry" action is clicked.
 * @param options.onUpgrade - Called when the "Upgrade" action is clicked.
 * @return The descriptor for `<WidgetState error>`.
 */
export function describeError(
	error: unknown,
	options: { onRetry?: () => void; onUpgrade?: () => void } = {}
): WidgetErrorDescriptor {
	if ( getStatsPlanErrorReason( error ) === 'upgrade-required' ) {
		return {
			description: __( 'This data is available on a higher plan.', 'jetpack-premium-analytics' ),
			actions: options.onUpgrade
				? [ { label: __( 'Upgrade', 'jetpack-premium-analytics' ), onClick: options.onUpgrade } ]
				: undefined,
		};
	}

	return {
		description: __(
			"We couldn't load this data. Please try again in a moment.",
			'jetpack-premium-analytics'
		),
		actions: options.onRetry
			? [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: options.onRetry } ]
			: undefined,
	};
}
