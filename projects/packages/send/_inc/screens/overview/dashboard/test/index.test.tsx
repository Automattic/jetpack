import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import { useSearch } from '@wordpress/route';
import { fetchLog, fetchUsage, sendTest } from '../../../../data/api';
import { addDays, siteToday } from '../../../../data/dates';
import { useStats } from '../../../../data/store';
import { RECORDS, lookup, lookupRow } from '../../setup/test/fixtures/status';
import Dashboard from '../index';
import { makeStats } from './fixtures/stats';
import type { DnsLookup, LogRow, SendStatus, Stats } from '../../../../data/types';
import type { ReactNode } from 'react';

const mockNavigate = jest.fn();
const mockLookup = jest.fn< DnsLookup | null, [] >( () => null );
jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
	useSearch: jest.fn(),
} ) );
jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );
type MockChartProps = {
	ariaLabel: string;
	data: { data: { date: Date; value: number }[] }[];
	options: { axis: { x: { tickValues: Date[]; tickFormat: ( value: Date ) => string } } };
	renderTooltip: ( params: object ) => ReactNode;
};
// Draws what the chart would: its bars, the labelled ticks, and the newest bar's tooltip.
jest.mock( '@automattic/charts', () => ( {
	BarChart: ( { ariaLabel, data, options, renderTooltip }: MockChartProps ) => {
		const points = data[ 0 ].data;
		const last = points[ points.length - 1 ];
		return (
			<div data-testid="chart" data-bars={ points.length }>
				{ ariaLabel }
				<span data-testid="ticks">
					{ options.axis.x.tickValues.map( tick => options.axis.x.tickFormat( tick ) ).join( '|' ) }
				</span>
				<span data-testid="tooltip">
					{ last && renderTooltip( { tooltipData: { nearestDatum: { datum: last } } } ) }
				</span>
			</div>
		);
	},
} ) );
jest.mock( '../../../../data/store', () => ( {
	...jest.requireActual( '../../../../data/store' ),
	useStats: jest.fn(),
} ) );
jest.mock( '../../../../data/api', () => ( {
	fetchLog: jest.fn(),
	fetchUsage: jest.fn( () => new Promise( () => undefined ) ),
	fetchStatus: jest.fn( () => new Promise( () => undefined ) ),
	sendTest: jest.fn( () => new Promise( () => undefined ) ),
	postAction: jest.fn( () => new Promise( () => undefined ) ),
	errorMessage: () => 'Something went wrong.',
} ) );
jest.mock( '../../../../components/onboarding/use-dns-polling', () => ( {
	useDnsPolling: () => ( {
		lookup: mockLookup(),
		checking: false,
		lastCheckedAt: null,
		error: null,
		checkNow: jest.fn(),
		nudge: jest.fn(),
	} ),
} ) );

/** Both records found with the wrong value, as when someone edits them after setup. */
const BOTH_WRONG = lookup( [
	lookupRow( { state: 'needs_fix', problem: 'wrong_value' } ),
	lookupRow( {
		purpose: 'dkim',
		name: 'jpsend._domainkey.example.com',
		host: 'jpsend._domainkey',
		state: 'needs_fix',
		problem: 'wrong_value',
	} ),
] );

const account = {
	handle: 'jpsend1',
	lockdown_auth_id: 'jpsend1',
	domain: 'example.com',
	dkim_selector: 'jpsend',
	monthly_limit: 3000,
	dns_records: RECORDS,
	provider: 'local',
	provisioned_at: '2026-10-01T00:00:00Z',
	dns_check: null,
} as SendStatus[ 'account' ] & object;

type StatusOverrides = {
	can_enable?: boolean;
	enabled?: boolean;
	has_history?: boolean;
	log_retention_days?: number;
};

const makeStatus = (
	testSentAt: string | null = '2026-10-18T10:00:00Z',
	{ can_enable = true, enabled = true, has_history, log_retention_days = 7 }: StatusOverrides = {}
) =>
	( {
		provisioner: 'local',
		account,
		settings: {
			enabled,
			from_name: 'Example Site',
			from_local_part: 'owner',
			fallback: true,
			reply_to: '',
			auto_enable: true,
		},
		can_enable,
		enable_blockers: [],
		suggested_domain: 'example.com',
		site_title: 'Example Site',
		admin_email: 'owner@example.com',
		current_user_email: 'owner@example.com',
		connect_url: '',
		spf_suggestion: null,
		onboarding: {
			closed_at: '2026-10-18T10:00:00Z',
			step: null,
			dns_provider: null,
			test_to: 'owner@example.com',
			test_sent_at: testSentAt,
			auto_test_log_id: null,
			verified_seen_at: null,
		},
		next_check_at: null,
		has_history,
		log_retention_days,
	} ) as SendStatus;

