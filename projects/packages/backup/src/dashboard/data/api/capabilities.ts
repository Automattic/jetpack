import { apiCall, apiPath } from './_helpers';

export type Capabilities = {
	hasBackupPlan: boolean;
	hasScan: boolean;
	/**
	 * Facts the site decided for itself, kept in their own branch so that
	 * nothing here can be mistaken for something WordPress.com said. See
	 * `Capabilities_Bridge`, which owns the same rule on the PHP side.
	 *
	 * They ride on this response because it is the one request every
	 * screen already makes before it renders a body, so the answers are in
	 * hand before anything depending on them could appear.
	 *
	 * The branch and its members are all optional, because they can
	 * genuinely be absent: a site part-way through an upgrade can serve a
	 * newer JS bundle against older PHP. Read a missing value as closed
	 * rather than open — everything carried here gates an addition, so not
	 * showing it is always the milder mistake.
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
