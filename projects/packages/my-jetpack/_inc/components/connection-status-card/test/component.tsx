import '@testing-library/jest-dom';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { render, renderHook, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import ConnectionStatusCard from '../index';
import type { StateProducts, MyJetpackInitialState } from '../../../data/types';

interface TestMyJetpackInitialState {
	lifecycleStats: Pick<
		MyJetpackInitialState[ 'lifecycleStats' ],
		'historicallyActiveModules' | 'brokenModules'
	>;
	products: {
		items: {
			'anti-spam': Pick<
				StateProducts[ 'anti-spam' ],
				'requires_user_connection' | 'status' | 'pricing_for_ui'
			>;
		};
	};
}

const resetInitialState = () => {
	( window.myJetpackInitialState as unknown as TestMyJetpackInitialState ) = {
		lifecycleStats: {
			historicallyActiveModules: [],
			brokenModules: {
				needs_site_connection: [],
				needs_user_connection: [],
			},
		},
		products: {
			items: {
				'anti-spam': {
					requires_user_connection: false,
					status: 'inactive',
					// This property is needed as it is used when the `useAllProducts` hook is called
					// in the connection status card component
					pricing_for_ui: {
						product_term: 'year',
						available: false,
						wpcom_product_slug: '',
						currency_code: '',
						full_price: 0,
						discount_price: 0,
						coupon_discount: 0,
						is_introductory_offer: false,
					},
				},
			},
		},
	};
};

const setConnectionStore = ( {
	isRegistered = false,
	isUserConnected = false,
	hasConnectedOwner = false,
} = {} ) => {
	let storeSelect;
	renderHook( () => useSelect( select => ( storeSelect = select( CONNECTION_STORE_ID ) ), [] ) );
	jest
		.spyOn( storeSelect, 'getConnectionStatus' )
		.mockReset()
		.mockReturnValue( { isRegistered, isUserConnected, hasConnectedOwner } );
};

beforeEach( () => {
	resetInitialState();
	setConnectionStore();
} );

// TODO Mock requests with dummy data.
describe( 'ConnectionStatusCard', () => {
	const testProps = {
		apiNonce: 'test',
		apiRoot: 'https://example.org/wp-json/',
		redirectUri: 'https://example.org',
	};

	describe( 'When the site is not registered and has no broken modules', () => {
		const setup = () => {
			return render( <ConnectionStatusCard { ...testProps } /> );
		};

		it( 'renders the correct copy for the site connection line item', () => {
			setup();
			expect( screen.getByText( 'Start with Jetpack.' ) ).toBeInTheDocument();
			expect(
				screen.getByRole( 'button', { name: 'Connect your site with one click' } )
			).toBeInTheDocument();
		} );

		it( 'does not render the user connection line item', () => {
			setup();
			expect( screen.queryByText( 'Unlock more of Jetpack' ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: 'Sign in' } ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'When the site is not registered and has broken modules', () => {
		const setup = () => {
			window.myJetpackInitialState.lifecycleStats.brokenModules.needs_site_connection = [
				'anti-spam',
			];
			return render( <ConnectionStatusCard { ...testProps } /> );
		};

		it( 'renders the correct copy for the site connection line item', () => {
			setup();
			expect(
				screen.getByText( 'Missing site connection to enable some features.' )
			).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Connect' } ) ).toBeInTheDocument();
		} );

		it( 'does not render the user connection line item', () => {
			setup();
			expect( screen.queryByText( 'Unlock more of Jetpack' ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: 'Sign in' } ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'When the user has not connected their WordPress.com account and there are no broken modules', () => {
		describe( 'There are no products that require user connection', () => {
			const setup = () => {
				setConnectionStore( { isRegistered: true } );
				return render( <ConnectionStatusCard { ...testProps } /> );
			};

			it( 'renders the correct site connection line item', () => {
				setup();
				expect( screen.getByText( 'Site connected.' ) ).toBeInTheDocument();
				expect( screen.getByRole( 'button', { name: 'Manage' } ) ).toBeInTheDocument();
			} );

			it( 'renders the correct user connection line item', () => {
				setup();
				expect( screen.getByText( 'Unlock more of Jetpack' ) ).toBeInTheDocument();
				expect( screen.getByRole( 'button', { name: 'Sign in' } ) ).toBeInTheDocument();
			} );
		} );

		describe( 'There are products that require user connection', () => {
			const setup = () => {
				setConnectionStore( { isRegistered: true } );
				window.myJetpackInitialState.products.items[ 'anti-spam' ].requires_user_connection = true;
				return render( <ConnectionStatusCard { ...testProps } /> );
			};

			it( 'renders the correct site connection line item', () => {
				setup();
				expect( screen.getByText( 'Site connected.' ) ).toBeInTheDocument();
				expect( screen.getByRole( 'button', { name: 'Manage' } ) ).toBeInTheDocument();
			} );

			it( 'renders the correct user connection line item', () => {
				setup();
				expect( screen.getByText( 'Some features require authentication.' ) ).toBeInTheDocument();
				expect( screen.getByRole( 'button', { name: 'Sign in' } ) ).toBeInTheDocument();
			} );
		} );
	} );

	describe( 'When the user has not connected their WordPress.com account and there are broken modules', () => {
		const setup = () => {
			setConnectionStore( { isRegistered: true } );
			window.myJetpackInitialState.lifecycleStats.brokenModules.needs_user_connection = [
				'anti-spam',
			];
			return render( <ConnectionStatusCard { ...testProps } /> );
		};

		it( 'renders the correct site connection line item', () => {
			setup();
			expect( screen.getByText( 'Site connected.' ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Manage' } ) ).toBeInTheDocument();
		} );

		it( 'renders the correct user connection line item', () => {
			setup();
			expect(
				screen.getByText( 'Missing authentication to enable all features.' )
			).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Sign in' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'When the user has connected their WordPress.com account', () => {
		const setup = () => {
			setConnectionStore( { isRegistered: true, isUserConnected: true, hasConnectedOwner: true } );
			return render( <ConnectionStatusCard { ...testProps } /> );
		};

		it( 'renders the correct site connection line item', () => {
			setup();
			expect( screen.getByText( 'Site connected.' ) ).toBeInTheDocument();
		} );

		it( 'renders the correct user connection line item', () => {
			setup();
			expect( screen.getByText( /Connected as/ ) ).toBeInTheDocument();
		} );

		it( 'renders two manage buttons', () => {
			setup();
			expect( screen.getAllByRole( 'button', { name: 'Manage' } ) ).toHaveLength( 2 );
		} );
	} );
} );
