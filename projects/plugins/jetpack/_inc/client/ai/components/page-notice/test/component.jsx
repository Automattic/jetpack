import { useConnectionErrorNotice } from '@automattic/jetpack-connection';
import { render, screen } from '@testing-library/react';
import PageNotice, { getPageNoticeState } from '../index';

jest.mock( '@automattic/jetpack-connection', () => ( {
	ConnectionError: () => <div data-testid="connection-error" />,
	useConnectionErrorNotice: jest.fn(),
} ) );

const IGNORE_A11Y = { ignore: 'script, style, .a11y-speak-region' };

const connected = ( overrides = {} ) => ( {
	host_allows_ai: true,
	master_enabled: true,
	is_connected: true,
	is_user_connected: true,
	...overrides,
} );

const resolve = ( overrides = {} ) =>
	getPageNoticeState( {
		view: 'overview',
		blogId: 1,
		isUserConnected: true,
		settings: connected(),
		hasConnectionError: false,
		...overrides,
	} );

describe( 'getPageNoticeState', () => {
	it( 'returns nothing when the site is connected and AI is on', () => {
		expect( resolve() ).toBeNull();
	} );

	describe( 'one state at a time', () => {
		it( 'reports the host switch', () => {
			expect( resolve( { settings: connected( { host_allows_ai: false } ) } ) ).toBe( 'host-off' );
		} );

		it( 'reports a site with no blog ID', () => {
			expect( resolve( { blogId: 0 } ) ).toBe( 'site-disconnected' );
		} );

		it( 'reports a site the settings call says is disconnected', () => {
			expect( resolve( { settings: connected( { is_connected: false } ) } ) ).toBe(
				'site-disconnected'
			);
		} );

		it( 'reports an unlinked account from page data', () => {
			expect( resolve( { isUserConnected: false } ) ).toBe( 'user-unlinked' );
		} );

		it( 'reports an unlinked account from the settings call', () => {
			expect( resolve( { settings: connected( { is_user_connected: false } ) } ) ).toBe(
				'user-unlinked'
			);
		} );

		it( 'reports the master switch', () => {
			expect( resolve( { settings: connected( { master_enabled: false } ) } ) ).toBe(
				'master-off'
			);
		} );
	} );

	describe( 'a connection the site cannot use', () => {
		it( 'outranks every other state', () => {
			expect(
				resolve( {
					hasConnectionError: true,
					blogId: 0,
					settings: connected( { host_allows_ai: false } ),
				} )
			).toBe( 'connection-error' );
		} );

		it( 'still belongs to no other view', () => {
			expect( resolve( { view: 'mcp', hasConnectionError: true } ) ).toBeNull();
		} );
	} );

	describe( 'precedence when several are true', () => {
		it( 'the host switch beats every other state', () => {
			expect(
				resolve( {
					blogId: 0,
					isUserConnected: false,
					settings: connected( {
						host_allows_ai: false,
						is_connected: false,
						is_user_connected: false,
						master_enabled: false,
					} ),
				} )
			).toBe( 'host-off' );
		} );

		it( 'a disconnected site beats an unlinked account', () => {
			expect( resolve( { blogId: 0, isUserConnected: false } ) ).toBe( 'site-disconnected' );
		} );

		it( 'a disconnected site beats the master switch', () => {
			expect( resolve( { blogId: 0, settings: connected( { master_enabled: false } ) } ) ).toBe(
				'site-disconnected'
			);
		} );

		it( 'an unlinked account beats the master switch', () => {
			expect(
				resolve( { isUserConnected: false, settings: connected( { master_enabled: false } ) } )
			).toBe( 'user-unlinked' );
		} );
	} );

	describe( 'views the notice does not belong to', () => {
		it.each( [ 'mcp', 'scheduled-tasks' ] )( 'stays silent on the %s view', view => {
			expect( resolve( { view, blogId: 0 } ) ).toBeNull();
		} );

		it( 'stays silent on an MCP sub-view', () => {
			expect( resolve( { view: 'mcp/read', blogId: 0 } ) ).toBeNull();
		} );
	} );

	describe( 'while the settings call is still in flight', () => {
		it( 'uses the blog ID from page data so a disconnected site is named at once', () => {
			expect( resolve( { blogId: 0, settings: null } ) ).toBe( 'site-disconnected' );
		} );

		it( 'names an unlinked account from page data too', () => {
			expect( resolve( { isUserConnected: false, settings: null } ) ).toBe( 'user-unlinked' );
		} );

		it( 'claims nothing it cannot yet know', () => {
			expect( resolve( { settings: null } ) ).toBeNull();
		} );
	} );
} );

