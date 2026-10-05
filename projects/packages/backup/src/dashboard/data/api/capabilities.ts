import { apiCall, apiPath } from './_helpers';

export type Capabilities = {
	hasBackupPlan: boolean;
	hasScan: boolean;
	/**
	 * Facts the site decided for itself, branched so nothing here reads as
	 * something WordPress.com said; `Capabilities_Bridge` owns the same rule in
	 * PHP. All optional, since a part-upgraded site can serve a newer bundle
	 * against older PHP — read a missing value as closed.
	 */
	local?: {
		/** Whether the standalone Jetpack VaultPress Backup plugin is active. */
		isStandalonePluginActive?: boolean;
	};
};

/**
 * Fetch the site's backup capabilities.
 *
 * Wrapped in `apiCall` (not raw `apiFetch`) so bridge errors come back as
 * `ApiError`s with a `code` field, matching the rest of the data-layer
 * fetchers.
 *
 * @return The capabilities payload.
 */
export async function fetchCapabilities(): Promise< Capabilities > {
	return apiCall< Capabilities >( { path: apiPath( '/site/capabilities' ) } );
}
