/**
 * My Jetpack Notification Bubble async loader.
 *
 * `Initializer::maybe_show_red_bubble()` enqueues this script only when the
 * red-bubble transient is cold, which also means it registered nothing with
 * the menu-badges `Notification_Counts` registry for this request. Menu_Renderer
 * has therefore already rendered the page's menu with a zero contribution from
 * My Jetpack, and no `[data-jp-menu-badge="my-jetpack"]` element exists on the
 * page for `window.jetpackMenuBadges.setCount()` to update.
 *
 * This request's only job is to warm the red-bubble transient (the REST
 * callback recomputes and re-caches it, see
 * `Red_Bubble_Notifications::get_red_bubble_alerts()`) so the *next* page load
 * takes the cached-alerts path and registers My Jetpack's contribution with
 * the registry in time for Menu_Renderer to badge it. It intentionally does
 * not write any badge into the current page's DOM.
 */
import apiFetch from '@wordpress/api-fetch';

apiFetch( {
	path: 'my-jetpack/v1/red-bubble-notifications',
	method: 'POST',
} ).catch( error => {
	// eslint-disable-next-line no-console
	console.log( '[Jetpack] Red bubble notification fetch failed:', error );
} );
