import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import { fetchStats, postAction } from '../../../../data/api';
import SetupPage, { CONNECTED_HOLD_MS } from '../setup-page';
import { VERIFIED, makeStatus } from './fixtures/status';
import type { SendStatus } from '../../../../data/types';

jest.mock( '@wordpress/route', () => ( { useNavigate: () => jest.fn() } ) );
jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );
jest.mock( '../../../../data/api', () => ( {
	saveOnboarding: jest.fn( () => new Promise( () => undefined ) ),
	postAction: jest.fn( () => new Promise( () => undefined ) ),
	sendTest: jest.fn( () => new Promise( () => undefined ) ),
	fetchDnsHost: jest.fn( () => new Promise( () => undefined ) ),
	fetchStatus: jest.fn( () => new Promise( () => undefined ) ),
	fetchStats: jest.fn( () => new Promise( () => undefined ) ),
	errorMessage: () => 'Something went wrong.',
} ) );
jest.mock( '../../../../components/onboarding/use-dns-polling', () => ( {
	useDnsPolling: () => ( {
		lookup: null,
		checking: false,
		lastCheckedAt: null,
		stopped: false,
		error: null,
		checkNow: jest.fn(),
		nudge: jest.fn(),
	} ),
} ) );

const header = ( name: RegExp ) => screen.getByRole( 'button', { name } );
const isOpen = ( name: RegExp ) => header( name ).getAttribute( 'aria-expanded' ) === 'true';
const page = ( status: SendStatus ) => <SetupPage status={ status } onFinish={ jest.fn() } />;

