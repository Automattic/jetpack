/**
 * Script module that registers a WordPress.com connector card on the
 * WP core Settings > Connectors page (WP 7.0+).
 *
 * Loaded via wp_enqueue_script_module() with `@wordpress/connectors`
 * as a static dependency. Uses classic-script globals for element,
 * i18n, and components which are always loaded on admin pages.
 *
 * Name, description, and logo are provided by the PHP registration
 * in register_connector() and merged automatically by the store.
 * This module adds the render function and passes connection-specific
 * data (owner, plugins, disconnect) via script module data.
 *
 * The render prop naming differs between WP core (name, logo) and
 * the Gutenberg plugin (label, icon), so the card accepts both.
 *
 * @see Wpcom_Connector::enqueue_script_module()
 */

// eslint-disable-next-line import/no-unresolved -- resolved via WP import map at runtime.
const connectors = await import( '@wordpress/connectors' );
const registerConnector =
	connectors.__experimentalRegisterConnector || connectors.registerConnector;
const ConnectorItem = connectors.__experimentalConnectorItem || connectors.ConnectorItem;

const { createElement, useState, useRef } = window.wp.element;
const { __ } = window.wp.i18n;
const { Button, Modal } = window.wp.components;
const HStack = window.wp.components.__experimentalHStack || window.wp.components.HStack;
const VStack = window.wp.components.__experimentalVStack || window.wp.components.VStack;
const Text = window.wp.components.__experimentalText || window.wp.components.Text;

const MODULE_ID = '@automattic/jetpack-connection-connectors';
const dataEl = document.getElementById( `wp-script-module-data-${ MODULE_ID }` );
const data = JSON.parse( dataEl?.textContent ?? '{}' );

const initialIsConnected = Boolean( data.isConnected );
const initialIsRegistered = Boolean( data.isRegistered );
const apiRoot = data.apiRoot || '';
const apiNonce = data.apiNonce || '';
const redirectUri = data.redirectUri || '';
const currentUser = data.currentUser || null;
const connectionOwner = data.connectionOwner || null;
const connectedPlugins = data.connectedPlugins || [];
const siteDetails = data.siteDetails || null;
const isWoaSite = Boolean( data.isWoaSite );
const isVipSite = Boolean( data.isVipSite );
const isManagedPlatformSite = isWoaSite || isVipSite;
const CONNECTOR_LOGO = data.connectorLogoUrl
	? createElement( 'img', { src: data.connectorLogoUrl, alt: '', width: 36, height: 36 } )
	: null;
const ssoStatus = data.ssoStatus ?? null;

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
		const qs = params.toString();
		const authRes = await window.fetch(
			apiRoot + 'jetpack/v4/connection/authorize_url' + ( qs ? '?' + qs : '' ),
			{ headers: { 'X-WP-Nonce': apiNonce } }
		);
		if ( ! authRes.ok ) {
			const errBody = await authRes.json().catch( () => null );
			throw new Error(
				errBody?.message || __( 'Failed to retrieve authorization URL.', 'jetpack-connection' )
			);
		}
		const authData = await authRes.json();
		const authorizeUrl = authData?.authorizeUrl || authData;
		if ( typeof authorizeUrl !== 'string' || ! authorizeUrl ) {
			throw new Error( 'No authorization URL received' );
		}
		window.location.href = addSkipPricing( authorizeUrl );
		return;
	}

	const body = { from: 'wpcom-connector' };
	if ( redirectUri ) {
		body.redirect_uri = redirectUri;
	}

	const response = await window.fetch( apiRoot + 'jetpack/v4/connection/register', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce': apiNonce,
		},
		body: JSON.stringify( body ),
	} );

	if ( ! response.ok ) {
		const errBody = await response.json().catch( () => null );
		throw new Error( errBody?.message || __( 'Site registration failed.', 'jetpack-connection' ) );
	}

	const result = await response.json();

	if ( ! result.authorizeUrl ) {
		throw new Error( 'No authorization URL received' );
	}

	window.location.href = addSkipPricing( result.authorizeUrl );
}

