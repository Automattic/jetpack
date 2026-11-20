/**
 * Default step-2 targets (JETPACK-2685): core wp-admin frame markup, present whether the
 * port's flag is off or on, so a diff catches the frame moving rather than its content.
 *
 * `control` is page-specific -- pass one with --control-selector.
 */
export const DEFAULT_GEOMETRY_TARGETS = {
	root: { label: 'Page root (#wpwrap)', selector: '#wpwrap', required: true },
	wpbodyContent: { label: '#wpbody-content', selector: '#wpbody-content', required: true },
	header: { label: 'Header (#wpadminbar)', selector: '#wpadminbar', required: true },
	// allowHidden: boot hides #wpfooter by design, replacing it with a pinned JetpackFooter
	// inside the layout -- see projects/js-packages/base-styles/admin-page-layout.scss.
	footer: { label: 'Footer (#wpfooter)', selector: '#wpfooter', required: true, allowHidden: true },
	control: { label: 'Control', selector: null, required: false },
};

// Query params that legitimately differ between two page loads (nonces, cache busters)
// without the port having changed anything. Kept short and specific on purpose: a generic
// name (a `v` or `t` param) can carry real state -- e.g. an API version or a tab filter --
// that step 3 exists to catch. --ignore-query-param adds more for a site that needs them.
export const DEFAULT_IGNORED_QUERY_PARAMS = [
	'_wpnonce',
	'_ajax_nonce',
	'_nonce',
	'ver',
	'_',
	'_locale',
	// Jetpack's own REST cache buster; without it every wp-json call lands in both
	// "only with flag off" and "only with flag on". Seen on the Search dashboard.
	'_cacheBuster',
];

// Hosts whose traffic is per-event by design: a Tracks pixel carries a timestamp in every
// URL, so each load produces new keys and buries the real findings. --ignore-host adds more.
export const DEFAULT_IGNORED_HOSTS = [ 'pixel.wp.com' ];

// Below this, a geometry delta is rounding noise, not a real shift.
export const DEFAULT_TOLERANCE_PX = 0.5;
