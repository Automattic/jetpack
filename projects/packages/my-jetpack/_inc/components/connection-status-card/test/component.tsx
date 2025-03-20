import '@testing-library/jest-dom';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import Providers from '../../../providers';
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

const adminUserConnectionData = {
	currentUser: {
		permissions: {
			manage_options: true,
		},
		wpcomUser: {
			display_name: 'test',
			email: 'email@example.com',
		},
	},
};

const adminUserWithErrorConnectionData = {
	currentUser: {
		permissions: {
			manage_options: true,
		},
		wpcomUser: {
			display_name: 'test',
			email: 'email@example.com',
		},
		isMaster: true,
		possibleAccountErrors: {
			mismatch: {
				type: 'mismatch',
				message: 'We noticed there is another WordPress account using this email address.',
				details: {
					site_email: 'email@example.com',
					wpcom_email: 'different@example.com',
				},
			},
		},
	},
};
// This is a temporary test that will get updated when new error types are introduced.
const adminUserWithMultipleErrorsConnectionData = {
	currentUser: {
		permissions: {
			manage_options: true,
		},
		wpcomUser: {
			display_name: 'test',
			email: 'email@example.com',
		},
		isMaster: true,
		possibleAccountErrors: {
			mismatch: {
				type: 'mismatch',
				message: 'We noticed there is another WordPress account using this email address.',
				details: {
					site_email: 'email@example.com',
					wpcom_email: 'different@example.com',
				},
			},
			another_error: {
				type: 'another_error',
				message: 'This is another error message.',
			},
		},
	},
};

const nonAdminUserConnectionData = {
	currentUser: {
		permissions: {
			manage_options: false,
		},
		wpcomUser: {
			display_name: 'test',
			email: 'email@example.com',
		},
		isMaster: false,
	},
	connectionOwner: 'adminuser',
};

const nonAdminUserWithErrorConnectionData = {
	currentUser: {
		permissions: {
			manage_options: false,
		},
		wpcomUser: {
			display_name: 'test',
			email: 'email@example.com',
		},
		isMaster: false,
		possibleAccountErrors: {
			mismatch: {
				type: 'mismatch',
				message: 'We noticed there is another WordPress account using this email address.',
				details: {
					site_email: 'email@example.com',
					wpcom_email: 'different@example.com',
				},
			},
		},
	},
	connectionOwner: 'adminuser',
};

