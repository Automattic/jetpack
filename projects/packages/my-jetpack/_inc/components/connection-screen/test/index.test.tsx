import { render } from '@testing-library/react';
import ConnectionScreen from '../index';

const mockConnectScreen = jest.fn();
let mockSearch: Record< string, unknown > = {};
let mockOldScript = false;

jest.mock( '@automattic/jetpack-connection', () => {
	const actual = jest.requireActual( '@automattic/jetpack-connection' );
	return {
		...actual,
		get CONNECTION_FROM() {
			return mockOldScript ? undefined : actual.CONNECTION_FROM;
		},
		get isStandardEntryPoint() {
			return mockOldScript ? undefined : actual.isStandardEntryPoint;
		},
		ConnectScreen: ( props: Record< string, unknown > ) => {
			mockConnectScreen( props );
			return null;
		},
	};
} );
jest.mock( '../../../router-bridge', () => ( { useRouteSearch: () => mockSearch } ) );
jest.mock( '../../../hooks/use-my-jetpack-connection', () => () => ( {} ) );
jest.mock(
	'../../../hooks/use-my-jetpack-return-to-page',
	() => () => 'admin.php?page=my-jetpack'
);
jest.mock( '../../close-link', () => () => null );

const renderedFrom = () => mockConnectScreen.mock.lastCall[ 0 ].from;

beforeEach( () => {
	jest.clearAllMocks();
	mockSearch = {};
	mockOldScript = false;
} );

describe( 'ConnectionScreen', () => {
	it( 'sends its own name when the link names no entry point', () => {
		render( <ConnectionScreen /> );

		expect( renderedFrom() ).toBe( 'my_jetpack_connection_screen' );
	} );

	it( 'forwards a standard name from the link', () => {
		mockSearch = { from: 'my_jetpack_products_backup' };
		render( <ConnectionScreen /> );

		expect( renderedFrom() ).toBe( 'my_jetpack_products_backup' );
	} );

	it.each( [ 'my-jetpack', 'jetpack-onboarding', true ] )(
		'falls back to its own name for %p',
		from => {
			mockSearch = { from };
			render( <ConnectionScreen /> );

			expect( renderedFrom() ).toBe( 'my_jetpack_connection_screen' );
		}
	);

	it( 'sends `my-jetpack` when the shared script lacks the connection names', () => {
		mockOldScript = true;
		mockSearch = { from: 'my_jetpack_products_backup' };
		render( <ConnectionScreen /> );

		expect( renderedFrom() ).toBe( 'my-jetpack' );
	} );

	it( 'keeps skip_pricing from the link', () => {
		mockSearch = { from: 'my_jetpack_header', skip_pricing: true };
		render( <ConnectionScreen /> );

		expect( mockConnectScreen.mock.lastCall[ 0 ] ).toMatchObject( {
			from: 'my_jetpack_header',
			skipPricingPage: true,
		} );
	} );
} );