describe( 'PageNotice', () => {
	const renderNotice = ( overrides = {} ) =>
		render(
			<PageNotice
				view="overview"
				blogId={ 1 }
				isUserConnected={ true }
				settings={ connected() }
				userConnectionUrl="admin.php?page=my-jetpack#/connection"
				manageUrl="admin.php?page=my-jetpack#/products"
				siteAdminUrl="https://example.com/wp-admin/"
				hasMyJetpack={ true }
				{ ...overrides }
			/>
		);

	beforeEach( () => {
		useConnectionErrorNotice.mockReturnValue( { hasConnectionError: false } );
	} );

	it( 'renders nothing when there is nothing to say', () => {
		const { container } = renderNotice();
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'hands a broken connection to the shared connection notice', () => {
		useConnectionErrorNotice.mockReturnValue( { hasConnectionError: true } );
		renderNotice( { blogId: 0 } );
		expect( screen.getByTestId( 'connection-error' ) ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-node-access -- the wrapper is the assertion.
		expect( screen.getByTestId( 'connection-error' ).parentElement ).toHaveClass(
			'jetpack-ai-admin__page-notice'
		);
		expect(
			screen.queryByText( 'This site is not connected to WordPress.com.', IGNORE_A11Y )
		).not.toBeInTheDocument();
	} );

	it( 'names the host switch and links to the support doc', () => {
		renderNotice( { settings: connected( { host_allows_ai: false } ) } );
		expect(
			screen.getByText( 'Jetpack AI is not available for this site.', IGNORE_A11Y )
		).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Learn more/ } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'source=jetpack-ai-hub-docs-wp-supports-ai' )
		);
	} );

	it( 'sends an unregistered site to the connection screen', () => {
		renderNotice( { blogId: 0 } );
		expect(
			screen.getByText( 'This site is not connected to WordPress.com.', IGNORE_A11Y )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Connect Jetpack' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Connect Jetpack' } ) ).toHaveAttribute(
			'href',
			'admin.php?page=my-jetpack#/connection'
		);
	} );

	it( 'keeps the connection notice off the views it does not own', () => {
		useConnectionErrorNotice.mockReturnValue( { hasConnectionError: true } );
		const { container } = renderNotice( { view: 'mcp' } );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'offers a link, not the connect button, when the site is registered already', () => {
		renderNotice( { settings: connected( { is_connected: false } ) } );
		expect( screen.queryByRole( 'button', { name: 'Connect Jetpack' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Connect Jetpack' } ) ).toHaveAttribute(
			'href',
			'admin.php?page=my-jetpack#/connection'
		);
	} );

	it( 'sends an unlinked account to the URL page data gave it', () => {
		renderNotice( {
			isUserConnected: false,
			userConnectionUrl: 'admin.php?page=jetpack#/connect-user',
		} );
		expect(
			screen.getByText( 'Your WordPress.com account isn’t connected.', IGNORE_A11Y )
		).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Connect account' } ) ).toHaveAttribute(
			'href',
			'admin.php?page=jetpack#/connect-user'
		);
	} );

	describe( 'the master switch notice', () => {
		const masterOff = { settings: connected( { master_enabled: false } ) };

		it( 'points at My Jetpack where My Jetpack is loaded', () => {
			renderNotice( masterOff );
			expect(
				screen.getByText( 'Jetpack AI is turned off for this site.', IGNORE_A11Y )
			).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: 'Manage in My Jetpack' } ) ).toHaveAttribute(
				'href',
				'admin.php?page=my-jetpack#/products'
			);
		} );

		it( 'points at the modules page where My Jetpack is not loaded', () => {
			renderNotice( {
				...masterOff,
				hasMyJetpack: false,
				manageUrl: 'admin.php?page=jetpack_modules',
			} );
			expect( screen.getByRole( 'link', { name: 'Manage in Jetpack modules' } ) ).toHaveAttribute(
				'href',
				'admin.php?page=jetpack_modules'
			);
			expect(
				screen.queryByRole( 'link', { name: 'Manage in My Jetpack' } )
			).not.toBeInTheDocument();
		} );
	} );
} );
