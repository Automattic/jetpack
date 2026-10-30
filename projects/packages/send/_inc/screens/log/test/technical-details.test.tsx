import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TechnicalDetails from '../technical-details';
import type { LogEntry, LogRow } from '../../../data/types';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );
const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( { useNavigate: () => mockNavigate } ) );

const row = ( overrides: Partial< LogRow > = {} ): LogRow => ( {
	id: '12',
	created_at: '2026-10-19 18:14:03',
	recipients: 'jordan@example.org',
	subject: 'Your order',
	status: 'failed',
	error: 'HTTP 403: not authorized to send',
	request_id: '6f2c9e',
	source: 'wp_mail',
	reason: 'lockdown',
	...overrides,
} );

const entryFor = ( logRow: LogRow, overrides: Partial< LogEntry > = {} ): LogEntry => ( {
	...logRow,
	message: {
		from: null,
		reply_to: null,
		cc: [],
		bcc: [],
		content_type: 'text/plain',
		body: 'Hello',
		attachments: [],
		kept: 'full',
		redacted: true,
	},
	detail: null,
	resend: { allowed: true, reason: '', locked: false },
	resends: [],
	resend_count: 0,
	resend_of_entry: null,
	resent_by: '',
	debug_count: 0,
	support_text: 'Jetpack Send email report\nStatus: failed (lockdown)',
	...overrides,
} );

const open = async () => {
	await userEvent.click( screen.getByRole( 'button', { name: 'Technical details' } ) );
	// The panel measures itself a frame after it opens.
	await act( () => new Promise( resolve => requestAnimationFrame( resolve ) ) );
};

/**
 * The value shown beside a label.
 *
 * @param label - The row's label.
 * @return The value's text.
 */
const valueOf = ( label: string ) =>
	screen.getByText( label, { selector: 'dt' } ).nextElementSibling?.textContent;

beforeEach( () => jest.clearAllMocks() );

