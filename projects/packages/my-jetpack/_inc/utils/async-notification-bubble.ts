/**
 * My Jetpack Notification Bubble async loader.
 *
 * `Initializer::maybe_show_red_bubble()` enqueues this script only when the
 * red-bubble transient is cold. On that path it registers a hidden zero-count
 * placeholder with the menu-badges `Notification_Counts` registry, so
 * Menu_Renderer emits a hidden `[data-jp-menu-badge="my-jetpack"]` element on
 * the current page.
 *
 * This request warms the red-bubble transient (the REST callback recomputes and
 * re-caches it, see `Red_Bubble_Notifications::get_red_bubble_alerts()`) and,
 * with the fresh alerts it gets back, lights up that placeholder via
 * `window.jetpackMenuBadges.setCount()` — so the badge appears on the current
 * page without waiting for a reload. The next page load takes the cached-alerts
 * path and re-registers the authoritative per-alert counts server-side.
 */
import apiFetch from '@wordpress/api-fetch';

apiFetch< RedBubbleAlerts >( {
	path: 'my-jetpack/v1/red-bubble-notifications',
	method: 'POST',
} )
	.then( alerts => {
		if ( typeof window.jetpackMenuBadges?.setCount !== 'function' ) {
			return;
		}
		// Count the alerts that would show a badge, skipping the same ones as the
		// server-side registration; the next page load re-registers the authoritative count.
		const excluded = window.myJetpackNotificationBubble?.excludedAlerts ?? [];
		const count = alerts
			? Object.entries( alerts ).filter(
					( [ slug, alert ] ) =>
						! excluded.includes( slug ) && ! ( alert as { is_silent?: boolean } | null )?.is_silent
				).length
			: 0;
		window.jetpackMenuBadges.setCount( 'my-jetpack', count );
	} )
	.catch( error => {
		// eslint-disable-next-line no-console
		console.log( '[Jetpack] Red bubble notification fetch failed:', error );
	} );