describe( 'SetupPage', () => {
	beforeEach( () => jest.clearAllMocks() );

	it( 'starts on the sender with the other tasks locked', () => {
		render( page( makeStatus( { withAccount: false } ) ) );

		expect(
			screen.getByRole( 'heading', { name: 'Send your site’s emails from example.com' } )
		).toBeInTheDocument();
		expect( screen.getByText( '0 of 3 completed' ) ).toBeInTheDocument();
		expect( isOpen( /Choose who your emails come from/ ) ).toBe( true );
		// Locked, it already has the title it keeps; detection only adds "at {provider}".
		expect( isOpen( /^Add 2 records/ ) ).toBe( false );
		expect( isOpen( /Send yourself a test/ ) ).toBe( false );
		expect( screen.getByRole( 'button', { name: 'Use this address' } ) ).toBeInTheDocument();
	} );

	it( 'names no domain while the site is on a temporary address', () => {
		render( page( makeStatus( { withAccount: false, suggested_domain: '127.0.0.1' } ) ) );
		expect(
			screen.getByRole( 'heading', { name: 'Send your site’s emails from your own domain' } )
		).toBeInTheDocument();
		expect( screen.getByLabelText( 'Domain' ) ).toBeInTheDocument();
	} );

	it( 'keeps one card open, and doesn’t reopen one after the user closes it', async () => {
		const user = userEvent.setup();
		const { rerender } = render( page( makeStatus() ) );

		expect( isOpen( /Add 2 records at Cloudflare/ ) ).toBe( true );
		await user.click( header( /Choose who your emails come from/ ) );
		expect( isOpen( /Choose who your emails come from/ ) ).toBe( true );
		expect( isOpen( /Add 2 records at Cloudflare/ ) ).toBe( false );

		await user.click( header( /Choose who your emails come from/ ) );
		rerender( page( makeStatus() ) );
		expect( isOpen( /Choose who your emails come from/ ) ).toBe( false );
		expect( isOpen( /Add 2 records at Cloudflare/ ) ).toBe( false );
	} );

	it( 'sets up sending, then opens the records and moves focus to them', async () => {
		const user = userEvent.setup();
		jest.mocked( postAction ).mockResolvedValue( makeStatus() );
		const { rerender } = render( page( makeStatus( { withAccount: false } ) ) );

		await user.click( screen.getByRole( 'button', { name: 'Use this address' } ) );
		expect( postAction ).toHaveBeenCalledWith( 'setup', { domain: 'example.com' } );
		rerender( page( makeStatus() ) );

		await waitFor( () => expect( header( /Add 2 records at Cloudflare/ ) ).toHaveFocus() );
		expect( isOpen( /Add 2 records at Cloudflare/ ) ).toBe( true );
		expect( speak ).toHaveBeenCalledWith(
			'Sending is set up for example.com. Next, add 2 records.'
		);
		expect( screen.getByText( '1 of 3 completed' ) ).toBeInTheDocument();
	} );

	it( 'offers one Try again when setting up sending fails, and keeps focus on it', async () => {
		const user = userEvent.setup();
		jest.mocked( postAction ).mockRejectedValueOnce( { code: 'jetpack_send_provision_failed' } );
		render( page( makeStatus( { withAccount: false } ) ) );

		await user.click( screen.getByRole( 'button', { name: 'Use this address' } ) );
		const retry = await screen.findByRole( 'button', { name: 'Try again' } );
		expect( screen.getAllByRole( 'button', { name: 'Try again' } ) ).toHaveLength( 1 );
		expect( screen.queryByRole( 'button', { name: 'Use this address' } ) ).not.toBeInTheDocument();
		expect( retry ).toHaveFocus();
		expect( screen.getByText( 'We couldn’t set up sending for example.com.' ) ).toBeInTheDocument();
	} );

	it( 'unlocks and opens the test when the domain connects, without moving focus', async () => {
		const { rerender } = render( page( makeStatus() ) );

		rerender( page( makeStatus( VERIFIED ) ) );

		await waitFor( () => expect( isOpen( /Send yourself a test/ ) ).toBe( true ), {
			timeout: CONNECTED_HOLD_MS * 3,
		} );
		expect( header( /Send yourself a test/ ) ).not.toHaveFocus();
		expect( header( /Add 2 records at Cloudflare/ ) ).not.toHaveFocus();
		expect( speak ).toHaveBeenCalledWith( 'example.com is connected. Sending is on.' );
		expect( screen.getByText( '2 of 3 completed' ) ).toBeInTheDocument();
		expect( screen.getByText( 'On' ) ).toBeInTheDocument();
	} );

	it( 'keeps focus in the page when the card holding it closes on connect', async () => {
		const { rerender } = render( page( makeStatus() ) );
		const copy = screen.getByRole( 'button', { name: 'Copy name, record 1' } );
		act( () => copy.focus() );

		rerender( page( makeStatus( VERIFIED ) ) );

		await waitFor( () => expect( isOpen( /Send yourself a test/ ) ).toBe( true ), {
			timeout: CONNECTED_HOLD_MS * 3,
		} );
		await waitFor( () => expect( header( /Add 2 records at Cloudflare/ ) ).toHaveFocus() );
		expect( header( /Send yourself a test/ ) ).not.toHaveFocus();
	} );

	it( 'says the domain is sending once every task is done, with one way forward', async () => {
		const onFinish = jest.fn();
		render(
			<SetupPage
				status={ makeStatus( {
					...VERIFIED,
					onboarding: { test_sent_at: '2026-10-18T10:00:00Z', auto_test_log_id: '42' },
				} ) }
				onFinish={ onFinish }
			/>
		);
		expect( screen.getByRole( 'heading', { name: 'example.com is sending' } ) ).toBeInTheDocument();
		expect( screen.getByText( '3 of 3 completed' ) ).toBeInTheDocument();
		expect( isOpen( /Send yourself a test/ ) ).toBe( true );
		expect( screen.getByRole( 'button', { name: 'Go to your dashboard' } ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'See it in your log' } )
		).not.toBeInTheDocument();
		expect( screen.getByText( 'How your emails look' ) ).toBeInTheDocument();
		// The dashboard gets its first period ahead of time.
		await waitFor( () => expect( fetchStats ).toHaveBeenCalledWith( { range: 90 } ) );
	} );
} );
