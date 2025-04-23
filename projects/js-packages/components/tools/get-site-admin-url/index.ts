import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Returns the site admin URL.
 *
 * @deprecated use `getAdminUrl` from `@automattic/jetpack-script-data` instead.
 *
 * @return {?string} The site admin URL or null if not available.
 */
export default function getSiteAdminUrl() {
	return (
		getScriptData()?.site?.admin_url ||
		window.Initial_State?.adminUrl ||
		window.Jetpack_Editor_Initial_State?.adminUrl ||
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Not using @ts-expect-error because myJetpackInitialState is typed in "my-jetpack" package and that doesn't expect this error
		// @ts-ignore The usage of myJetpackInitialState is not typed inside this generic package. We should get rid of it in the future.
		window?.myJetpackInitialState?.adminUrl ||
		null
	);
}
