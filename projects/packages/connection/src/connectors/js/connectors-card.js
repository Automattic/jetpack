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
 * @see Wpcom_Connector::enqueue_script_module()
 */

// eslint-disable-next-line import/no-unresolved -- resolved via WP import map at runtime.
const connectors = await import( '@wordpress/connectors' );
const registerConnector =
	connectors.__experimentalRegisterConnector || connectors.registerConnector;
const ConnectorItem = connectors.__experimentalConnectorItem || connectors.ConnectorItem;

const { createElement, useState } = window.wp.element;
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
			throw new Error( 'Failed to retrieve authorization URL' );
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
		throw new Error( 'Registration failed' );
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
 * @param {object|null} props.actionSlot - Optional element rendered at the end of the user row.
 * @return {object|null} React element or null.
 */
function UserSection( { title, user, actionSlot = null } ) {
	if ( ! user ) {
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
					createElement(
						Text,
						{ variant: 'muted', size: 12 },
						user.email ? '@' + user.login + ' (' + user.email + ')' : '@' + user.login
					)
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
 * Expanded content shown when the user clicks "Details".
 *
 * @param {object}   props              - Component props.
 * @param {Function} props.onDisconnect - Callback after successful disconnect.
 * @return {object} React element.
 */
function ExpandedDetails( { onDisconnect } ) {
	const [ isDisconnecting, setIsDisconnecting ] = useState( false );
	const [ isUnlinking, setIsUnlinking ] = useState( false );
	const [ showDetailsModal, setShowDetailsModal ] = useState( false );
	const [ pendingConfirm, setPendingConfirm ] = useState( null );

	const executeDisconnect = async () => {
		setPendingConfirm( null );
		setIsDisconnecting( true );

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
				onDisconnect();
			}
		} finally {
			setIsDisconnecting( false );
		}
	};

	const handleDisconnect = () => {
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
			}
		} finally {
			setIsUnlinking( false );
		}
	};

	const handleUnlinkUser = () => {
		if ( currentUser?.isOwner && currentUser?.hasOtherConnectedUsers ) {
			setPendingConfirm( {
				title: __( 'Disconnect user account', 'jetpack-connection' ),
				message: __(
					'Disconnecting the owner account will remove the Jetpack connection for all users on this site. The site will remain connected.',
					'jetpack-connection'
				),
				onConfirm: executeUnlinkUser,
			} );
			return;
		}

		executeUnlinkUser();
	};

	const currentUserTitle = currentUser?.isOwner
		? __( 'Connected as owner', 'jetpack-connection' )
		: __( 'Connected as', 'jetpack-connection' );

	const unlinkAction = currentUser
		? createElement(
				Button,
				{
					variant: 'secondary',
					isDestructive: false,
					size: 'small',
					isBusy: isUnlinking,
					disabled: isUnlinking || isDisconnecting,
					onClick: handleUnlinkUser,
					className: 'wpcom-connector__unlink-user',
				},
				__( 'Disconnect user account', 'jetpack-connection' )
		  )
		: null;

	return createElement(
		VStack,
		{ spacing: 5 },
		createElement( UserSection, {
			title: currentUserTitle,
			user: currentUser,
			actionSlot: unlinkAction,
		} ),
		! currentUser?.isOwner
			? createElement( UserSection, {
					title: __( 'Connection owner', 'jetpack-connection' ),
					user: connectionOwner,
			  } )
			: null,
		createElement( ConnectedPluginsSection ),
		createElement( 'hr', { className: 'wpcom-connector__divider' } ),
		createElement(
			HStack,
			{ spacing: 3, alignment: 'center' },
			siteDetails
				? createElement(
						Button,
						{
							variant: 'link',
							size: 'compact',
							onClick: () => setShowDetailsModal( true ),
							className: 'wpcom-connector__details-link',
						},
						__( 'Connection details', 'jetpack-connection' )
				  )
				: null,
			createElement(
				Button,
				{
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
		showDetailsModal && siteDetails
			? createElement(
					Modal,
					{
						title: __( 'Connection details', 'jetpack-connection' ),
						onRequestClose: () => setShowDetailsModal( false ),
						size: 'small',
					},
					createElement(
						VStack,
						{ spacing: 4, className: 'wpcom-connector__details-modal' },
						createElement(
							HStack,
							{ spacing: 3, alignment: 'center' },
							createElement(
								Text,
								{ variant: 'muted', size: 12 },
								__( 'Blog ID', 'jetpack-connection' )
							),
							createElement( Text, { size: 13 }, String( siteDetails.blogId ) )
						),
						createElement(
							HStack,
							{ spacing: 3, alignment: 'center' },
							createElement(
								Text,
								{ variant: 'muted', size: 12 },
								__( 'Site URL', 'jetpack-connection' )
							),
							createElement( Text, { size: 13 }, siteDetails.siteUrl )
						),
						createElement(
							HStack,
							{ spacing: 3, alignment: 'center' },
							createElement(
								Text,
								{ variant: 'muted', size: 12 },
								__( 'Home URL', 'jetpack-connection' )
							),
							createElement( Text, { size: 13 }, siteDetails.homeUrl )
						)
					)
			  )
			: null,
		pendingConfirm
			? createElement(
					Modal,
					{
						title: pendingConfirm.title,
						onRequestClose: () => setPendingConfirm( null ),
						size: 'small',
					},
					createElement(
						VStack,
						{ spacing: 5 },
						createElement( Text, { size: 13 }, pendingConfirm.message ),
						createElement(
							HStack,
							{ spacing: 3, justify: 'flex-end' },
							createElement(
								Button,
								{
									variant: 'tertiary',
									size: 'compact',
									onClick: () => setPendingConfirm( null ),
								},
								__( 'Cancel', 'jetpack-connection' )
							),
							createElement(
								Button,
								{
									variant: 'primary',
									isDestructive: true,
									size: 'compact',
									onClick: pendingConfirm.onConfirm,
								},
								__( 'Disconnect', 'jetpack-connection' )
							)
						)
					)
			  )
			: null
	);
}

/**
 * Render callback for the WordPress.com connector card.
 *
 * @param {object} props             - Connector render props.
 * @param {string} props.name        - Connector name (from server).
 * @param {string} props.description - Connector description (from server).
 * @param {object} props.logo        - Connector logo element (from server).
 * @return {object} React element.
 */
function WpcomConnectorCard( { name, description, logo } ) {
	const [ isExpanded, setIsExpanded ] = useState( false );
	const [ isConnected, setIsConnected ] = useState( initialIsConnected );
	const [ isSiteRegistered, setIsSiteRegistered ] = useState( initialIsRegistered );
	const [ isConnecting, setIsConnecting ] = useState( false );
	const [ connectError, setConnectError ] = useState( null );

	const handleDisconnect = () => {
		setIsConnected( false );
		setIsSiteRegistered( false );
		setIsExpanded( false );
	};

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

	if ( isConnected ) {
		// State 3: Fully connected (site + user).
		actionArea = createElement(
			HStack,
			{ spacing: 3, expanded: false },
			createElement( StatusBadge, { label: __( 'Connected', 'jetpack-connection' ) } ),
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
			expandedContent = createElement(
				'div',
				{ className: 'wpcom-connector__expanded' },
				createElement( ExpandedDetails, { onDisconnect: handleDisconnect } )
			);
		}
	} else if ( isSiteRegistered ) {
		// State 2: Site registered but no connected owner.
		actionArea = createElement(
			HStack,
			{ spacing: 3, expanded: false },
			createElement( StatusBadge, {
				label: __( 'Site connected', 'jetpack-connection' ),
				modifier: 'site-connected',
			} ),
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
			expandedContent = createElement(
				'div',
				{ className: 'wpcom-connector__expanded' },
				createElement(
					VStack,
					{ spacing: 4 },
					createElement(
						Text,
						{ size: 13 },
						__(
							'Your site is registered with WordPress.com. Connect your user account to unlock full functionality.',
							'jetpack-connection'
						)
					),
					createElement(
						Button,
						{
							variant: 'primary',
							size: 'compact',
							onClick: handleConnect,
							isBusy: isConnecting,
							disabled: isConnecting,
						},
						isConnecting
							? __( 'Connecting…', 'jetpack-connection' )
							: __( 'Connect your WordPress.com account', 'jetpack-connection' )
					)
				)
			);
		}
	} else {
		// State 1: Neither connected.
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
			logo,
			name,
			description: styledDescription,
			actionArea,
		},
		expandedContent,
		connectError
			? createElement(
					'p',
					{
						className: 'wpcom-connector__error',
						role: 'alert',
					},
					connectError
			  )
			: null
	);
}

/*
 * The slug must match the connector ID registered in PHP via
 * wp_connectors_init ('wordpress_com'). The store merges both
 * registrations: the server provides name, description, and logo;
 * this call adds the render function.
 */
registerConnector( 'wordpress_com', {
	render: WpcomConnectorCard,
} );
