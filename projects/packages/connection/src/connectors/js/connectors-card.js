/**
 * Script module that registers a Jetpack connector card on the
 * WP core Settings > Connectors page (WP 7.0+).
 *
 * Built by webpack into dist/connectors/ and loaded via
 * wp_enqueue_script_module() with `@wordpress/connectors` as a static
 * dependency. Its other imports are classic scripts, which the PHP
 * enqueues beside it from the asset file's `dependencies`.
 *
 * Name, description, and logo are provided by the PHP registration
 * in register_connector() and merged automatically by the store.
 * This module adds the render function. Connection state shared with the
 * package's components comes from the jetpack-connection store; the
 * card-only extras come from script module data.
 *
 * The render prop naming differs between WP core (name, logo) and
 * the Gutenberg plugin (label, icon), so the card accepts both.
 *
 * @see Jetpack_Connector::enqueue_script_module()
 */

import {
	bumpConnectionStat,
	CONNECTION_EVENTS,
	CONNECTION_STORE_ID,
	ConnectionErrorView,
	DisconnectDialog,
	DisconnectUserDialog,
	getProtectedOwnerConfirmationCopy,
	getRegistrationErrorDisplay,
	getTracksIdentity,
	initializeTracksIdentity,
	ProtectedOwnerConfirmation,
	ProtectedOwnerRelease,
	TermsOfService,
	TransferConnectionOwnership,
	trackConnectionEvent,
	getUserConnectKind,
	getUserConnectMessage,
	useConnectionErrorNotice,
} from '@automattic/jetpack-connection';
import * as components from '@wordpress/components';
// Namespace import: a missing named export would fail the whole module before the fallbacks run.
// eslint-disable-next-line import/no-unresolved -- resolved via WP import map at runtime.
import * as connectors from '@wordpress/connectors';
import { useSelect } from '@wordpress/data';
import {
	createElement,
	createInterpolateElement,
	useState,
	useEffect,
	useMemo,
	useRef,
} from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { getAccountSections } from './account-sections.mjs';
import { createRequestError, getConnectErrorDisplay } from './connect-error.mjs';

const registerConnector =
	connectors.__experimentalRegisterConnector || connectors.registerConnector;
const ConnectorItem = connectors.__experimentalConnectorItem || connectors.ConnectorItem;

const { Button, Modal, Notice, Tooltip } = components;
const HStack = components.__experimentalHStack || components.HStack;
const VStack = components.__experimentalVStack || components.VStack;
const Text = components.__experimentalText || components.Text;

const MODULE_ID = '@automattic/jetpack-connection-connectors';
const CONNECTOR_ID = 'wordpress_com';
// Links such as My Jetpack's "Manage connection" add ?connector=wordpress_com to open the details.
const isLinkedTo =
	new URLSearchParams( window.location.search ).get( 'connector' ) === CONNECTOR_ID;
const dataEl = document.getElementById( `wp-script-module-data-${ MODULE_ID }` );
const data = JSON.parse( dataEl?.textContent ?? '{}' );

// Card-only data. Connection state the package's components also read comes from the store; see useCardConnection().
const apiRoot = data.apiRoot || '';
const apiNonce = data.apiNonce || '';
const redirectUri = data.redirectUri || '';
// Absolute form of redirectUri, for flows that redirect without resolving it against wp-admin.
const connectorsUrl = data.connectorsUrl || undefined;
const connectionOwnerEditUrl = data.connectionOwnerEditUrl || null;
const connectedUsersUrl = data.connectedUsersUrl || '';
const pluginLogos = data.pluginLogos || {};
const siteDetails = data.siteDetails || null;
const isWoaSite = Boolean( data.isWoaSite );
const isVipSite = Boolean( data.isVipSite );
const isManagedPlatformSite = isWoaSite || isVipSite;
const CONNECTOR_LOGO = data.connectorLogoUrl
	? createElement( 'img', { src: data.connectorLogoUrl, alt: '', width: 36, height: 36 } )
	: null;
const ssoStatus = data.ssoStatus ?? null;
const isSafeModeConfirmed = Boolean( data.isSafeModeConfirmed );
const idc = data.idc || null;
// `platform` matches what the Identity Crisis screen sends with the same jetpack_idc_* events.
const idcTrackingProps = idc?.platform ? { platform: idc.platform } : {};
const protectedOwner = data.protectedOwner || null;

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
 * Connection state for the card, read from the jetpack-connection store.
 *
 * @return {object} Connection state and the values derived from it.
 */
