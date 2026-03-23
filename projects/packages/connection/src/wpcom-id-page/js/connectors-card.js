/**
 * Script module that registers a custom WordPress.com ID card on the
 * WP core Settings > Connectors page (WP 7.0+).
 *
 * Uses dynamic import for `@wordpress/connectors` (available in the
 * page's import map) and classic-script globals for element / i18n
 * which are always loaded on admin pages.
 *
 * Loaded via a manual `<script type="module">` tag — see
 * Wpcom_Id_Page::maybe_enqueue_connectors_module().
 */

( async function () {
	const { createElement } = window.wp?.element ?? {};
	const { __ } = window.wp?.i18n ?? {};

	if ( ! createElement || ! __ ) {
		return;
	}

	let registerConnector, ConnectorItem;

	try {
		const connectors = await import( '@wordpress/connectors' ); // eslint-disable-line import/no-unresolved
		registerConnector = connectors.__experimentalRegisterConnector || connectors.registerConnector;
		ConnectorItem = connectors.__experimentalConnectorItem || connectors.ConnectorItem;

		if ( ! registerConnector || ! ConnectorItem ) {
			return;
		}
	} catch {
		return;
	}

	let data;
	try {
		const el = document.getElementById( 'wpcom-connector-data' );
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

	/*
	 * The slug must match the connector ID registered in PHP via
	 * wp_connectors_init ('wordpress_com'). The store merges both
	 * registrations: the server provides label/description/icon,
	 * and this call adds the render function.
	 *
	 * Before the Gutenberg PR that removes the ai_provider filter
	 * (#76722), registerDefaultConnectors() skips non-AI connectors
	 * so the server-side data isn't registered client-side. We
	 * supply label/description as fallbacks for that scenario.
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
} )();
