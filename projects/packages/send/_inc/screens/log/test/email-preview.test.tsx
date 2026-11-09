import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import { fetchLogEntry, resendLogEntry } from '../../../data/api';
import EmailPanel, { FRAME_PROBE_CLASS } from '../email-preview';
import type { LogEntry } from '../../../data/types';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );
const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( { useNavigate: () => mockNavigate } ) );
jest.mock( '../../../data/api', () => ( {
	fetchLogEntry: jest.fn(),
	resendLogEntry: jest.fn(),
	errorMessage: ( e: { message?: string } ) => e?.message ?? 'error',
} ) );
const mockLogChanged = jest.fn();
jest.mock( '../../../data/store', () => {
	const { createReduxStore, register } = jest.requireActual( '@wordpress/data' );
	const sendStore = createReduxStore( 'jetpack-send-panel-test', {
		reducer: ( state = {} ) => state,
		actions: {
			logChanged: () => {
				mockLogChanged();
				return { type: 'LOG_CHANGED' };
			},
			requestLogDelete: ( row: unknown ) => ( { type: 'LOG_DELETE_REQUEST', row } ),
		},
		selectors: { getLogRow: () => null },
	} );
	register( sendStore );
	return {
		sendStore,
		useSendStatus: () => ( {
			status: {
				account: { domain: 'example.com' },
				onboarding: { auto_test_log_id: null },
				provisioner: 'wpcom',
				current_user_email: 'owner@example.com',
			},
		} ),
	};
} );

const entry = ( overrides: Partial< LogEntry > = {} ): LogEntry => ( {
	id: '7',
	created_at: '2026-10-19 14:14:03',
	recipients: 'jordan@example.org',
	subject: 'Your order #1042',
	status: 'sent',
	error: '',
	request_id: 'r7',
	source: 'wp_mail',
	message: {
		from: { email: 'hello@example.com', name: 'Example Shop' },
		reply_to: null,
		to: [ { email: 'jordan@example.org' } ],
		cc: [],
		bcc: [],
		content_type: 'text/plain',
		body: 'Thanks for your order.',
		attachments: [],
		kept: 'full',
	},
	detail: null,
	resend: { allowed: true, reason: '', locked: false },
	resends: [],
	resend_count: 0,
	resend_of_entry: null,
	resent_by: '',
	debug_count: 0,
	support_text: 'report',
	...overrides,
} );

const renderPanel = async ( logEntry: LogEntry ) => {
	jest.mocked( fetchLogEntry ).mockResolvedValue( logEntry );
	const onClose = jest.fn();
	const view = render( <EmailPanel id={ logEntry.id } onClose={ onClose } /> );
	const panel = await screen.findByRole( 'region', { name: logEntry.subject } );
	await expect( within( panel ).findByText( 'Example Shop' ) ).resolves.toBeVisible();
	return { ...view, panel, onClose };
};

beforeEach( () => jest.clearAllMocks() );

