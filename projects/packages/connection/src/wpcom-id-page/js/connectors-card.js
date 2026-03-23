/**
 * Script module that registers a WordPress.com connector card on the
 * WP core Settings > Connectors page (WP 7.0+).
 *
 * Loaded via wp_enqueue_script_module() with `@wordpress/connectors`
 * as a static dependency. Uses classic-script globals for element,
 * i18n, and components which are always loaded on admin pages.
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
const logoUrl = data.logoUrl || '';

/**
 * Logo element built from the URL provided by PHP.
 *
 * @return {object|null} React element or null.
 */
function Logo() {
	if ( ! logoUrl ) {
		return null;
	}
	return createElement( 'img', {
		src: logoUrl,
		alt: '',
		width: 40,
		height: 40,
	} );
}

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
 * @param {string} props.label       - Connector label.
 * @param {string} props.description - Connector description.
 * @return {object} React element.
 */
function WpcomConnectorCard( { label, description } ) {
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
		icon: createElement( Logo ),
		name: label,
		description,
		actionArea,
	} );
}

/*
 * The slug must match the connector ID registered in PHP via
 * wp_connectors_init ('wordpress_com'). The store merges both
 * registrations: the server provides label/description/icon,
 * and this call adds the render function.
 */
registerConnector( 'wordpress_com', {
	label: data.name || __( 'WordPress.com account', 'jetpack-connection' ),
	description:
		data.description ||
		__(
			'Connect your site to WordPress.com for enhanced functionality, Jetpack and WooCommerce services, and centralized management.',
			'jetpack-connection'
		),
	render: WpcomConnectorCard,
} );
