import analytics from '@automattic/jetpack-analytics';
// Imported via its deep export rather than the package barrel: the barrel
// (`@automattic/jetpack-connection`) re-exports the disconnect dialog, which
// imports `.jpg` assets the wp-build esbuild pipeline has no loader for, so a
// barrel import fails the build even though the hook itself needs none of it.
import useProductCheckoutWorkflow from '@automattic/jetpack-connection/hooks/use-product-checkout-workflow';
import { useCallback } from '@wordpress/element';
import { VIDEOPRESS_ADMIN_PAGE } from '../utils/constants';

// Tracks event recorded when the upgrade CTA is clicked. Carried over verbatim
// from the legacy dashboard's `UpgradeTrigger` so both dashboards report
// against the same funnel.
const UPGRADE_CLICK_EVENT = 'jetpack_videopress_upgrade_trigger_link_click';

/**
 * Read the inlined initial state, guarding for environments (tests, the legacy
 * page) where the `var JPVIDEOPRESS_INITIAL_STATE` is absent.
 *
 * @return The initial-state payload, or undefined when it isn't present.
 */
function getInitialState() {
	return typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined' ? JPVIDEOPRESS_INITIAL_STATE : undefined;
}

/**
 * Shared "upgrade to paid VideoPress" action for the modernized dashboard.
 *
 * Wraps the cross-product `useProductCheckoutWorkflow` hook so every upgrade
 * CTA — the Overview free-tier notice and the Library at-limit drop notice —
 * drives the exact same checkout (same product slug, redirect, and Tracks
 * event) instead of each re-deriving the wiring. The connection details the
 * workflow needs are hydrated server-side by `class-initial-state.php`; the
 * product to purchase and the post-checkout redirect come from
 * `JPVIDEOPRESS_INITIAL_STATE`.
 *
 * Tracks identity is initialized centrally by `useDashboardAnalytics`, so the
 * returned callback only records the event; its `blog_id` is supplied
 * automatically by `window.jpTracksContext`.
 *
 * @return A callback that records the upgrade-click event and starts checkout.
 */
export function useVideoPressUpgrade(): () => void {
	const state = getInitialState();

	const { run } = useProductCheckoutWorkflow( {
		productSlug: state?.product?.slug ?? '',
		redirectUrl: VIDEOPRESS_ADMIN_PAGE,
		useBlogIdSuffix: true,
		from: 'jetpack-videopress',
	} );

	return useCallback( () => {
		// Record the click, then defer the checkout redirect by a microtask so
		// the Tracks pixel is dispatched before navigation can cancel it.
		// Mirrors the legacy dashboard's `recordEvent( … ).then( run )`.
		analytics.tracks.recordEvent( UPGRADE_CLICK_EVENT );
		void Promise.resolve().then( () => run() );
	}, [ run ] );
}