/**
 * Append skip_pricing to a Calypso authorize URL so that the post-auth
 * redirect honours redirect_after_auth instead of sending the user to
 * the Calypso plans page.
 *
 * TEMPORARY: Remove once Calypso recognises `from=wpcom-connector`
 * natively and redirects to redirectAfterAuth for this flow.
 *
 * @param {string} url - Calypso authorize URL.
 * @return {string} URL with skip_pricing appended.
 */
function addSkipPricing( url ) {
	try {
		const parsed = new URL( url );
		parsed.searchParams.set( 'skip_pricing', 'true' );
		return parsed.toString();
	} catch {
		return url;
	}
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
 * @param {string}        props.message   - Error message text.
 * @param {Function|null} props.onDismiss - Callback to clear the error; omit for non-dismissible.
 * @return {object} React element.
 */
function ErrorNotice( { message, onDismiss = null } ) {
	return createElement(
		HStack,
		{ spacing: 2, className: 'wpcom-connector__error', role: 'alert' },
		createElement( Text, { size: 13 }, message ),
		onDismiss
			? createElement(
					Button,
					{
						variant: 'link',
						size: 'small',
						onClick: onDismiss,
						'aria-label': __( 'Dismiss error', 'jetpack-connection' ),
					},
					__( 'Dismiss', 'jetpack-connection' )
			  )
			: null
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
	const cls = 'wpcom-connector__status-badge wpcom-connector__status-badge--' + modifier;
	return createElement( 'span', { className: cls }, label );
}

/**
 * A labelled user row with avatar, display name, and login.
 *
 * @param {object}      props            - Component props.
 * @param {string}      props.title      - Section heading (uppercase label).
 * @param {object|null} props.user       - User data object with displayName, login, avatar.
 * @param {string|null} props.subtitle   - Override for the default login/email line.
 * @param {object|null} props.actionSlot - Optional element rendered at the end of the user row.
 * @return {object|null} React element or null.
 */
function UserSection( { title, user, subtitle = null, actionSlot = null } ) {
	if ( ! user ) {
		return null;
	}

	const defaultSubtitle = user.email
		? '@' + user.login + ' (' + user.email + ')'
		: '@' + user.login;

	return createElement(
		VStack,
		{ spacing: 3, className: 'wpcom-connector__section' },
		createElement(
			Text,
			{
				variant: 'muted',
				size: 11,
				upperCase: true,
				weight: 500,
			},
			title
		),
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
							className: 'wpcom-connector__owner-avatar',
					  } )
					: null,
				createElement(
					VStack,
					{ spacing: 0 },
					createElement( Text, { weight: 600, size: 13 }, user.displayName ),
					createElement( Text, { variant: 'muted', size: 12 }, subtitle || defaultSubtitle )
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
	if ( ! connectedPlugins.length ) {
		return null;
	}

	return createElement(
		VStack,
		{ spacing: 3, className: 'wpcom-connector__section' },
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
								className: 'wpcom-connector__plugin-icon',
						  } )
						: createElement( 'span', {
								className:
									'dashicons dashicons-admin-plugins wpcom-connector__plugin-icon wpcom-connector__plugin-icon--fallback',
						  } ),
					createElement( Text, { size: 13 }, plugin.name )
				)
			)
		)
	);
}

/**
 * Prompt shown to admins whose user account is not yet linked.
 *
 * @param {object}   props                 - Component props.
 * @param {Function} props.onConnect       - Callback to start the authorization flow.
 * @param {boolean}  props.isConnecting    - Whether a connection attempt is in progress.
 * @param {boolean}  props.isDisconnecting - Whether a disconnect is in progress (disables button).
 * @return {object} React element.
 */