describe( 'EmailPanel', () => {
	it( 'works out the frame’s styles once, not on every render', async () => {
		const probes = jest.spyOn( window, 'getComputedStyle' );
		const html = entry( {
			message: { ...entry().message!, content_type: 'text/html', body: '<p>Hi</p>' },
		} );
		const { rerender } = await renderPanel( html );

		rerender( <EmailPanel id="7" onClose={ jest.fn() } /> );
		rerender( <EmailPanel id="7" onClose={ jest.fn() } /> );

		const probeRuns = probes.mock.calls.filter( ( [ element ] ) =>
			element.classList.contains( FRAME_PROBE_CLASS )
		);
		expect( probeRuns ).toHaveLength( 1 );
		probes.mockRestore();
	} );

	it.each( [
		[ 'off', 'This email’s content wasn’t kept. Your site’s code turned that off.' ],
		[ 'too_large', 'This email was too big to keep a copy.' ],
	] as const )( 'says why there’s no copy when content was %s', async ( kept, copy ) => {
		const { panel } = await renderPanel(
			entry( {
				message: { ...entry().message!, body: null, kept, attachments: [ 'invoice.pdf' ] },
			} )
		);

		expect( within( panel ).getByText( copy ) ).toBeVisible();
		// The addresses and attachment names are kept even when the content isn't.
		expect( within( panel ).getByRole( 'list', { name: 'Attachments' } ) ).toHaveTextContent(
			'invoice.pdf'
		);
	} );

	it( 'offers no Resend for a test, which has Send a test instead', async () => {
		const { panel } = await renderPanel( entry( { source: 'test' } ) );

		expect( within( panel ).queryByRole( 'button', { name: 'Resend' } ) ).not.toBeInTheDocument();
		expect( within( panel ).getByRole( 'button', { name: 'Delete' } ) ).toBeVisible();
	} );

	it( 'resends, says so in the panel, reloads the lists and opens the new copy', async () => {
		jest.mocked( resendLogEntry ).mockResolvedValue( {
			success: true,
			log_id: '8',
			status: 'sent',
			reason: '',
			message: '',
		} );
		const { panel } = await renderPanel( entry() );

		await userEvent.click( within( panel ).getByRole( 'button', { name: 'Resend' } ) );
		const dialog = await screen.findByRole( 'dialog', { name: 'Resend this email' } );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Resend' } ) );

		await expect( within( panel ).findByText( 'Sent again' ) ).resolves.toBeVisible();
		expect( within( panel ).getByText( 'Sent to jordan@example.org just now.' ) ).toBeVisible();
		expect( speak ).toHaveBeenCalledWith( 'Sent again to jordan@example.org.' );
		expect( mockLogChanged ).toHaveBeenCalled();
		// The copies listed in Details load again.
		await waitFor( () => expect( fetchLogEntry ).toHaveBeenCalledTimes( 2 ) );

		await userEvent.click( within( panel ).getByRole( 'button', { name: 'Open the new copy' } ) );
		const [ [ { search } ] ] = mockNavigate.mock.calls;
		expect( search( { status: 'failed', entry: 7 } ) ).toEqual( { status: 'failed', entry: 8 } );
	} );

	it( 'closes only the resend dialog on Escape, never the panel', async () => {
		const { panel, onClose } = await renderPanel( entry() );

		await userEvent.click( within( panel ).getByRole( 'button', { name: 'Resend' } ) );
		await expect( screen.findByRole( 'dialog' ) ).resolves.toBeVisible();
		await userEvent.keyboard( '{Escape}' );

		await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );
		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'opens the resend dialog on Someone else from a wrong-address failure', async () => {
		const { panel } = await renderPanel(
			entry( { status: 'failed', reason: 'rejected', error: '550 5.1.1 User unknown' } )
		);

		// The bar's Resend comes first; the notice's is the second.
		const [ , noticeResend ] = within( panel ).getAllByRole( 'button', { name: 'Resend' } );
		await userEvent.click( noticeResend );

		const dialog = await screen.findByRole( 'dialog' );
		expect( within( dialog ).getByRole( 'radio', { name: /^Someone else/ } ) ).toBeChecked();
	} );

	it( 'links an original to its copies, keeping the list’s filters when one opens', async () => {
		const { panel } = await renderPanel(
			entry( {
				resends: [
					{ id: '21', status: 'sent', created_at: '2026-10-19 15:00:00' },
					{ id: '20', status: 'failed', created_at: '2026-10-19 14:50:00' },
					{ id: '19', status: 'sent', created_at: '2026-10-19 14:40:00' },
				],
				resend_count: 5,
			} )
		);

		expect( within( panel ).getByText( 'and 2 more' ) ).toBeVisible();
		expect( within( panel ).queryByText( 'Original email' ) ).not.toBeInTheDocument();
		const links = within( panel ).getAllByRole( 'link', { name: /· (Sent|Failed)$/ } );
		expect( links ).toHaveLength( 3 );
		await userEvent.click( links[ 1 ] );
		const [ [ { search } ] ] = mockNavigate.mock.calls;
		expect( search( { search: 'jordan', entry: 7 } ) ).toEqual( { search: 'jordan', entry: 20 } );
	} );

	it( 'links a copy to its original, says who resent it, and says when the original is gone', async () => {
		const copy = entry( {
			id: '8',
			source: 'resend',
			resend_of: '7',
			resend_of_entry: {
				id: '7',
				exists: true,
				created_at: '2026-10-19 14:14:03',
				status: 'failed',
			},
			resent_by: 'Site Manager',
		} );
		const { panel, rerender } = await renderPanel( copy );

		expect( within( panel ).getByText( 'Resent' ) ).toBeVisible();
		expect( within( panel ).getByText( 'Site Manager' ) ).toBeVisible();
		// The original's own status, not "Sent" for one that failed.
		expect( within( panel ).getByRole( 'link', { name: / · Failed$/ } ) ).toBeVisible();

		jest.mocked( fetchLogEntry ).mockResolvedValue( {
			...copy,
			id: '9',
			resend_of_entry: { id: '7', exists: false, created_at: null },
		} );
		rerender( <EmailPanel id="9" onClose={ jest.fn() } /> );
		await expect( screen.findByText( 'No longer in the log' ) ).resolves.toBeVisible();
	} );
} );