const logRow = ( overrides: Partial< LogRow > ): LogRow => ( {
	id: '1',
	created_at: '2026-10-18 09:00:00',
	recipients: 'customer@example.com',
	subject: 'Your order has been received',
	status: 'sent',
	error: '',
	request_id: 'r1',
	source: 'wp_mail',
	...overrides,
} );

const BUSY: Stats = makeStats( {
	range: 90,
	from: '2026-07-21',
	to: '2026-10-18',
	has_history: true,
	last_email_at: '2026-10-18T09:00:00Z',
	totals: { emails: 12, sent: 10, fallback: 0, failed: 2 },
	days: [ { date: '2026-10-18', sent: 10, fallback: 0, failed: 2 } ],
	origins: [
		{ key: 'plugin:woocommerce', label: 'WooCommerce', count: 9 },
		{ key: 'core:password_reset', label: 'Password resets', count: 3 },
	],
} );

const renderDashboard = (
	stats: Stats | null,
	rows: LogRow[],
	{
		testSentAt,
		search = {},
		status = {},
		refreshing = false,
	}: {
		testSentAt?: string | null;
		search?: object;
		status?: StatusOverrides;
		refreshing?: boolean;
	} = {}
) => {
	jest.mocked( useSearch ).mockReturnValue( search );
	jest.mocked( useStats ).mockReturnValue( { stats, error: null, retry: jest.fn(), refreshing } );
	jest.mocked( fetchLog ).mockResolvedValue( { items: rows, total: rows.length } );
	return render( <Dashboard status={ makeStatus( testSentAt, status ) } account={ account } /> );
};

/**
 * Days up to the site's today, one email each, so the last bar is today's.
 *
 * @param count - How many days.
 * @return Stats for them.
 */
const recentDays = ( count: number ) => {
	const today = siteToday();
	return Array.from( { length: count }, ( _, index ) => ( {
		date: addDays( today, index + 1 - count ),
		sent: 1,
		fallback: 0,
		failed: 0,
	} ) );
};

