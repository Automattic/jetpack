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
	// allowHidden: boot's admin-page-layout.scss sets `#wpfooter { display: none }` by design
	// (replaced with a pinned JetpackFooter inside the layout), so going hidden on flag-on is
	// expected, not a finding -- see projects/js-packages/base-styles/admin-page-layout.scss.
	footer: { label: 'Footer (#wpfooter)', selector: '#wpfooter', required: true, allowHidden: true },
	control: { label: 'Control', selector: null, required: false },
};

// Query params that legitimately differ between two page loads (nonces, cache busters)
// without the port having changed anything. Kept short and specific on purpose: a generic
// name (a `v` or `t` param) can carry real state -- e.g. an API version or a tab filter --
// that step 3 exists to catch. --ignore-query-param adds more for a site that needs them.
export const DEFAULT_IGNORED_QUERY_PARAMS = [ '_wpnonce', 'ver', '_', '_locale' ];

// Below this, a geometry delta is rounding noise, not a real shift.
export const DEFAULT_TOLERANCE_PX = 0.5;
