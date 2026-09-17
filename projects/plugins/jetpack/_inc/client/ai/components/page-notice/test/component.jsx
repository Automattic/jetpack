import { render, screen } from '@testing-library/react';
import PageNotice, { getPageNoticeState } from '../index';

jest.mock( '@automattic/jetpack-connection', () => ( {
	ConnectionError: () => <div data-testid="connection-error" />,
} ) );

const IGNORE_A11Y = { ignore: 'script, style, .a11y-speak-region' };

// Every input is page data now; the resolver never reads the settings response.
const resolve = ( overrides = {} ) =>
	getPageNoticeState( {
		view: 'overview',
		blogId: 1,
		isUserConnected: true,
		isConnected: true,
		isOfflineMode: false,
		hostAllowsAi: true,
		masterEnabled: true,
		masterForcedOff: '',
		hasConnectionError: false,
		...overrides,
	} );

describe( 'getPageNoticeState', () => {
	it( 'returns nothing when the site is connected and AI is on', () => {
		expect( resolve() ).toBeNull();
	} );

	describe( 'one state at a time', () => {
		it( 'reports the host switch', () => {
			expect( resolve( { hostAllowsAi: false } ) ).toBe( 'host-off' );
		} );

		it.each( [ 'filter', 'modules' ] )( 'reports the %s route custom code took', route => {
			expect( resolve( { masterForcedOff: route } ) ).toBe( 'forced-off' );
		} );

		it( 'reports offline mode ahead of the connection it disables', () => {
			expect( resolve( { isOfflineMode: true, isConnected: false } ) ).toBe( 'offline-mode' );
		} );

		it( 'reports a disconnected site from page data', () => {
			expect( resolve( { isConnected: false } ) ).toBe( 'site-disconnected' );
		} );

		it( 'reports a site with no blog ID', () => {
			expect( resolve( { blogId: 0 } ) ).toBe( 'site-disconnected' );
		} );

		it( 'reports a site with no connected owner', () => {
			expect( resolve( { isConnected: false } ) ).toBe( 'site-disconnected' );
		} );

		it( 'reports an unlinked account from page data', () => {
			expect( resolve( { isUserConnected: false } ) ).toBe( 'user-unlinked' );
		} );

		it( 'reports the master switch', () => {
			expect( resolve( { masterEnabled: false } ) ).toBe( 'master-off' );
		} );
	} );

	describe( 'offline mode outranks the states it explains', () => {
		it.each( [
			[ 'a broken connection', { hasConnectionError: true } ],
			[ 'the host switch', { hostAllowsAi: false } ],
			[ 'a disconnected site', { isConnected: false } ],
		] )( 'beats %s', ( _label, overrides ) => {
			expect( resolve( { isOfflineMode: true, ...overrides } ) ).toBe( 'offline-mode' );
		} );
	} );

	describe( 'a connection the site cannot use', () => {
		it( 'outranks every other state', () => {
			expect(
				resolve( {
					hasConnectionError: true,
					blogId: 0,
					hostAllowsAi: false,
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
					isConnected: false,
					hostAllowsAi: false,
					masterEnabled: false,
				} )
			).toBe( 'host-off' );
		} );

		it( 'a disconnected site beats an unlinked account', () => {
			expect( resolve( { blogId: 0, isUserConnected: false } ) ).toBe( 'site-disconnected' );
		} );

		it( 'a disconnected site beats the master switch', () => {
			expect( resolve( { blogId: 0, masterEnabled: false } ) ).toBe( 'site-disconnected' );
		} );

		it( 'an unlinked account beats the master switch', () => {
			expect( resolve( { isUserConnected: false, masterEnabled: false } ) ).toBe( 'user-unlinked' );
		} );

		describe( 'code holding AI off', () => {
			// It outranks these three because none of their remedies would work:
			// connecting, linking or flipping the master leaves AI off.
			it.each( [
				[ 'a disconnected site', { blogId: 0, isConnected: false } ],
				[ 'an unlinked account', { isUserConnected: false } ],
				[ 'the master switch', { masterEnabled: false } ],
			] )( 'beats %s', ( _label, overrides ) => {
				expect( resolve( { masterForcedOff: 'modules', ...overrides } ) ).toBe( 'forced-off' );
			} );

			// And loses to these, each of which is the fuller answer.
			it.each( [
				[ 'the host switch', { hostAllowsAi: false }, 'host-off' ],
				[ 'offline mode', { isOfflineMode: true }, 'offline-mode' ],
				[ 'a broken connection', { hasConnectionError: true }, 'connection-error' ],
			] )( 'loses to %s', ( _label, overrides, expected ) => {
				expect( resolve( { masterForcedOff: 'filter', ...overrides } ) ).toBe( expected );
			} );
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

	describe( 'with only the defaults page data gives it', () => {
		it( 'uses the blog ID from page data so a disconnected site is named at once', () => {
			expect( resolve( { blogId: 0 } ) ).toBe( 'site-disconnected' );
		} );

		it( 'names an unlinked account from page data too', () => {
			expect( resolve( { isUserConnected: false } ) ).toBe( 'user-unlinked' );
		} );

		it( 'claims nothing it cannot yet know', () => {
			expect( resolve() ).toBeNull();
		} );
	} );
} );

describe( 'PageNotice', () => {
	// The component renders one resolved state; getPageNoticeState decides which,
	// and is tested on its own above.
	const renderNotice = ( { state = null, ...overrides } = {} ) =>
		render(
			<PageNotice
				state={ state }
				userConnectionUrl="admin.php?page=my-jetpack#/connection"
				manageUrl="admin.php?page=my-jetpack#/products"
				hasMyJetpack={ true }
				{ ...overrides }
			/>
		);

	it( 'renders nothing when there is nothing to say', () => {
		const { container } = renderNotice();
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'hands a broken connection to the shared connection notice', () => {
		renderNotice( { state: 'connection-error' } );
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
		renderNotice( { state: 'host-off' } );
		expect(
			screen.getByText( 'Jetpack AI is not available for this site.', IGNORE_A11Y )
		).toBeInTheDocument();
		const learnMore = screen.getByRole( 'link', { name: /Learn more/ } );
		expect( learnMore ).toHaveAttribute(
			'href',
			expect.stringContaining( 'source=jetpack-ai-hub-notice-host-off' )
		);
		expect( learnMore ).toHaveAttribute( 'target', '_blank' );
	} );

	describe( 'the custom-code notice', () => {
		const COPY = 'Jetpack AI is turned off by custom code on this site.';
		const DETAIL = 'It can’t be turned on from here.';

		it( 'links to the AI filter when that is the route taken', () => {
			renderNotice( { state: 'forced-off', masterForcedOff: 'filter' } );
			expect( screen.getByText( COPY, IGNORE_A11Y ) ).toBeInTheDocument();
			expect( screen.getByText( DETAIL, IGNORE_A11Y ) ).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: /Learn more/ } ) ).toHaveAttribute(
				'href',
				expect.stringContaining( 'source=jetpack-ai-hub-notice-forced-off-filter' )
			);
		} );

		it( 'links to the module hooks when a module filter is the route taken', () => {
			renderNotice( { state: 'forced-off', masterForcedOff: 'modules' } );
			expect( screen.getByText( COPY, IGNORE_A11Y ) ).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: /Learn more/ } ) ).toHaveAttribute(
				'href',
				expect.stringContaining( 'source=jetpack-ai-hub-notice-forced-off-modules' )
			);
		} );

		it( 'offers no switch, since none would work', () => {
			renderNotice( { state: 'forced-off', masterForcedOff: 'modules' } );
			expect( screen.queryByRole( 'link', { name: /Manage in/ } ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'names offline mode rather than asking for a connection it forbids', () => {
		renderNotice( { state: 'offline-mode' } );
		expect(
			screen.getByText( 'Jetpack AI is not available in offline mode.', IGNORE_A11Y )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Connect Jetpack' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Learn more/ } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'source=jetpack-support-development-mode' )
		);
	} );

	it( 'sends an unregistered site to the connection screen', () => {
		renderNotice( { state: 'site-disconnected' } );
		expect(
			screen.getByText( 'This site is not connected to WordPress.com.', IGNORE_A11Y )
		).toBeInTheDocument();
		// The disconnected reader is the likeliest to think their toggles were wiped.
		expect(
			screen.getByText( 'Your saved settings will apply once the site is connected.', IGNORE_A11Y )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Connect Jetpack' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Connect Jetpack' } ) ).toHaveAttribute(
			'href',
			'admin.php?page=my-jetpack#/connection'
		);
	} );

	it( 'survives swapping from one state to another while mounted', () => {
		const { rerender } = renderNotice( { state: 'host-off' } );
		expect(
			screen.getByText( 'Jetpack AI is not available for this site.', IGNORE_A11Y )
		).toBeInTheDocument();

		rerender(
			<PageNotice
				state="master-off"
				userConnectionUrl="admin.php?page=my-jetpack#/connection"
				manageUrl="admin.php?page=my-jetpack#/products"
				hasMyJetpack={ true }
			/>
		);

		expect(
			screen.getByText( 'Jetpack AI is turned off for this site.', IGNORE_A11Y )
		).toBeInTheDocument();
		expect(
			screen.queryByText( 'Jetpack AI is not available for this site.', IGNORE_A11Y )
		).not.toBeInTheDocument();
	} );

	it( 'offers a link, not the connect button, when the site is registered already', () => {
		renderNotice( { state: 'site-disconnected' } );
		expect( screen.queryByRole( 'button', { name: 'Connect Jetpack' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Connect Jetpack' } ) ).toHaveAttribute(
			'href',
			'admin.php?page=my-jetpack#/connection'
		);
	} );

	it( 'sends an unlinked account to the URL page data gave it', () => {
		renderNotice( {
			state: 'user-unlinked',
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
		const masterOff = { state: 'master-off' };

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
