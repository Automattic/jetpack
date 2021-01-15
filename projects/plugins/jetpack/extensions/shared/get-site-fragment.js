/**
 * Returns the site fragment (slug) in the environment we're running Gutenberg in.
 *
 * @returns {?String} Site fragment (slug)
 */
export default function getSiteFragment() {
	// Gutenberg in Jetpack adds a site fragment in the initial state
	if (
		window &&
		window.Jetpack_Editor_Initial_State &&
		window.Jetpack_Editor_Initial_State.siteFragment
	) {
		return window.Jetpack_Editor_Initial_State.siteFragment;
	}

	return null;
}