function ConnectPrompt( { onConnect, isConnecting, isDisconnecting } ) {
	return createElement(
		HStack,
		{ spacing: 3, className: 'wpcom-connector__section' },
		createElement(
			'div',
			{ className: 'wpcom-connector__connect-prompt-text' },
			createElement(
				Text,
				{ size: 13 },
				__(
					'Your site is registered with WordPress.com. Connect your user account to unlock full functionality.',
					'jetpack-connection'
				)
			)
		),
		createElement(
			Button,
			{
				variant: 'secondary',
				size: 'small',
				onClick: onConnect,
				isBusy: isConnecting,
				disabled: isConnecting || isDisconnecting,
				className: 'wpcom-connector__inline-action',
			},
			isConnecting
				? __( 'Connecting…', 'jetpack-connection' )
				: __( 'Connect account', 'jetpack-connection' )
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
			className: 'wpcom-connector__confirm-modal',
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
 * Read-only modal showing blog ID, site URL, home URL, and SSO status.
 *
 * @param {object}   props         - Component props.
 * @param {Function} props.onClose - Called when the modal is dismissed.
 * @return {object} React element.
 */
function SiteDetailsModal( { onClose } ) {
	const row = ( label, value ) => [
		createElement(
			Text,
			{ key: label, variant: 'muted', size: 12, className: 'wpcom-connector__details-label' },
			label
		),
		createElement(
			Text,
			{ key: label + '-value', size: 13, className: 'wpcom-connector__details-value' },
			value
		),
	];

	return createElement(
		Modal,
		{
			className: 'wpcom-connector__modal',
			title: __( 'Connection details', 'jetpack-connection' ),
			onRequestClose: onClose,
			size: 'small',
			focusOnMount: 'firstElement',
		},
		createElement(
			'div',
			{ className: 'wpcom-connector__details-modal' },
			...row( __( 'Blog ID', 'jetpack-connection' ), String( siteDetails.blogId ) ),
			...row( __( 'Site URL', 'jetpack-connection' ), siteDetails.siteUrl ),
			...row( __( 'Home URL', 'jetpack-connection' ), siteDetails.homeUrl ),
			...( ssoStatus !== null
				? row(
						__( 'WordPress.com login (SSO)', 'jetpack-connection' ),
						ssoStatus
							? __( 'Enabled', 'jetpack-connection' )
							: __( 'Not enabled', 'jetpack-connection' )
				  )
				: [] )
		)
	);
}

/* ── Expanded details panel ─────────────────────────────────────── */

/**
 * Expanded content shown when the user clicks "Details".
 *
 * @param {object}   props              - Component props.
 * @param {boolean}  props.isConnecting - Whether a user connection is in progress.
 * @param {Function} props.onConnect    - Callback to start user authorization flow.
 * @return {object} React element.
 */
function ExpandedDetails( { isConnecting = false, onConnect = null } ) {
	const [ isDisconnecting, setIsDisconnecting ] = useState( false );
	const [ isUnlinking, setIsUnlinking ] = useState( false );
	const [ showDetailsModal, setShowDetailsModal ] = useState( false );
	const [ pendingConfirm, setPendingConfirm ] = useState( null );
	const [ actionError, setActionError ] = useState( null );
	const detailsLinkRef = useRef( null );
	const confirmTriggerRef = useRef( null );
	const disconnectSiteRef = useRef( null );
	const disconnectAccountRef = useRef( null );

	const executeDisconnect = async () => {
		setPendingConfirm( null );
		setIsDisconnecting( true );
		setActionError( null );

		try {
			const response = await window.fetch( apiRoot + 'jetpack/v4/connection', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': apiNonce,
				},
				body: JSON.stringify( { isActive: false } ),
			} );

			if ( response.ok ) {
				window.location.reload();
				return;
			}

			const errBody = await response.json().catch( () => null );
			setActionError(
				errBody?.message ||
					__( 'Failed to disconnect the site. Please try again.', 'jetpack-connection' )
			);
		} catch {
			setActionError(
				__( 'Failed to disconnect the site. Please try again.', 'jetpack-connection' )
			);
		} finally {
			setIsDisconnecting( false );
		}
	};

	const handleDisconnect = () => {
		confirmTriggerRef.current = disconnectSiteRef.current;
		setPendingConfirm( {
			title: __( 'Disconnect site', 'jetpack-connection' ),
			message: __(
				'Are you sure you want to disconnect from WordPress.com? This will affect all plugins using this connection.',
				'jetpack-connection'
			),
			onConfirm: executeDisconnect,
		} );
	};

	const executeUnlinkUser = async () => {
		setPendingConfirm( null );
		setIsUnlinking( true );
		setActionError( null );

		try {
			const body = { linked: false, force: true };
			if ( currentUser?.isOwner ) {
				body[ 'disconnect-all-users' ] = true;
			}

			const response = await window.fetch( apiRoot + 'jetpack/v4/connection/user', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': apiNonce,
				},
				body: JSON.stringify( body ),
			} );

			if ( response.ok ) {
				window.location.reload();
				return;
			}

			const errBody = await response.json().catch( () => null );
			setActionError(
				errBody?.message ||
					__( 'Failed to disconnect the account. Please try again.', 'jetpack-connection' )
			);
		} catch {
			setActionError(
				__( 'Failed to disconnect the account. Please try again.', 'jetpack-connection' )
			);
		} finally {
			setIsUnlinking( false );
		}
	};

	const handleUnlinkUser = () => {
		confirmTriggerRef.current = disconnectAccountRef.current;
		const message =
			currentUser?.isOwner && currentUser?.hasOtherConnectedUsers
				? __(
						'Disconnecting the owner account will remove the WordPress.com account connection for all users on this site. The site will remain connected to WordPress.com.',
						'jetpack-connection'
				  )
				: __(
						'Are you sure you want to disconnect your WordPress.com account? The site will remain connected to WordPress.com.',
						'jetpack-connection'
				  );

		setPendingConfirm( {
			title: __( 'Disconnect user account', 'jetpack-connection' ),
			message,
			onConfirm: executeUnlinkUser,
		} );
	};

	return createElement(
		VStack,
		{ spacing: 5 },

		// Current user info + unlink action (only when the viewing admin is linked).
		currentUser
			? createElement( UserSection, {
					title: currentUser.isOwner
						? __( 'Connected as owner', 'jetpack-connection' )
						: __( 'Connected as', 'jetpack-connection' ),
					user: currentUser,
					actionSlot:
						isManagedPlatformSite && currentUser.isOwner
							? null
							: createElement(
									Button,
									{
										ref: disconnectAccountRef,
										variant: 'link',
										isDestructive: true,
										isBusy: isUnlinking,
										disabled: isUnlinking || isDisconnecting,
										onClick: handleUnlinkUser,
										className: 'wpcom-connector__inline-action',
									},
									__( 'Disconnect account', 'jetpack-connection' )
							  ),
			  } )
			: null,

		// Connect prompt (only when the viewing admin is NOT linked).
		! currentUser && onConnect
			? createElement( ConnectPrompt, {
					onConnect,
					isConnecting,
					isDisconnecting,
			  } )
			: null,

		// Connection owner (shown to non-owners and unlinked admins).
		connectionOwner && ! currentUser?.isOwner
			? createElement( UserSection, {
					title: __( 'Connection owner', 'jetpack-connection' ),
					user: connectionOwner,
					subtitle: connectionOwner.localLogin
						? '@' +
						  connectionOwner.login +
						  ' ( ' +
						  __( 'local username:', 'jetpack-connection' ) +
						  ' ' +
						  connectionOwner.localLogin +
						  ' )'
						: null,
			  } )
			: null,

		createElement( ConnectedPluginsSection ),

		actionError
			? createElement( ErrorNotice, {
					message: actionError,
					onDismiss: () => setActionError( null ),
			  } )
			: null,

		// Footer: connection details link + disconnect site button.
		createElement( 'hr', { className: 'wpcom-connector__divider' } ),
		createElement(
			HStack,
			{ spacing: 3, alignment: 'center' },
			siteDetails
				? createElement(
						Button,
						{
							ref: detailsLinkRef,
							variant: 'link',
							onClick: e => {
								e.currentTarget.blur();
								setShowDetailsModal( true );
							},
							className: 'wpcom-connector__details-link',
						},
						__( 'Connection details', 'jetpack-connection' )
				  )
				: null,
			isManagedPlatformSite
				? null
				: createElement(
						Button,
						{
							ref: disconnectSiteRef,
							variant: 'secondary',
							isDestructive: true,
							size: 'compact',
							isBusy: isDisconnecting,
							disabled: isDisconnecting || isUnlinking,
							onClick: handleDisconnect,
							className: 'wpcom-connector__disconnect-site',
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
			: null
	);
}

/* ── Main card component ────────────────────────────────────────── */

/**
 * Render callback for the WordPress.com connector card.
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
function WpcomConnectorCard( { name, label, description, logo, icon } ) {
	const connectorName = name || label;
	const connectorLogo = logo || icon || CONNECTOR_LOGO;
	const [ isExpanded, setIsExpanded ] = useState( false );
	const isConnected = initialIsConnected;
	const isSiteRegistered = initialIsRegistered;
	const [ isConnecting, setIsConnecting ] = useState( false );
	const [ connectError, setConnectError ] = useState( data.authError || null );

	const handleConnect = async () => {
		setIsConnecting( true );
		setConnectError( null );

		try {
			await startConnectionFlow( isSiteRegistered );
		} catch ( err ) {
			setConnectError(
				err?.message || __( 'Connection failed. Please try again.', 'jetpack-connection' )
			);
			setIsConnecting( false );
		}
	};

	let actionArea;
	let expandedContent = null;

	if ( isConnected || isSiteRegistered ) {
		// Site is registered with WordPress.com (with or without a connected owner).
		const badgeProps = isConnected
			? { label: __( 'Connected', 'jetpack-connection' ) }
			: {
					label: __( 'Site connected', 'jetpack-connection' ),
					modifier: 'site-connected',
			  };

		actionArea = createElement(
			HStack,
			{ spacing: 3, expanded: false },
			createElement( StatusBadge, badgeProps ),
			createElement(
				Button,
				{
					variant: 'secondary',
					size: 'compact',
					onClick: () => setIsExpanded( ! isExpanded ),
					'aria-expanded': isExpanded,
				},
				isExpanded ? __( 'Close', 'jetpack-connection' ) : __( 'Details', 'jetpack-connection' )
			)
		);

		if ( isExpanded ) {
			const needsUserConnection = ! currentUser;
			expandedContent = createElement(
				'div',
				{ className: 'wpcom-connector__expanded' },
				createElement( ExpandedDetails, {
					isConnecting: needsUserConnection ? isConnecting : false,
					onConnect: needsUserConnection ? handleConnect : null,
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
				disabled: isConnecting,
			},
			isConnecting
				? __( 'Connecting…', 'jetpack-connection' )
				: __( 'Connect', 'jetpack-connection' )
		);
	}

	const showBadge = isConnected || isSiteRegistered;
	const styledDescription = showBadge
		? description
		: createElement( 'span', { className: 'wpcom-connector__description-padded' }, description );

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
					message: connectError,
					onDismiss: () => setConnectError( null ),
			  } )
			: null
	);
}

registerConnector( 'wordpress_com', {
	name: data.connectorName ?? 'WordPress.com',
	label: data.connectorName ?? 'WordPress.com',
	description:
		data.connectorDescription ??
		__( 'Enhanced functionality with Jetpack and WooCommerce.', 'jetpack-connection' ),
	logoUrl: data.connectorLogoUrl ?? '',
	render: WpcomConnectorCard,
} );
