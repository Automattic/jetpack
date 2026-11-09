import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { postAction } from '../../../data/api';
import SettingsScreen from '../index';
import type { Account, SendStatus } from '../../../data/types';

const mockNavigate = jest.fn();
const mockSearch = jest.fn( () => ( {} ) );
jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
	useSearch: () => mockSearch(),
} ) );

jest.mock( '../../../data/api', () => ( {
	postAction: jest.fn(),
	fetchLogSummary: jest.fn( () => new Promise( () => undefined ) ),
	errorMessage: () => 'Something went wrong.',
} ) );

const account = {
	handle: 'jpsend3f9a',
	lockdown_auth_id: 'abc',
	domain: 'example.com',
	dkim_selector: 'jpsend',
	monthly_limit: 3000,
	dns_records: [],
	provider: 'wpcom',
	provisioned_at: '2026-10-18T10:00:00Z',
	dns_check: null,
} as Account;

const status = {
	provisioner: 'wpcom',
	account,
	settings: {
		enabled: true,
		from_name: '',
		from_local_part: 'owner',
		fallback: true,
		reply_to: 'owner@example.org',
		auto_enable: true,
		log_retention_days: 30,
		debug_log: false,
		debug_log_days: 7,
	},
	can_enable: true,
	enable_blockers: [],
	suggested_domain: 'example.com',
	site_title: 'Example Site',
	admin_email: 'owner@example.org',
	current_user_email: 'owner@example.org',
	connect_url: '',
	spf_suggestion: null,
	onboarding: {
		closed_at: null,
		step: null,
		dns_provider: null,
		test_to: null,
		test_sent_at: null,
		auto_test_log_id: null,
		verified_seen_at: null,
	},
	next_check_at: null,
	sender_avatar: { email: 'owner@example.com', url: 'https://example.org/avatar/owner?d=blank' },
	site_icon_url: null,
	log_retention_days: 30,
	log_retention_locked: false,
	log_covers_from: null,
	log_trimmed_before: null,
	debug_log: { enabled: false, days: 7, until: null, entries: 0 },
} as SendStatus;

const SPF = {
	type: 'TXT',
	name: 'example.com',
	value: 'v=spf1 include:relay.example.net ~all',
	purpose: 'spf' as const,
	optional: true,
	host: '@',
};
const DKIM = {
	...SPF,
	name: 'jpsend._domainkey.example.com',
	value: 'v=DKIM1; k=rsa; p=abc',
	purpose: 'dkim' as const,
	optional: false,
};

// eslint-disable-next-line testing-library/no-node-access -- the avatar's image is decorative, so it has no role.
const avatarImage = () => document.querySelector( '.jetpack-send-avatar img' );