function useCardConnection() {
	const {
		connectionStatus,
		userConnectionData,
		owner: storeOwner,
		plugins,
		isOfflineMode,
		blogId,
	} = useSelect( select => {
		const store = select( CONNECTION_STORE_ID );
		return {
			connectionStatus: store.getConnectionStatus(),
			userConnectionData: store.getUserConnectionData(),
			owner: store.getConnectionOwner(),
			plugins: store.getConnectedPlugins(),
			isOfflineMode: store.getIsOfflineMode(),
			blogId: store.getBlogId() || null,
		};
	}, [] );

	return useMemo( () => {
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
		// Per the Jetpack Connection language guidelines, use "store" whenever a
		// WooCommerce-family plugin is connected (Woo is the user's primary context),
		// and "site" otherwise.
		const hasWooPlugin = connectedPlugins.some( plugin => plugin.slug.startsWith( 'woocommerce' ) );

		return {
			isRegistered,
			isConnected,
			isOfflineMode: Boolean( isOfflineMode ),
			isFirstConnection: ! isRegistered && ! blogId,
			isInSafeMode: isRegistered && Boolean( connectionStatus.isInSafeMode ),
			blogId,
			currentUser,
			tracksIdentity: getTracksIdentity( currentUser ),
			viewer,
			owner: owner
				? {
						id: owner.id,
						displayName: owner.displayName,
						avatar: owner.avatar || '',
						editUrl: connectionOwnerEditUrl,
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
			subjectNoun: hasWooPlugin
				? _x(
						'store',
						'The thing connected to WordPress.com, in a WooCommerce context.',
						'jetpack-connection'
					)
				: _x( 'site', 'The thing connected to WordPress.com.', 'jetpack-connection' ),
		};
	}, [ connectionStatus, userConnectionData, storeOwner, plugins, isOfflineMode, blogId ] );
}

const TRACKING_CONTEXT = 'connectors';

/**
 * Tracks recording for the card, silent in offline mode where every action is disabled.
 *
 * Every event carries the viewer's `viewer_connection_type` from useCardConnection(). `track` is a no-op when an
 * older shared bundle lacks the helper.
 *
 * @param {object}  connection                      - Values from the caller's useCardConnection().
 * @param {boolean} connection.isOfflineMode        - Whether the site is in offline mode.
 * @param {string}  connection.viewerConnectionType - The viewer's connection: owner, user or site_only.
 * @return {{trackingContext: (string|undefined), track: Function}} Context for the shared dialogs, and a recorder.
 */
function useTracking( { isOfflineMode, viewerConnectionType } ) {
	return useMemo( () => {
		const trackingContext = isOfflineMode ? undefined : TRACKING_CONTEXT;
		const track = ( event, props ) => {
			if ( trackingContext && event && typeof trackConnectionEvent === 'function' ) {
				trackConnectionEvent( event, trackingContext, {
					...props,
					viewer_connection_type: viewerConnectionType,
				} );
			}
		};
		return { trackingContext, track };
	}, [ isOfflineMode, viewerConnectionType ] );
}

/**
 * Make a POST/GET request to a Jetpack REST endpoint with the standard
 * connection headers and error handling.
 *
 * Resolves with the parsed JSON body (or null if there is no body), and
 * throws an Error whose message is the server-provided message — falling
 * back to `fallbackError` — for both non-OK responses and network failures.
 * For a non-OK response, the error's `response` is the parsed body.
 *
 * @param {string} endpoint                - REST path relative to apiRoot.
 * @param {object} [options]               - Request options.
 * @param {string} [options.method]        - HTTP method (default 'GET').
 * @param {object} [options.body]          - JSON body; sets Content-Type when present.
 * @param {string} [options.fallbackError] - Message used when the server provides none.
 * @return {Promise<object|string|null>} Parsed JSON response.
 */
async function apiRequest( endpoint, { method = 'GET', body = null, fallbackError = '' } = {} ) {
	const errorMessage =
		fallbackError || __( 'An error occurred. Please try again.', 'jetpack-connection' );
	const options = { method, headers: { 'X-WP-Nonce': apiNonce } };
	if ( body ) {
		options.headers[ 'Content-Type' ] = 'application/json';
		options.body = JSON.stringify( body );
	}

	let response;
	try {
		response = await window.fetch( apiRoot + endpoint, options );
	} catch {
		throw new Error( errorMessage );
	}

	if ( ! response.ok ) {
		const errBody = await response.json().catch( () => null );
		throw createRequestError( errBody, errorMessage );
	}

	// Some endpoints (e.g. disconnect) return an empty body on success; treat
	// an unparseable body as a successful no-content response rather than a
	// failure.
	return response.json().catch( () => null );
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
function decorateAuthUrl( url ) {
	try {
		const parsed = new URL( url );
		parsed.searchParams.set( 'from', 'jetpack-connector' );
		parsed.searchParams.set( 'skip_pricing', 'true' );
		return parsed.toString();
	} catch {
		return url;
	}
}

/**
 * Disconnect this site from WordPress.com.
 *
 * During an identity crisis this only clears the local tokens — the
 * Identity_Crisis filter blocks the remote deregister call — so the original
 * site keeps its registration.
 *
 * @param {string} [fallbackError] - Message used when the server provides none.
 * @return {Promise<object|string|null>} Parsed JSON response.
 */
function disconnectSite( fallbackError ) {
	return apiRequest( 'jetpack/v4/connection', {
		method: 'POST',
		body: { isActive: false },
		fallbackError,
	} );
}

/**
 * Start the Jetpack connection flow: register the site (if needed),
 * then redirect to WordPress.com for user authorization.
 *
 * Mirrors the flow in useConnection / handleRegisterSite from
 * the `@automattic/jetpack-connection` JS package.
 *
 * @param {boolean} siteRegistered - Whether the site is already registered.
 * @return {Promise<void>} Resolves after redirect begins.
 */
async function startConnectionFlow( siteRegistered ) {
	if ( siteRegistered ) {
		const params = new URLSearchParams();
		if ( redirectUri ) {
			params.set( 'redirect_uri', redirectUri );
		}
		params.set( 'from', 'jetpack-connector' );
		const qs = params.toString();
		const authData = await apiRequest(
			'jetpack/v4/connection/authorize_url' + ( qs ? '?' + qs : '' ),
			{ fallbackError: __( 'Failed to retrieve authorization URL.', 'jetpack-connection' ) }
		);
		const authorizeUrl = authData?.authorizeUrl || authData;
		if ( typeof authorizeUrl !== 'string' || ! authorizeUrl ) {
			throw new Error( 'No authorization URL received' );
		}
		window.location.href = decorateAuthUrl( authorizeUrl );
		return;
	}

	const body = { from: 'jetpack-connector' };
	if ( redirectUri ) {
		body.redirect_uri = redirectUri;
	}

	const result = await apiRequest( 'jetpack/v4/connection/register', {
		method: 'POST',
		body,
		fallbackError: __( 'Site registration failed.', 'jetpack-connection' ),
	} );

	if ( ! result?.authorizeUrl ) {
		throw new Error( 'No authorization URL received' );
	}

	window.location.href = decorateAuthUrl( result.authorizeUrl );
}

/**
 * Focus an element once #wpwrap no longer has aria-hidden.
 *
 * The blur-before-open pattern on modal triggers and this helper are both
 * workarounds for a Gutenberg bug where aria-hidden is applied to #wpwrap
 * before focus has moved into the modal portal, causing a browser console warning.
 *
 * @see https://github.com/WordPress/gutenberg/issues/41503
 *
 * @param {HTMLElement|null} element - Element to focus.
 */
function focusWhenReady( element ) {
	if ( ! element ) {
		return;
	}
	const wpwrap = document.getElementById( 'wpwrap' );
	if ( ! wpwrap || ! wpwrap.hasAttribute( 'aria-hidden' ) ) {
		element.focus();
		return;
	}
	const observer = new MutationObserver( () => {
		if ( ! wpwrap.hasAttribute( 'aria-hidden' ) ) {
			observer.disconnect();
			element.focus();
		}
	} );
	observer.observe( wpwrap, { attributes: true, attributeFilter: [ 'aria-hidden' ] } );
}

/* ── Small presentational components ────────────────────────────── */

/**
 * Inline error notice with an optional dismiss button.
 *
 * @param {object}        props           - Component props.
 * @param {*}             props.message   - Error message.
 * @param {*}             props.detail    - Optional second line, such as the underlying cURL error.
 * @param {Function|null} props.onDismiss - Callback to clear the error; omit for non-dismissible.
 * @return {object} React element.
 */
function ErrorNotice( { message, detail = null, onDismiss = null } ) {
	return createElement(
		Notice,
		{
			status: 'error',
			isDismissible: Boolean( onDismiss ),
			onRemove: onDismiss || undefined,
			className: 'jetpack-connector__notice',
		},
		message,
		detail ? createElement( 'p', { className: 'jetpack-connector__notice-detail' }, detail ) : null
	);
}

/**
 * Notice explaining that connection management is disabled while the
 * site is in Jetpack's offline mode.
 *
 * @return {object} React element.
 */
function OfflineNotice() {
	const message = createInterpolateElement(
		__(
			'Your site is in <link>Offline Mode</link>, so connecting and disconnecting are disabled.',
			'jetpack-connection'
		),
		{
			link: createElement( 'a', {
				href: 'https://jetpack.com/support/offline-mode/',
				target: '_blank',
				rel: 'noopener noreferrer',
			} ),
		}
	);

	return createElement(
		Notice,
		{
			status: 'warning',
			isDismissible: false,
			className: 'jetpack-connector__notice',
		},
		message
	);
}

/**
 * Status badge with a BEM modifier for different connection states.
 *
 * @param {object} props          - Component props.
 * @param {string} props.label    - Badge text.
 * @param {string} props.modifier - BEM modifier suffix (e.g. 'connected', 'site-connected').
 * @return {object} React element.
 */
function StatusBadge( { label, modifier = 'connected' } ) {
	const cls = 'jetpack-connector__status-badge jetpack-connector__status-badge--' + modifier;
	return createElement( 'span', { className: cls }, label );
}

/**
 * A labelled user row with avatar, display name, and login.
 *
 * @param {object}            props            - Component props.
 * @param {string}            props.title      - Section heading (uppercase label).
 * @param {object|null}       props.user       - User data object with displayName, login, avatar, and an optional editUrl.
 * @param {string|false|null} props.subtitle   - Override for the default login/email line. Pass false to hide entirely.
 * @param {object|null}       props.actionSlot - Optional element rendered at the end of the user row.
 * @param {boolean}           props.showShield - Whether to show the protected-owner shield beside the title.
 * @return {object|null} React element or null.
 */
function UserSection( { title, user, subtitle = null, actionSlot = null, showShield = false } ) {
	if ( ! user ) {
		return null;
	}

	const defaultSubtitle = user.email ? user.login + ' (' + user.email + ')' : user.login;
	const showSubtitle = subtitle !== false;

	return createElement(
		VStack,
		{ spacing: 3, className: 'jetpack-connector__section' },
		createElement( SectionHeading, { title, showShield } ),
		createElement(
			HStack,
			null,
			createElement(
				HStack,
				{ spacing: 3, expanded: false, alignment: 'center' },
				user.avatar
					? createElement( 'img', {
							src: user.avatar,
							alt: '',
							width: 36,
							height: 36,
							className: 'jetpack-connector__owner-avatar',
						} )
					: null,
				createElement(
					VStack,
					{ spacing: 0 },
					user.editUrl
						? createElement(
								'a',
								{
									href: user.editUrl,
									className: 'jetpack-connector__user-link',
								},
								createElement( Text, { weight: 600, size: 13 }, user.displayName )
							)
						: createElement( Text, { weight: 600, size: 13 }, user.displayName ),
					showSubtitle
						? createElement( Text, { variant: 'muted', size: 12 }, subtitle || defaultSubtitle )
						: null
				)
			),
			actionSlot
		)
	);
}

/**
 * Connected plugins section displayed in the expanded card.
 *
 * @return {object|null} React element or null.
 */
function ConnectedPluginsSection() {
	const { connectedPlugins } = useCardConnection();

	if ( ! connectedPlugins.length ) {
		return null;
	}

	return createElement(
		VStack,
		{ spacing: 3, className: 'jetpack-connector__section' },
		createElement(
			Text,
			{
				variant: 'muted',
				size: 11,
				upperCase: true,
				weight: 500,
			},
			__( 'Connected plugins', 'jetpack-connection' )
		),
		createElement(
			HStack,
			{ spacing: 4, wrap: true, justify: 'flex-start' },
			...connectedPlugins.map( plugin =>
				createElement(
					HStack,
					{ key: plugin.slug, spacing: 2, expanded: false, alignment: 'center' },
					plugin.logoUrl
						? createElement( 'img', {
								src: plugin.logoUrl,
								alt: '',
								className: 'jetpack-connector__plugin-icon',
							} )
						: createElement( 'span', {
								className:
									'dashicons dashicons-admin-plugins jetpack-connector__plugin-icon jetpack-connector__plugin-icon--fallback',
							} ),
					createElement( Text, { size: 13 }, plugin.name )
				)
			)
		)
	);
}

/**
 * Uppercase section label, with an optional protected-owner shield.
 *
 * @param {object}  props            - Component props.
 * @param {string}  props.title      - Section heading.
 * @param {boolean} props.showShield - Whether to show the protected-owner shield.
 * @return {object} React element.
 */
function SectionHeading( { title, showShield = false } ) {
	const label = createElement(
		Text,
		{
			variant: 'muted',
			size: 11,
			upperCase: true,
			weight: 500,
		},
		title
	);

	if ( ! showShield ) {
		return label;
	}

	return createElement(
		HStack,
		{ spacing: 1, expanded: false, alignment: 'center', justify: 'flex-start' },
		label,
		createElement( ProtectedOwnerShield )
	);
}

/**
 * Shield shown beside the Connection owner title while a protected owner is requested or stored.
 *
 * Nothing is locked until an anchor exists, so a requested owner gets its own wording.
 *
 * @return {object} React element.
 */
function ProtectedOwnerShield() {
	// Shared with the confirmation dialog, so the badge and the dialog describe one lock.
	const { lockedNotice, pendingLockNotice } = getProtectedOwnerConfirmationCopy();
	const notice = protectedOwnerState()?.anchored ? lockedNotice : pendingLockNotice;
	const icon = createElement( 'span', {
		className: 'dashicons dashicons-shield jetpack-connector__protected-owner-shield',
		role: 'img',
		tabIndex: 0,
		'aria-label': notice,
	} );

	if ( ! Tooltip ) {
		return createElement( 'span', { title: notice }, icon );
	}

	return createElement( Tooltip, { text: notice }, icon );
}

/**
 * Title for the viewing admin's own account row.
 *
 * @param {object} user - Current user data, including isOwner.
 * @return {string} Section title.
 */
function connectedAccountTitle( user ) {
	if ( ! user.isOwner ) {
		return __( 'Connected as', 'jetpack-connection' );
	}

	if ( protectedOwnerIsPending() ) {
		return __( 'Connection owner — unconfirmed', 'jetpack-connection' );
	}

	return __( 'Connected as owner', 'jetpack-connection' );
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
 * @return {object|null} Entry from PROTECTED_OWNER_STATES, or null when there is nothing to do.
 */
function protectedOwnerState() {
	return ( protectedOwner && PROTECTED_OWNER_STATES[ protectedOwner.status ] ) || null;
}

/**
 * Which protected-owner slot to render, if any.
 *
 * @return {string|null} `confirm`, `connect`, `reconnect`, `other-owner`, or null.
 */
function protectedOwnerSlotKind() {
	return protectedOwnerState()?.slot || null;
}

/**
 * Support link for the protected-owner recovery copy.
 *
 * @return {object} React element for createInterpolateElement's `support` tag.
 */
function supportLink() {
	return createElement( 'a', {
		href: 'https://jetpack.com/redirect/?source=jetpack-support',
		target: '_blank',
		rel: 'noopener noreferrer',
	} );
}

/**
 * Whether a protected owner is requested or stored but not yet the connection owner.
 *
 * Derived from the same table as the slot so the two cannot disagree about one site.
 *
 * @return {boolean} True while the connection owner is unconfirmed.
 */
function protectedOwnerIsPending() {
	return protectedOwnerSlotKind() !== null;
}

/**
 * Whether the connection owner is the protected owner the anchor names.
 *
 * @return {boolean} True once a protected owner is settled.
 */
function protectedOwnerIsEstablished() {
	return Boolean( protectedOwnerState()?.anchored ) && ! protectedOwnerIsPending();
}

/**
 * Whether the viewer can give up this site's protected ownership.
 *
 * Only the confirmed owner, and only once ownership is settled: every pending state already
 * offers its own slot, and releasing from one of those would unlock a lock nobody holds yet.
 *
 * @param {object|null} viewer - The viewer's row data from useCardConnection().
 * @return {boolean} True when the release row should be shown.
 */
function canReleaseProtectedOwner( viewer ) {
	// Holding the connection too, which is the gate the release endpoint applies: a settled site
	// has the anchored owner there, and a shared binding alone would earn a 403.
	return (
		protectedOwnerIsEstablished() &&
		Boolean( protectedOwner?.viewerIsConfirmedOwner ) &&
		Boolean( viewer?.isOwner )
	);
}

/**
 * Release-ownership row, shown under the confirmed owner's own account.
 *
 * @param {object}  props        - Component props.
 * @param {boolean} props.isBusy - Whether another account action is in progress (disables the link).
 * @return {object} React element.
 */
function ReleaseOwnershipSection( { isBusy = false } ) {
	const [ isReleaseOpen, setIsReleaseOpen ] = useState( false );
	const { isOfflineMode, subjectNoun, viewerConnectionType } = useCardConnection();
	const { trackingContext, track } = useTracking( { isOfflineMode, viewerConnectionType } );

	return createElement(
		VStack,
		{ spacing: 3, className: 'jetpack-connector__section' },
		createElement(
			Button,
			{
				variant: 'link',
				className: 'jetpack-connector__inline-action',
				disabled: isBusy || isOfflineMode,
				onClick: () => {
					track( CONNECTION_EVENTS?.cardActionClick, { action: 'release_protected_owner' } );
					setIsReleaseOpen( true );
				},
			},
			__( 'Release ownership', 'jetpack-connection' )
		),
		isReleaseOpen && ProtectedOwnerRelease
			? createElement( ProtectedOwnerRelease, {
					isOpen: true,
					apiRoot,
					apiNonce,
					subject: subjectNoun,
					trackingContext,
					onClose: () => setIsReleaseOpen( false ),
					onReleased: () => window.location.reload(),
				} )
			: null
	);
}

/**
 * Protected-owner slot.
 *
 * @return {object} React element.
 */
function ProtectedOwnerSection() {
	const [ isConfirmOpen, setIsConfirmOpen ] = useState( false );
	const { subjectNoun, isOfflineMode, viewerConnectionType } = useCardConnection();
	const { trackingContext, track } = useTracking( { isOfflineMode, viewerConnectionType } );
	const kind = protectedOwnerSlotKind();
	let title;
	let body;

	if ( kind === 'reconnect' ) {
		title = __( 'Restore ownership', 'jetpack-connection' );

		// The owner's own token is what could not be read, so the viewer who holds the
		// anchored identity is asked to reconnect rather than to connect a second account.
		const text = protectedOwner.viewerIsConfirmedOwner
			? __(
					'Reconnect your account to restore ownership, or <support>contact support</support>.',
					'jetpack-connection'
				)
			: __(
					'The confirmed owner account could not be read. Reconnecting it restores ownership, or <support>contact support</support>.',
					'jetpack-connection'
				);

		body = createElement(
			Text,
			{ size: 13 },
			createInterpolateElement( text, { support: supportLink() } )
		);
	} else if ( kind === 'other-owner' ) {
		title = __( 'Restore ownership', 'jetpack-connection' );
		body = createElement(
			Text,
			{ size: 13 },
			createInterpolateElement(
				sprintf(
					// translators: %s: "site" or "store".
					__(
						'The confirmed %s owner needs to connect their account, or <support>contact support</support>.',
						'jetpack-connection'
					),
					subjectNoun
				),
				{ support: supportLink() }
			)
		);
	} else if ( kind === 'connect' ) {
		title = __( 'Confirm ownership', 'jetpack-connection' );
		body = createElement(
			Text,
			{ size: 13 },
			sprintf(
				// translators: %s: "site" or "store".
				__(
					'Connect your account before you can confirm you are the %s owner.',
					'jetpack-connection'
				),
				subjectNoun
			)
		);
	} else {
		title = __( 'Confirm ownership', 'jetpack-connection' );

		const requestedBy = sprintf(
			// translators: %s: "site" or "store".
			__( 'a plugin on this %s', 'jetpack-connection' ),
			subjectNoun
		);

		body = createElement(
			VStack,
			{ spacing: 2 },
			createElement(
				Button,
				{
					variant: 'link',
					className: 'jetpack-connector__inline-action',
					onClick: () => {
						track( CONNECTION_EVENTS?.cardActionClick, { action: 'confirm_protected_owner' } );
						setIsConfirmOpen( true );
					},
				},
				sprintf(
					// translators: %s: "site" or "store".
					__( 'Confirm you are the %s owner.', 'jetpack-connection' ),
					subjectNoun
				)
			),
			createElement(
				Text,
				{ variant: 'muted', size: 12 },
				sprintf(
					// translators: %1$s: who asked for a protected owner. %2$s: "site" or "store".
					__(
						'Confirming ownership is requested by %1$s, so important features stay tied to one account. Until an owner is confirmed, some features stay locked and the account that connected this %2$s is shown as the unconfirmed owner. Ownership can be transferred later.',
						'jetpack-connection'
					),
					requestedBy,
					subjectNoun
				)
			)
		);
	}

	return createElement(
		VStack,
		{ spacing: 3, className: 'jetpack-connector__section' },
		createElement( SectionHeading, { title, showShield: true } ),
		body,
		isConfirmOpen && ProtectedOwnerConfirmation
			? createElement( ProtectedOwnerConfirmation, {
					isOpen: true,
					apiRoot,
					apiNonce,
					subject: subjectNoun,
					trackingContext,
					onClose: () => setIsConfirmOpen( false ),
					onConfirmed: () => window.location.reload(),
				} )
			: null
	);
}

/**
 * Prompt shown to admins whose user account is not yet linked.
 *
 * @param {object}   props              - Component props.
 * @param {Function} props.onConnect    - Callback to start the authorization flow.
 * @param {boolean}  props.isConnecting - Whether a connection attempt is in progress.
 * @return {object} React element.
 */
function ConnectPrompt( { onConnect, isConnecting } ) {
	const { isRegistered, isConnected, isOfflineMode, owner, currentUser } = useCardConnection();
	const promptKind = getUserConnectKind( {
		isRegistered,
		hasConnectedOwner: isConnected,
		owner,
		currentUserId: currentUser?.id,
	} );
	const isReconnectingOwner = 'reconnect-owner' === promptKind;
	const promptText = getUserConnectMessage( promptKind );

	let buttonText = __(
		'Connect account',
		'jetpack-connection',
		/* dummy arg to avoid bad minification */ 0
	);
	if ( isConnecting ) {
		buttonText = __( 'Connecting…', 'jetpack-connection' );
	} else if ( isReconnectingOwner ) {
		buttonText = __( 'Reconnect account', 'jetpack-connection' );
	}

	return createElement(
		HStack,
		{ spacing: 3, className: 'jetpack-connector__section' },
		createElement(
			'div',
			{ className: 'jetpack-connector__connect-prompt-text' },
			createElement( Text, { size: 13 }, promptText )
		),
		createElement(
			Button,
			{
				variant: 'secondary',
				size: 'small',
				onClick: onConnect,
				isBusy: isConnecting,
				disabled: isConnecting || isOfflineMode,
				className: 'jetpack-connector__inline-action',
			},
			buttonText
		)
	);
}

/* ── Modal components ───────────────────────────────────────────── */

/**
 * Destructive confirmation dialog (disconnect site or unlink owner).
 *
 * @param {object}   props           - Component props.
 * @param {string}   props.title     - Modal heading.
 * @param {string}   props.message   - Body text explaining consequences.
 * @param {Function} props.onConfirm - Called when the user confirms.
 * @param {Function} props.onCancel  - Called when the user cancels or closes.
 * @return {object} React element.
 */
function ConfirmationModal( { title, message, onConfirm, onCancel } ) {
	return createElement(
		Modal,
		{
			title,
			onRequestClose: onCancel,
			size: 'small',
			role: 'alertdialog',
			className: 'jetpack-connector__confirm-modal',
		},
		createElement(
			VStack,
			{ spacing: 5 },
			createElement( Text, { size: 13 }, message ),
			createElement(
				HStack,
				{ spacing: 3, justify: 'flex-end' },
				createElement(
					Button,
					{ variant: 'tertiary', size: 'compact', onClick: onCancel, autoFocus: true },
					__( 'Cancel', 'jetpack-connection' )
				),
				createElement(
					Button,
					{
						variant: 'primary',
						isDestructive: true,
						size: 'compact',
						onClick: onConfirm,
					},
					__( 'Disconnect', 'jetpack-connection' )
				)
			)
		)
	);
}

/**
 * Modal hosting the ownership transfer flow.
 *
 * The shared component carries the choose → confirm → done flow and its own actions, so the
 * card supplies only the modal, its heading and the way out.
 *
 * @param {object}   props               - Component props.
 * @param {Function} props.onClose       - Called when the modal is dismissed.
 * @param {Function} props.onTransferred - Called once WordPress.com has accepted the new owner.
 * @return {object} React element.
 */
function TransferOwnershipModal( { onClose, onTransferred } ) {
	const [ isTransferring, setIsTransferring ] = useState( false );
	const { trackingContext } = useTracking( useCardConnection() );

	return createElement(
		Modal,
		{
			title: __( 'Transfer connection ownership', 'jetpack-connection' ),
			onRequestClose: onClose,
			size: 'small',
			className: 'jetpack-connector__transfer-modal',
			focusOnMount: 'firstElement',
			// A transfer cannot be undone halfway, so every way out is held shut while it runs.
			isDismissible: ! isTransferring,
			shouldCloseOnClickOutside: ! isTransferring,
			shouldCloseOnEsc: ! isTransferring,
		},
		createElement( TransferConnectionOwnership, {
			apiRoot,
			apiNonce,
			onBusyChange: setIsTransferring,
			onTransferred,
			trackingContext,
		} )
	);
}

/**
 * Read-only modal showing blog ID, site URL, home URL, and SSO status.
 *
 * @param {object}   props         - Component props.
 * @param {Function} props.onClose - Called when the modal is dismissed.
 * @return {object} React element.
 */
function SiteDetailsModal( { onClose } ) {
	const { blogId } = useCardConnection();
	const row = ( label, value ) => [
		createElement(
			Text,
			{ key: label, variant: 'muted', size: 12, className: 'jetpack-connector__details-label' },
			label
		),
		createElement(
			Text,
			{ key: label + '-value', size: 13, className: 'jetpack-connector__details-value' },
			value
		),
	];

	return createElement(
		Modal,
		{
			className: 'jetpack-connector__modal',
			title: __( 'Connection details', 'jetpack-connection' ),
			onRequestClose: onClose,
			size: 'small',
			focusOnMount: 'firstElement',
		},
		createElement(
			'div',
			{ className: 'jetpack-connector__details-modal' },
			...row( __( 'Blog ID', 'jetpack-connection' ), String( blogId ?? '' ) ),
			...row( __( 'Site URL', 'jetpack-connection' ), siteDetails.siteUrl ),
			...row( __( 'Home URL', 'jetpack-connection' ), siteDetails.homeUrl ),
			...( ssoStatus !== null
				? row(
						__( 'WordPress.com login (SSO)', 'jetpack-connection' ),
						ssoStatus
							? __( 'Enabled', 'jetpack-connection' )
							: __(
									'Not enabled',
									'jetpack-connection',
									/* dummy arg to avoid bad minification */ 0
								)
					)
				: [] )
		)
	);
}

/* ── Identity crisis (Safe Mode) panel ──────────────────────────── */

/**
 * POST to an identity-crisis REST endpoint.
 *
 * @param {string} action - Endpoint suffix (e.g. 'migrate', 'start-fresh', 'confirm-safe-mode').
 * @param {object} [body] - Optional JSON body.
 * @return {Promise<object|string>} Parsed JSON response.
 */
async function postIdcAction( action, body = null ) {
	return apiRequest( 'jetpack/v4/identity-crisis/' + action, { method: 'POST', body } );
}

/**
 * A single identity-crisis resolution option (title, description, action button).
 *
 * @param {object}   props             - Component props.
 * @param {string}   props.title       - Option heading.
 * @param {object}   props.description - Body element/text describing the option.
 * @param {string}   props.buttonLabel - Action button label.
 * @param {string}   props.busyLabel   - Action button label while busy.
 * @param {boolean}  props.isBusy      - Whether this action is in progress.
 * @param {boolean}  props.disabled    - Whether the button is disabled.
 * @param {Function} props.onClick     - Action callback.
 * @param {boolean}  props.isPrimary   - Whether to render a primary (vs secondary) button.
 * @return {object} React element.
 */
function IDCOption( {
	title,
	description,
	buttonLabel,
	busyLabel,
	isBusy,
	disabled,
	onClick,
	isPrimary,
} ) {
	return createElement(
		VStack,
		{ spacing: 2, className: 'jetpack-connector__idc-option' },
		createElement( Text, { weight: 600, size: 13 }, title ),
		createElement( Text, { variant: 'muted', size: 12 }, description ),
		createElement(
			Button,
			{
				variant: isPrimary ? 'primary' : 'secondary',
				size: 'compact',
				isBusy,
				disabled,
				onClick,
				className: 'jetpack-connector__inline-action',
			},
			isBusy ? busyLabel : buttonLabel
		)
	);
}

/**
 * Identity crisis (Safe Mode) resolution panel.
 *
 * Replaces the standard expanded details when the site URL recorded with
 * WordPress.com no longer matches the current site URL. Offers the same
 * resolutions as the standard Jetpack IDC screen (migrate the connection,
 * create a fresh connection, stay in Safe Mode) via the identity-crisis REST
 * endpoints, and adds a Disconnect site option.
 *
 * @return {object} React element.
 */
function IDCPanel() {
	const [ busyAction, setBusyAction ] = useState( null );
	const [ isMigrated, setIsMigrated ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ pendingConfirm, setPendingConfirm ] = useState( null );
	const [ showWhy, setShowWhy ] = useState( false );
	const { hasJetpackPlugin, subjectNoun, isOfflineMode, viewerConnectionType } =
		useCardConnection();
	const { track, trackingContext } = useTracking( { isOfflineMode, viewerConnectionType } );
	// Also bumps the `jetpack-idc` MC stat the Identity Crisis screen bumps, when the site allows tracking.
	const trackIdc = ( event, stat ) => {
		track( event, idcTrackingProps );
		if ( stat && trackingContext && idc?.bumpStats && typeof bumpConnectionStat === 'function' ) {
			bumpConnectionStat( 'jetpack-idc', stat );
		}
	};

	const handleMigrate = async () => {
		trackIdc( 'jetpack_idc_migrate', 'migrate' );
		setBusyAction( 'migrate' );
		setError( null );
		try {
			await postIdcAction( 'migrate' );
			setIsMigrated( true );
		} catch ( err ) {
			setError(
				err?.message ||
					sprintf(
						// translators: %s: "site" or "store".
						__( 'Failed to update the %s address. Please try again.', 'jetpack-connection' ),
						subjectNoun
					)
			);
		} finally {
			setBusyAction( null );
		}
	};

	const handleStartFresh = async () => {
		trackIdc( 'jetpack_idc_start_fresh', 'start-fresh' );
		setBusyAction( 'start-fresh' );
		setError( null );
		try {
			const body = redirectUri ? { redirect_uri: redirectUri } : null;
			const result = await postIdcAction( 'start-fresh', body );
			const url = typeof result === 'string' ? result : result?.authorizeUrl || result?.url;
			if ( typeof url !== 'string' || ! url ) {
				throw new Error( __( 'No connection URL received.', 'jetpack-connection' ) );
			}
			window.location.href = decorateAuthUrl( url );
		} catch ( err ) {
			setError(
				err?.message ||
					__( 'Failed to create a fresh connection. Please try again.', 'jetpack-connection' )
			);
			setBusyAction( null );
		}
	};

	const handleStaySafe = async () => {
		trackIdc( 'jetpack_idc_confirm_safe_mode', 'confirm-safe-mode' );
		setBusyAction( 'safe-mode' );
		setError( null );
		try {
			await postIdcAction( 'confirm-safe-mode' );
			window.location.reload();
		} catch ( err ) {
			setError(
				err?.message || __( 'Failed to confirm Safe Mode. Please try again.', 'jetpack-connection' )
			);
			setBusyAction( null );
		}
	};

	const executeDisconnect = async () => {
		trackIdc( 'jetpack_idc_disconnect_site' );
		setPendingConfirm( null );
		setBusyAction( 'disconnect' );
		setError( null );
		try {
			await disconnectSite(
				sprintf(
					// translators: %s: "site" or "store".
					__( 'Failed to disconnect the %s. Please try again.', 'jetpack-connection' ),
					subjectNoun
				)
			);
			window.location.reload();
		} catch ( err ) {
			setError( err.message );
			setBusyAction( null );
		}
	};

	const handleDisconnect = () => {
		track( CONNECTION_EVENTS?.cardActionClick, { action: 'safe_mode_disconnect_site' } );
		setPendingConfirm( {
			title: sprintf(
				// translators: %s: "site" or "store".
				__( 'Disconnect this %s', 'jetpack-connection' ),
				subjectNoun
			),
			message: sprintf(
				// translators: %1$s: "site" or "store".
				__(
					'This clears the stale connection that triggered Safe Mode, so this %1$s stops being mistaken for another. Only this %1$s is affected — the original %1$s keeps its registration and data.',
					'jetpack-connection'
				),
				subjectNoun
			),
			onConfirm: executeDisconnect,
		} );
	};

	if ( isMigrated ) {
		return createElement(
			VStack,
			{ spacing: 4, className: 'jetpack-connector__idc-panel' },
			createElement(
				Text,
				{ weight: 600, size: 14 },
				__( 'Address updated', 'jetpack-connection' )
			),
			createElement(
				Text,
				{ variant: 'muted', size: 13 },
				sprintf(
					// translators: %s: "site" or "store".
					__( 'WordPress.com now recognizes this %s at its new address.', 'jetpack-connection' ),
					subjectNoun
				)
			),
			createElement(
				Button,
				{
					variant: 'primary',
					size: 'compact',
					onClick: () => window.location.reload(),
					className: 'jetpack-connector__inline-action',
				},
				__( 'Got it, thanks', 'jetpack-connection' )
			)
		);
	}

	const currentUrl = idc?.currentUrl || ( siteDetails ? siteDetails.homeUrl : '' );
	const wpcomUrl = idc?.wpcomHomeUrl || '';
	const isDevelopmentSite = Boolean( idc?.isDevelopmentSite );
	const possibleDynamicSiteUrl = Boolean( idc?.possibleDynamicSiteUrlDetected );

	// Build a fresh <strong> element for a URL on each call so the same React
	// element is never reused across parents.
	const urlEl = ( url, fallback ) =>
		url
			? createElement( 'strong', { title: url }, url )
			: createElement( 'strong', null, fallback );

	const introText = hasJetpackPlugin
		? // translators: %s: "site" or "store".
			__(
				'This %s is registered with WordPress.com at <wpcom />, but now loads at <current />. Features that sync with WordPress.com — like Stats and Backups — are paused in Safe Mode until you resolve this.',
				'jetpack-connection'
			)
		: // translators: %s: "site" or "store".
			__(
				'This %s is registered with WordPress.com at <wpcom />, but now loads at <current />. Features that sync with WordPress.com are paused in Safe Mode until you resolve this.',
				'jetpack-connection',
				/* dummy arg to avoid bad minification */ 0
			);

	const intro = createInterpolateElement( sprintf( introText, subjectNoun ), {
		wpcom: urlEl( wpcomUrl, __( 'its original address', 'jetpack-connection' ) ),
		current: urlEl( currentUrl, __( 'this address', 'jetpack-connection' ) ),
	} );

	const whyExplanation = createElement(
		VStack,
		{ spacing: 2, className: 'jetpack-connector__idc-why' },
		createElement(
			Text,
			{ size: 12, variant: 'muted' },
			__( 'This can happen when:', 'jetpack-connection' )
		),
		createElement(
			'ul',
			{ className: 'jetpack-connector__idc-why-list' },
			createElement(
				'li',
				null,
				sprintf(
					// translators: %s: "site" or "store".
					__( "You changed your %s's address.", 'jetpack-connection' ),
					subjectNoun
				)
			),
			createElement(
				'li',
				null,
				sprintf(
					// translators: %s: "site" or "store".
					__( 'Your %s is reachable at more than one address.', 'jetpack-connection' ),
					subjectNoun
				)
			),
			createElement(
				'li',
				null,
				__(
					'You restored or copied a database from another site that was already registered with WordPress.com.',
					'jetpack-connection'
				)
			)
		)
	);

	const migrateOption = createElement( IDCOption, {
		key: 'migrate',
		title: sprintf(
			// translators: %s: "site" or "store".
			__( 'Same %s, new address', 'jetpack-connection' ),
			subjectNoun
		),
		description: __(
			'Update the address WordPress.com has on file. Your connection, history, and data stay the same.',
			'jetpack-connection'
		),
		buttonLabel: __( 'Update address', 'jetpack-connection' ),
		busyLabel: __( 'Updating…', 'jetpack-connection' ),
		isBusy: busyAction === 'migrate',
		disabled: Boolean( busyAction ),
		onClick: handleMigrate,
		isPrimary: true,
	} );

	const freshOption = createElement( IDCOption, {
		key: 'fresh',
		title: sprintf(
			// translators: %s: "site" or "store".
			__( 'A different %s', 'jetpack-connection' ),
			subjectNoun
		),
		description: sprintf(
			// translators: %1$s: "site" or "store" (repeated).
			__(
				'This is a different %1$s from the one registered with WordPress.com. Give it its own connection — restoring its previous one if it had it, or starting fresh. The original %1$s is unaffected.',
				'jetpack-connection'
			),
			subjectNoun
		),
		buttonLabel: __( 'Connect separately', 'jetpack-connection' ),
		busyLabel: __( 'Connecting…', 'jetpack-connection' ),
		isBusy: busyAction === 'start-fresh',
		disabled: Boolean( busyAction ),
		onClick: handleStartFresh,
		isPrimary: true,
	} );

	// Development/staging sites are most often intentional clones, so migrating
	// (which would reassign the production site's ID and data to this copy) is
	// not offered — only a fresh connection, matching the Jetpack IDC screen
	// (ScreenMain in @automattic/jetpack-idc).
	const options = isDevelopmentSite ? [ freshOption ] : [ migrateOption, freshOption ];

	return createElement(
		VStack,
		{ spacing: 5, className: 'jetpack-connector__idc-panel' },
		createElement(
			Text,
			{ weight: 600, size: 14 },
			sprintf(
				// translators: %s: "site" or "store".
				__( 'Your %s address has changed', 'jetpack-connection' ),
				subjectNoun
			)
		),
		createElement( Text, { size: 13 }, intro ),
		// Collapsible "Show more details?" explanation keeps the panel compact
		// while making the likely causes available to anyone who wants them.
		createElement(
			Button,
			{
				variant: 'link',
				onClick: () => setShowWhy( value => ! value ),
				'aria-expanded': showWhy,
				'aria-controls': 'jetpack-connector-idc-why',
				className: 'jetpack-connector__idc-why-toggle',
			},
			__( 'Show more details?', 'jetpack-connection' )
		),
		// Wrap in a plain element so the `hidden` attribute actually hides the
		// region: VStack renders `display: flex`, which would override `hidden`.
		// The wrapper stays in the DOM so the toggle's aria-controls is always valid.
		createElement( 'div', { id: 'jetpack-connector-idc-why', hidden: ! showWhy }, whyExplanation ),
		// A dynamic site URL in wp-config.php can keep re-triggering Safe Mode,
		// so resolving the crisis won't stick until it's made static.
		possibleDynamicSiteUrl
			? createElement(
					Notice,
					{
						status: 'warning',
						isDismissible: false,
						className: 'jetpack-connector__notice',
					},
					createInterpolateElement(
						__(
							'Your <code>wp-config.php</code> may set the site URL dynamically, which can keep re-triggering Safe Mode. <link>Learn how to set a static site URL.</link>',
							'jetpack-connection'
						),
						{
							code: createElement( 'code' ),
							link: createElement( 'a', {
								href: 'https://jetpack.com/redirect/?source=jetpack-idcscreen-dynamic-site-urls',
								target: '_blank',
								rel: 'noopener noreferrer',
							} ),
						}
					)
				)
			: null,
		error
			? createElement( ErrorNotice, { message: error, onDismiss: () => setError( null ) } )
			: null,
		createElement(
			Text,
			{ weight: 600, size: 14, className: 'jetpack-connector__idc-choose' },
			__( 'Choose the option below that matches your situation', 'jetpack-connection' )
		),
		createElement(
			HStack,
			{ spacing: 4, alignment: 'top', className: 'jetpack-connector__idc-options' },
			...options
		),
		createElement( 'hr', { className: 'jetpack-connector__divider' } ),
		createElement(
			HStack,
			{ spacing: 3, alignment: 'center', className: 'jetpack-connector__idc-footer' },
			isSafeModeConfirmed
				? createElement(
						Text,
						{ variant: 'muted', size: 12 },
						__(
							'In Safe Mode. Features stay paused until you choose an option above.',
							'jetpack-connection'
						)
					)
				: createElement(
						'span',
						{ className: 'jetpack-connector__idc-safe-mode-group' },
						createElement(
							Button,
							{
								// No isBusy here: the striped "busy" background looks
								// odd on a link-style button, so the "Saving…" label
								// plus the disabled state convey progress instead.
								variant: 'link',
								disabled: Boolean( busyAction ),
								onClick: handleStaySafe,
								className: 'jetpack-connector__idc-safe-mode-link',
							},
							busyAction === 'safe-mode'
								? __( 'Saving…', 'jetpack-connection' )
								: __(
										'Not sure? Stay in Safe Mode',
										'jetpack-connection',
										/* dummy arg to avoid bad minification */ 0
									)
						),
						createElement(
							Text,
							{ variant: 'muted', size: 13 },
							createInterpolateElement( __( 'or <link>learn more</link>', 'jetpack-connection' ), {
								link: createElement( 'a', {
									href: 'https://jetpack.com/redirect/?source=jetpack-support-safe-mode',
									target: '_blank',
									rel: 'noopener noreferrer',
								} ),
							} )
						)
					),
			isManagedPlatformSite
				? null
				: createElement(
						Button,
						{
							variant: 'secondary',
							isDestructive: true,
							size: 'compact',
							isBusy: busyAction === 'disconnect',
							disabled: Boolean( busyAction ),
							onClick: handleDisconnect,
							className: 'jetpack-connector__disconnect-site',
						},
						__( 'Disconnect site', 'jetpack-connection' )
					)
		),
		pendingConfirm
			? createElement( ConfirmationModal, {
					title: pendingConfirm.title,
					message: pendingConfirm.message,
					onConfirm: pendingConfirm.onConfirm,
					onCancel: () => setPendingConfirm( null ),
				} )
			: null
	);
}

/* ── Expanded details panel ─────────────────────────────────────── */

/**
 * Expanded content shown when the user clicks "Details".
 *
 * @param {object}   props                       - Component props.
 * @param {boolean}  props.isConnecting          - Whether a user connection is in progress.
 * @param {Function} props.onConnect             - Callback to start user authorization flow.
 * @param {object}   props.connectionErrorNotice - The card's useConnectionErrorNotice() result, or null offline.
 * @return {object} React element.
 */
function ExpandedDetails( {
	isConnecting = false,
	onConnect = null,
	connectionErrorNotice = null,
} ) {
	const {
		viewer,
		owner,
		ownerIsViewer,
		isOwnerConnectionBroken,
		isOfflineMode,
		tracksIdentity,
		connectedPlugins,
		viewerConnectionType,
	} = useCardConnection();
	const [ isDisconnectUserOpen, setIsDisconnectUserOpen ] = useState( false );
	const [ showDetailsModal, setShowDetailsModal ] = useState( false );
	const [ isTransferOpen, setIsTransferOpen ] = useState( false );
	const [ isDisconnectDialogOpen, setIsDisconnectDialogOpen ] = useState( false );
	const [ pendingConfirm, setPendingConfirm ] = useState( null );
	const [ actionError, setActionError ] = useState( null );
	const { track } = useTracking( { isOfflineMode, viewerConnectionType } );
	const detailsLinkRef = useRef( null );
	const transferOwnershipRef = useRef( null );
	const transferredRef = useRef( false );
	const confirmTriggerRef = useRef( null );
	const disconnectSiteRef = useRef( null );
	const disconnectAccountRef = useRef( null );

	const isErrorBannerShown = Boolean( connectionErrorNotice?.hasConnectionError );
	const sections = getAccountSections( {
		viewer,
		owner,
		ownerIsViewer,
		isOwnerConnectionBroken,
		canConnect: Boolean( onConnect ),
		isErrorBannerShown,
		isProtectedOwnerPending: protectedOwnerIsPending(),
	} );

	return createElement(
		VStack,
		{ spacing: 5 },

		// Offline mode notice (connecting/disconnecting disabled).
		isOfflineMode ? createElement( OfflineNotice ) : null,

		isErrorBannerShown
			? createElement( ConnectionErrorView, { notice: connectionErrorNotice } )
			: null,

		// Current user info + unlink action (only when the viewing admin is linked).
		viewer
			? createElement( UserSection, {
					title: connectedAccountTitle( viewer ),
					user: viewer,
					// This row stands in for the connection-owner row when the viewer is the
					// owner, so it carries the shield the other row would have shown.
					showShield: viewer.isOwner && protectedOwnerIsEstablished(),
					actionSlot:
						isManagedPlatformSite && viewer.isOwner
							? null
							: createElement(
									// The links right-align themselves; an alignment prop here would fight the mobile reset.
									VStack,
									{ spacing: 1 },
									viewer.isOwner
										? createElement(
												Button,
												{
													ref: transferOwnershipRef,
													variant: 'link',
													className: 'jetpack-connector__inline-action',
													disabled: isOfflineMode,
													onClick: () => {
														track( CONNECTION_EVENTS?.cardActionClick, {
															action: 'transfer_ownership',
														} );
														setIsTransferOpen( true );
													},
												},
												__( 'Transfer ownership', 'jetpack-connection' )
											)
										: null,
									createElement(
										Button,
										{
											ref: disconnectAccountRef,
											variant: 'link',
											isDestructive: true,
											disabled: isOfflineMode,
											onClick: () => {
												track( CONNECTION_EVENTS?.cardActionClick, {
													action: 'disconnect_account',
												} );
												setIsDisconnectUserOpen( true );
											},
											className: 'jetpack-connector__inline-action',
										},
										__( 'Disconnect account', 'jetpack-connection' )
									)
								),
				} )
			: null,

		// Release link, directly under the confirmed owner's own account row.
		canReleaseProtectedOwner( viewer ) ? createElement( ReleaseOwnershipSection ) : null,

		// Connect prompt (only when the viewing admin is NOT linked).
		sections.connectPrompt
			? createElement( ConnectPrompt, {
					onConnect,
					isConnecting,
				} )
			: null,

		// Unconfirmed owner row, in place of the connection-owner row while a protected owner is pending.
		sections.unconfirmedOwnerRow
			? createElement( UserSection, {
					title: __( 'Connection owner — unconfirmed', 'jetpack-connection' ),
					user: owner,
					subtitle: false,
				} )
			: null,

		protectedOwnerSlotKind() ? createElement( ProtectedOwnerSection ) : null,

		// Connection owner, once a protected owner is established or was never requested.
		sections.ownerRow
			? createElement( UserSection, {
					title: __( 'Connection owner', 'jetpack-connection' ),
					user: owner,
					subtitle: false,
					showShield: protectedOwnerIsEstablished(),
				} )
			: null,

		createElement( ConnectedPluginsSection ),

		actionError
			? createElement( ErrorNotice, {
					message: actionError,
					onDismiss: () => setActionError( null ),
				} )
			: null,

		// Footer: connection details and connected users links + disconnect site button.
		createElement( 'hr', { className: 'jetpack-connector__divider' } ),
		createElement(
			HStack,
			{ spacing: 3, alignment: 'center', wrap: true },
			// Grouped so the links stay together on one side, leaving the HStack's
			// space-between to separate them from the destructive action.
			createElement(
				HStack,
				{ spacing: 4, expanded: false, alignment: 'center', justify: 'flex-start' },
				siteDetails
					? createElement(
							Button,
							{
								ref: detailsLinkRef,
								variant: 'link',
								onClick: e => {
									e.currentTarget.blur();
									track( CONNECTION_EVENTS?.cardActionClick, { action: 'details_modal' } );
									setShowDetailsModal( true );
								},
								className: 'jetpack-connector__details-link',
							},
							__( 'Connection details', 'jetpack-connection' )
						)
					: null,
				connectedUsersUrl
					? createElement(
							Button,
							{
								variant: 'link',
								href: connectedUsersUrl,
								onClick: () =>
									track( CONNECTION_EVENTS?.cardActionClick, { action: 'connected_users' } ),
								className: 'jetpack-connector__connected-users-link',
							},
							__( 'Connected users', 'jetpack-connection' )
						)
					: null
			),
			isManagedPlatformSite
				? null
				: createElement(
						Button,
						{
							ref: disconnectSiteRef,
							variant: 'secondary',
							isDestructive: true,
							size: 'compact',
							disabled: isOfflineMode,
							onClick: () => {
								track( CONNECTION_EVENTS?.cardActionClick, { action: 'disconnect_site' } );
								setIsDisconnectDialogOpen( true );
							},
							className: 'jetpack-connector__disconnect-site',
						},
						__( 'Disconnect site', 'jetpack-connection' )
					)
		),

		// Modals (rendered but visually hidden until triggered).
		showDetailsModal && siteDetails
			? createElement( SiteDetailsModal, {
					onClose: () => {
						setShowDetailsModal( false );
						focusWhenReady( detailsLinkRef.current );
					},
				} )
			: null,
		pendingConfirm
			? createElement( ConfirmationModal, {
					title: pendingConfirm.title,
					message: pendingConfirm.message,
					onConfirm: pendingConfirm.onConfirm,
					onCancel: () => {
						setPendingConfirm( null );
						focusWhenReady( confirmTriggerRef.current );
					},
				} )
			: null,
		// Mounted only while open, so a reopened dialog starts again at its first step.
		isDisconnectDialogOpen
			? createElement( DisconnectDialog, {
					apiRoot,
					apiNonce,
					connectedPlugins,
					// No connectedSiteId: without it the dialog skips the disconnect survey.
					connectedUser: tracksIdentity,
					context: TRACKING_CONTEXT,
					isOpen: true,
					// The dialog disconnects on its first step; the reload waits for its closing steps.
					onDisconnected: () => window.location.reload(),
					onClose: () => {
						setIsDisconnectDialogOpen( false );
						focusWhenReady( disconnectSiteRef.current );
					},
				} )
			: null,
		isDisconnectUserOpen
			? createElement( DisconnectUserDialog, {
					isOpen: true,
					apiRoot,
					apiNonce,
					context: TRACKING_CONTEXT,
					// The unlink already recorded itself in the store, which a non-owner's row reads
					// from. Otherwise card-only data such as protectedOwner changed too, so reload.
					onUnlinked: () => {
						if ( viewer?.isOwner || protectedOwner ) {
							window.location.reload();
							return;
						}
						setIsDisconnectUserOpen( false );
					},
					onClose: () => {
						setIsDisconnectUserOpen( false );
						focusWhenReady( disconnectAccountRef.current );
					},
					onTransferOwnership: () => {
						setIsDisconnectUserOpen( false );
						setIsTransferOpen( true );
					},
				} )
			: null,
		isTransferOpen
			? createElement( TransferOwnershipModal, {
					onTransferred: () => {
						transferredRef.current = true;
					},
					// Reloads for card-only data, held until the done step has been read.
					onClose: () => {
						setIsTransferOpen( false );

						if ( transferredRef.current ) {
							window.location.reload();
							return;
						}

						focusWhenReady( transferOwnershipRef.current );
					},
				} )
			: null
	);
}

/* ── Main card component ────────────────────────────────────────── */

/**
 * Render callback for the Jetpack connector card.
 *
 * Props vary between WordPress core (name, description, logo)
 * and the Gutenberg plugin (label, description, icon).
 *
 * @param {object} props             - Connector render props.
 * @param {string} props.name        - Connector name (core).
 * @param {string} props.label       - Connector label (Gutenberg).
 * @param {string} props.description - Connector description.
 * @param {object} props.logo        - Logo element (core).
 * @param {object} props.icon        - Icon element (Gutenberg).
 * @return {object} React element.
 */
function JetpackConnectorCard( { name, label, description, logo, icon } ) {
	const connectorName = name || label;
	const connectorLogo = logo || icon || CONNECTOR_LOGO;
	const [ isExpanded, setIsExpanded ] = useState( isLinkedTo );
	const {
		isConnected,
		isRegistered: isSiteRegistered,
		isOfflineMode,
		isFirstConnection,
		isInSafeMode,
		isOwnerConnectionBroken,
		viewer,
		currentUser,
		tracksIdentity,
		viewerConnectionType,
	} = useCardConnection();
	const { track } = useTracking( { isOfflineMode, viewerConnectionType } );
	const [ isConnecting, setIsConnecting ] = useState( false );
	// Identify the viewer once here, so every dialog the card opens records events under them.
	useEffect( () => {
		initializeTracksIdentity( currentUser );
		// eslint-disable-next-line react-hooks/exhaustive-deps -- re-identify only when the identity changes.
	}, [ tracksIdentity.ID, tracksIdentity.login ] );
	const [ connectError, setConnectError ] = useState(
		data.authError ? { message: data.authError, detail: null } : null
	);
	const errorNotice = useConnectionErrorNotice( {
		trackingContext: TRACKING_CONTEXT,
		reconnectRedirectUrl: connectorsUrl,
		reconnectFrom: 'jetpack-connector',
	} );
	// Hidden in offline mode, where the card disables connection actions.
	const connectionErrorNotice = isOfflineMode ? null : errorNotice;
	const connectionErrorSeverity = connectionErrorNotice?.severity ?? null;

	// The denominator for every other event: once per page load, however often the card re-renders.
	const hasTrackedView = useRef( false );
	useEffect( () => {
		if ( hasTrackedView.current || isOfflineMode ) {
			return;
		}
		hasTrackedView.current = true;
		track( CONNECTION_EVENTS?.cardView );
		// Deliberately once: later changes to these values are not new views.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
	// Reset "Connecting…" state when the page is restored from bfcache
	// (e.g. user hits Back after being redirected to the auth page).
	useEffect( () => {
		const onPageShow = e => {
			if ( e.persisted ) {
				setIsConnecting( false );
			}
		};
		window.addEventListener( 'pageshow', onPageShow );
		return () => window.removeEventListener( 'pageshow', onPageShow );
	}, [] );

	const handleConnect = async () => {
		if ( isOfflineMode ) {
			return;
		}
		track( CONNECTION_EVENTS?.cardActionClick, {
			action: isSiteRegistered ? 'connect_authorize' : 'connect_register',
		} );
		setIsConnecting( true );
		setConnectError( null );

		try {
			await startConnectionFlow( isSiteRegistered );
		} catch ( err ) {
			setConnectError(
				getConnectErrorDisplay(
					err,
					getRegistrationErrorDisplay,
					__( 'An error occurred. Please try again.', 'jetpack-connection' )
				)
			);
			setIsConnecting( false );
		}
	};

	// Named once: the button uses it, and the consent notice below names the button.
	const connectLabel = __(
		'Connect',
		'jetpack-connection',
		/* dummy arg to avoid bad minification */ 0
	);
	let actionArea;
	let expandedContent = null;

	if ( isConnected || isSiteRegistered ) {
		// Site is registered with WordPress.com (with or without a connected owner).
		let badgeProps;
		if ( isInSafeMode ) {
			// Identity crisis: the recorded site URL no longer matches WordPress.com.
			badgeProps = {
				label: __( 'Safe Mode', 'jetpack-connection' ),
				modifier: 'safe-mode',
			};
		} else if ( 'error' === connectionErrorSeverity ) {
			badgeProps = {
				label: __( 'Connection error', 'jetpack-connection' ),
				modifier: 'error',
			};
		} else if ( 'warning' === connectionErrorSeverity || isOwnerConnectionBroken ) {
			// 'warning' means only the owner can fix it. A broken owner can also have no verified error yet.
			badgeProps = {
				label: __( 'Needs attention', 'jetpack-connection' ),
				modifier: 'warning',
			};
		} else if ( isConnected ) {
			badgeProps = { label: __( 'Connected', 'jetpack-connection' ) };
		} else {
			badgeProps = {
				label: __( 'Site registered', 'jetpack-connection' ),
				modifier: 'site-registered',
			};
		}

		// In Safe Mode the toggle becomes a primary "Resolve" call to action
		// that surfaces the identity-crisis options. Once expanded it reverts to
		// a neutral "Close".
		const toggleProps = {
			variant: 'secondary',
			size: 'compact',
			onClick: () => {
				if ( ! isExpanded ) {
					track( CONNECTION_EVENTS?.cardActionClick, { action: 'details_open' } );
				}
				setIsExpanded( ! isExpanded );
			},
			'aria-expanded': isExpanded,
		};
		let toggleLabel = isExpanded
			? __( 'Close', 'jetpack-connection' )
			: __( 'Details', 'jetpack-connection', /* dummy arg to avoid bad minification */ 0 );
		if ( isInSafeMode && ! isExpanded ) {
			toggleProps.variant = 'primary';
			toggleLabel = __( 'Resolve', 'jetpack-connection' );
		}

		actionArea = createElement(
			HStack,
			{ spacing: 3, expanded: false },
			createElement( StatusBadge, badgeProps ),
			createElement( Button, toggleProps, toggleLabel )
		);

		if ( isExpanded ) {
			const needsUserConnection = ! viewer;
			expandedContent = createElement(
				'div',
				{ className: 'jetpack-connector__expanded' },
				// While in Safe Mode, the identity-crisis resolution options
				// replace the standard connection details.
				isInSafeMode
					? createElement( IDCPanel )
					: createElement( ExpandedDetails, {
							isConnecting: needsUserConnection ? isConnecting : false,
							onConnect: needsUserConnection ? handleConnect : null,
							connectionErrorNotice,
						} )
			);
		}
	} else {
		// Not connected at all — show a simple connect button.
		actionArea = createElement(
			Button,
			{
				variant: 'secondary',
				size: 'compact',
				onClick: handleConnect,
				isBusy: isConnecting,
				disabled: isConnecting || isOfflineMode,
			},
			isConnecting ? __( 'Connecting…', 'jetpack-connection' ) : connectLabel
		);
	}

	const showBadge = isConnected || isSiteRegistered;
	const styledDescription = showBadge
		? description
		: createElement( 'span', { className: 'jetpack-connector__description-padded' }, description );

	return createElement(
		ConnectorItem,
		{
			// ConnectorItem uses name/logo (core) or label/icon (Gutenberg).
			logo: connectorLogo,
			icon: connectorLogo,
			name: connectorName,
			label: connectorName,
			description: styledDescription,
			actionArea,
		},
		expandedContent,
		connectError
			? createElement( ErrorNotice, {
					message: connectError.message,
					detail: connectError.detail,
					onDismiss: () => setConnectError( null ),
				} )
			: null,
		isOfflineMode && ! isConnected && ! isSiteRegistered ? createElement( OfflineNotice ) : null,
		isFirstConnection && ! isOfflineMode && ! isConnected && ! isSiteRegistered
			? createElement( TermsOfService, {
					agreeButtonLabel: connectLabel,
					variant: 'body-sm',
					className: 'jetpack-connector__tos-notice',
				} )
			: null
	);
}

registerConnector( CONNECTOR_ID, {
	name: data.connectorName ?? 'Jetpack Connection',
	label: data.connectorName ?? 'Jetpack Connection',
	description:
		data.connectorDescription ??
		__(
			'Enhanced functionality for Jetpack and WooCommerce with WordPress.com cloud services.',
			'jetpack-connection'
		),
	logoUrl: data.connectorLogoUrl ?? '',
	render: JetpackConnectorCard,
} );