describe( 'Dashboard', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockLookup.mockReturnValue( null );
	} );

	it( 'shows activity, recent emails and sources for a busy site', async () => {
		renderDashboard( BUSY, [ logRow( { id: '9', status: 'failed' } ) ] );

		await expect(
			screen.findByRole( 'tab', { name: /All emails\s*12/ } )
		).resolves.toBeInTheDocument();
		expect( screen.getAllByRole( 'tab', { name: /Sent by your host\s*0/ } ) ).toHaveLength( 1 );
		expect( screen.getByTestId( 'chart' ) ).toHaveTextContent( 'All emails per day' );
		expect( useStats ).toHaveBeenCalledWith( { range: 90 } );
		expect( fetchLog ).toHaveBeenCalledWith( { page: 1, per_page: 5 } );

		const link = await screen.findByRole( 'link', { name: 'Your order has been received' } );
		expect( link ).toHaveAttribute( 'href', expect.stringContaining( 'p=%2Flog%3Fentry%3D9' ) );
		expect( screen.getByText( 'What sends the most' ) ).toBeInTheDocument();
		// The period picked in Email activity, said again where it applies.
		expect(
			screen.getByRole( 'button', { name: 'Date range: Last 90 days' } )
		).toBeInTheDocument();
		expect( screen.getAllByText( 'Last 90 days' ) ).toHaveLength( 2 );
		expect( screen.getByText( 'Jul 21 – Oct 18, 2026' ) ).toBeInTheDocument();
		expect( screen.getByText( 'WooCommerce' ) ).toBeInTheDocument();
		expect( screen.getByText( 'to customer@example.com' ) ).toBeInTheDocument();
		expect( screen.getByText( /^Last email / ) ).toBeInTheDocument();
		expect( screen.getByText( 'Backup: your host’s mail is on' ) ).toBeInTheDocument();
	} );

	it( 'counts failed emails at the top of Email activity and sends people to the same ones', async () => {
		renderDashboard(
			{ ...BUSY, range: 30, attention: { failed_in_log: 2, fallback_in_log: 0 } },
			[],
			{ search: { range: 30 } }
		);

		const notice = await screen.findByText( '2 emails didn’t send in the last 30 days.' );
		// Inside the card, above the tabs, so its late arrival can't push the top row down.
		const activity = screen.getByRole( 'region', { name: 'Email activity' } );
		expect( activity ).toContainElement( notice );
		expect( notice.compareDocumentPosition( within( activity ).getAllByRole( 'tab' )[ 0 ] ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
		// The Failed tab and the notice read the same counts.
		expect( screen.getByRole( 'tab', { name: /Failed\s*2/ } ) ).toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'See them in the Log' } ) );
		expect( mockNavigate ).toHaveBeenCalledWith( {
			href: '/log?status=failed&source=wp_mail,resend&range=30',
		} );
	} );

	it.each( [
		[ 'only the ones still in the log', 1, 'See the 1 still in your log', '' ],
		[ 'no link once the log has none of them', 0, null, ' None of them are in your log anymore.' ],
	] )( 'links to %s', async ( _, inLog, link, gone ) => {
		renderDashboard( { ...BUSY, attention: { failed_in_log: inLog, fallback_in_log: 0 } }, [] );

		await expect(
			screen.findByText( `2 emails didn’t send in the last 90 days.${ gone }` )
		).resolves.toBeInTheDocument();
		const actions = within( screen.getByRole( 'region', { name: 'Email activity' } ) );
		expect(
			actions.queryAllByRole( 'button', { name: link ?? /in (the|your) Log/i } )
		).toHaveLength( link ? 1 : 0 );
	} );

	it( 'titles every card with a second-level heading, in reading order', async () => {
		renderDashboard( BUSY, [ logRow( {} ) ] );

		await expect(
			screen.findByRole( 'link', { name: 'Your order has been received' } )
		).resolves.toBeInTheDocument();
		expect(
			screen.getAllByRole( 'heading', { level: 2 } ).map( heading => heading.textContent )
		).toEqual( [
			'Sending',
			'Domain',
			'This month',
			'Email activity',
			'Recent emails',
			'What sends the most',
		] );
	} );

	it( 'shows a test sent from the status card without a reload', async () => {
		renderDashboard( BUSY, [ logRow( {} ) ] );
		await expect(
			screen.findByRole( 'link', { name: 'Your order has been received' } )
		).resolves.toBeInTheDocument();
		jest.mocked( sendTest ).mockResolvedValueOnce( { success: true, log_id: '10' } );
		jest.mocked( fetchLog ).mockResolvedValue( {
			items: [ logRow( { id: '10', subject: 'Test email from Example Site', source: 'test' } ) ],
			total: 1,
		} );

		await userEvent.click( screen.getByRole( 'button', { name: 'Send a test' } ) );

		await expect(
			screen.findByRole( 'link', { name: 'Test email from Example Site' } )
		).resolves.toBeInTheDocument();
		await waitFor( () => expect( fetchUsage ).toHaveBeenCalledTimes( 2 ) );
	} );

	it( 'switches the chart between metrics with the tabs, by click or arrow key', async () => {
		renderDashboard( BUSY, [] );

		await userEvent.click( await screen.findByRole( 'tab', { name: /Failed/ } ) );
		expect( screen.getByTestId( 'chart' ) ).toHaveTextContent( 'Failed per day' );
		await userEvent.keyboard( '{ArrowLeft}' );
		expect( screen.getByTestId( 'chart' ) ).toHaveTextContent( 'Sent by your host per day' );
	} );

	it( 'leaves out What sends the most while one source sends everything', async () => {
		renderDashboard( { ...BUSY, origins: [ { key: 'core', label: 'WordPress', count: 12 } ] }, [
			logRow( {} ),
		] );

		await expect(
			screen.findByRole( 'heading', { name: 'Recent emails' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'What sends the most' ) ).not.toBeInTheDocument();
	} );

	it( 'strips the site title WordPress puts in front of its own subjects', async () => {
		renderDashboard( BUSY, [ logRow( { subject: '[Example Site] Password Reset' } ) ] );

		const link = await screen.findByRole( 'link', { name: 'Password Reset' } );
		expect( link ).toHaveAttribute( 'title', '[Example Site] Password Reset' );
	} );

	it.each( [
		[ 'a preset', { range: 30 }, { range: 30 }, 'Last 7 days', '/?range=7' ],
		[ 'an older link’s range', { range: 7 }, { range: 7 }, 'Last 90 days', '/' ],
		[
			'custom days',
			{ start: '2026-09-01', end: '2026-10-01' },
			{ start: '2026-09-01', end: '2026-10-01' },
			'Last 24 hours',
			'/?range=1',
		],
		[
			'a range that isn’t offered, as the default',
			{ range: 14 },
			{ range: 90 },
			'Last 7 days',
			'/?range=7',
		],
	] )(
		'reads %s from the address, and a pick changes the address',
		async ( _, search, period, pick, href ) => {
			renderDashboard( BUSY, [], { search } );

			await expect(
				screen.findByRole( 'tab', { name: /All emails\s*12/ } )
			).resolves.toBeInTheDocument();
			expect( useStats ).toHaveBeenCalledWith( period );

			await userEvent.click( screen.getByRole( 'button', { name: /^Date range:/ } ) );
			await userEvent.click( await screen.findByRole( 'button', { name: pick } ) );
			expect( mockNavigate ).toHaveBeenCalledWith( { href } );
		}
	);

	it( 'keeps the card, its range button and What sends the most on screen while a new period loads', async () => {
		const user = userEvent.setup();
		const { rerender } = renderDashboard( BUSY, [] );
		const trigger = await screen.findByRole( 'button', { name: 'Date range: Last 90 days' } );
		await user.click( trigger );
		await user.click( await screen.findByRole( 'button', { name: 'Last 7 days' } ) );
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/?range=7' } );

		// The address now asks for 7 days; the 90 days stay until they land.
		jest.mocked( useSearch ).mockReturnValue( { range: 7 } );
		jest.mocked( useStats ).mockReturnValue( {
			stats: BUSY,
			error: null,
			retry: jest.fn(),
			refreshing: true,
		} );
		rerender( <Dashboard status={ makeStatus() } account={ account } /> );

		const card = screen.getByRole( 'region', { name: 'Email activity' } );
		expect( card ).toHaveAttribute( 'aria-busy', 'true' );
		const moved = screen.getByRole( 'button', { name: 'Date range: Last 7 days' } );
		expect( moved ).toBe( trigger );
		await waitFor( () => expect( moved ).toHaveFocus() );
		expect( screen.getByRole( 'heading', { name: 'What sends the most' } ) ).toBeInTheDocument();
		expect( speak ).not.toHaveBeenCalledWith( 'Showing the last 7 days.' );

		jest.mocked( useStats ).mockReturnValue( {
			stats: { ...BUSY, range: 7, from: '2026-10-12' },
			error: null,
			retry: jest.fn(),
			refreshing: false,
		} );
		rerender( <Dashboard status={ makeStatus() } account={ account } /> );

		expect( card ).toHaveAttribute( 'aria-busy', 'false' );
		expect( speak ).toHaveBeenCalledWith( 'Showing the last 7 days.' );
	} );

	it( 'starts a new site’s chart on its first counted day and says so under the title', async () => {
		const days = recentDays( 90 );
		renderDashboard(
			{ ...BUSY, days, from: days[ 0 ].date, to: days[ 89 ].date, stats_since: days[ 87 ].date },
			[]
		);

		const chart = await screen.findByTestId( 'chart' );
		expect( chart ).toHaveAttribute( 'data-bars', '3' );
		expect( screen.getByTestId( 'ticks' ) ).toHaveTextContent( /\|Today$/ );
		expect( screen.getByText( /^Since / ) ).toBeInTheDocument();
	} );

	it.each( [
		[
			'hours for the last 24 hours',
			() => {
				const hour = Math.floor( Date.now() / 3600000 ) * 3600000;
				return {
					range: 1 as const,
					unit: 'hour' as const,
					hours: Array.from( { length: 24 }, ( _, index ) => ( {
						start: new Date( hour - ( 23 - index ) * 3600000 ).toISOString(),
						sent: 2,
						fallback: 0,
						failed: 0,
					} ) ),
				};
			},
			'All emails per hour',
			24,
			/\|Now$/,
			/^2 emails so far$/,
		],
		[
			'weeks past 90 days',
			() => ( { range: 180 as const, days: recentDays( 180 ) } ),
			'All emails per week',
			27,
			/\|This week$/,
			/emails? so far$/,
		],
	] )(
		'draws %s, labelling the one still filling up',
		async ( _, overrides, label, bars, ticks, tooltip ) => {
			renderDashboard( { ...BUSY, ...overrides() }, [] );

			const chart = await screen.findByTestId( 'chart' );
			expect( chart ).toHaveTextContent( label );
			expect( Number( chart.getAttribute( 'data-bars' ) ) ).toBeGreaterThanOrEqual( bars - 1 );
			expect( screen.getByTestId( 'ticks' ) ).toHaveTextContent( ticks );
			expect( within( screen.getByTestId( 'tooltip' ) ).getByText( tooltip ) ).toBeInTheDocument();
		}
	);

	it.each( [
		[
			'just after setup',
			'2026-10-18T10:00:00Z',
			'Your chart starts with your site’s first email.',
		],
		[ 'with no test either', null, 'No emails yet.' ],
	] )( 'never shows a chart of zeros %s', async ( _, testSentAt, title ) => {
		renderDashboard( makeStats( { tests: testSentAt ? 1 : 0 } ), [], { testSentAt } );

		await expect( screen.findByText( title ) ).resolves.toBeInTheDocument();
		const activity = screen.getByRole( 'region', { name: 'Email activity' } );
		// One "Send a test": the empty card's while nothing is logged, else the Sending card's. The
		// test's own row in Recent emails says when it went, so the empty card doesn't.
		expect( screen.getAllByRole( 'button', { name: 'Send a test' } ) ).toHaveLength( 1 );
		expect( within( activity ).queryAllByRole( 'button' ) ).toHaveLength( testSentAt ? 0 : 1 );
		expect( screen.queryByText( /Your test went out/ ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'tab', { name: /Emails/ } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /^Date range/ } ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'What sends the most' ) ).not.toBeInTheDocument();
	} );
	it.each< [ string, StatusOverrides, DnsLookup | null, string, string, string ] >( [
		[ 'healthy', {}, null, 'On', 'Connected', 'false' ],
		[
			'the records stop matching',
			{ can_enable: false },
			BOTH_WRONG,
			'On',
			'Records don’t match',
			'true',
		],
		[ 'paused', { enabled: false }, null, 'Paused', 'Connected', 'false' ],
		[
			'paused and the records stop matching',
			{ enabled: false, can_enable: false },
			BOTH_WRONG,
			'Paused',
			'Records don’t match',
			'true',
		],
	] )(
		'puts Sending, Domain and This month side by side when %s',
		async ( _, status, found, sendingBadge, domainBadge, recordsOpen ) => {
			mockLookup.mockReturnValue( found );
			renderDashboard( BUSY, [], { status } );

			await expect( screen.findAllByText( domainBadge ) ).resolves.not.toHaveLength( 0 );
			// eslint-disable-next-line testing-library/no-node-access -- The row's cells are the layout under test.
			const cells = document.querySelectorAll(
				'.jetpack-send-dashboard__cards > .jetpack-send-dashboard__cell'
			);
			expect(
				[ ...cells ].map(
					cell => within( cell as HTMLElement ).getAllByRole( 'heading' )[ 0 ].textContent
				)
			).toEqual( [ 'Sending', 'Domain', 'This month' ] );
			// The title never repeats the badge: on or paused is the badge's to say.
			expect( within( cells[ 0 ] as HTMLElement ).getByText( sendingBadge ) ).toBeInTheDocument();
			// The records open full width under the row, never inside a card, so the three stay even.
			const toggle = screen.getByRole( 'button', { name: 'Records' } );
			expect( toggle ).toHaveAttribute( 'aria-expanded', recordsOpen );
			if ( recordsOpen === 'false' ) {
				await userEvent.click( toggle );
			}
			const records = screen.getByRole( 'heading', { name: 'Records for example.com' } );
			[ ...cells ].forEach( cell => expect( cell ).not.toContainElement( records ) );
		}
	);

	it( 'says a records problem once: its effect on the Sending card, the fix under Records', async () => {
		mockLookup.mockReturnValue( BOTH_WRONG );
		renderDashboard( BUSY, [], { status: { can_enable: false } } );

		await expect( screen.findByText( 'Records don’t match' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'On' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Your host is covering until the domain is fixed.' )
		).toBeInTheDocument();
		expect( screen.queryByText( /^Backup:/ ) ).not.toBeInTheDocument();
		expect( screen.getAllByText( /changed at your DNS host/ ) ).toHaveLength( 1 );
		expect( screen.queryByText( /value doesn’t match/ ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /needs a look/i ) ).not.toBeInTheDocument();
		// The server refuses a test until the records pass, which would only say the problem again.
		expect( screen.queryByRole( 'button', { name: 'Send a test' } ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /Finish connecting/ ) ).not.toBeInTheDocument();
		// Something to copy: each record's name and value.
		expect( screen.getAllByRole( 'button', { name: /^Copy .+, record [12]$/ } ) ).toHaveLength( 4 );
		expect( screen.getByRole( 'button', { name: 'Check now' } ) ).toBeInTheDocument();
	} );

	it( 'disables the empty card’s Send a test while the records fail', async () => {
		mockLookup.mockReturnValue( BOTH_WRONG );
		renderDashboard( makeStats( { tests: 0 } ), [], {
			testSentAt: null,
			status: { can_enable: false },
		} );

		await expect( screen.findByText( 'No emails yet.' ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Send a test' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'keeps every card in its final place while the stats load', async () => {
		renderDashboard( null, [ logRow( {} ) ] );

		await expect(
			screen.findByRole( 'link', { name: 'Your order has been received' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( /^Last email / ) ).not.toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-node-access -- Placeholders are aria-hidden.
		const lastEmail = document.querySelector( '.jetpack-send-sending .jetpack-send-skeleton' );
		expect( lastEmail ).not.toBeNull();
		// The side card waits for the stats to say there are two sources, so a quiet site never flashes it.
		expect(
			screen.queryByRole( 'heading', { name: 'What sends the most' } )
		).not.toBeInTheDocument();
	} );

	it( 'goes straight to the empty state while loading when the status says nothing was logged', async () => {
		renderDashboard( null, [], { testSentAt: null, status: { has_history: false } } );

		expect( screen.getByText( 'No emails yet.' ) ).toBeInTheDocument();
		await waitFor( () => expect( fetchLog ).toHaveBeenCalled() );
		expect( screen.queryByRole( 'tab' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { name: 'Recent emails' } ) ).not.toBeInTheDocument();
	} );

	it( 'sends “Change sender” to Settings with the sender form open', async () => {
		renderDashboard( BUSY, [ logRow( {} ) ] );

		await userEvent.click( await screen.findByRole( 'button', { name: 'Change sender' } ) );
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/settings?edit=sender' } );
	} );

	it( 'says “No emails yet.” once, in Email activity, when nothing has been logged', async () => {
		renderDashboard( makeStats( { tests: 0 } ), [], { testSentAt: null } );

		await waitFor( () => expect( fetchLog ).toHaveBeenCalled() );
		await waitFor( () =>
			expect( screen.queryByRole( 'heading', { name: 'Recent emails' } ) ).not.toBeInTheDocument()
		);
		expect( screen.getAllByText( 'No emails yet.' ) ).toHaveLength( 1 );
		expect( screen.queryByText( 'What sends the most' ) ).not.toBeInTheDocument();
	} );

	it( 'leaves the host-sent count to the Sending card while the domain is failing', async () => {
		mockLookup.mockReturnValue( BOTH_WRONG );
		const hostSent = makeStats( {
			has_history: true,
			totals: { emails: 2, sent: 0, fallback: 2, failed: 0 },
			days: [ { date: '2026-10-18', sent: 0, fallback: 2, failed: 0 } ],
		} );
		renderDashboard( hostSent, [], { status: { can_enable: false } } );

		await expect(
			screen.findByRole( 'tab', { name: /Sent by your host\s*2/ } )
		).resolves.toBeInTheDocument();
		expect(
			screen.getByText( 'Your host is covering until the domain is fixed.' )
		).toBeInTheDocument();
		expect( screen.queryByText( /so your host sent/ ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'healthy', {}, true ],
		[ 'paused', { enabled: false }, false ],
	] )(
		'says the host sent what Send couldn’t only when nothing else says it (%s)',
		async ( _, status, shown ) => {
			const hostSent = makeStats( {
				has_history: true,
				totals: { emails: 2, sent: 0, fallback: 2, failed: 0 },
				days: [ { date: '2026-10-18', sent: 0, fallback: 2, failed: 0 } ],
				attention: { failed_in_log: 0, fallback_in_log: 2 },
			} );
			renderDashboard( hostSent, [], { status } );

			await expect(
				screen.findByRole( 'tab', { name: /Sent by your host\s*2/ } )
			).resolves.toBeInTheDocument();
			expect(
				screen.queryAllByText(
					/^Jetpack Send couldn’t send 2 emails in the last \d+ days, so your host sent them\.$/
				)
			).toHaveLength( shown ? 1 : 0 );
			// Paused: the Sending card says the host sends, and Email activity says what that means.
			expect(
				screen.queryAllByText( 'Emails sent while paused aren’t logged here.' )
			).toHaveLength( shown ? 0 : 1 );
		}
	);

	it( 'explains a failed recent email in plain words, never the service’s own text', async () => {
		renderDashboard( BUSY, [
			logRow( { id: '9', status: 'failed', error: 'HTTP 429: Too many requests' } ),
		] );

		await expect(
			screen.findByText(
				'Jetpack Send couldn’t send this. The problem is on our side, not your site.'
			)
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( /Too many requests/ ) ).not.toBeInTheDocument();
	} );

	it( 'still counts failed emails while the domain is failing: that’s a different fact', async () => {
		mockLookup.mockReturnValue( BOTH_WRONG );
		renderDashboard( BUSY, [], { status: { can_enable: false } } );

		await expect(
			screen.findByText( /^2 emails didn’t send in the last 90 days\./ )
		).resolves.toBeInTheDocument();
	} );

	it( 'says the host covers “while we confirm” when nothing is wrong yet', async () => {
		mockLookup.mockReturnValue(
			lookup( [
				lookupRow( { state: 'found' } ),
				lookupRow( {
					purpose: 'dkim',
					name: 'jpsend._domainkey.example.com',
					host: 'jpsend._domainkey',
					state: 'found',
				} ),
			] )
		);
		renderDashboard( BUSY, [], { status: { can_enable: false } } );

		await expect(
			screen.findByText( 'Your host is covering while we confirm your domain.' )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Checking' ) ).toBeInTheDocument();
		expect( screen.queryByText( /until the domain is fixed/ ) ).not.toBeInTheDocument();
	} );

	it( 'lines recent emails up in one grid: avatar, subject over who and when, status', async () => {
		const subject = 'Your order #1042 has been received and will ship tomorrow from the warehouse';
		renderDashboard( BUSY, [
			logRow( {
				id: '9',
				subject,
				recipients: '"Desk, Help" <help@example.com>',
				avatar_url: 'https://gravatar.example.com/avatar/1?d=blank',
			} ),
			logRow( { id: '8', recipients: '12345@example.com', source: 'test', avatar_url: null } ),
		] );

		const list = await screen.findByRole( 'list', { name: 'Recent emails' } );
		expect( list ).toHaveClass( 'jetpack-send-list--recent' );
		const [ first, second ] = within( list ).getAllByRole( 'listitem' );
		// eslint-disable-next-line testing-library/no-node-access -- Column order is what lines the badges up.
		const cells = [ ...first.children ];
		expect( cells.map( cell => cell.className ) ).toEqual( [
			'jetpack-send-avatar jetpack-send-avatar--sm',
			'jetpack-send-list__main',
			'jetpack-send-list__status',
		] );
		const link = within( first ).getByRole( 'link', { name: subject } );
		expect( link ).toHaveClass( 'jetpack-send-list__truncate' );
		expect( link ).toHaveAttribute( 'title', subject );
		// Who it went to and when, under the subject.
		expect( within( first ).getByText( 'to "Desk, Help" <help@example.com>' ) ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-node-access -- The time is the meta line's last part.
		expect( cells[ 1 ].querySelector( '.jetpack-send-list__meta time' ) ).not.toBeNull();

		// The photo sits over the initial; one that fails to load leaves the initial.
		expect( cells[ 0 ] ).toHaveTextContent( 'D' );
		// eslint-disable-next-line testing-library/no-node-access -- The avatar is decorative, so aria-hidden.
		const photo = cells[ 0 ].querySelector( 'img' ) as HTMLImageElement;
		expect( photo ).toHaveAttribute( 'alt', '' );
		fireEvent.error( photo );
		// eslint-disable-next-line testing-library/no-node-access -- As above.
		expect( cells[ 0 ].querySelector( 'img' ) ).toBeNull();
		expect( cells[ 0 ] ).toHaveTextContent( 'D' );

		// No photo and no letter: a person icon. The Test badge stays by the subject, out of the status column.
		// eslint-disable-next-line testing-library/no-node-access -- As above.
		expect( second.querySelector( '.jetpack-send-avatar svg' ) ).not.toBeNull();
		// eslint-disable-next-line testing-library/no-node-access -- As above.
		expect( second.querySelector( '.jetpack-send-list__subject' ) ).toHaveTextContent( 'Test' );
	} );

	it( 'shows each source with its plugin icon, or a placeholder', async () => {
		renderDashboard(
			{
				...BUSY,
				origins: [
					{
						key: 'plugin:woocommerce',
						label: 'WooCommerce',
						count: 9,
						icon_url: 'https://ps.w.org/woocommerce/assets/icon.svg',
					},
					{ key: 'plugin:shop-extras', label: 'Shop Extras', count: 3, icon_url: null },
					{ key: 'core:password_reset', label: 'Password resets', count: 2, icon_url: null },
				],
			},
			[]
		);

		const list = await screen.findByRole( 'list', { name: 'What sends the most' } );
		expect( list ).toHaveClass( 'jetpack-send-list--origins' );
		const [ shop, extras, resets ] = within( list ).getAllByRole( 'listitem' );
		// eslint-disable-next-line testing-library/no-node-access -- Icons are decorative, so aria-hidden.
		const icon = ( row: HTMLElement ) => row.firstElementChild as HTMLElement;
		// eslint-disable-next-line testing-library/no-node-access -- As above.
		const logo = icon( shop ).querySelector( 'img' ) as HTMLImageElement;
		expect( logo ).toHaveAttribute( 'src', 'https://ps.w.org/woocommerce/assets/icon.svg' );
		expect( logo ).toHaveAttribute( 'alt', '' );
		fireEvent.error( logo );
		// A plugin without an icon shows its initial, never a broken-looking plug; WordPress's own emails keep a glyph.
		expect( icon( shop ) ).toHaveClass( 'jetpack-send-avatar' );
		expect( icon( shop ) ).toHaveTextContent( 'W' );
		expect( icon( extras ) ).toHaveTextContent( 'S' );
		expect( icon( resets ) ).toHaveClass( 'jetpack-send-origin-icon--glyph' );
		expect( within( shop ).getByText( 'WooCommerce' ) ).toHaveAttribute( 'title', 'WooCommerce' );
	} );

	it( 'says the log has nothing right now, for how long it keeps emails, once the counts outlive it', async () => {
		renderDashboard( { ...BUSY, last_email_at: null, last_email_day: '2026-10-12' }, [], {
			status: { has_history: true, log_retention_days: 7 },
		} );

		await expect(
			screen.findByText( 'No emails in the log right now. It keeps emails for 1 week.' )
		).resolves.toBeInTheDocument();
		// A count knows its day, not its time.
		expect( screen.getByText( 'Last email Oct 12' ) ).toBeInTheDocument();
	} );

	it( 'marks a copy sent again from the Log as Resent', async () => {
		renderDashboard( BUSY, [ logRow( { id: '7', source: 'resend', subject: 'Your receipt' } ) ] );

		const link = await screen.findByRole( 'link', { name: 'Your receipt' } );
		// eslint-disable-next-line testing-library/no-node-access -- The badge sits beside the subject.
		expect( link.closest( '.jetpack-send-list__subject' ) ).toHaveTextContent( 'Resent' );
	} );
} );
