import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { select } from '@wordpress/data';
import { check } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { recordViewOnce } from '../../../data/tracks';
import useProtectSettings from '../../../data/use-protect-settings';
import { runFirewallTest } from '../firewall-test';
import FirewallOverviewCard, { resetFirewallBlocks } from '../overview-card';
import type { FirewallContext } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '../../../data/tracks' );
jest.mock( '../firewall-test', () => ( {
	...jest.requireActual( '../firewall-test' ),
	runFirewallTest: jest.fn(),
} ) );

const props = {
	state: {
		available: true,
		active: true,
		blockedCount: 1,
		blockedLast30Days: 1,
		recentBlocks: [],
		hasBlocked: true,
		lastTestAt: null,
		hasScan: false,
		upgradeUrl: '#upgrade',
		currentIp: '192.0.2.44',
		ipRules: {
			jetpack_waf_ip_block_list: '203.0.113.7\n203.0.113.8',
			jetpack_waf_ip_block_list_enabled: true,
			jetpack_waf_ip_allow_list: '',
			jetpack_waf_ip_allow_list_enabled: false,
		},
		rulesUpdatedAt: null,
	},
	settings: {
		settings: null,
		error: null,
		isSaving: () => false,
		save: jest.fn().mockResolvedValue( true ),
	},
	openTab: jest.fn(),
} as unknown as FirewallContext;

const refreshed = ( count: number, recentBlocks: unknown[] = [] ) => ( {
	blockedCount: count,
	blockedLast30Days: count,
	recentBlocks,
	hasBlocked: true,
	lastTestAt: null,
} );

const BLOCKED = {
	outcome: 'blocked',
	url: 'https://example.com/?jetpack_waf_test=93571da44ce07839f080f22ce422c11b',
	status: 403,
	statusText: '',
	wafHeader: '403 - rule -2',
	allowedHeader: null,
};