describe( 'TechnicalDetails', () => {
	it( 'labels each fact about a refused send, with the service’s own words verbatim', async () => {
		const failed = row();
		render(
			<TechnicalDetails
				row={ failed }
				entry={ entryFor( failed, {
					detail: {
						stage: 'response',
						http_status: 403,
						service_errors: [ '550 5.7.1 This sender is not authorized to send from example.com' ],
						smtp: { code: '550', enhanced: '5.7.1' },
						timing: { ms: 412, timeout_s: 30 },
						fallback: 'on',
						host: {
							result: 'failed',
							reason: 'host_off',
							message: 'Could not instantiate mail function.',
							exception_code: 2,
						},
						records: { lockdown: 'failed', dkim: 'passed', spf: 'soft failed' },
					},
				} ) }
			/>
		);
		await open();

		expect( valueOf( 'What happened' ) ).toBe( 'HTTP 403 from the email service' );
		expect( valueOf( 'Mail server code' ) ).toBe( '550 5.7.1' );
		// The service answered, so it wasn't still waiting.
		expect( valueOf( 'Step' ) ).toBe( 'Reading the answer' );
		expect( valueOf( 'Reason code' ) ).toBe( 'lockdown' );
		// wp-admin's own `code` look is replaced, so the card has one monospace face.
		expect( screen.getByText( 'lockdown', { selector: 'code' } ) ).toHaveClass(
			'jetpack-send-code'
		);
		expect( valueOf( 'Time taken' ) ).toBe( '0.4 s' );
		expect( valueOf( 'Timeout' ) ).toBe( '30 s' );
		expect( valueOf( 'Backup mail' ) ).toBe( 'On' );
		expect( valueOf( 'Your host’s mail' ) ).toBe(
			'Failed: Could not instantiate mail function. (code 2) host_off'
		);
		expect( valueOf( 'Your records when it was sent' ) ).toBe(
			'Sending permission: failed · Signing (DKIM): passed · Sender list (SPF): soft failed'
		);
		expect( valueOf( 'Stored copy' ) ).toBe( 'Full · Sign-in links removed' );
		expect(
			screen.getByText( '550 5.7.1 This sender is not authorized to send from example.com' )
		).toBeVisible();
	} );

	it.each( [
		[
			'a refusal that came with a 2xx',
			{ http_status: 202, code: 'jetpack_send_http_202' },
			'Refused by the email service (HTTP 202)',
		],
		[
			'an answer that couldn’t be read',
			{ http_status: 202, code: 'jetpack_send_unclear' },
			'HTTP 202 from the email service, but the answer couldn’t be read',
		],
		[
			'a network error, with its stage',
			{ transport: { phase: 'dns' as const }, timing: { ms: 200 } },
			'Network error after 0.2 s, finding the service',
		],
	] )( 'says what happened as the support report does: %s', async ( _, detail, line ) => {
		const failed = row();
		render( <TechnicalDetails row={ failed } entry={ entryFor( failed, { detail } ) } /> );
		await open();

		expect( valueOf( 'What happened' ) ).toBe( line );
	} );

	it( 'says a sent email was accepted, with its IDs and a way to copy the request ID', async () => {
		const user = userEvent.setup();
		const sent = row( { status: 'sent', error: '', reason: '' } );
		render(
			<TechnicalDetails
				row={ sent }
				entry={ entryFor( sent, {
					detail: {
						http_status: 202,
						request_id: 'req-1',
						message_id: 'msg-1',
						timing: { ms: 380 },
					},
				} ) }
			/>
		);
		await open();

		expect( valueOf( 'What happened' ) ).toBe( 'Accepted by the email service' );
		expect( valueOf( 'Message ID' ) ).toBe( 'msg-1' );
		expect( screen.queryByText( 'Reason code' ) ).not.toBeInTheDocument();
		// A sent email never needed the backup, so the row isn't there at all rather than empty.
		expect( screen.queryByText( 'Backup mail' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Step' ) ).not.toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: 'Copy request ID' } ) );
		await expect( navigator.clipboard.readText() ).resolves.toBe( 'req-1' );
	} );

	it( 'says how long it waited when the connection timed out after sending', async () => {
		const failed = row( { reason: 'no_answer' } );
		render(
			<TechnicalDetails
				row={ failed }
				entry={ entryFor( failed, {
					detail: { transport: { errno: 28, phase: 'after_send' }, timing: { ms: 30000 } },
				} ) }
			/>
		);
		await open();

		expect( valueOf( 'What happened' ) ).toBe( 'cURL error 28 after 30.0 s, after sending' );
	} );

	it( 'still says it was waiting when a send timed out after the request went out', async () => {
		const failed = row( { reason: 'no_answer' } );
		render(
			<TechnicalDetails
				row={ failed }
				entry={ entryFor( failed, {
					detail: {
						stage: 'response',
						transport: { errno: 28, phase: 'after_send' },
						timing: { ms: 30000 },
						fallback: 'off',
					},
				} ) }
			/>
		);
		await open();

		expect( valueOf( 'Step' ) ).toBe( 'Waiting for an answer' );
		expect( valueOf( 'Backup mail' ) ).toBe( 'Off' );
	} );

	it( 'shows an older row’s raw error, since it has no stored detail', async () => {
		const older = row( { reason: '', error: 'The sending service returned HTTP 503.' } );
		render( <TechnicalDetails row={ older } entry={ entryFor( older ) } /> );
		await open();

		expect( screen.getByText( 'The sending service returned HTTP 503.' ) ).toBeVisible();
		expect( valueOf( 'Request ID' ) ).toBe( '6f2c9e' );
	} );

	it( 'copies the support report and links to the email’s debug entries only when there are some', async () => {
		const user = userEvent.setup();
		const failed = row();
		const { rerender } = render( <TechnicalDetails row={ failed } entry={ entryFor( failed ) } /> );
		await open();

		await user.click( screen.getByRole( 'button', { name: 'Copy details for support' } ) );
		await expect( navigator.clipboard.readText() ).resolves.toBe(
			'Jetpack Send email report\nStatus: failed (lockdown)'
		);
		expect( screen.queryByRole( 'button', { name: /See debug entries/ } ) ).not.toBeInTheDocument();

		rerender(
			<TechnicalDetails row={ failed } entry={ entryFor( failed, { debug_count: 3 } ) } />
		);
		await user.click( screen.getByRole( 'button', { name: 'See debug entries (3)' } ) );
		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/debug-log?email=12' } );
	} );

	it( 'waits for the entry before offering Copy details', async () => {
		render( <TechnicalDetails row={ row() } entry={ null } /> );
		await open();

		expect( screen.getByText( 'HTTP 403: not authorized to send' ) ).toBeVisible();
		expect( screen.queryByRole( 'button', { name: /Copy details/ } ) ).not.toBeInTheDocument();
	} );
} );