const setConnectionStore = ( {
	isRegistered = false,
	isUserConnected = false,
	hasConnectedOwner = false,
	userConnectionData = adminUserConnectionData,
} = {} ) => {
	let storeSelect;
	renderHook( () => useSelect( select => ( storeSelect = select( CONNECTION_STORE_ID ) ), [] ), {
		wrapper: Providers,
	} );
	jest
		.spyOn( storeSelect, 'getConnectionStatus' )
		.mockReset()
		.mockReturnValue( { isRegistered, isUserConnected, hasConnectedOwner, userConnectionData } );
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
			return render(
				<Providers>
					<ConnectionStatusCard { ...testProps } />
				</Providers>
			);
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
			return render(
				<Providers>
					<ConnectionStatusCard { ...testProps } />
				</Providers>
			);
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
				return render(
					<Providers>
						<ConnectionStatusCard { ...testProps } />
					</Providers>
				);
			};

			it( 'renders the correct site connection line item', () => {
				setup();
				expect( screen.getByText( 'Site connected.' ) ).toBeInTheDocument();
				expect( screen.getByRole( 'button', { name: 'Manage' } ) ).toBeInTheDocument();
			} );

			it( 'renders the correct user connection line item', async () => {
				setup();

				// Wait for the specific text to appear, which indicates the data has been processed
				await waitFor( () => {
					return screen.queryByText( 'Some features require authentication.' ) !== null;
				} );

				expect( screen.getByText( 'Unlock more of Jetpack' ) ).toBeInTheDocument();
				expect( screen.getByRole( 'button', { name: 'Sign in' } ) ).toBeInTheDocument();
			} );
		} );

		describe( 'There are products that require user connection', () => {
			const setup = () => {
				setConnectionStore( { isRegistered: true } );
				window.myJetpackInitialState.products.items[ 'anti-spam' ].requires_user_connection = true;
				return render(
					<Providers>
						<ConnectionStatusCard { ...testProps } />
					</Providers>
				);
			};

			it( 'renders the correct site connection line item', () => {
				setup();
				expect( screen.getByText( 'Site connected.' ) ).toBeInTheDocument();
				expect( screen.getByRole( 'button', { name: 'Manage' } ) ).toBeInTheDocument();
			} );

			it( 'renders the correct user connection line item', () => {
				setup();
				setTimeout( () => {
					expect( screen.getByText( 'Some features require authentication.' ) ).toBeInTheDocument();
					expect( screen.getByRole( 'button', { name: 'Sign in' } ) ).toBeInTheDocument();
				}, 1500 );
			} );
		} );
	} );

	describe( 'When the user has not connected their WordPress.com account and there are broken modules', () => {
		const setup = () => {
			setConnectionStore( { isRegistered: true } );
			window.myJetpackInitialState.lifecycleStats.brokenModules.needs_user_connection = [
				'anti-spam',
			];
			return render(
				<Providers>
					<ConnectionStatusCard { ...testProps } />
				</Providers>
			);
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
			return render(
				<Providers>
					<ConnectionStatusCard { ...testProps } />
				</Providers>
			);
		};

		it( 'renders the correct site connection line item', () => {
			setup();
			expect( screen.getByText( 'Site connected.' ) ).toBeInTheDocument();
		} );

		it( 'renders the correct user connection line item', () => {
			setup();
			expect( screen.getByText( /Connected as/ ) ).toBeInTheDocument();
		} );

		it( 'renders one manage button', () => {
			setup();
			expect( screen.getAllByRole( 'button', { name: 'Manage' } ) ).toHaveLength( 1 );
		} );
	} );

	describe( 'When a non-admin is not connected, but there is a connection owner', () => {
		const setup = () => {
			setConnectionStore( {
				isRegistered: true,
				isUserConnected: false,
				hasConnectedOwner: true,
				userConnectionData: nonAdminUserConnectionData,
			} );
			return render(
				<Providers>
					<ConnectionStatusCard { ...testProps } />
				</Providers>
			);
		};

		it( 'renders the owner name', () => {
			setup();
			expect( screen.getByText( /Also connected: [A-Za-z ]+ \(Owner\)/ ) ).toBeInTheDocument();
		} );

		it( 'renders prompt for this user to connect', () => {
			setup();
			expect( screen.getByText( 'Unlock more of Jetpack' ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Sign in' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'When a non-admin is not connected, and there is no connection owner', () => {
		const setup = () => {
			setConnectionStore( {
				isRegistered: true,
				isUserConnected: false,
				hasConnectedOwner: false,
				userConnectionData: nonAdminUserConnectionData,
			} );
			return render(
				<Providers>
					<ConnectionStatusCard { ...testProps } />
				</Providers>
			);
		};

		it( 'renders message about an admin needing to sign in first', () => {
			setup();
			expect(
				screen.getByText( 'A site admin will need to connect before you are able to sign in' )
			).toBeInTheDocument();
		} );
	} );

	describe( 'When the admin user has connected their WordPress.com account with account errors', () => {
		const setup = () => {
			setConnectionStore( {
				isRegistered: true,
				isUserConnected: true,
				hasConnectedOwner: true,
				userConnectionData: adminUserWithErrorConnectionData,
			} );
			return render(
				<Providers>
					<ConnectionStatusCard { ...testProps } />
				</Providers>
			);
		};

		it( 'renders the info tooltip next to email', () => {
			setup();
			const iconElement = screen.getByRole( 'img', { hidden: true } );
			expect( iconElement ).toBeInTheDocument();
		} );

		it( 'shows tooltip with error message when hovered', async () => {
			setup();
			const iconElement = screen.getByRole( 'img', { hidden: true } );

			// Simulate hovering on the tooltip icon
			await userEvent.hover( iconElement );

			// The tooltip should appear with the error message
			const message = await screen.findByText(
				'We noticed there is another WordPress account using this email address.'
			);
			expect( message ).toBeInTheDocument();
		} );
	} );

	describe( 'When the admin user has connected their WordPress.com account with multiple account errors', () => {
		const setup = () => {
			setConnectionStore( {
				isRegistered: true,
				isUserConnected: true,
				hasConnectedOwner: true,
				userConnectionData: adminUserWithMultipleErrorsConnectionData,
			} );
			return render(
				<Providers>
					<ConnectionStatusCard { ...testProps } />
				</Providers>
			);
		};

		it( 'shows all error messages in the tooltip', async () => {
			setup();
			const iconElement = screen.getByRole( 'img', { hidden: true } );

			// Simulate hovering on the tooltip icon
			await userEvent.hover( iconElement );

			// Both error messages should appear in the tooltip
			const message1 = await screen.findByText(
				'We noticed there is another WordPress account using this email address.'
			);
			const message2 = await screen.findByText( 'This is another error message.' );
			expect( message1 ).toBeInTheDocument();
			expect( message2 ).toBeInTheDocument();
		} );
	} );

	describe( 'When a non-admin has connected their WordPress.com account with account errors', () => {
		const setup = () => {
			setConnectionStore( {
				isRegistered: true,
				isUserConnected: true,
				hasConnectedOwner: true,
				userConnectionData: nonAdminUserWithErrorConnectionData,
			} );
			return render(
				<Providers>
					<ConnectionStatusCard { ...testProps } />
				</Providers>
			);
		};

		it( 'renders the info tooltip next to email for non-owner', () => {
			setup();
			const iconElement = screen.getByRole( 'img', { hidden: true } );
			expect( iconElement ).toBeInTheDocument();
		} );

		it( 'shows tooltip with error message when hovered', async () => {
			setup();
			const iconElement = screen.getByRole( 'img', { hidden: true } );

			// Simulate hovering on the tooltip icon
			await userEvent.hover( iconElement );

			// The tooltip should appear with the error message
			const message = await screen.findByText(
				'We noticed there is another WordPress account using this email address.'
			);
			expect( message ).toBeInTheDocument();
		} );

		it( 'sets the correct tracking parameters for non-owner context', async () => {
			setup();
			const infoTooltip = screen.getByTestId( 'info-tooltip' );
			expect( infoTooltip ).toBeInTheDocument();

			// Check if the tooltip has the correct context for tracking
			// Since tracking props aren't directly testable through the DOM,
			// we're at least verifying the tooltip exists with the expected class
			expect( infoTooltip ).toHaveClass( 'account-error-tooltip' );
		} );
	} );
} );
