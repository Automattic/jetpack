/**
 * Returns the site admin URL.
 *
 * @return {?string} The site admin URL or null if not available.
 */
export default function getSiteAdminUrl() {
	return (
		window.Initial_State?.adminUrl ||
		window.Jetpack_Editor_Initial_State?.adminUrl ||
		window?.myJetpackInitialState?.adminUrl ||
		null
	);
}
