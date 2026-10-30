import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch } from '@wordpress/data';
import { fetchUsage, saveOnboarding, sendTest } from '../../../data/api';
import { sendStore } from '../../../data/store';
import { makeStats } from '../dashboard/test/fixtures/stats';
import OverviewScreen from '../index';
import type { DnsRecord, SendStatus } from '../../../data/types';

const mockNavigate = jest.fn();
const mockPolling = jest.fn();

jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
	useSearch: () => ( {} ),
} ) );

jest.mock( '@automattic/charts', () => ( { BarChart: () => null } ) );

jest.mock( '../../../data/api', () => ( {
	fetchUsage: jest.fn( () => new Promise( () => undefined ) ),
	fetchStats: jest.fn( () => new Promise( () => undefined ) ),
	fetchLog: jest.fn( () => new Promise( () => undefined ) ),
	saveOnboarding: jest.fn( () => new Promise( () => undefined ) ),
	postAction: jest.fn( () => new Promise( () => undefined ) ),
	sendTest: jest.fn( () => new Promise( () => undefined ) ),
	fetchDnsHost: jest.fn( () => new Promise( () => undefined ) ),
	fetchStatus: jest.fn( () => new Promise( () => undefined ) ),
	errorMessage: () => 'Something went wrong.',
} ) );

jest.mock( '../../../components/onboarding/use-dns-polling', () => ( {
	useDnsPolling: ( options: unknown ) => mockPolling( options ),
} ) );

jest.mock( '../../../components/onboarding/steps/checklist', () => ( {
	useAnnounceRecordChanges: () => undefined,
} ) );

jest.mock( '../../../components/onboarding/steps/delegate', () => ( {
	__esModule: true,
	default: () => <div data-testid="delegate" />,
} ) );

const RECORDS: DnsRecord[] = [
	{
		type: 'TXT',
		name: '_mailchannels.example.com',
		host: '_mailchannels',
		value: 'v=mc1 auth=abc',
		purpose: 'lockdown',
	},
	{
		type: 'TXT',
		name: 'jpsend._domainkey.example.com',
		host: 'jpsend._domainkey',
		value: 'v=DKIM1; k=rsa; p=abc',
		purpose: 'dkim',
	},
	{
		type: 'TXT',
		name: 'example.com',
		host: '@',
		value: 'v=spf1 include:relay.mailchannels.net ~all',
		purpose: 'spf',
		optional: true,
	},
];

type Overrides = Omit< Partial< SendStatus >, 'settings' | 'onboarding' > & {
	settings?: Partial< SendStatus[ 'settings' ] >;
	onboarding?: Partial< SendStatus[ 'onboarding' ] >;
	withAccount?: boolean;
};

const makeStatus = ( { settings, onboarding, withAccount = true, ...rest }: Overrides = {} ) =>
	( {
		provisioner: 'wpcom',
		account: withAccount
			? {
					handle: 'jpsend3f9a',
					lockdown_auth_id: 'abc',
					domain: 'example.com',
					dkim_selector: 'jpsend',
					monthly_limit: 3000,
					dns_records: RECORDS,
					provider: 'wpcom',
					provisioned_at: new Date().toISOString(),
					dns_check: null,
					dns_host: {
						domain: 'example.com',
						apex: 'example.com',
						nameservers: [ 'ada.ns.cloudflare.com' ],
						provider: 'cloudflare',
						provider_source: 'ns',
						confidence: 'high',
						editable: true,
						reason: null,
						domain_connect: { host: null, supported: null },
						one_click: { supported: null },
						wpcom_dns: { supported: null },
						cloudflare_api: { supported: false },
						existing: { lockdown: null, spf: null, dkim: null },
						checked_at: new Date().toISOString(),
					},
				}
			: null,
		settings: {
			enabled: false,
			from_name: '',
			from_local_part: 'owner',
			fallback: true,
			reply_to: '',
			auto_enable: true,
			...settings,
		},
		can_enable: false,
		enable_blockers: [ 'dns_not_checked' ],
		suggested_domain: 'example.com',
		site_title: 'Example Site',
		admin_email: 'owner@example.com',
		current_user_email: 'owner@example.com',
		connect_url: '',
		spf_suggestion: null,
		onboarding: {
			closed_at: null,
			step: null,
			dns_provider: null,
			test_to: 'owner@example.com',
			test_sent_at: null,
			auto_test_log_id: null,
			verified_seen_at: null,
			...onboarding,
		},
		// The server watches the domain from setup until it connects.
		next_check_at: withAccount ? '2026-10-18T10:15:00Z' : null,
		...rest,
	} ) as SendStatus;

