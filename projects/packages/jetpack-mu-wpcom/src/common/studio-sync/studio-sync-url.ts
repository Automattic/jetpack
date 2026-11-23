const STUDIO_SITE_ID_PARAM = 'studioSiteId';
const AUTO_OPEN_PUSH_PARAM = 'autoOpenPush';

// Studio's own identifier, echoed back rather than interpreted: only its length is bounded.
const STUDIO_SITE_ID_MAX_LENGTH = 64;

export interface StudioSyncParams {
	studioSiteId: string;
	autoOpenPush: boolean;
}

/**
 * Reads the params Studio's publish flow puts on the Dashboard URL, and returns the URL without them.
 *
 * @param {string} href - The current URL.
 * @return {object|null} The params and the cleaned URL, or null when the URL carries no usable `studioSiteId`.
 */
export function takeStudioSyncParams(
	href: string
): { params: StudioSyncParams; url: string } | null {
	const url = new URL( href );
	const studioSiteIds = url.searchParams.getAll( STUDIO_SITE_ID_PARAM );
	if ( studioSiteIds.length === 0 ) {
		return null;
	}

	const autoOpenPush = url.searchParams.get( AUTO_OPEN_PUSH_PARAM ) === 'true';
	url.searchParams.delete( STUDIO_SITE_ID_PARAM );
	url.searchParams.delete( AUTO_OPEN_PUSH_PARAM );

	const [ studioSiteId ] = studioSiteIds;
	if (
		studioSiteIds.length > 1 ||
		studioSiteId.length === 0 ||
		studioSiteId.length > STUDIO_SITE_ID_MAX_LENGTH
	) {
		return null;
	}

	return { params: { studioSiteId, autoOpenPush }, url: url.toString() };
}

/**
 * Builds the deep link that tells Studio to connect its local site to this one.
 *
 * @param {object}  params              - The deep link's params.
 * @param {string}  params.studioSiteId - Studio's local site ID.
 * @param {number}  params.remoteSiteId - This site's WordPress.com blog ID.
 * @param {boolean} params.autoOpenPush - Whether Studio should open Push once connected.
 * @return {string} The `wp-studio://` URL.
 */
export function buildStudioSyncConnectUrl( {
	studioSiteId,
	remoteSiteId,
	autoOpenPush,
}: StudioSyncParams & { remoteSiteId: number } ): string {
	const query = new URLSearchParams( { studioSiteId, remoteSiteId: String( remoteSiteId ) } );
	if ( autoOpenPush ) {
		query.set( AUTO_OPEN_PUSH_PARAM, 'true' );
	}
	return `wp-studio://sync-connect-site?${ query }`;
}
