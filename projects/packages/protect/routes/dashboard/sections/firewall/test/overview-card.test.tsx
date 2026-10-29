import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { select } from '@wordpress/data';
import { check } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { recordViewOnce } from '../../../data/tracks';
import { runFirewallTest } from '../firewall-test';
import FirewallOverviewCard, {
	BLOCKS_REFRESH_INTERVAL,
	resetFirewallBlocks,
} from '../overview-card';
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
		blockedToday: 1,
		blockedLast30Days: 1,
		recentBlocks: [],
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
	blockedToday: count,
	blockedLast30Days: count,
	recentBlocks,
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

		expect(
			screen.getByRole( 'button', { name: 'Edit block list 2 addresses on the list' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Edit allow list 0 addresses on the list' } )
		).toBeInTheDocument();
	} );

	it( 'saves an edited block list from its dialog', async () => {
		render( <FirewallOverviewCard { ...props } /> );

		await userEvent.click( screen.getByRole( 'button', { name: /^Edit block list/ } ) );
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

		await userEvent.click( screen.getByRole( 'button', { name: /^Edit allow list/ } ) );
		const dialog = await screen.findByRole( 'dialog', { name: 'Always allowed IP addresses' } );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Add it to the list' } ) );

		expect( within( dialog ).getByRole( 'textbox', { name: 'IP addresses' } ) ).toHaveValue(
			'192.0.2.44'
		);
		expect( dialog ).toHaveTextContent( 'Already on this list' );
	} );
	it( 'turns the firewall on from the card while it is off, even before anything is blocked', async () => {
		render(
			<FirewallOverviewCard
				{ ...props }
				state={ { ...props.state, active: false, blockedCount: 0, blockedLast30Days: 0 } }
			/>
		);
		expect( screen.queryByText( 'No requests blocked yet' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Run test' } ) ).toBeInTheDocument();

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
			<FirewallOverviewCard { ...props } state={ { ...props.state, blockedLast30Days: 1234 } } />
		);
		document.documentElement.lang = '';

		expect( screen.getByText( /^1.?234$/ ) ).toBeInTheDocument();
	} );

	it( 'shows the last 30 days of blocks, with a log of the recent ones', async () => {
		render(
			<FirewallOverviewCard
				{ ...props }
				state={ {
					...props.state,
					blockedLast30Days: 45,
					blockedCount: 678,
					recentBlocks: [
						{ id: 1, timestamp: '2026-10-09T16:54:03Z', ruleId: -1, reason: 'ip block list' },
					],
				} }
			/>
		);

		// The label's text runs straight into its value's.
		expect( document.body ).toHaveTextContent( 'Blocked in the last 30 days45' );
		await userEvent.click( screen.getByRole( 'button', { name: 'View log' } ) );
		await expect(
			screen.findByRole( 'dialog', { name: 'Recently blocked requests' } )
		).resolves.toHaveTextContent( 'Blocked IP address' );
	} );

	it( 'updates the count from the refresh after a test', async () => {
		( runFirewallTest as jest.Mock ).mockResolvedValue( BLOCKED );
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( {
			blockedCount: 90,
			blockedToday: 4,
			blockedLast30Days: 56,
			recentBlocks: [],
		} );
		render( <FirewallOverviewCard { ...props } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Run test' } ) );

		expect( document.body ).toHaveTextContent( 'Blocked in the last 30 days56' );
	} );

	describe( 'without a reload', () => {
		const setHidden = ( hidden: boolean ) => {
			Object.defineProperty( document, 'hidden', { configurable: true, value: hidden } );
			act( () => document.dispatchEvent( new Event( 'visibilitychange' ) ) );
		};
		const tick = () => act( async () => jest.advanceTimersByTime( BLOCKS_REFRESH_INTERVAL ) );

		beforeEach( () => {
			jest.useFakeTimers();
			( apiFetch as unknown as jest.Mock ).mockReset().mockResolvedValue( refreshed( 56 ) );
		} );
		afterEach( () => {
			jest.useRealTimers();
			Object.defineProperty( document, 'hidden', { configurable: true, value: false } );
		} );

		it( 'refreshes the counts while the page stays open, pausing in a background tab', async () => {
			render( <FirewallOverviewCard { ...props } /> );
			setHidden( true );
			await tick();
			expect( apiFetch ).not.toHaveBeenCalled();

			setHidden( false );
			await waitFor( () =>
				expect( document.body ).toHaveTextContent( 'Blocked in the last 30 days56' )
			);

			( apiFetch as unknown as jest.Mock ).mockResolvedValue( refreshed( 57 ) );
			await tick();
			expect( document.body ).toHaveTextContent( 'Blocked in the last 30 days57' );
		} );

		it( 'refreshes the counts when the firewall is turned on', async () => {
			const off = { ...props.state!, active: false };
			const { rerender } = render( <FirewallOverviewCard { ...props } state={ off } /> );

			rerender(
				<FirewallOverviewCard
					{ ...props }
					state={ off }
					settings={ { ...props.settings, settings: { waf: true } } }
				/>
			);

			await waitFor( () =>
				expect( document.body ).toHaveTextContent( 'Blocked in the last 30 days56' )
			);
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/jetpack/v4/protect-dashboard/firewall/blocks',
			} );
		} );
	} );

	it( 'leaves the empty state for the counts once its test logs a block, keeping focus on Run test', async () => {
		( runFirewallTest as jest.Mock ).mockResolvedValue( BLOCKED );
		( apiFetch as unknown as jest.Mock ).mockResolvedValue(
			refreshed( 1, [ { id: 1, timestamp: '', ruleId: -2, reason: 'firewall test' } ] )
		);
		render(
			<FirewallOverviewCard
				{ ...props }
				state={ { ...props.state, blockedCount: 0, blockedToday: 0, blockedLast30Days: 0 } }
			/>
		);
		expect( screen.getByText( 'No requests blocked yet' ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Run test' } ) );

		expect( screen.queryByText( 'No requests blocked yet' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Run test' } ) ).toHaveFocus();
		expect( document.body ).toHaveTextContent( 'Blocked in the last 30 days1' );
	} );

	it( 'leaves focus alone when it moved on before the test finished', async () => {
		let finish: ( value: unknown ) => void = () => {};
		( runFirewallTest as jest.Mock ).mockReturnValue(
			new Promise( resolve => ( finish = resolve ) )
		);
		( apiFetch as unknown as jest.Mock ).mockResolvedValue(
			refreshed( 1, [ { id: 1, timestamp: '', ruleId: -2, reason: 'firewall test' } ] )
		);
		render( <FirewallOverviewCard { ...props } state={ { ...props.state, blockedCount: 0 } } /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Run test' } ) );
		const editBlockList = screen.getByRole( 'button', { name: /^Edit block list/ } );
		act( () => editBlockList.focus() );

		await act( async () => finish( BLOCKED ) );

		expect( screen.queryByText( 'No requests blocked yet' ) ).not.toBeInTheDocument();
		expect( editBlockList ).toHaveFocus();
	} );

	it.each( [ 'after', 'before' ] )(
		'keeps a test’s counts when the card comes back from a tab switch %s the test finishes',
		async when => {
			let finish: ( value: unknown ) => void = () => {};
			( runFirewallTest as jest.Mock ).mockReturnValue(
				new Promise( resolve => ( finish = resolve ) )
			);
			( apiFetch as unknown as jest.Mock ).mockResolvedValue( refreshed( 1 ) );
			const state = { ...props.state, blockedCount: 0, blockedLast30Days: 0 };
			const { unmount } = render( <FirewallOverviewCard { ...props } state={ state } /> );
			await userEvent.click( screen.getByRole( 'button', { name: 'Run test' } ) );
			if ( when === 'after' ) {
				await act( async () => finish( BLOCKED ) );
			}

			unmount();
			render( <FirewallOverviewCard { ...props } state={ state } /> );
			await act( async () => finish( BLOCKED ) );

			expect( screen.queryByText( 'No requests blocked yet' ) ).not.toBeInTheDocument();
			expect( document.body ).toHaveTextContent( 'Blocked in the last 30 days1' );
		}
	);

	it.each( [
		[ 'never had automatic rules', null, 'Let your firewall keep up with new attacks', {} ],
		[
			'rules stopped updating',
			1773446400,
			'Your automatic firewall rules have stopped updating',
			{ state: 'stopped' },
		],
	] )( 'sells automatic rules for a site that %s', ( _, rulesUpdatedAt, heading, eventProps ) => {
		render( <FirewallOverviewCard { ...props } state={ { ...props.state, rulesUpdatedAt } } /> );

		expect( screen.getByText( heading ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Upgrade/ } ) ).toHaveAttribute( 'href', '#upgrade' );
		expect( recordViewOnce ).toHaveBeenLastCalledWith(
			'jetpack_protect_dashboard_firewall_upsell_view',
			eventProps
		);
	} );

	it( 'sells automatic rules again once the Settings tab turns them off', () => {
		render(
			<FirewallOverviewCard
				{ ...props }
				state={ { ...props.state, rulesUpdatedAt: 1773446400 } }
				settings={ {
					...props.settings,
					settings: { waf: true, jetpack_waf_automatic_rules: false },
				} }
			/>
		);

		expect( screen.getByText( 'Let your firewall keep up with new attacks' ) ).toBeInTheDocument();
		expect(
			screen.queryByText( 'Your automatic firewall rules have stopped updating' )
		).not.toBeInTheDocument();
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

	it( 'opens the Settings tab at its own card', async () => {
		const openTab = jest.fn();
		render( <FirewallOverviewCard { ...props } openTab={ openTab } /> );

		await userEvent.setup().click( screen.getByRole( 'link', { name: 'Configure Firewall' } ) );

		expect( openTab ).toHaveBeenCalledWith( 'settings', { section: 'firewall' } );
	} );
} );
