/**
 * Script module that registers a custom WordPress.com ID card on the
 * WP core Settings > Connectors page.
 *
 * This file is an ES module loaded via wp_enqueue_script_module().
 * It cannot use JSX — all React elements use createElement.
 *
 * @see Wpcom_Id_Page::maybe_enqueue_connectors_module()
 */

/* eslint-disable jsdoc/require-param, jsdoc/require-returns */
/* eslint-disable @wordpress/no-unsafe-wp-apis */
/* eslint-disable import/no-unresolved -- resolved at runtime via WP script module import maps */

import {
	__experimentalRegisterConnector as registerConnector,
	__experimentalConnectorItem as ConnectorItem,
} from '@wordpress/connectors';
import { createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Read the module data injected by PHP via the wp_script_module_data filter.
 */
function getData() {
	try {
		const el = document.getElementById(
			'wp-script-module-data-@automattic/jetpack-connection-connectors'
		);
		return JSON.parse( el?.textContent ?? '{}' );
	} catch {
		return {};
	}
}

const data = getData();
const isConnected = Boolean( data.isConnected );
const manageUrl = data.manageUrl || '';
const logoUrl = data.logoUrl || '';

/**
 * Build the logo element from the URL provided by PHP.
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
