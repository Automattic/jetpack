declare global {
	interface Window {
		Initial_State?: {
			adminUrl?: string;
		};
		Jetpack_Editor_Initial_State?: {
			adminUrl?: string;
		};
		myJetpackInitialState?: {
			adminUrl?: string;
		};
	}
}
/**
 * Returns the site admin URL.
 *
 * @returns {?string} The site admin URL or null if not available.
 */
export default function getSiteAdminUrl() {
	return (
		window.Initial_State?.adminUrl ||
		window.Jetpack_Editor_Initial_State?.adminUrl ||
		window?.myJetpackInitialState?.adminUrl ||
		null
	);
}
