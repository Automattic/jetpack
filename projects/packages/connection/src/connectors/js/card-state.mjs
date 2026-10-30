/**
 * What the Connectors card derives from the jetpack-connection store and its script module data.
 *
 * Pure, so the card's state can be tested without a DOM.
 *
 * @see connectors-card.js useCardConnection()
 */

/**
 * The viewer's account row, or null when they have no user connection.
 *
 * WordPress.com values win; the local name and email fill in when the WordPress.com lookup failed.
 *
 * @param {object}  currentUser     - userConnectionData.currentUser from the store.
 * @param {boolean} isUserConnected - Whether the viewer holds a user token.
 * @return {object|null} Viewer row data.
 */
function buildViewer( currentUser, isUserConnected ) {
	if ( ! isUserConnected || ! currentUser ) {
		return null;
	}

	const wpcomUser = currentUser.wpcomUser || {};

	return {
		displayName: wpcomUser.display_name || currentUser.displayName || currentUser.username || '',
		login: wpcomUser.login || currentUser.username || '',
		email: wpcomUser.email || currentUser.email || '',
		avatar: currentUser.gravatar || '',
		isOwner: Boolean( currentUser.isMaster ),
	};
}

/**
 * Connection state for the card.
 *
 * @param {object}      store                    - Values read from the jetpack-connection store.
 * @param {object}      store.connectionStatus   - getConnectionStatus().
 * @param {object}      store.userConnectionData - getUserConnectionData().
 * @param {object|null} store.owner              - getConnectionOwner().
 * @param {*}           store.plugins            - getConnectedPlugins().
 * @param {boolean}     store.isOfflineMode      - getIsOfflineMode().
 * @param {number|null} store.blogId             - getBlogId().
 * @param {object}      cardData                 - Card-only script module data.
 * @param {object}      cardData.pluginLogos     - Logo URLs keyed by plugin slug.
 * @param {string|null} cardData.ownerEditUrl    - Edit link for the connection owner.
 * @return {object} Connection state and the values derived from it.
 */
export function getCardConnection(
	{ connectionStatus, userConnectionData, owner: storeOwner, plugins, isOfflineMode, blogId },
	{ pluginLogos = {}, ownerEditUrl = null } = {}
) {
	const isRegistered = Boolean( connectionStatus.isRegistered );
	const isConnected = isRegistered && Boolean( connectionStatus.hasConnectedOwner );
	const currentUser = userConnectionData?.currentUser || null;
	// The store's owner comes from the master_user option, so it still names an owner whose token
	// is broken; the card flags them so the rows and prompt can say who has to reconnect.
	let owner = isRegistered ? storeOwner : null;
	const isOwnerConnectionBroken = Boolean( owner ) && ! isConnected;
	// Without jetpack_connect (offline mode, network-restricted site admins) the store withholds the
	// owner object, but userConnectionData still names the connected owner.
	if ( isConnected && ! owner && userConnectionData?.connectionOwner ) {
		owner = { id: null, displayName: userConnectionData.connectionOwner };
	}
	const ownerIsViewer = owner?.id
		? Boolean( currentUser && owner.id === currentUser.id )
		: Boolean( owner && currentUser?.isMaster );
	// Not gated on isConnected, so a healthy viewer keeps their row when the owner's token breaks.
	const viewer = isRegistered
		? buildViewer( currentUser, Boolean( connectionStatus.isUserConnected ) )
		: null;
	// Tracks `viewer_connection_type`: `site_only` whenever the viewer's own account isn't connected, owner or not.
	let viewerConnectionType = 'site_only';
	if ( viewer ) {
		viewerConnectionType = ownerIsViewer || viewer.isOwner ? 'owner' : 'user';
	}
	// The initial state sends a WP_Error object when the plugin list can't be read.
	const connectedPlugins = ( Array.isArray( plugins ) ? plugins : [] ).map( plugin => ( {
		name: plugin.name || plugin.slug,
		slug: plugin.slug,
		logoUrl: pluginLogos[ plugin.slug ] || null,
	} ) );

	return {
		isRegistered,
		isConnected,
		isOfflineMode: Boolean( isOfflineMode ),
		isFirstConnection: ! isRegistered && ! blogId,
		isInSafeMode: isRegistered && Boolean( connectionStatus.isInSafeMode ),
		blogId,
		currentUser,
		viewer,
		owner: owner
			? {
					id: owner.id,
					displayName: owner.displayName,
					avatar: owner.avatar || '',
					editUrl: ownerEditUrl,
				}
			: null,
		isOwnerConnectionBroken,
		ownerIsViewer,
		viewerConnectionType,
		connectedPlugins,
		// Stats and Backups are Jetpack-plugin features, so only cite them as examples
		// of paused features when a Jetpack-family plugin is actually connected.
		// Other plugin families (WooCommerce, Automattic for Agencies) fall back to the
		// generic "features that sync with WordPress.com" wording.
		hasJetpackPlugin: connectedPlugins.some(
			plugin => plugin.slug === 'jetpack' || plugin.slug.startsWith( 'jetpack-' )
		),
		// Per the Jetpack Connection language guidelines, use "store" whenever a
		// WooCommerce-family plugin is connected (Woo is the user's primary context),
		// and "site" otherwise.
		hasWooPlugin: connectedPlugins.some( plugin => plugin.slug.startsWith( 'woocommerce' ) ),
	};
}

