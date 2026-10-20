import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import { applyCloudflare, saveOnboarding } from '../../../../data/api';
import ConnectTask from '../connect-task';
import { taskStates } from '../model';
import { VERIFIED, dnsHost, lookup, lookupRow, makeStatus } from './fixtures/status';
import type { DnsPollingState } from '../../../../components/onboarding/use-dns-polling';
import type { DnsLookup, SendStatus } from '../../../../data/types';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );
jest.mock( '../../../../data/api', () => ( {
	fetchDnsHost: jest.fn( () => new Promise( () => undefined ) ),
	fetchStatus: jest.fn( () => new Promise( () => undefined ) ),
	saveOnboarding: jest.fn( () => new Promise( () => undefined ) ),
	postAction: jest.fn( () => new Promise( () => undefined ) ),
	applyCloudflare: jest.fn( () => new Promise( () => undefined ) ),
	postDomainConnect: jest.fn(),
	postWpcomDns: jest.fn(),
	errorMessage: () => 'Something went wrong.',
} ) );

const polling = ( current: DnsLookup | null = null ): DnsPollingState => ( {
	lookup: current,
	checking: false,
	lastCheckedAt: null,
	stopped: false,
	error: null,
	checkNow: jest.fn(),
	nudge: jest.fn(),
} );

const renderTask = ( status: SendStatus, state: DnsPollingState = polling() ) =>
	render(
		<ConnectTask
			status={ status }
			state={ taskStates( status, state.lookup ).connect }
			polling={ state }
			open
			onOpenChange={ jest.fn() }
		/>
	);