const PENDING = makeStatus();
const ACTIVE = makeStatus( {
	can_enable: true,
	enable_blockers: [],
	settings: { enabled: true },
	onboarding: { test_sent_at: '2026-10-18T10:00:00Z', verified_seen_at: '2026-10-18T10:00:00Z' },
} );
const ATTENTION = makeStatus( {
	can_enable: false,
	enable_blockers: [ 'dkim' ],
	settings: { enabled: true },
	onboarding: { closed_at: '2026-10-18T10:00:00Z', test_sent_at: '2026-10-18T10:00:00Z' },
} );
const AUTO_TESTED = makeStatus( {
	can_enable: true,
	enable_blockers: [],
	settings: { enabled: true },
	onboarding: { test_sent_at: '2026-10-18T10:00:00Z', auto_test_log_id: '42' },
} );

describe( 'OverviewScreen', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockPolling.mockReturnValue( {
			lookup: null,
			checking: false,
			lastCheckedAt: null,
			stopped: false,
			error: null,
			checkNow: jest.fn(),
			nudge: jest.fn(),
		} );
	} );

	it( 'shows the setup checklist with the records task open while the records are pending', () => {
		render( <OverviewScreen status={ PENDING } /> );

		expect(
			screen.getByRole( 'heading', { name: 'Send your site’s emails from example.com' } )
		).toBeInTheDocument();
		expect( screen.getByText( '1 of 3 completed' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /Add 2 records at Cloudflare/ } ) ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		expect( screen.getByText( 'How your emails will look' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Not on yet' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'heading', { name: 'Sending', level: 2 } )
		).not.toBeInTheDocument();
		expect( mockPolling ).toHaveBeenCalledWith( { enabled: true, mode: 'setup' } );
	} );

	it( 'shows the sending card and this month’s count, tests included, once setup is finished', async () => {
		jest.mocked( fetchUsage ).mockResolvedValueOnce( {
			emails: 12,
			tests: 2,
			month_start: '2026-10-01',
			resets_on: '2026-11-01',
			monthly_limit: 3000,
			total_usage: 0,
			period_start: '2026-10-01',
			period_end: '2026-10-31',
		} );
		render( <OverviewScreen status={ ACTIVE } /> );

		expect( screen.getByRole( 'heading', { name: 'Sending', level: 2 } ) ).toBeInTheDocument();
		expect( screen.getByText( 'On' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Example Site' ) ).toBeInTheDocument();
		expect( screen.getByText( 'owner@example.com' ) ).toBeInTheDocument();
		expect( screen.queryByText( /completed$/ ) ).not.toBeInTheDocument();
		expect( mockPolling ).toHaveBeenCalledWith( { enabled: false, mode: 'overview' } );
		// The log's count, not the mail service's lagging 0.
		await expect( screen.findByText( '12 of 3,000 emails' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'including 2 tests' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Resets Nov 1' ) ).toBeInTheDocument();
	} );

	it( 'sends a test from the sending card without leaving the page', async () => {
		const user = userEvent.setup();
		jest.mocked( sendTest ).mockResolvedValueOnce( { success: true, log_id: '7' } );
		dispatch( sendStore ).receiveStats(
			'r90',
			makeStats( { has_history: true, totals: { emails: 3, sent: 3, fallback: 0, failed: 0 } } )
		);
		render( <OverviewScreen status={ ACTIVE } /> );

		// The card offers it once the stats say something has been logged.
		await user.click( await screen.findByRole( 'button', { name: 'Send a test' } ) );
		await expect( screen.findByText( 'Sent to owner@example.com.' ) ).resolves.toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: 'See it in your log' } ) );
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/log?entry=7' } );
	} );

	it( 'flags records that broke after setup and opens them with what to copy', () => {
		mockPolling.mockReturnValue( {
			...mockPolling(),
			lookup: {
				domain: 'example.com',
				checked_at: '2026-10-18T10:00:00Z',
				records: [
					{
						purpose: 'lockdown',
						name: '_mailchannels.example.com',
						host: '_mailchannels',
						type: 'TXT',
						state: 'found',
						expected: 'v=mc1 auth=abc',
					},
					{
						purpose: 'dkim',
						name: 'jpsend._domainkey.example.com',
						host: 'jpsend._domainkey',
						type: 'TXT',
						state: 'needs_fix',
						problem: 'wrong_value',
						expected: 'v=DKIM1; k=rsa; p=abc',
					},
				],
				all_found: false,
				can_enable: false,
			},
		} );
		render( <OverviewScreen status={ ATTENTION } /> );

		// The Domain card names the problem; the Sending card stays On and says what happens meanwhile.
		expect( screen.getByText( 'Record doesn’t match' ) ).toBeInTheDocument();
		expect( screen.getByText( 'On' ) ).toBeInTheDocument();
		expect( screen.queryByText( /needs a look/i ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Records' } ) ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		expect(
			screen.getByText( 'One record changed at Cloudflare. Copy it again and replace the old one.' )
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Copy content, record 2' } ) ).toBeInTheDocument();
		expect( mockPolling ).toHaveBeenCalledWith( { enabled: true, mode: 'overview' } );
	} );

	it.each( [
		[ 'setup', PENDING ],
		[ 'no account', makeStatus( { withAccount: false } ) ],
		[ 'active', ACTIVE ],
		[ 'attention', ATTENTION ],
	] )( 'keeps vendor and record jargon out of the %s page', ( _name, status ) => {
		const { container } = render( <OverviewScreen status={ status } /> );
		// The record values themselves are what people paste, so only the words around them count.
		// eslint-disable-next-line testing-library/no-container -- Strips the values.
		const words = container.cloneNode( true ) as HTMLElement;
		// eslint-disable-next-line testing-library/no-node-access -- Strips the values.
		words.querySelectorAll( 'code' ).forEach( value => value.remove() );
		expect( words ).not.toHaveTextContent( /MailChannels|DKIM|SPF|Lockdown|nameserver/i );
	} );

	it( 'opens the automatic test once, marks it seen and offers the dashboard', async () => {
		render( <OverviewScreen status={ AUTO_TESTED } /> );

		expect( screen.getByRole( 'heading', { name: 'example.com is sending' } ) ).toBeInTheDocument();
		expect( screen.getByText( '3 of 3 completed' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'We sent a test to owner@example.com as soon as example.com connected.' )
		).toBeVisible();
		await waitFor( () => expect( saveOnboarding ).toHaveBeenCalledWith( { verified_seen: true } ) );

		// One way forward: the dashboard's Recent emails shows the test, so no log button here.
		expect(
			screen.queryByRole( 'button', { name: 'See it in your log' } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Go to your dashboard' } ) ).toBeInTheDocument();
	} );

	it( 'finishes setup: saves, swaps to the sending page and moves focus to it', async () => {
		const user = userEvent.setup();
		jest.mocked( saveOnboarding ).mockResolvedValue( AUTO_TESTED );
		render( <OverviewScreen status={ AUTO_TESTED } /> );

		await user.click( screen.getByRole( 'button', { name: 'Go to your dashboard' } ) );

		expect( saveOnboarding ).toHaveBeenCalledWith( { closed: true, verified_seen: true } );
		await waitFor( () =>
			expect( screen.getByRole( 'heading', { name: 'Sending', level: 2 } ) ).toHaveFocus()
		);
		// The card says it; no notice repeats it above.
		expect( screen.queryByText( 'Sending is on.' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( '3 of 3 completed' ) ).not.toBeInTheDocument();
	} );
} );
