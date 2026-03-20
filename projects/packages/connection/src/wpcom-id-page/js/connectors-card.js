/**
 * Script module that registers a custom WordPress.com ID card on the
 * WP core Settings > Connectors page (WP 7.0+).
 *
 * Uses dynamic imports so the module degrades gracefully when
 * `@wordpress/connectors` is not available.
 *
 * This file is an ES module loaded via wp_enqueue_script_module().
 * It cannot use JSX — all React elements use createElement.
 *
 * @see Wpcom_Id_Page::maybe_enqueue_connectors_module()
 */

/* eslint-disable import/no-unresolved -- resolved at runtime via WP script module import maps */

( async function () {
	const debug = true; // TODO: Remove before merging.
	const log = ( ...args ) => debug && console.warn( '[WPCOM-Connector]', ...args ); // eslint-disable-line no-console

	log( 'Module loaded' );

	let registerConnector, ConnectorItem, createElement, __;

	try {
		const connectors = await import( '@wordpress/connectors' );
		log( 'Imported @wordpress/connectors, exports:', Object.keys( connectors ) );
		registerConnector = connectors.__experimentalRegisterConnector || connectors.registerConnector;
		ConnectorItem = connectors.__experimentalConnectorItem || connectors.ConnectorItem;

		if ( ! registerConnector || ! ConnectorItem ) {
			log(
				'Missing exports — registerConnector:',
				!! registerConnector,
				'ConnectorItem:',
				!! ConnectorItem
			);
			return;
		}

		( { createElement } = await import( '@wordpress/element' ) );
		( { __ } = await import( '@wordpress/i18n' ) );
		log( 'All imports resolved' );
	} catch ( err ) {
		log( 'Import failed:', err );
		return;
	}

	const MODULE_ID = 'wp-script-module-data-@automattic/jetpack-connection-connectors';

	let data;
	try {
		const el = document.getElementById( MODULE_ID );
		data = JSON.parse( el?.textContent ?? '{}' );
	} catch {
		data = {};
	}

	const isConnected = Boolean( data.isConnected );
	const manageUrl = data.manageUrl || '';
	const logoUrl = data.logoUrl || '';

	/**
	 * Build the logo element from the URL provided by PHP.
	 *
	 * @return {Object|null} React element or null.
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
	 * The custom card render for the WordPress.com connector.
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
						'a',
						{
							href: manageUrl,
							className: 'components-button is-secondary is-compact',
							style: { textDecoration: 'none' },
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

	log( 'Registering connector with data:', { isConnected, manageUrl, logoUrl } );

	registerConnector( 'cloud-service/wordpress-com', {
		label: data.name || __( 'WordPress.com account', 'jetpack-connection' ),
		description:
			data.description ||
			__(
				'Connect your site to WordPress.com for enhanced functionality, Jetpack and WooCommerce services, and centralized management.',
				'jetpack-connection'
			),
		render: WpcomConnectorCard,
	} );

	log( 'Connector registered successfully' );
} )();
