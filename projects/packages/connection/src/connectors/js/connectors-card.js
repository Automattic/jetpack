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
const { Button } = window.wp.components;
const HStack = window.wp.components.__experimentalHStack || window.wp.components.HStack;
const VStack = window.wp.components.__experimentalVStack || window.wp.components.VStack;
const Text = window.wp.components.__experimentalText || window.wp.components.Text;

const MODULE_ID = '@automattic/jetpack-connection-connectors';
const dataEl = document.getElementById( `wp-script-module-data-${ MODULE_ID }` );
const data = JSON.parse( dataEl?.textContent ?? '{}' );

const initialIsConnected = Boolean( data.isConnected );
const apiRoot = data.apiRoot || '';
const apiNonce = data.apiNonce || '';
const connectionOwner = data.connectionOwner || null;
const connectedPlugins = data.connectedPlugins || [];

/**
 * Badge shown when the site is connected.
 *
 * @return {object} React element.
 */
function ConnectedBadge() {
	return createElement(
		'span',
		{
			style: {
				color: '#345b37',
				backgroundColor: '#eff8f0',
				padding: '4px 12px',
				borderRadius: '2px',
				fontSize: '13px',
				fontWeight: 500,
				whiteSpace: 'nowrap',
			},
		},
		__( 'Connected', 'jetpack-connection' )
	);
}

/**
 * Connection owner section displayed in the expanded card.
 *
 * @return {object|null} React element or null.
 */
function ConnectionOwnerSection() {
	if ( ! connectionOwner ) {
		return null;
	}

	return createElement(
		VStack,
		{ spacing: 3 },
		createElement(
			Text,
			{
				variant: 'muted',
				size: 11,
				upperCase: true,
				weight: 500,
			},
			__( 'Connection owner', 'jetpack-connection' )
		),
		createElement(
			HStack,
			{ spacing: 3, alignment: 'center' },
			connectionOwner.avatar
				? createElement( 'img', {
						src: connectionOwner.avatar,
						alt: '',
						width: 36,
						height: 36,
						style: { borderRadius: '50%' },
				  } )
				: null,
			createElement(
				VStack,
				{ spacing: 0 },
				createElement( Text, { weight: 600, size: 13 }, connectionOwner.displayName ),
				createElement( Text, { variant: 'muted', size: 12 }, '@' + connectionOwner.login )
			)
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
		{ spacing: 3 },
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
			{ spacing: 4, wrap: true },
			...connectedPlugins.map( plugin =>
				createElement(
					HStack,
					{ key: plugin.slug, spacing: 2, expanded: false },
					createElement( 'span', {
						className: 'dashicons dashicons-admin-plugins',
						style: { fontSize: '20px', width: '20px', height: '20px' },
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

	const handleDisconnect = async () => {
		// eslint-disable-next-line no-alert -- intentional confirmation dialog.
		const confirmed = window.confirm(
			__(
				'Are you sure you want to disconnect from WordPress.com? This will affect all plugins using this connection.',
				'jetpack-connection'
			)
		);

		if ( ! confirmed ) {
			return;
		}

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

	return createElement(
		VStack,
		{ spacing: 5 },
		createElement( ConnectionOwnerSection ),
		createElement( ConnectedPluginsSection ),
		createElement(
			HStack,
			{ spacing: 3, alignment: 'center' },
			createElement(
				Button,
				{
					variant: 'link',
					isDestructive: true,
					isBusy: isDisconnecting,
					disabled: isDisconnecting,
					onClick: handleDisconnect,
				},
				__( 'Disconnect', 'jetpack-connection' )
			)
		)
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

	const handleDisconnect = () => {
		setIsConnected( false );
		setIsExpanded( false );
	};

	const actionArea = createElement(
		HStack,
		{ spacing: 3, expanded: false },
		isConnected ? createElement( ConnectedBadge ) : null,
		isConnected
			? createElement(
					Button,
					{
						variant: isExpanded ? 'tertiary' : 'secondary',
						size: 'compact',
						onClick: () => setIsExpanded( ! isExpanded ),
						'aria-expanded': isExpanded,
					},
					isExpanded ? __( 'Close', 'jetpack-connection' ) : __( 'Details', 'jetpack-connection' )
			  )
			: null
	);

	return createElement(
		ConnectorItem,
		{
			logo,
			name,
			description,
			actionArea,
		},
		isExpanded && isConnected
			? createElement( ExpandedDetails, { onDisconnect: handleDisconnect } )
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
