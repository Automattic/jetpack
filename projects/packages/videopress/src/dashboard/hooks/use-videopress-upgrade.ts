import analytics from '@automattic/jetpack-analytics';
import { useCallback } from '@wordpress/element';
import useVideoPressCheckout from '../../client/hooks/use-videopress-checkout';
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
 * Record the upgrade click and start the platform-appropriate checkout.
 *
 * @return A callback that records the upgrade-click event and starts checkout.
 */
export function useVideoPressUpgrade(): () => void {
	const state = getInitialState();

	const { run } = useVideoPressCheckout( {
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
