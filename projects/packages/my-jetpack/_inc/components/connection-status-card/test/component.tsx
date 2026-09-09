import '@testing-library/jest-dom';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { render, renderHook, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import Providers from '../../../providers';
import ConnectionStatusCard from '../index';
import type { StateProducts, MyJetpackInitialState } from '../../../data/types';
import type { ConnectionErrorObject } from '@automattic/jetpack-connection';

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
		isMaster: false,
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

const setConnectionStore = ( {
	isRegistered = false,
	isUserConnected = false,
	hasConnectedOwner = false,
	userConnectionData = adminUserConnectionData,
	connectionErrors = {},
	connectionOwner = null,
} = {} ) => {
	let storeSelect;
	renderHook( () => useSelect( select => ( storeSelect = select( CONNECTION_STORE_ID ) ), [] ), {
		wrapper: Providers,
	} );
	jest
		.spyOn( storeSelect, 'getConnectionStatus' )
		.mockReset()
		.mockReturnValue( { isRegistered, isUserConnected, hasConnectedOwner } );
	jest
		.spyOn( storeSelect, 'getUserConnectionData' )
		.mockReset()
		.mockReturnValue( userConnectionData );
	jest.spyOn( storeSelect, 'getConnectionErrors' ).mockReset().mockReturnValue( connectionErrors );
	jest.spyOn( storeSelect, 'getConnectionOwner' ).mockReset().mockReturnValue( connectionOwner );
};
beforeAll( () => {
	global.JetpackScriptData = {
		user: {
			current_user: {
				capabilities: {},
			},
		},
		site: {
			host: 'standard',
		},
	};
} );
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
			expect( screen.getByText( 'Site not connected' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Connect your site with one click.' ) ).toBeInTheDocument();
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
			expect( screen.getByText( 'Connect your site with one click.' ) ).toBeInTheDocument();
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
				expect( screen.getByText( 'Site connected' ) ).toBeInTheDocument();
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
				expect( screen.getByText( 'Site connected' ) ).toBeInTheDocument();
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
			expect( screen.getByText( 'Site connected' ) ).toBeInTheDocument();
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
			expect( screen.getByText( 'Site and account connected' ) ).toBeInTheDocument();
		} );

		it( 'renders the correct user connection line item', () => {
			setup();
			expect( screen.getByText( /Connected as/ ) ).toBeInTheDocument();
		} );
	} );

	describe( 'When the connection is fully established but broken', () => {
		const setupWithError = ( {
			error = { audience: 'site' },
			userId = '1',
			isAdmin = true,
			connectionOwner = null,
			connectionErrors,
		}: {
			error?: Partial< ConnectionErrorObject >;
			userId?: string;
			isAdmin?: boolean;
			connectionOwner?: { id: number; displayName: string } | null;
			connectionErrors?: Record< string, Record< string, ConnectionErrorObject > >;
		} = {} ) => {
			global.JetpackScriptData.user.current_user.capabilities.manage_options = isAdmin;
			setConnectionStore( {
				isRegistered: true,
				isUserConnected: true,
				hasConnectedOwner: true,
				connectionOwner,
				connectionErrors: connectionErrors ?? {
					invalid_token: {
						[ userId ]: {
							error_code: 'invalid_token',
							error_message: 'Your site is not connected to WordPress.com.',
							user_id: userId,
							...error,
						},
					},
				},
			} );
			return render(
				<Providers>
					<ConnectionStatusCard { ...testProps } />
				</Providers>
			);
		};

		// setupWithError writes manage_options; clear it so later describes see their own caps.
		afterEach( () => {
			global.JetpackScriptData.user.current_user.capabilities = {};
		} );

		it( 'does not claim everything looks good', () => {
			setupWithError();
			expect( screen.queryByText( 'Everything looks good.' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Site and account connected' ) ).not.toBeInTheDocument();
		} );

		it( 'names the site as the broken half for a site-audience error', () => {
			setupWithError( { error: { audience: 'site' } } );
			expect( screen.getByText( 'Site connection needs attention' ) ).toBeInTheDocument();
		} );

		it( 'names the account as the broken half for the viewer’s own token', () => {
			setupWithError( { error: { audience: 'user' } } );
			expect( screen.getByText( 'Account connection needs attention' ) ).toBeInTheDocument();
		} );

		it( 'falls back to the site scope when the error carries no audience', () => {
			setupWithError( { error: {} } );
			expect( screen.getByText( 'Site connection needs attention' ) ).toBeInTheDocument();
		} );

		it( 'offers Site Health to an admin', () => {
			setupWithError();
			expect( screen.getByRole( 'link', { name: /Check your site’s health/ } ) ).toHaveAttribute(
				'href',
				expect.stringContaining( 'site-health.php' )
			);
		} );

		it( 'withholds Site Health from a user who cannot open it', () => {
			setupWithError( { isAdmin: false } );
			expect( screen.queryByText( /Check your site’s health/ ) ).not.toBeInTheDocument();
		} );

		it( 'names the manage connection action rather than hanging it off the heading', () => {
			setupWithError();
			expect(
				screen.queryByRole( 'button', { name: /Site connection needs attention/ } )
			).not.toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Manage connection' } ) ).toBeInTheDocument();
		} );

		// The viewer cannot repair somebody else's token, so the card names the owner
		// as the one who has to act rather than pointing at the viewer's own account.
		it( 'points at the owner when the broken token is theirs and the viewer is not them', () => {
			setupWithError( {
				error: { audience: 'owner' },
				userId: '2',
				connectionOwner: { id: 2, displayName: 'Owner' },
			} );
			expect( screen.getByText( 'Connection needs attention' ) ).toBeInTheDocument();
			expect(
				screen.getByText(
					'The connection owner needs to reconnect their account before some features work again.'
				)
			).toBeInTheDocument();
		} );

		// Two halves broken at once: the card stops naming a half rather than picking
		// one of them and describing the wrong problem.
		it( 'stays general when the errors do not agree on one half', () => {
			setupWithError( {
				connectionErrors: {
					invalid_token: {
						1: {
							error_code: 'invalid_token',
							error_message: 'Your site is not connected to WordPress.com.',
							user_id: '1',
							audience: 'site',
						},
					},
					invalid_user_token: {
						1: {
							error_code: 'invalid_user_token',
							error_message: 'Your account is not connected to WordPress.com.',
							user_id: '1',
							audience: 'user',
						},
					},
				},
			} );
			expect( screen.getByText( 'Connection needs attention' ) ).toBeInTheDocument();
			expect(
				screen.getByText( 'There’s a problem with your Jetpack connection.' )
			).toBeInTheDocument();
		} );
	} );

	describe( 'When the account is still to be connected and something is broken', () => {
		afterEach( () => {
			global.JetpackScriptData.user.current_user.capabilities = {};
		} );

		// Connecting the account is the most useful thing this viewer can do, so a live
		// error tints the card without displacing that prompt.
		it( 'keeps the connect prompt rather than replacing it with the fault', () => {
			global.JetpackScriptData.user.current_user.capabilities.manage_options = true;
			setConnectionStore( {
				isRegistered: true,
				isUserConnected: false,
				hasConnectedOwner: true,
				connectionErrors: {
					invalid_token: {
						1: {
							error_code: 'invalid_token',
							error_message: 'Your site is not connected to WordPress.com.',
							user_id: '1',
							audience: 'site',
						},
					},
				},
			} );
			render(
				<Providers>
					<ConnectionStatusCard { ...testProps } />
				</Providers>
			);

			expect( screen.getByText( 'Site connected' ) ).toBeInTheDocument();
			expect(
				screen.getByText( 'Connect your account to unlock all the features.' )
			).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Connect my account' } ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Site connection needs attention' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'When on WoA site and user is connection owner', () => {
		const setup = () => {
			global.JetpackScriptData.site.host = 'woa';

			const woaOwnerConnectionData = {
				currentUser: {
					permissions: {
						manage_options: true,
					},
					wpcomUser: {
						display_name: 'test',
						email: 'email@example.com',
					},
					isMaster: true,
				},
			};

			setConnectionStore( {
				isRegistered: true,
				isUserConnected: true,
				hasConnectedOwner: true,
				userConnectionData: woaOwnerConnectionData,
			} );

			return render(
				<Providers>
					<ConnectionStatusCard { ...testProps } />
				</Providers>
			);
		};

		afterEach( () => {
			global.JetpackScriptData.site.host = 'standard';
		} );

		it( 'disables the manage connection button for WoA connection owners', () => {
			setup();
			const button = screen.getByRole( 'button', { name: /Site and account connected/ } );
			expect( button ).toBeDisabled();
		} );
	} );

	describe( 'When a user has account errors', () => {
		const setup = () => {
			const userDataWithErrors = {
				currentUser: {
					permissions: {
						manage_options: true,
					},
					wpcomUser: {
						display_name: 'test',
						email: 'email@example.com',
					},
					isMaster: false,
					possibleAccountErrors: {
						mismatch: {
							type: 'mismatch',
							message: 'Your WordPress.com email is also used by another user account.',
							details: {
								site_email: 'local@example.com',
								wpcom_email: 'email@example.com',
							},
						},
					},
				},
			};

			setConnectionStore( {
				isRegistered: true,
				isUserConnected: true,
				hasConnectedOwner: true,
				userConnectionData: userDataWithErrors,
			} );

			return render(
				<Providers>
					<ConnectionStatusCard { ...testProps } />
				</Providers>
			);
		};

		it( 'renders the tooltip icon for account errors', () => {
			setup();
			// Instead of looking for the button directly, we can verify that the component
			// shows the email, which indicates the user data with errors is being displayed
			expect( screen.getByText( /email@example.com/ ) ).toBeInTheDocument();

			// Note: To fully test the tooltip functionality, we would need to:
			// 1. Add data-testid to the InfoTooltip button for reliable selection
			// 2. Use fireEvent.click to trigger the tooltip to show
			// 3. Assert on the tooltip content (error message)
			// This would require modifying the InfoTooltip component
		} );

		it( 'renders user information when account has errors', () => {
			setup();
			// Verify the display name and email from the user data are shown
			expect( screen.getByText( /Connected as test/ ) ).toBeInTheDocument();
			expect( screen.getByText( /email@example.com/ ) ).toBeInTheDocument();
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
			expect(
				screen.getByText( 'Connect your account to unlock all the features.' )
			).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Connect my account' } ) ).toBeInTheDocument();
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
				screen.getByText(
					'A site admin will need to connect their account before you can connect yours.'
				)
			).toBeInTheDocument();
		} );
	} );

	describe( 'When an admin is not connected but site is registered', () => {
		const setup = () => {
			global.JetpackScriptData.user.current_user.capabilities = { manage_options: true };

			setConnectionStore( {
				isRegistered: true,
				isUserConnected: false,
				hasConnectedOwner: false,
				userConnectionData: adminUserConnectionData,
			} );
			return render(
				<Providers>
					<ConnectionStatusCard { ...testProps } />
				</Providers>
			);
		};

		afterEach( () => {
			global.JetpackScriptData.user.current_user.capabilities = {};
		} );

		it( 'enables the manage connection button so admins can disconnect the site', () => {
			setup();
			const button = screen.getByRole( 'button', { name: /Site connected/ } );
			expect( button ).toBeEnabled();
		} );

		it( 'still shows the connect account prompt', () => {
			setup();
			expect(
				screen.getByText( 'Connect your account to unlock all the features.' )
			).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Connect my account' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'When a non-admin is not connected and site is registered', () => {
		const setup = () => {
			global.JetpackScriptData.user.current_user.capabilities = {};

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

		it( 'disables the manage connection button for non-admins', () => {
			setup();
			const button = screen.getByRole( 'button', { name: /Site connected/ } );
			expect( button ).toBeDisabled();
		} );
	} );

	describe( 'When on WoA site and admin is not connected', () => {
		const setup = () => {
			global.JetpackScriptData.site.host = 'woa';
			global.JetpackScriptData.user.current_user.capabilities = { manage_options: true };

			setConnectionStore( {
				isRegistered: true,
				isUserConnected: false,
				hasConnectedOwner: false,
				userConnectionData: adminUserConnectionData,
			} );

			return render(
				<Providers>
					<ConnectionStatusCard { ...testProps } />
				</Providers>
			);
		};

		afterEach( () => {
			global.JetpackScriptData.site.host = 'standard';
			global.JetpackScriptData.user.current_user.capabilities = {};
		} );

		it( 'disables the manage connection button since WoA sites cannot be disconnected', () => {
			setup();
			const button = screen.getByRole( 'button', { name: /Site connected/ } );
			expect( button ).toBeDisabled();
		} );
	} );
} );
