/**
 * Default targets for step 2 (JETPACK-2685): the WP admin frame elements that must
 * stay put when a wp-build port is only a chassis swap. `#wpwrap`, `#wpadminbar` and
 * `#wpfooter` are core wp-admin markup present on every page, flag on or off, so they
 * catch the port shifting the frame around its own content -- not the content itself.
 *
 * `control` has no default: a representative interactive control (a button, a toggle)
 * is page-specific. Pass one with --control-selector.
 */
export const DEFAULT_GEOMETRY_TARGETS = {
	root: { label: 'Page root (#wpwrap)', selector: '#wpwrap', required: true },
	wpbodyContent: { label: '#wpbody-content', selector: '#wpbody-content', required: true },
	header: { label: 'Header (#wpadminbar)', selector: '#wpadminbar', required: true },
	footer: { label: 'Footer (#wpfooter)', selector: '#wpfooter', required: true },
	control: { label: 'Control', selector: null, required: false },
};

// Query params that legitimately differ between two page loads (nonces, cache busters)
// without the port having changed anything. --ignore-query-param adds more.
export const DEFAULT_IGNORED_QUERY_PARAMS = [ '_wpnonce', 'ver', 'v', 't', '_', '_locale' ];

// Below this, a geometry delta is rounding noise, not a real shift.
export const DEFAULT_TOLERANCE_PX = 0.5;
