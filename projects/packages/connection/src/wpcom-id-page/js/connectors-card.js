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
 * This module only adds the render function and connection-specific
 * data (isConnected, manageUrl) via script module data.
 *
 * @see Wpcom_Id_Page::maybe_enqueue_connectors_module()
 */

// eslint-disable-next-line import/no-unresolved -- resolved via WP import map at runtime.
const connectors = await import( '@wordpress/connectors' );
const registerConnector =
	connectors.__experimentalRegisterConnector || connectors.registerConnector;
const ConnectorItem = connectors.__experimentalConnectorItem || connectors.ConnectorItem;

const { createElement } = window.wp.element;
const { __ } = window.wp.i18n;
const { Button } = window.wp.components;

const MODULE_ID = '@automattic/jetpack-connection-connectors';
const dataEl = document.getElementById( `wp-script-module-data-${ MODULE_ID }` );
const data = JSON.parse( dataEl?.textContent ?? '{}' );

const isConnected = Boolean( data.isConnected );
const manageUrl = data.manageUrl || '';

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
 * Render callback for the WordPress.com connector card.
 *
 * @param {object} props             - Connector render props.
 * @param {string} props.name        - Connector name (from server).
 * @param {string} props.description - Connector description (from server).
 * @param {object} props.logo        - Connector logo element (from server).
 * @return {object} React element.
 */
function WpcomConnectorCard( { name, description, logo } ) {
	const buttonLabel = isConnected
		? __( 'Manage', 'jetpack-connection' )
		: __( 'Connect', 'jetpack-connection' );

	const actionArea = createElement(
		'div',
		{
			style: {
				display: 'flex',
				alignItems: 'center',
				gap: '12px',
			},
		},
		isConnected ? createElement( ConnectedBadge ) : null,
		manageUrl
			? createElement(
					Button,
					{
						variant: 'secondary',
						size: 'compact',
						href: manageUrl,
					},
					buttonLabel
			  )
			: null
	);

	return createElement( ConnectorItem, {
		logo,
		name,
		description,
		actionArea,
	} );
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
