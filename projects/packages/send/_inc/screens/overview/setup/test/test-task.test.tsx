import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import { select } from '@wordpress/data';
import { fetchStatus, saveOnboarding, sendTest } from '../../../../data/api';
import { sendStore } from '../../../../data/store';
import { setupMode, taskStates } from '../model';
import TestTask from '../test-task';
import { useTestEmail } from '../use-test-email';
import { VERIFIED, makeStatus } from './fixtures/status';
import type { SendStatus } from '../../../../data/types';
import type { LocalTest } from '../model';

const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( { useNavigate: () => mockNavigate } ) );
jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );
jest.mock( '../../../../data/api', () => ( {
	saveOnboarding: jest.fn( () => new Promise( () => undefined ) ),
	sendTest: jest.fn(),
	fetchStatus: jest.fn( () => new Promise( () => undefined ) ),
	errorMessage: ( error: { message?: string } ) => error?.message ?? 'Something went wrong.',
} ) );

const Harness = ( { status, onSkip = jest.fn() }: { status: SendStatus; onSkip?: () => void } ) => {
	const test = useTestEmail( 'example.com' );
	let local: LocalTest = null;
	if ( test.state.phase === 'sent' || test.state.phase === 'failed' ) {
		local = test.state.phase;
	}
	return (
		<TestTask
			status={ status }
			state={ taskStates( status, null, local ).test }
			test={ test }
			open
			onOpenChange={ jest.fn() }
			onSkip={ onSkip }
			skipping={ false }
		/>
	);
};

