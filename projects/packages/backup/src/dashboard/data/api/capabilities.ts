import apiFetch from '@wordpress/api-fetch';

export type Capabilities = {
	hasBackupPlan: boolean;
	hasScan: boolean;
	planSlug: string | null;
};

/**
 * Fetch the site's backup capabilities.
 *
 * @return The capabilities payload.
 */
export async function fetchCapabilities(): Promise< Capabilities > {
	return apiFetch< Capabilities >( { path: '/jetpack/v4/site/capabilities' } );
}
