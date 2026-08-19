/**
 * Deprecated Tour Kit shims.
 *
 * The Tour Kit tour UI was removed because it was no longer rendered anywhere in the monorepo (only
 * the NUX hooks/contexts/constants were in use). These no-op shims keep the public `WpcomTourKit`
 * and `usePrefetchTourAssets` exports for backwards compatibility and fire a Tracks event on use, so
 * any remaining caller is surfaced before the shims are removed in a follow-up cleanup.
 *
 * Note: `jetpack_mu_wpcom_tour_kit_deprecated_shim_used` must be allowlisted server-side for
 * the event to be recorded.
 */
import { useEffect } from '@wordpress/element';
import { wpcomTrackEvent } from '../tracks';
import type { FunctionComponent } from 'react';

const trackDeprecatedShimUsage = ( shim: 'WpcomTourKit' | 'usePrefetchTourAssets' ) =>
	wpcomTrackEvent( 'jetpack_mu_wpcom_tour_kit_deprecated_shim_used', { shim } );

/**
 * Deprecated no-op replacement for the removed `WpcomTourKit` tour component.
 *
 * @deprecated The Tour Kit tour UI was removed; this renders nothing and is slated for removal.
 * @return Always `null`.
 */
export const WpcomTourKit: FunctionComponent< { config?: unknown } > = () => {
	useEffect( () => {
		trackDeprecatedShimUsage( 'WpcomTourKit' );
	}, [] );

	return null;
};

/**
 * Deprecated no-op replacement for the removed `usePrefetchTourAssets` hook.
 *
 * @deprecated The Tour Kit tour UI was removed; this is a no-op and is slated for removal.
 * @param      _steps - Ignored; retained for call-signature compatibility.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- `_steps` kept for call-signature compatibility.
export function usePrefetchTourAssets( _steps?: unknown ): void {
	useEffect( () => {
		trackDeprecatedShimUsage( 'usePrefetchTourAssets' );
	}, [] );
}