describe( 'TestTask', () => {
	beforeEach( () => jest.clearAllMocks() );

	it( 'stays locked with a plain hint until the domain is connected', () => {
		render( <Harness status={ makeStatus() } /> );
		expect( screen.getByText( 'Once sending is on' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Available once example.com is connected.' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Send test email' } ) ).not.toBeInTheDocument();
		expect( saveOnboarding ).not.toHaveBeenCalled();
	} );

	it( 'shows the fixed recipient, marks the ready state seen, and sends', async () => {
		const user = userEvent.setup();
		jest.mocked( sendTest ).mockResolvedValue( { success: true, log_id: '9' } );
		render( <Harness status={ makeStatus( VERIFIED ) } /> );

		expect( screen.getByText( 'owner@example.com', { selector: 'dd' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Example Site' ) ).toBeInTheDocument();
		expect( screen.getAllByText( 'owner@example.com' ) ).toHaveLength( 2 );
		expect( screen.getByText( 'Test email from Example Site' ) ).toBeInTheDocument();
		await waitFor( () => expect( saveOnboarding ).toHaveBeenCalledWith( { verified_seen: true } ) );

		await user.click( screen.getByRole( 'button', { name: 'Send test email' } ) );
		await expect( screen.findByText( 'Sent to owner@example.com.' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Sent' ) ).toBeInTheDocument();
		expect( speak ).toHaveBeenCalledWith( 'Your test is on its way.' );
		expect( sendTest ).toHaveBeenCalledWith();
	} );

	it( 'explains a failed test plainly and links to its log row', async () => {
		const user = userEvent.setup();
		jest.mocked( sendTest ).mockResolvedValue( {
			success: false,
			log_id: '11',
			error: 'cURL error 28: Operation timed out',
		} );
		render( <Harness status={ makeStatus( VERIFIED ) } /> );

		await user.click( screen.getByRole( 'button', { name: 'Send test email' } ) );
		await expect( screen.findByText( 'Your test didn’t go out' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Didn’t go out' ) ).toBeInTheDocument();
		expect( speak ).toHaveBeenCalledWith( expect.stringContaining( 'didn’t go out' ), 'assertive' );

		await user.click( screen.getByRole( 'button', { name: 'See what went wrong' } ) );
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/log?entry=11' } );
		expect( screen.getByRole( 'button', { name: 'Try again' } ) ).toBeInTheDocument();
	} );

	it( 'doesn’t say a test failed when Send isn’t sure it went out', async () => {
		const user = userEvent.setup();
		jest
			.mocked( sendTest )
			.mockResolvedValue( { success: false, log_id: '12', error: 'timeout', reason: 'no_answer' } );
		render( <Harness status={ makeStatus( VERIFIED ) } /> );

		await user.click( screen.getByRole( 'button', { name: 'Send test email' } ) );
		await expect(
			screen.findByText( 'Jetpack Send isn’t sure your test went out' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Your test didn’t go out' ) ).not.toBeInTheDocument();
		expect( speak ).toHaveBeenCalledWith(
			expect.stringMatching( /^Jetpack Send isn’t sure your test went out\. / ),
			'assertive'
		);
	} );

	it.each( [
		[
			'on our side',
			'HTTP 403: Can only send to verified email addresses',
			'The problem is on our side, not your site.',
			true,
			undefined,
		],
		[
			'a records problem',
			'550 Domain lockdown',
			/hasn’t given Jetpack permission/,
			false,
			undefined,
		],
		// The server's stored reason wins over a bare status that reads as "our side".
		[
			'the reason the server named',
			'HTTP 403',
			/hasn’t given Jetpack permission/,
			false,
			'lockdown',
		],
	] )(
		'says a failed test is %s, with support only when the site can’t fix it',
		async ( _, error, text, support, reason ) => {
			const user = userEvent.setup();
			jest.mocked( sendTest ).mockResolvedValue( { success: false, log_id: '13', error, reason } );
			render( <Harness status={ makeStatus( VERIFIED ) } /> );

			await user.click( screen.getByRole( 'button', { name: 'Send test email' } ) );
			await expect( screen.findByText( text ) ).resolves.toBeInTheDocument();
			expect( screen.queryAllByRole( 'link', { name: /Contact support/ } ) ).toHaveLength(
				support ? 1 : 0
			);
		}
	);

	it( 'gives a next step when the failure has no known reason', async () => {
		const user = userEvent.setup();
		jest.mocked( sendTest ).mockResolvedValue( {
			success: false,
			log_id: '12',
			error: 'The mail service returned an error.',
		} );
		render( <Harness status={ makeStatus( VERIFIED ) } /> );

		await user.click( screen.getByRole( 'button', { name: 'Send test email' } ) );
		await expect(
			screen.findByText( 'Something went wrong. Try again in a minute.' )
		).resolves.toBeInTheDocument();
	} );

	it( 'reads the status again after a test, so the next route opens the active Overview', async () => {
		const user = userEvent.setup();
		const seen = makeStatus( {
			...VERIFIED,
			onboarding: { verified_seen_at: '2026-10-18T10:00:00Z' },
		} );
		const after = makeStatus( {
			...VERIFIED,
			onboarding: {
				verified_seen_at: '2026-10-18T10:00:00Z',
				test_sent_at: '2026-10-18T10:01:00Z',
			},
		} );
		jest.mocked( sendTest ).mockResolvedValue( { success: true, log_id: '9' } );
		jest.mocked( fetchStatus ).mockResolvedValue( after );
		expect( setupMode( seen ) ).toBe( 'setup' );
		render( <Harness status={ seen } /> );

		await user.click( screen.getByRole( 'button', { name: 'Send test email' } ) );
		await waitFor( () => expect( select( sendStore ).getStatus() ).toEqual( after ) );
		expect( fetchStatus ).toHaveBeenCalled();
		// A StatusGate mounted from here (the Log, then Overview) decides from this status.
		expect( setupMode( select( sendStore ).getStatus() as SendStatus ) ).toBe( 'active' );
	} );

	it( 'disables sending while the test limit is reached', async () => {
		const user = userEvent.setup();
		jest.mocked( sendTest ).mockRejectedValue( {
			code: 'jetpack_send_rate_limited',
			message: 'Too many.',
		} );
		render( <Harness status={ makeStatus( VERIFIED ) } /> );

		await user.click( screen.getByRole( 'button', { name: 'Send test email' } ) );
		await expect(
			screen.findByText( 'You’ve sent a few tests already. Try again in a few minutes.' )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Send test email' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'says the automatic test went out', () => {
		render(
			<Harness
				status={ makeStatus( {
					...VERIFIED,
					onboarding: { test_sent_at: '2026-10-18T10:00:00Z', auto_test_log_id: '42' },
				} ) }
			/>
		);
		expect( screen.getByText( 'Sent automatically' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'We sent a test to owner@example.com as soon as example.com connected.' )
		).toBeInTheDocument();
	} );

	it( 'skips, and then shows the test as skipped', async () => {
		const user = userEvent.setup();
		const onSkip = jest.fn();
		const { rerender } = render( <Harness status={ makeStatus( VERIFIED ) } onSkip={ onSkip } /> );

		await user.click( screen.getByRole( 'button', { name: 'Skip' } ) );
		expect( onSkip ).toHaveBeenCalled();

		rerender(
			<Harness
				status={ makeStatus( { ...VERIFIED, onboarding: { closed_at: '2026-10-18T10:00:00Z' } } ) }
			/>
		);
		expect( screen.getByText( 'Skipped' ) ).toBeInTheDocument();
	} );
} );

describe( 'useTestEmail', () => {
	it( 'sends one test at a time', async () => {
		let resolve: ( value: { success: boolean } ) => void = () => undefined;
		jest
			.mocked( sendTest )
			.mockImplementation(
				() => new Promise( done => ( resolve = done ) ) as ReturnType< typeof sendTest >
			);
		const { result } = renderHook( () => useTestEmail( 'example.com' ) );

		act( () => {
			void result.current.send();
			void result.current.send();
		} );
		expect( sendTest ).toHaveBeenCalledTimes( 1 );
		await act( async () => resolve( { success: true } ) );
		expect( result.current.state.phase ).toBe( 'sent' );
	} );
} );