describe( 'SettingsScreen', () => {
	beforeEach( () => {
		jest.mocked( postAction ).mockReset().mockResolvedValue( status );
		mockSearch.mockReturnValue( {} );
		mockNavigate.mockReset();
		window.sessionStorage.clear();
	} );

	it( 'opens the sender form when "Change sender" sends you here, then drops the param', async () => {
		mockSearch.mockReturnValue( { edit: 'sender' } );
		render( <SettingsScreen status={ status } account={ account } /> );

		expect( screen.getByRole( 'textbox', { name: 'Name' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Change' } ) ).not.toBeInTheDocument();
		expect( mockNavigate ).toHaveBeenCalledWith( {
			href: '/settings',
			replace: true,
			viewTransition: false,
		} );
	} );

	it( 'keeps Advanced open when you come back to Settings', async () => {
		const user = userEvent.setup();
		const { unmount } = render( <SettingsScreen status={ status } account={ account } /> );
		await user.click( screen.getByText( 'Advanced' ) );
		expect( screen.getByRole( 'switch', { name: 'Pause sending' } ) ).toBeVisible();
		unmount();

		render( <SettingsScreen status={ status } account={ account } /> );
		expect( screen.getByRole( 'switch', { name: 'Pause sending' } ) ).toBeVisible();
	} );

	it( 'shows one SPF value, and no setup date before the domain first connects', async () => {
		const user = userEvent.setup();
		const spf = {
			type: 'TXT',
			name: 'example.com',
			value: 'v=spf1 include:relay.example.net ~all',
			purpose: 'spf' as const,
			optional: true,
			host: '@',
		};
		const merged = 'v=spf1 include:_spf.host.example include:relay.example.net ~all';
		const pending = {
			...status,
			can_enable: false,
			onboarding: { ...status.onboarding, closed_at: null },
			spf_suggestion: { value: merged, state: 'merge' as const },
			account: {
				...account,
				dns_records: [
					spf,
					{
						...spf,
						name: 'jpsend._domainkey.example.com',
						value: 'v=DKIM1; k=rsa; p=abc',
						purpose: 'dkim' as const,
						optional: false,
					},
				],
			},
		};
		window.sessionStorage.setItem( 'jetpack-send-settings-advanced-open', '1' );
		const { container } = render(
			<SettingsScreen status={ pending } account={ pending.account } />
		);

		expect( screen.queryByText( 'Set up on' ) ).not.toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: 'Show technical details' } ) );
		expect( container ).not.toHaveTextContent( spf.value );
		// The technical details and the SPF row under Advanced.
		expect( screen.getAllByText( merged ) ).toHaveLength( 2 );
	} );

	it( 'saves the sender with the reply-to address', async () => {
		const user = userEvent.setup();
		render( <SettingsScreen status={ status } account={ account } /> );

		expect( screen.getByText( 'Replies go to owner@example.org.' ) ).toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: 'Change' } ) );
		const replyTo = screen.getByRole( 'textbox', { name: 'Replies go to' } );
		await user.clear( replyTo );
		await user.type( replyTo, 'hello@example.com' );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		expect( postAction ).toHaveBeenCalledWith( 'settings', {
			from_name: '',
			from_local_part: 'owner',
			reply_to: 'hello@example.com',
		} );
	} );

	it( 'shows the saved address’s avatar, and the initial while a new address is typed', async () => {
		const user = userEvent.setup();
		render( <SettingsScreen status={ status } account={ account } /> );
		expect( avatarImage() ).toHaveAttribute( 'src', status.sender_avatar?.url );

		await user.click( screen.getByRole( 'button', { name: 'Change' } ) );
		await user.type( screen.getByRole( 'textbox', { name: 'Address' } ), 's' );

		expect( avatarImage() ).toBeNull();
		expect( screen.getByText( 'owners@example.com' ) ).toBeInTheDocument();
	} );

	it( 'says what the details toggle will do, and never names the sending service', async () => {
		const user = userEvent.setup();
		const { container } = render( <SettingsScreen status={ status } account={ account } /> );

		await user.click( screen.getByRole( 'button', { name: 'Show technical details' } ) );

		expect( screen.getByRole( 'button', { name: 'Hide technical details' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Sending account ID', { selector: 'dt' } ) ).toBeVisible();
		expect( container ).not.toHaveTextContent( /mailchannels/i );
	} );

	it( 'turns automatic sending off without asking, but asks before pausing', async () => {
		const user = userEvent.setup();
		render( <SettingsScreen status={ status } account={ account } /> );

		await user.click( screen.getByText( 'Advanced' ) );
		await user.click(
			screen.getByRole( 'switch', { name: 'Turn on sending when the records pass' } )
		);
		expect( postAction ).toHaveBeenCalledWith( 'settings', { auto_enable: false } );

		await user.click( screen.getByRole( 'switch', { name: 'Pause sending' } ) );
		await expect( screen.findByText( 'Pause sending?' ) ).resolves.toBeInTheDocument();
		expect( postAction ).toHaveBeenCalledTimes( 1 );

		await user.click( screen.getByRole( 'button', { name: 'Pause' } ) );
		await waitFor( () =>
			expect( postAction ).toHaveBeenLastCalledWith( 'settings', { enabled: false } )
		);
	} );

	it( 'starts over and lands on the setup page', async () => {
		const user = userEvent.setup();
		jest.mocked( postAction ).mockResolvedValue( { ...status, account: null } );
		render( <SettingsScreen status={ status } account={ account } /> );

		await user.click( screen.getByRole( 'button', { name: 'Start over…' } ) );
		await user.click( await screen.findByRole( 'button', { name: 'Start over' } ) );

		await waitFor( () => expect( mockNavigate ).toHaveBeenCalledWith( { href: '/' } ) );
		expect( postAction ).toHaveBeenCalledWith( 'reset' );
	} );

	it( 'puts Email log between Domain and Advanced', () => {
		render( <SettingsScreen status={ status } account={ account } /> );

		expect(
			screen.getAllByRole( 'heading', { level: 2 } ).map( heading => heading.textContent )
		).toEqual( [
			'Sender',
			'Domain',
			'Email log',
			'AdvancedPause sending, backup mail, debug log and more',
		] );
	} );

	it( 'turns the debug log on from Advanced without asking', async () => {
		const user = userEvent.setup();
		render( <SettingsScreen status={ status } account={ account } /> );

		await user.click( screen.getByText( 'Advanced' ) );
		expect(
			screen.getByText(
				'Records each step Jetpack Send takes, to help you or support find a problem.'
			)
		).toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /View debug log/ } ) ).not.toBeInTheDocument();
		await user.click( screen.getByRole( 'switch', { name: 'Keep a debug log' } ) );

		expect( postAction ).toHaveBeenCalledWith( 'settings', { debug_log: true } );
		expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
	} );

	it( 'says until when it records, how long it keeps entries, and links to them while on', async () => {
		const user = userEvent.setup();
		const recording = {
			...status,
			debug_log: { enabled: true, days: 7 as const, until: '2026-10-26T14:10:00Z', entries: 3 },
		};
		window.sessionStorage.setItem( 'jetpack-send-settings-advanced-open', '1' );
		render( <SettingsScreen status={ recording } account={ account } /> );

		expect( screen.getByText( /^Recording until .+\. It turns itself off then\.$/ ) ).toBeVisible();
		expect( screen.getByRole( 'link', { name: 'View debug log (3 entries)' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'p=%2Fdebug-log' )
		);
		expect( screen.getByText( 'Each entry is deleted 1 week after it’s recorded.' ) ).toBeVisible();
		await user.click( screen.getByRole( 'combobox', { name: 'Turn off after' } ) );
		await user.click( await screen.findByRole( 'option', { name: '1 month' } ) );
		expect( postAction ).toHaveBeenCalledWith( 'settings', { debug_log_days: 30 } );
	} );

	it.each( [
		[ 'debug', () => screen.getByRole( 'switch', { name: 'Keep a debug log' } ) ],
		// From an email the sender list blocked, so it's needed now, not optional.
		[ 'advanced', () => screen.getByText( 'Sender list (SPF)' ) ],
	] )( 'opens Advanced on its %s setting when a link lands there', async ( edit, target ) => {
		mockSearch.mockReturnValue( { edit } );
		const withSpf = { ...account, dns_records: [ SPF, DKIM ] };
		render( <SettingsScreen status={ { ...status, account: withSpf } } account={ withSpf } /> );

		await waitFor( () => expect( target() ).toHaveFocus() );
		expect( mockNavigate ).toHaveBeenCalledWith( {
			href: '/settings',
			replace: true,
			viewTransition: false,
		} );
	} );
} );
