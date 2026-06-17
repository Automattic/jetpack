const assert = require( 'node:assert/strict' );
const { readFileSync } = require( 'node:fs' );
const path = require( 'node:path' );
const { describe, it } = require( 'node:test' );

const PACKAGE_ROOT = path.resolve( __dirname, '..', '..' );
const CARD_SCRIPT_PATH = path.join( PACKAGE_ROOT, 'src', 'connectors', 'js', 'connectors-card.js' );
const CARD_SCRIPT_SOURCE = readFileSync( CARD_SCRIPT_PATH, 'utf8' ).replace(
	"const connectors = await import( '@wordpress/connectors' );",
	'const connectors = globalThis.__jetpackConnectorTestConnectors;'
);

let importIndex = 0;

function sprintf( template, ...args ) {
	let index = 0;
	return args.reduce( ( result, arg, argIndex ) => {
		const positional = new RegExp( `%${ argIndex + 1 }\\$s`, 'g' );
		return result.replace( positional, arg ).replace( /%s/, () => {
			const replacement = args[ index ];
			index += 1;
			return replacement;
		} );
	}, template );
}

async function loadConnectorCard( data ) {
	const createElement = ( type, props, ...children ) => ( {
		type,
		props: props || {},
		children,
	} );

	globalThis.__jetpackConnectorTestRegistration = null;
	globalThis.__jetpackConnectorTestConnectors = {
		ConnectorItem: 'ConnectorItem',
		registerConnector: ( id, config ) => {
			globalThis.__jetpackConnectorTestRegistration = { id, ...config };
		},
	};

	globalThis.document = {
		getElementById: () => ( {
			textContent: JSON.stringify( data ),
		} ),
	};

	globalThis.window = {
		addEventListener: () => {},
		removeEventListener: () => {},
		wp: {
			components: {
				Button: 'Button',
				Modal: 'Modal',
				Notice: 'Notice',
				__experimentalHStack: 'HStack',
				__experimentalVStack: 'VStack',
				__experimentalText: 'Text',
			},
			element: {
				createElement,
				createInterpolateElement: text => text,
				useEffect: () => {},
				useRef: initialValue => ( { current: initialValue || null } ),
				useState: initialValue => [ initialValue, () => {} ],
			},
			i18n: {
				__,
				_x: __,
				sprintf,
			},
		},
	};

	await import(
		`data:text/javascript;base64,${ Buffer.from( CARD_SCRIPT_SOURCE ).toString( 'base64' ) }#${
			importIndex++
		}`
	);

	return globalThis.__jetpackConnectorTestRegistration;
}

function __( text ) {
	return text;
}

function getSummaryBadgeProps( registration ) {
	const rendered = registration.render( {
		description: 'Enhanced functionality for Jetpack and WooCommerce with WordPress.com.',
		icon: null,
		label: 'Jetpack Connection',
		logo: null,
		name: 'Jetpack Connection',
	} );

	return rendered.props.actionArea.children[ 0 ].props;
}

describe( 'Jetpack connector status badge', () => {
	it( 'shows Offline Mode instead of Connected when a connected site is in offline mode', async () => {
		const registration = await loadConnectorCard( {
			isConnected: true,
			isRegistered: true,
			isOfflineMode: true,
		} );

		assert.deepEqual( getSummaryBadgeProps( registration ), {
			label: 'Offline Mode',
			modifier: 'offline-mode',
		} );
	} );
} );