describe( 'ConnectTask', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'lists both records in the provider’s own words, with labelled Copy buttons', async () => {
		const user = userEvent.setup();
		const state = polling();
		renderTask( makeStatus(), state );

		expect( screen.getByText( 'Add 2 records at Cloudflare' ) ).toBeInTheDocument();
		expect( screen.getByText( '0 of 2 found' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Lets Jetpack send for you' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Proves the emails are really yours' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Still looking for 2 records' ) ).toBeInTheDocument();
		// The waiting note says it once; the rows don't repeat it.
		expect( screen.queryByText( 'Not found yet' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Skip' } ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Copy name, record 1' } ) );
		await expect( navigator.clipboard.readText() ).resolves.toBe( '_mailchannels' );
		expect( speak ).toHaveBeenCalledWith( 'Copied' );
		expect( state.nudge ).toHaveBeenCalled();
		expect( screen.getByRole( 'button', { name: 'Copied' } ) ).toBeInTheDocument();
	} );

	it( 'links to Cloudflare’s DNS records page', () => {
		renderTask( makeStatus() );
		expect( screen.getByRole( 'link', { name: /Open Cloudflare/ } ) ).toHaveAttribute(
			'href',
			'https://dash.cloudflare.com/?to=/:account/:zone/dns/records'
		);
	} );

	it( 'counts a found record in the header and the waiting note', () => {
		renderTask(
			makeStatus(),
			polling( lookup( [ lookupRow( { state: 'found' } ), lookupRow( { purpose: 'dkim' } ) ] ) )
		);

		expect( screen.getByText( '1 of 2 found' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Found' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Still looking for 1 record' ) ).toBeInTheDocument();
	} );

	it( 'says it’s still waiting, and what to check, once records have been missing for 48 hours', () => {
		const base = makeStatus();
		const status = makeStatus( {
			account: {
				...( base.account as NonNullable< SendStatus[ 'account' ] > ),
				provisioned_at: new Date( Date.now() - 49 * 60 * 60 * 1000 ).toISOString(),
			},
		} );
		renderTask(
			status,
			polling( lookup( [ lookupRow( {} ), lookupRow( { purpose: 'dkim' } ) ] ) )
		);

		expect( screen.getByText( 'Still waiting on example.com' ) ).toBeInTheDocument();
		expect(
			screen.getByText( /Most hosts are done by now, so check the records match exactly\./ )
		).toBeInTheDocument();
		expect( screen.queryByText( 'Still looking for 2 records' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the normal waiting note before 48 hours', () => {
		const base = makeStatus();
		const status = makeStatus( {
			account: {
				...( base.account as NonNullable< SendStatus[ 'account' ] > ),
				provisioned_at: new Date( Date.now() - 47 * 60 * 60 * 1000 ).toISOString(),
			},
		} );
		renderTask( status );

		expect( screen.getByText( 'Still looking for 2 records' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Still waiting on example.com' ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[
			'wrong_value',
			'Record doesn’t match',
			'Doesn’t match',
			/One record has a different value at Cloudflare/,
		],
		[
			'doubled',
			'Record name doubled',
			'Name doubled',
			/Cloudflare added example\.com to the end of the name/,
		],
		[
			'conflict',
			'Old record in the way',
			'Old record in the way',
			/There’s already a record with this name/,
		],
		[ 'proxied', 'Proxy on', 'Proxy on', /Turn off the proxy for this record/ ],
		[ 'not_live', 'Record not live yet', 'Not live yet', /It’s saved but not live yet/ ],
	] as const )( 'explains a %s problem inside the card', ( problem, header, badge, text ) => {
		renderTask(
			makeStatus(),
			polling(
				lookup( [
					lookupRow( { state: 'found' } ),
					lookupRow( {
						purpose: 'dkim',
						host: 'jpsend._domainkey',
						state: 'needs_fix',
						problem,
					} ),
				] )
			)
		);

		// The header and the row say what's wrong, never a catch-all; the notice says the fix once.
		expect( screen.getAllByText( header ) ).toHaveLength( header === badge ? 2 : 1 );
		expect( screen.getAllByText( badge ) ).toHaveLength( header === badge ? 2 : 1 );
		expect( screen.queryByText( /needs a fix/i ) ).not.toBeInTheDocument();
		expect( screen.getAllByText( text ) ).toHaveLength( 1 );
	} );

	it.each( [
		[
			'wrong_value',
			'We found both records at Cloudflare, but their values are different. Copy them again and replace the old ones.',
		],
		[ 'conflict', 'Both names already have an old record. Delete the old ones, then add these.' ],
	] as const )(
		'says a %s problem both records share once, in one notice',
		( problem, summary ) => {
			renderTask(
				makeStatus(),
				polling(
					lookup( [
						lookupRow( { state: 'needs_fix', problem } ),
						lookupRow( {
							purpose: 'dkim',
							host: 'jpsend._domainkey',
							state: 'needs_fix',
							problem,
						} ),
					] )
				)
			);

			expect( screen.getAllByText( summary ) ).toHaveLength( 1 );
			expect( screen.queryByText( /^Record \d/ ) ).not.toBeInTheDocument();
			expect( screen.queryByText( /this record|the value is different/ ) ).not.toBeInTheDocument();
		}
	);

	it( 'says once that the domain isn’t live, and waits on the domain rather than the records', () => {
		renderTask(
			makeStatus(),
			polling(
				lookup( [
					lookupRow( { state: 'found' } ),
					lookupRow( { purpose: 'dkim', host: 'jpsend._domainkey', state: 'found' } ),
					lookupRow( {
						purpose: 'sender_domain',
						name: 'example.com',
						host: '@',
						state: 'needs_fix',
						problem: 'not_live',
					} ),
				] )
			)
		);

		expect( screen.getByText( 'Domain not live' ) ).toBeInTheDocument();
		expect(
			screen.getAllByText( 'example.com isn’t pointing at a website or mailbox yet.' )
		).toHaveLength( 1 );
		// "Live" is said once, by the badge; the waiting note stays neutral.
		expect( screen.getByText( 'Checking every few minutes' ) ).toBeInTheDocument();
		expect(
			screen.queryByText( /go live|isn’t live yet|not live yet\. Check|usually quick/ )
		).not.toBeInTheDocument();
	} );

	it( 'says when DNS can’t be reached and keeps trying', () => {
		renderTask(
			makeStatus(),
			polling(
				lookup( [
					lookupRow( { state: 'no_answer' } ),
					lookupRow( { purpose: 'dkim', state: 'no_answer' } ),
				] )
			)
		);
		expect(
			screen.getByText( 'We can’t reach example.com’s DNS right now. We’ll keep trying.' )
		).toBeInTheDocument();
	} );

	it( 'shows “Finding where … is managed” while detection runs', () => {
		renderTask( makeStatus( { host: null } ) );
		expect( screen.getByText( 'Finding where example.com is managed…' ) ).toBeInTheDocument();
	} );

	it( 'asks where DNS is managed when detection found nothing, with every provider to pick from', () => {
		renderTask(
			makeStatus( { host: dnsHost( { provider: null, provider_source: null, nameservers: [] } ) } )
		);
		expect( screen.getByText( 'Connect example.com' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Where do you change DNS settings for example.com?' )
		).toBeInTheDocument();
	} );

	it( 'saves where DNS is managed when picked from the list', async () => {
		const user = userEvent.setup();
		renderTask(
			makeStatus( { host: dnsHost( { provider: null, provider_source: null, nameservers: [] } ) } )
		);

		await user.click(
			screen.getByRole( 'combobox', { name: 'Where do you change DNS settings for example.com?' } )
		);
		await user.click( await screen.findByRole( 'option', { name: 'I’m not sure' } ) );

		expect( saveOnboarding ).toHaveBeenCalledWith( { dns_provider: 'unsure' } );
		expect( screen.getByRole( 'button', { name: 'Copy steps' } ) ).toBeInTheDocument();
	} );

	it( 'opens the picker from “Not Cloudflare?” and returns focus on Cancel', async () => {
		const user = userEvent.setup();
		renderTask( makeStatus() );

		const notRight = screen.getByRole( 'button', { name: 'Not Cloudflare?' } );
		await user.click( notRight );
		await expect(
			screen.findByText( 'Where do you change DNS settings for example.com?' )
		).resolves.toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		await waitFor( () => expect( notRight ).toHaveFocus() );
		expect( saveOnboarding ).not.toHaveBeenCalled();
	} );

	it( 'lets Jetpack add the records at Cloudflare from a form inside the card', async () => {
		const user = userEvent.setup();
		renderTask( makeStatus( { host: dnsHost( { cloudflare_api: { supported: true } } ) } ) );

		const button = screen.getByRole( 'button', { name: 'Let Jetpack add them' } );
		await user.click( button );
		expect( screen.getByLabelText( 'API token' ) ).toHaveFocus();
		expect( screen.queryByRole( 'link', { name: /Open Cloudflare/ } ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		await waitFor( () =>
			expect( screen.getByRole( 'button', { name: 'Let Jetpack add them' } ) ).toHaveFocus()
		);
	} );

	it( 'keeps a note in the card when Cloudflare’s locked sender list was left as it is', async () => {
		const user = userEvent.setup();
		const status = makeStatus( { host: dnsHost( { cloudflare_api: { supported: true } } ) } );
		jest.mocked( applyCloudflare ).mockResolvedValueOnce( {
			success: true,
			records: [
				{ purpose: 'lockdown', name: '_mailchannels.example.com', action: 'created' },
				{
					purpose: 'spf',
					name: 'example.com',
					action: 'skipped',
					optional: true,
					reason: 'email_routing',
				},
				{ purpose: 'dkim', name: 'jpsend._domainkey.example.com', action: 'created' },
			],
			status,
		} );
		renderTask( status );

		await user.click( screen.getByRole( 'button', { name: 'Let Jetpack add them' } ) );
		await user.type( screen.getByLabelText( 'API token' ), 'cfTokenAbc123_secret-VALUE-xyz7890' );
		await user.click( screen.getByRole( 'button', { name: 'Add records' } ) );

		await expect(
			screen.findByText(
				'We left your domain’s sender list as it is, because Cloudflare Email Routing manages it. Sending doesn’t need it.'
			)
		).resolves.toBeInTheDocument();
		expect( screen.queryByLabelText( 'API token' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the steps to send someone else when asked', async () => {
		const user = userEvent.setup();
		renderTask( makeStatus() );

		const toggle = screen.getByRole( 'button', { name: 'Send these steps to someone' } );
		expect( toggle ).toHaveAttribute( 'aria-expanded', 'false' );
		await user.click( toggle );
		expect( toggle ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( screen.getByRole( 'button', { name: 'Copy steps' } ) ).toBeInTheDocument();
	} );

	it( 'marks both records found once connected, even when the last lookup hadn’t seen them', () => {
		renderTask(
			makeStatus( VERIFIED ),
			polling(
				lookup( [
					lookupRow( { state: 'not_found' } ),
					lookupRow( { purpose: 'dkim', host: 'jpsend._domainkey', state: 'not_found' } ),
				] )
			)
		);

		expect( screen.getByText( 'Both found' ) ).toBeInTheDocument();
		expect( screen.getAllByText( 'Found' ) ).toHaveLength( 2 );
		expect( screen.queryByText( 'Not found yet' ) ).not.toBeInTheDocument();
	} );

	it( 'offers Turn sending on once connected when sending doesn’t turn on by itself', () => {
		renderTask(
			makeStatus( {
				can_enable: true,
				enable_blockers: [],
				settings: { enabled: false, auto_enable: false },
			} )
		);
		expect( screen.getByText( 'Both found' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Turn sending on' } ) ).toBeInTheDocument();
		expect( screen.queryByText( /Still looking/ ) ).not.toBeInTheDocument();
	} );
} );
