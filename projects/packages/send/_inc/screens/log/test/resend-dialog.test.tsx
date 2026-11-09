/* eslint-disable testing-library/no-node-access -- the dialog's open state is a data attribute Base UI sets. */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback, useState } from 'react';
import { resendLogEntry } from '../../../data/api';
import ResendDialog, { originalAddresses, parseRecipients } from '../resend-dialog';
import type { LogEntry, ResendBlock } from '../../../data/types';
import type { ResendDialogProps } from '../resend-dialog';

const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( { useNavigate: () => mockNavigate } ) );
jest.mock( '../../../data/api', () => ( {
	resendLogEntry: jest.fn(),
	errorMessage: ( e: { message?: string } ) => e?.message ?? 'error',
} ) );
jest.mock( '../../../data/store', () => ( {
	useSendStatus: () => ( {
		status: { account: { domain: 'example.com' }, current_user_email: 'owner@example.com' },
	} ),
} ) );

const entry = ( overrides: Partial< LogEntry > = {} ): LogEntry => ( {
	id: '7',
	created_at: '2026-10-19 14:14:03',
	recipients: 'jordan@example.org',
	subject: 'Your order #1042',
	status: 'failed',
	error: '',
	request_id: '',
	source: 'wp_mail',
	origin: 'plugin:shop',
	origin_label: 'Shop',
	message: {
		from: { email: 'hello@example.com', name: 'Example Shop' },
		reply_to: null,
		to: [ { email: 'jordan@example.org', name: 'Jordan' } ],
		cc: [ { email: 'sam@example.org' } ],
		bcc: [],
		content_type: 'text/plain',
		body: 'Thanks',
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
	support_text: '',
	...overrides,
} );

/**
 * The dialog as the panel holds it: open state lives in the parent.
 *
 * @param props - Overrides.
 * @return The dialog.
 */
const Harness = ( props: Partial< ResendDialogProps > & { onOpenChange?: jest.Mock } ) => {
	const [ open, setOpen ] = useState( true );
	const { onOpenChange } = props;
	const onChange = useCallback(
		( next: boolean ) => {
			onOpenChange?.( next );
			setOpen( next );
		},
		[ onOpenChange ]
	);
	return (
		<ResendDialog
			entry={ entry() }
			someoneElse={ false }
			onLogged={ jest.fn() }
			onSent={ jest.fn() }
			onOpenCopy={ jest.fn() }
			{ ...props }
			open={ open }
			onOpenChange={ onChange }
		/>
	);
};

const choice = ( name: string ) =>
	screen.getByRole( 'radio', { name: new RegExp( `^${ name }` ) } );
const toField = () => screen.getByRole( 'textbox', { name: /^To/ } );

beforeEach( () => jest.clearAllMocks() );

describe( 'parseRecipients', () => {
	it.each( [
		[ 'plain addresses', 'a@example.com, b@example.org', [ 'a@example.com', 'b@example.org' ] ],
		[ 'display names', 'Jane Doe <jane@example.com>', [ 'jane@example.com' ] ],
		[
			'a comma inside a quoted name',
			'"Doe, Jane" <jane@example.com>, sam@example.org',
			[ 'jane@example.com', 'sam@example.org' ],
		],
		[ 'empty parts', ' , a@example.com,, ', [ 'a@example.com' ] ],
	] )( 'reads %s', ( _, value, expected ) => {
		expect( parseRecipients( value ) ).toEqual( expected );
	} );

	it( 'gives an older row’s "same people" as plain addresses the server accepts', () => {
		const older = entry( {
			recipients: '"Doe, Jane" <jane@example.com>, Sam <sam@example.org>',
			message: {
				...( entry().message as NonNullable< LogEntry[ 'message' ] > ),
				to: undefined,
				cc: [],
				bcc: [],
			},
		} );

		expect( originalAddresses( older ).to ).toEqual( [ 'jane@example.com', 'sam@example.org' ] );
	} );
} );

describe( 'ResendDialog', () => {
	it( 'starts on the same people, naming who that is, with focus on that choice', async () => {
		render( <Harness /> );

		const dialog = await screen.findByRole( 'dialog', { name: 'Resend this email' } );
		expect( choice( 'The same people' ) ).toBeChecked();
		expect(
			within( dialog ).getByText( 'Jordan <jordan@example.org> · Also Cc: sam@example.org' )
		).toBeVisible();
		expect( within( dialog ).getByText( 'owner@example.com' ) ).toBeVisible();
		await waitFor( () => expect( choice( 'The same people' ) ).toHaveFocus() );
	} );

	it( 'opens on Someone else, prefilled from the original, when a notice asks for it', async () => {
		render( <Harness someoneElse /> );

		await expect( screen.findByRole( 'dialog' ) ).resolves.toBeVisible();
		expect( choice( 'Someone else' ) ).toBeChecked();
		expect( toField() ).toHaveValue( 'jordan@example.org' );
		expect( screen.getByRole( 'textbox', { name: /^Cc/ } ) ).toHaveValue( 'sam@example.org' );
		// The original had no Bcc, so there's nothing to add one to.
		expect( screen.queryByRole( 'textbox', { name: /^Bcc/ } ) ).not.toBeInTheDocument();
	} );

	it( 'offers only the same people or the current user for an email with a sign-in link', async () => {
		render(
			<Harness
				someoneElse
				entry={ entry( { resend: { allowed: true, reason: '', locked: true } } ) }
			/>
		);

		await expect( screen.findByRole( 'dialog' ) ).resolves.toBeVisible();
		expect( screen.getAllByRole( 'radio' ) ).toHaveLength( 2 );
		expect( choice( 'The same people' ) ).toBeChecked();
		expect(
			screen.getByText(
				'This email has a sign-in link, so it can only go to the same people or to you.'
			)
		).toBeVisible();
	} );

	it.each( [
		[ 'no address', '', 'Add at least one email address.' ],
		[ 'a bad address', 'jordan@example.org, not-an-address', 'Check this address: not-an-address' ],
		[
			'more than 10 addresses',
			Array.from( { length: 10 }, ( _, i ) => `p${ i }@example.org` ).join( ', ' ),
			'You can send to up to 10 addresses at once.',
		],
		[
			'more than 5 new addresses',
			Array.from( { length: 6 }, ( _, i ) => `new${ i }@example.org` ).join( ', ' ),
			'You can add up to 5 addresses that weren’t on the original email.',
		],
	] )( 'stops %s before sending, next to the field', async ( _, value, message ) => {
		const user = userEvent.setup();
		render( <Harness someoneElse /> );
		await expect( screen.findByRole( 'dialog' ) ).resolves.toBeVisible();

		await user.clear( toField() );
		if ( value ) {
			// Pasted, since typing a long list key by key can outrun Jest's timeout on a busy machine.
			await user.paste( value );
		}
		await user.click( screen.getByRole( 'button', { name: 'Resend' } ) );

		await expect( screen.findByText( message ) ).resolves.toBeVisible();
		expect( resendLogEntry ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ 'The same people', { to: [ 'jordan@example.org' ], cc: [ 'sam@example.org' ], bcc: [] } ],
		[ 'Just me', { to: [ 'owner@example.com' ], cc: [], bcc: [] } ],
	] )( 'sends to %s', async ( name, request ) => {
		jest.mocked( resendLogEntry ).mockResolvedValue( {
			success: true,
			log_id: '8',
			status: 'sent',
			reason: '',
			message: '',
		} );
		const onSent = jest.fn();
		const onLogged = jest.fn();
		render( <Harness onSent={ onSent } onLogged={ onLogged } /> );
		await expect( screen.findByRole( 'dialog' ) ).resolves.toBeVisible();

		await userEvent.click( choice( name ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Resend' } ) );

		await waitFor( () => expect( onSent ).toHaveBeenCalled() );
		expect( resendLogEntry ).toHaveBeenCalledWith( '7', request );
		expect( onLogged ).toHaveBeenCalled();
	} );

	it( 'sends edited addresses to someone else', async () => {
		jest.mocked( resendLogEntry ).mockResolvedValue( {
			success: true,
			log_id: '8',
			status: 'sent',
			reason: '',
			message: '',
		} );
		render( <Harness someoneElse /> );
		await expect( screen.findByRole( 'dialog' ) ).resolves.toBeVisible();

		await userEvent.clear( toField() );
		await userEvent.type( toField(), 'casey@example.org,  jordan@example.org ' );
		await userEvent.click( screen.getByRole( 'button', { name: 'Resend' } ) );

		await waitFor( () =>
			expect( resendLogEntry ).toHaveBeenCalledWith( '7', {
				to: [ 'casey@example.org', 'jordan@example.org' ],
				cc: [ 'sam@example.org' ],
				bcc: [],
			} )
		);
	} );

	it.each( [ 'casey@example.org,', ', casey@example.org', 'casey@example.org,, ' ] )(
		'sends "%s" without the browser stopping it over a stray comma',
		async value => {
			jest.mocked( resendLogEntry ).mockResolvedValue( {
				success: true,
				log_id: '8',
				status: 'sent',
				reason: '',
				message: '',
			} );
			render( <Harness someoneElse /> );
			await expect( screen.findByRole( 'dialog' ) ).resolves.toBeVisible();

			await userEvent.clear( toField() );
			await userEvent.paste( value );
			expect( toField() ).toBeValid();
			await userEvent.click( screen.getByRole( 'button', { name: 'Resend' } ) );

			await waitFor( () =>
				expect( resendLogEntry ).toHaveBeenCalledWith( '7', {
					to: [ 'casey@example.org' ],
					cc: [ 'sam@example.org' ],
					bcc: [],
				} )
			);
		}
	);

	it( 'can’t be closed while it sends', async () => {
		let finish: ( value: unknown ) => void = () => undefined;
		jest
			.mocked( resendLogEntry )
			.mockReturnValue(
				new Promise( resolve => ( finish = resolve ) ) as ReturnType< typeof resendLogEntry >
			);
		const onOpenChange = jest.fn();
		render( <Harness onOpenChange={ onOpenChange } /> );
		await expect( screen.findByRole( 'dialog' ) ).resolves.toBeVisible();

		await userEvent.click( screen.getByRole( 'button', { name: 'Resend' } ) );
		await userEvent.keyboard( '{Escape}' );

		expect( screen.getByRole( 'dialog' ) ).toBeVisible();
		expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( onOpenChange ).not.toHaveBeenCalled();
		finish( { success: true, log_id: '8', status: 'sent', reason: '', message: '' } );
		await waitFor( () =>
			expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toHaveAttribute(
				'aria-disabled',
				'false'
			)
		);
	} );

	it( 'stays open when the service refuses the copy, then opens it only once the dialog has closed', async () => {
		jest.mocked( resendLogEntry ).mockResolvedValue( {
			success: false,
			log_id: '9',
			status: 'failed',
			reason: 'rejected',
			message: 'The receiving mail server turned it down.',
		} );
		const dialogOpenWhenCopyOpened: boolean[] = [];
		const onOpenCopy = jest.fn( () =>
			dialogOpenWhenCopyOpened.push(
				!! document.querySelector( '.jetpack-send-resend[data-open]' )
			)
		);
		render( <Harness onOpenCopy={ onOpenCopy } /> );
		await expect( screen.findByRole( 'dialog' ) ).resolves.toBeVisible();

		await userEvent.click( screen.getByRole( 'button', { name: 'Resend' } ) );
		await expect( screen.findByText( 'It didn’t go out' ) ).resolves.toBeVisible();
		expect( screen.getByText( 'The receiving mail server turned it down.' ) ).toBeVisible();
		await userEvent.click( screen.getByRole( 'link', { name: 'See the failed copy' } ) );

		await waitFor( () => expect( onOpenCopy ).toHaveBeenCalledWith( '9' ) );
		expect( dialogOpenWhenCopyOpened ).toEqual( [ false ] );
	} );

	it( 'keeps the recipients and shows the server’s reason when it refuses before sending', async () => {
		jest.mocked( resendLogEntry ).mockRejectedValue( {
			code: 'jetpack_send_resend_in_flight',
			message: 'This email is already being sent.',
		} );
		render( <Harness someoneElse /> );
		await expect( screen.findByRole( 'dialog' ) ).resolves.toBeVisible();

		await userEvent.click( screen.getByRole( 'button', { name: 'Resend' } ) );

		await expect( screen.findByText( 'This email is already being sent.' ) ).resolves.toBeVisible();
		expect( toField() ).toHaveValue( 'jordan@example.org' );
	} );

	it.each< [ ResendBlock, string ] >( [
		[ 'no_content', 'This email’s content wasn’t kept, so it can’t be sent again.' ],
		[ 'too_large', 'This email was too big to keep a copy, so it can’t be sent again.' ],
		[ 'attachments', 'Ask Shop to send it again instead.' ],
		[
			'unsupported',
			'Emails like this go through your host’s mail, so they can’t be resent from here.',
		],
		[ 'redacted', 'Your customer can get a new link from your site’s lost password page.' ],
		[ 'not_ready', 'Your domain isn’t connected right now, so Jetpack can’t send.' ],
	] )(
		'says why a %s email can’t be resent instead of showing the form',
		async ( reason, copy ) => {
			render(
				<Harness entry={ entry( { resend: { allowed: false, reason, locked: false } } ) } />
			);

			const dialog = await screen.findByRole( 'dialog' );
			expect( within( dialog ).getByText( new RegExp( copy ) ) ).toBeVisible();
			expect( within( dialog ).queryByRole( 'radio' ) ).not.toBeInTheDocument();
			// The footer's Close, beside the header's close icon.
			expect( within( dialog ).getByText( 'Close' ) ).toBeVisible();
		}
	);

	it( 'points a paused site at Settings', async () => {
		render(
			<Harness entry={ entry( { resend: { allowed: false, reason: 'paused', locked: false } } ) } />
		);
		await expect( screen.findByRole( 'dialog' ) ).resolves.toBeVisible();

		await userEvent.click( screen.getByRole( 'button', { name: 'Open Settings' } ) );

		expect( mockNavigate ).toHaveBeenCalledWith( { href: '/settings' } );
	} );
} );
