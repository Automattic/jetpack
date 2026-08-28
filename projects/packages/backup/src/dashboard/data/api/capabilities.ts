import { apiCall, apiPath } from './_helpers';

export type Capabilities = {
	hasBackupPlan: boolean;
	hasScan: boolean;
	/**
	 * Whether the standalone Jetpack VaultPress Backup plugin is active.
	 *
	 * Decided on the server — see `Capabilities_Bridge` — and carried on
	 * this response because it is the one request every screen already
	 * makes before it renders a body, so the answer is in hand before
	 * anything it gates could appear.
	 *
	 * Optional because the key can genuinely be absent: a site part-way
	 * through an upgrade can serve a newer JS bundle against older PHP.
	 * Consumers must read a missing value as closed rather than open —
	 * everything this gates is an addition, so not showing it is always
	 * the milder mistake.
	 */
	isStandalonePluginActive?: boolean;
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