/**
 * What each Manager::PO_STATE_* value means for the card: which slot it asks for, and whether
 * an anchor is stored. A status missing here, such as `NOT_ELIGIBLE`, leaves the card as it is.
 */
const PROTECTED_OWNER_STATES = {
	CAN_ESTABLISH: { slot: 'confirm', anchored: false },
	NEEDS_CONNECT_TO_ESTABLISH: { slot: 'connect', anchored: false },
	NEEDS_OWNER_RECONNECT: { slot: 'reconnect', anchored: true },
	NEEDS_DIFFERENT_OWNER: { slot: 'other-owner', anchored: true },
	RE_EVALUATE: { slot: null, anchored: true },
};

/**
 * What the card should do about this site's protected owner.
 *
 * @param {object|null} protectedOwner - The card's protectedOwner script module data.
 * @return {{slot: (string|null), anchored: boolean, isPending: boolean, isEstablished: boolean, canRelease: boolean}} Protected-owner state.
 */
export function getProtectedOwnerStatus( protectedOwner ) {
	const state = ( protectedOwner && PROTECTED_OWNER_STATES[ protectedOwner.status ] ) || null;
	const slot = state?.slot || null;
	const anchored = Boolean( state?.anchored );
	// Derived from the same table as the slot so the two cannot disagree about one site.
	const isEstablished = anchored && ! slot;

	return {
		slot,
		anchored,
		isPending: slot !== null,
		isEstablished,
		// Only once ownership is settled: every pending state already offers its own slot, and
		// releasing from one of those would unlock a lock nobody holds yet.
		canRelease: isEstablished && Boolean( protectedOwner?.viewerIsConfirmedOwner ),
	};
}

/**
 * Decorate a Calypso authorize URL with the params every connector flow needs:
 * `from=jetpack-connector` so Calypso returns the user to the Connectors page,
 * and `skip_pricing` so the post-auth redirect honours redirect_after_auth
 * instead of routing through the Calypso plans page.
 *
 * TEMPORARY: `skip_pricing` can be dropped once Calypso recognises
 * `from=jetpack-connector` natively and redirects to redirectAfterAuth.
 *
 * @param {string} url - Calypso authorize URL.
 * @return {string} Decorated URL (unchanged if it can't be parsed).
 */
export function decorateAuthUrl( url ) {
	try {
		const parsed = new URL( url );
		parsed.searchParams.set( 'from', 'jetpack-connector' );
		parsed.searchParams.set( 'skip_pricing', 'true' );
		return parsed.toString();
	} catch {
		return url;
	}
}