describe( 'FirewallOverviewCard', () => {
	beforeEach( resetFirewallBlocks );

	it.each( [
		[ 'Active', true, /Your host provides a firewall/ ],
		[ 'Unavailable', false, /isn’t available on your site/ ],
	] )(
		'shows %s, with nothing to test, where Jetpack’s firewall can’t run (host firewall: %s)',
		( badge, providedByHost, message ) => {
			render(
				<FirewallOverviewCard
					{ ...props }
					state={ { ...props.state!, available: false, active: false, providedByHost } }
				/>
			);

			expect( screen.getByText( badge ) ).toBeInTheDocument();
			expect( screen.getByText( message ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: 'Run test' } ) ).not.toBeInTheDocument();
		}
	);

	it( 'reports the test in a snackbar whose Learn more opens the steps', async () => {
		( runFirewallTest as jest.Mock ).mockResolvedValue( BLOCKED );
		( apiFetch as unknown as jest.Mock ).mockResolvedValue(
			refreshed( 2, [ { id: 1, timestamp: '', ruleId: -2, reason: 'firewall test' } ] )
		);
		render( <FirewallOverviewCard { ...props } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Run test' } ) );

		const [ notice ] = select( noticesStore ).getNotices();
		expect( notice ).toMatchObject( {
			type: 'snackbar',
			content: 'The firewall blocked the test request. It’s working.',
			explicitDismiss: true,
			icon: expect.objectContaining( { props: expect.objectContaining( { icon: check } ) } ),
		} );
		await act( async () => notice.actions[ 0 ].onClick() );

		const dialog = await screen.findByRole( 'dialog', { name: 'How the firewall test works' } );
		expect( dialog ).toHaveTextContent( '403 Forbidden' );
		expect( dialog ).toHaveTextContent( 'X-JetpackWAF-Blocked: 403 - rule -2' );
		expect( dialog ).toHaveTextContent( 'Logged the block' );
	} );

	it( 'counts the IP lists from page load before settings are fetched', () => {
		render( <FirewallOverviewCard { ...props } /> );

		expect( screen.getByText( '2 addresses on the list' ) ).toBeInTheDocument();
		expect( screen.getByText( '0 addresses on the list' ) ).toBeInTheDocument();
	} );

	it( 'saves an edited block list from its dialog', async () => {
		render( <FirewallOverviewCard { ...props } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Edit block list' } ) );
		const dialog = await screen.findByRole( 'dialog', { name: 'Blocked IP addresses' } );
		const field = within( dialog ).getByRole( 'textbox', { name: 'IP addresses' } );
		expect( field ).toHaveValue( '203.0.113.7\n203.0.113.8' );
		await userEvent.clear( field );
		await userEvent.type( field, '198.51.100.1' );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Save' } ) );

		expect( props.settings.save ).toHaveBeenCalledWith( {
			jetpack_waf_ip_block_list: '198.51.100.1',
		} );
	} );
	it( 'offers the visitor’s own address in the allow list dialog', async () => {
		render( <FirewallOverviewCard { ...props } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Edit allow list' } ) );
		const dialog = await screen.findByRole( 'dialog', { name: 'Always allowed IP addresses' } );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Add it to the list' } ) );

		expect( within( dialog ).getByRole( 'textbox', { name: 'IP addresses' } ) ).toHaveValue(
			'192.0.2.44'
		);
		expect( dialog ).toHaveTextContent( 'Already on this list' );
	} );
	it( 'turns the firewall on from the card while it is off', async () => {
		render( <FirewallOverviewCard { ...props } state={ { ...props.state, active: false } } /> );

		await userEvent.click( screen.getByRole( 'switch', { name: 'Enable firewall' } ) );

		expect( props.settings.save ).toHaveBeenCalledWith( { waf: true } );
	} );
	it( 'explains a test the IP allow list let through', async () => {
		( runFirewallTest as jest.Mock ).mockResolvedValue( {
			outcome: 'allowed',
			url: 'https://example.com/?jetpack_waf_test=93571da44ce07839f080f22ce422c11b',
			status: 200,
			statusText: '',
			wafHeader: null,
			allowedHeader: 'ip allow list',
		} );
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( refreshed( 1 ) );
		render( <FirewallOverviewCard { ...props } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Run test' } ) );

		const notice = select( noticesStore )
			.getNotices()
			.find( ( { content } ) => content.includes( 'always-allowed list' ) );
		expect( notice ).toMatchObject( { status: 'info', explicitDismiss: true } );
		await act( async () => notice.actions[ 0 ].onClick() );

		const dialog = await screen.findByRole( 'dialog', { name: 'How the firewall test works' } );
		expect( dialog ).toHaveTextContent( 'X-JetpackWAF-Test-Allowed: ip allow list' );
		expect( dialog ).toHaveTextContent( 'the firewall let the request through' );
	} );

	it( 'keeps the test’s result when the blocked requests can’t be refreshed', async () => {
		( runFirewallTest as jest.Mock ).mockResolvedValue( BLOCKED );
		( apiFetch as unknown as jest.Mock ).mockRejectedValue( { code: 'fetch_error' } );
		render( <FirewallOverviewCard { ...props } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Run test' } ) );

		const [ notice ] = select( noticesStore ).getNotices();
		expect( notice.content ).toBe( 'The firewall blocked the test request. It’s working.' );
		await act( async () => notice.actions[ 0 ].onClick() );
		const dialog = await screen.findByRole( 'dialog', { name: 'How the firewall test works' } );
		expect( dialog ).not.toHaveTextContent( /Logged the block|Nothing was logged/ );
	} );

	it.each( [
		[
			'a REST error’s own message',
			{ code: 'firewall_test_unavailable', message: 'Update Jetpack to test the firewall.' },
			'Update Jetpack to test the firewall.',
		],
		[
			'a generic message for a failed connection',
			{ code: 'fetch_error', message: 'Could not get a valid response from the server.' },
			'The firewall test couldn’t run. Try again.',
		],
	] )( 'reports a test that couldn’t start with %s', async ( _name, error, expected ) => {
		( runFirewallTest as jest.Mock ).mockRejectedValue( error );
		render( <FirewallOverviewCard { ...props } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Run test' } ) );

		expect( select( noticesStore ).getNotices()[ 0 ].content ).toBe( expected );
	} );

	it( 'takes its snackbar along when the tab changes, as Learn more opens this card’s dialog', async () => {
		( runFirewallTest as jest.Mock ).mockResolvedValue( BLOCKED );
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( refreshed( 2 ) );
		const { unmount } = render( <FirewallOverviewCard { ...props } /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Run test' } ) );

		unmount();

		expect( select( noticesStore ).getNotices() ).toHaveLength( 0 );
	} );

	it( 'drops a test that finishes after the card is gone', async () => {
		let finish: ( value: unknown ) => void = () => {};
		( runFirewallTest as jest.Mock ).mockReturnValue(
			new Promise( resolve => ( finish = resolve ) )
		);
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( refreshed( 2 ) );
		const { unmount } = render( <FirewallOverviewCard { ...props } /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Run test' } ) );

		unmount();
		await act( async () => finish( BLOCKED ) );

		expect( select( noticesStore ).getNotices() ).toHaveLength( 0 );
	} );

	it( 'renders the count for a WordPress locale that Intl rejects', () => {
		document.documentElement.lang = 'pt-PT-ao90';
		render(
			<FirewallOverviewCard { ...props } state={ { ...props.state, blockedCount: 1234 } } />
		);
		document.documentElement.lang = '';

		expect( screen.getByText( '1.2K' ) ).toHaveAttribute( 'title', '1,234' );
	} );

	it( 'shows each block count under its own label, and when the rules were updated', () => {
		render(
			<FirewallOverviewCard
				{ ...props }
				state={ {
					...props.state,
					blockedLast30Days: 45,
					blockedCount: 678,
					rulesUpdatedAt: 1760000000,
				} }
			/>
		);

		// Each label's text runs straight into its value's.
		expect( document.body ).toHaveTextContent(
			'Last 30 days blocked requests45All-time blocked requests678'
		);
		expect( document.body ).toHaveTextContent( 'Rules updated Oct 9, 2025' );
	} );

	it( 'updates every count from the refresh after a test', async () => {
		( runFirewallTest as jest.Mock ).mockResolvedValue( BLOCKED );
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( {
			blockedCount: 90,
			blockedLast30Days: 56,
			recentBlocks: [],
			hasBlocked: true,
			lastTestAt: null,
		} );
		render( <FirewallOverviewCard { ...props } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Run test' } ) );

		expect( document.body ).toHaveTextContent(
			'Last 30 days blocked requests56All-time blocked requests90'
		);
	} );

	it.each( [ 'after', 'before' ] )(
		'keeps a test’s counts when the card comes back from a tab switch %s the test finishes',
		async when => {
			let finish: ( value: unknown ) => void = () => {};
			( runFirewallTest as jest.Mock ).mockReturnValue(
				new Promise( resolve => ( finish = resolve ) )
			);
			( apiFetch as unknown as jest.Mock ).mockResolvedValue( refreshed( 56 ) );
			const { unmount } = render( <FirewallOverviewCard { ...props } /> );
			await userEvent.click( screen.getByRole( 'button', { name: 'Run test' } ) );
			if ( when === 'after' ) {
				await act( async () => finish( BLOCKED ) );
			}

			unmount();
			render( <FirewallOverviewCard { ...props } /> );
			await act( async () => finish( BLOCKED ) );

			expect( document.body ).toHaveTextContent( 'Last 30 days blocked requests56' );
		}
	);

	it( 'drops the rules date once the Settings tab turns the rules off', () => {
		render(
			<FirewallOverviewCard
				{ ...props }
				state={ { ...props.state, rulesUpdatedAt: 1760000000 } }
				settings={ {
					...props.settings,
					settings: { waf: true, jetpack_waf_automatic_rules: false },
				} }
			/>
		);

		expect( screen.queryByText( /Rules updated/ ) ).not.toBeInTheDocument();
	} );

	it( 'sells automatic rules to a site whose rules stopped updating', () => {
		render(
			<FirewallOverviewCard { ...props } state={ { ...props.state, rulesUpdatedAt: 1773446400 } } />
		);

		expect(
			screen.getByText( 'Your automatic firewall rules have stopped updating' )
		).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Upgrade/ } ) ).toHaveAttribute( 'href', '#upgrade' );
		expect( recordViewOnce ).toHaveBeenLastCalledWith(
			'jetpack_protect_dashboard_firewall_upsell_view',
			{ state: 'stopped' }
		);
	} );

	it( 'sells nothing to a working free site that never had automatic rules', () => {
		render( <FirewallOverviewCard { ...props } /> );

		expect( screen.queryByRole( 'link', { name: /Upgrade/ } ) ).not.toBeInTheDocument();
	} );

	it.each( [ null, 1773446400 ] )(
		'sells nothing to a site with Scan (rules updated at %s)',
		rulesUpdatedAt => {
			render(
				<FirewallOverviewCard
					{ ...props }
					state={ { ...props.state, hasScan: true, rulesUpdatedAt } }
				/>
			);

			expect( screen.queryByRole( 'link', { name: /Upgrade/ } ) ).not.toBeInTheDocument();
		}
	);

	const HOUR_AGO = new Date( Date.now() - 3600000 ).toISOString();
	const noBlocks = ( state = {} ) => ( {
		...props.state,
		blockedCount: 0,
		blockedLast30Days: 0,
		hasBlocked: false,
		...state,
	} );
	const EMPTY_LIST = { ...props.state.ipRules, jetpack_waf_ip_block_list: '' };

	it( 'keeps the block list dialog open with its error when the save fails', async () => {
		( apiFetch as unknown as jest.Mock ).mockImplementation( ( { method, path } ) => {
			if ( method === 'POST' ) {
				return Promise.reject( { message: 'Nope' } );
			}
			return Promise.resolve( path === '/jetpack/v4/settings' ? { waf: true, ...EMPTY_LIST } : {} );
		} );
		const Live = () => (
			<FirewallOverviewCard
				{ ...props }
				state={ noBlocks( { ipRules: EMPTY_LIST } ) }
				settings={ useProtectSettings() }
			/>
		);
		render( <Live /> );

		await userEvent.click( await screen.findByRole( 'button', { name: 'Add IPs to list' } ) );
		const dialog = await screen.findByRole( 'dialog', { name: 'Blocked IP addresses' } );
		await userEvent.type( within( dialog ).getByRole( 'textbox' ), '198.51.100.1' );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Save' } ) );

		await expect( within( dialog ).findByText( 'Nope' ) ).resolves.toBeInTheDocument();
		expect( within( dialog ).getByRole( 'textbox' ) ).toHaveValue( '198.51.100.1' );
	} );

	it( 'offers to turn on a free site’s block list that has addresses but is off', async () => {
		render(
			<FirewallOverviewCard
				{ ...props }
				state={ noBlocks( {
					ipRules: { ...props.state.ipRules, jetpack_waf_ip_block_list_enabled: false },
				} ) }
			/>
		);

		expect(
			screen.getByRole( 'heading', { name: 'Your block list is turned off' } )
		).toBeVisible();
		await userEvent.click( screen.getByRole( 'button', { name: 'Turn on and edit list' } ) );
		const dialog = await screen.findByRole( 'dialog', { name: 'Blocked IP addresses' } );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Save' } ) );

		expect( props.settings.save ).toHaveBeenCalledWith( {
			jetpack_waf_ip_block_list: '203.0.113.7\n203.0.113.8',
			jetpack_waf_ip_block_list_enabled: true,
		} );
	} );

	it.each( [
		[ 'an empty block list', EMPTY_LIST, 'No IPs added to block list', 'Add IPs to block' ],
		[
			'a block list that is off',
			{ ...props.state.ipRules, jetpack_waf_ip_block_list_enabled: false },
			'Your block list is turned off',
			'Turn on and edit list',
		],
	] )(
		'warns a free site with blocks but nothing left to block with, given %s',
		async ( _, ipRules, title, button ) => {
			render( <FirewallOverviewCard { ...props } state={ { ...props.state, ipRules } } /> );

			expect( screen.getByText( title ) ).toBeInTheDocument();
			expect( screen.getByText( 'Last 30 days blocked requests' ) ).toBeInTheDocument();
			await userEvent.click( screen.getByRole( 'button', { name: button } ) );
			await expect(
				screen.findByRole( 'dialog', { name: 'Blocked IP addresses' } )
			).resolves.toBeInTheDocument();
		}
	);

	it.each( [
		[ 'with Scan', { hasScan: true } ],
		[ 'whose automatic rules still block', { rulesUpdatedAt: 1773446400 } ],
		[ 'with addresses on its block list', {} ],
	] )( 'doesn’t warn a site %s that it has nothing to block', ( _, state ) => {
		render( <FirewallOverviewCard { ...props } state={ { ...props.state, ...state } } /> );

		expect( screen.queryByText( /Your firewall has nothing to block/ ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'addresses on its block list', props.state.ipRules ],
		[ 'an empty block list', EMPTY_LIST ],
	] )(
		'still warns a free site in an empty state, with %s, that its rules stopped updating',
		( _, ipRules ) => {
			render(
				<FirewallOverviewCard
					{ ...props }
					state={ noBlocks( { rulesUpdatedAt: 1773446400, ipRules } ) }
				/>
			);

			expect( screen.getByRole( 'heading', { name: 'No requests blocked yet' } ) ).toBeVisible();
			expect(
				screen.getByText( 'Your automatic firewall rules have stopped updating' )
			).toBeInTheDocument();
		}
	);

	it( 'asks a free site with no blocked IPs to add some or upgrade', async () => {
		render( <FirewallOverviewCard { ...props } state={ noBlocks( { ipRules: EMPTY_LIST } ) } /> );

		expect( screen.getByRole( 'heading', { name: 'No IPs added to block list' } ) ).toBeVisible();
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toHaveAttribute( 'href', '#upgrade' );
		expect( screen.queryByRole( 'button', { name: 'Edit block list' } ) ).not.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Add IPs to list' } ) );
		const dialog = await screen.findByRole( 'dialog', { name: 'Blocked IP addresses' } );
		await userEvent.type( within( dialog ).getByRole( 'textbox' ), '198.51.100.1' );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Save' } ) );

		expect( props.settings.save ).toHaveBeenCalledWith( {
			jetpack_waf_ip_block_list: '198.51.100.1',
		} );
	} );

	it.each( [
		[ 'before a test', null, 'Get started by testing your firewall', false ],
		[
			'after a test',
			HOUR_AGO,
			'The latest test ran an hour ago. No other requests have been blocked yet.',
			true,
		],
	] )(
		'offers a test in place of the counts when nothing was blocked, %s',
		( _, lastTestAt, copy, tested ) => {
			render(
				<FirewallOverviewCard
					{ ...props }
					state={ noBlocks( { blockedCount: lastTestAt ? 12 : 0, lastTestAt } ) }
				/>
			);

			expect( screen.getByRole( 'heading', { name: 'No requests blocked yet' } ) ).toBeVisible();
			expect( document.body ).toHaveTextContent( copy );
			expect( screen.getAllByRole( 'button', { name: 'Run test' } ) ).toHaveLength( 1 );
			expect( screen.queryByText( 'Blocked today' ) ).not.toBeInTheDocument();
			expect( !! screen.queryByText( 'Latest test ran an hour ago' ) ).toBe( tested );
			expect( screen.getByRole( 'button', { name: 'Edit block list' } ) ).toBeVisible();
		}
	);

	it( 'shows the test it ran from the empty state, still with nothing else blocked', async () => {
		( runFirewallTest as jest.Mock ).mockResolvedValue( BLOCKED );
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( {
			...refreshed( 1 ),
			hasBlocked: false,
			lastTestAt: HOUR_AGO,
		} );
		render( <FirewallOverviewCard { ...props } state={ noBlocks() } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Run test' } ) );

		expect( screen.getByText( 'Latest test ran an hour ago' ) ).toBeInTheDocument();
		expect( document.body ).toHaveTextContent( 'No other requests have been blocked yet.' );
	} );

	it( 'opens the Settings tab at its own card', async () => {
		const openTab = jest.fn();
		render( <FirewallOverviewCard { ...props } openTab={ openTab } /> );

		await userEvent.setup().click( screen.getByRole( 'link', { name: 'Configure Firewall' } ) );

		expect( openTab ).toHaveBeenCalledWith( 'settings', { section: 'firewall' } );
	} );
} );
