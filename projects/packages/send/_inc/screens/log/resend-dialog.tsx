import { useCallback, useId, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import {
	Button,
	Dialog,
	Notice,
	RadioGroupControl,
	Stack,
	Text,
	ValidatedInputControl,
} from '@wordpress/ui';
import ErrorNotice from '../../components/error-notice';
import { PanelRow, PanelRows, formatAddress } from '../../components/panel-parts';
import { errorMessage, resendLogEntry } from '../../data/api';
import { fullTime, parseUtc } from '../../data/dates';
import { failureMessage, failureReason } from '../../data/failure-reasons';
import { adminHref, logEntryHref } from '../../data/log-link';
import { useSendStatus } from '../../data/store';
import type { LogEntry, ResendBlock, ResendRequest, ResendResult } from '../../data/types';
import type { FormEvent, MouseEvent } from 'react';

/** The server's limits, checked here first so mistakes show next to the field. */
const MAX_ADDRESSES = 10;
const MAX_NEW_ADDRESSES = 5;

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;

type Choice = 'same' | 'me' | 'other';
type Field = 'to' | 'cc' | 'bcc';
type Fields = Record< Field, string >;

/**
 * The addresses typed into a field, split on commas.
 *
 * @param value - The field's text.
 * @return The addresses.
 */
export const splitAddresses = ( value: string ): string[] =>
	value
		.split( ',' )
		.map( part => part.trim() )
		.filter( Boolean );

/**
 * A logged recipient list as plain addresses. Older rows keep it as written, so "Name <a@example.com>"
 * gives "a@example.com", and a comma inside a quoted name doesn't split it.
 *
 * @param value - The list, e.g. `"Doe, Jane" <jane@example.com>, sam@example.org`.
 * @return The addresses.
 */
export function parseRecipients( value: string ): string[] {
	const parts: string[] = [];
	let current = '';
	let quoted = false;
	let angled = false;
	for ( const char of value ) {
		if ( char === '"' && ! angled ) {
			quoted = ! quoted;
		} else if ( char === '<' && ! quoted ) {
			angled = true;
		} else if ( char === '>' && ! quoted ) {
			angled = false;
		} else if ( char === ',' && ! quoted && ! angled ) {
			parts.push( current );
			current = '';
			continue;
		}
		current += char;
	}
	parts.push( current );
	return parts
		.map( part => {
			const inside = /<([^<>]*)>\s*$/.exec( part );
			return ( inside ? inside[ 1 ] : part ).trim();
		} )
		.filter( Boolean );
}

/**
 * Who the original went to, as plain addresses: To from the stored copy (older rows: the list's
 * recipients), then Cc and Bcc.
 *
 * @param entry - The email.
 * @return Addresses for each field.
 */
export function originalAddresses( entry: LogEntry ): Record< Field, string[] > {
	const message = entry.message;
	return {
		to: message?.to?.length
			? message.to.map( address => address.email )
			: parseRecipients( entry.recipients ),
		cc: message?.cc.map( address => address.email ) ?? [],
		bcc: message?.bcc.map( address => address.email ) ?? [],
	};
}

/**
 * What's wrong with the typed addresses, per field, as the server would say it.
 *
 * @param fields   - The fields' text.
 * @param original - Every address on the original, To, Cc and Bcc.
 * @return A message for each field that has a problem.
 */
export function checkAddresses(
	fields: Fields,
	original: string[]
): Partial< Record< Field, string > > {
	const errors: Partial< Record< Field, string > > = {};
	( [ 'to', 'cc', 'bcc' ] as Field[] ).forEach( field => {
		const bad = splitAddresses( fields[ field ] ).find( address => ! EMAIL.test( address ) );
		if ( bad ) {
			/* translators: %s: an email address as typed. */
			errors[ field ] = sprintf( __( 'Check this address: %s', 'jetpack-send-pkg' ), bad );
		}
	} );
	if ( ! errors.to && ! splitAddresses( fields.to ).length ) {
		errors.to = __( 'Add at least one email address.', 'jetpack-send-pkg' );
	}
	if ( Object.keys( errors ).length ) {
		return errors;
	}
	const all = new Set(
		[ fields.to, fields.cc, fields.bcc ]
			.flatMap( splitAddresses )
			.map( address => address.toLowerCase() )
	);
	const known = new Set( original.map( address => address.toLowerCase() ) );
	if ( all.size > MAX_ADDRESSES ) {
		errors.to = __( 'You can send to up to 10 addresses at once.', 'jetpack-send-pkg' );
	} else if ( [ ...all ].filter( address => ! known.has( address ) ).length > MAX_NEW_ADDRESSES ) {
		errors.to = __(
			'You can add up to 5 addresses that weren’t on the original email.',
			'jetpack-send-pkg'
		);
	}
	return errors;
}

/**
 * Why an email can't be resent, in plain words.
 *
 * @param reason - The block.
 * @param entry  - The email.
 * @return The sentence.
 */
function blockedCopy( reason: ResendBlock, entry: LogEntry ): string {
	switch ( reason ) {
		case 'paused':
			return __(
				'Sending is paused, so emails can’t be resent. Turn it back on in Settings.',
				'jetpack-send-pkg'
			);
		case 'not_ready':
			return __(
				'Your domain isn’t connected right now, so Jetpack can’t send.',
				'jetpack-send-pkg'
			);
		case 'no_content':
			return __(
				'This email’s content wasn’t kept, so it can’t be sent again.',
				'jetpack-send-pkg'
			);
		case 'too_large':
			return __(
				'This email was too big to keep a copy, so it can’t be sent again.',
				'jetpack-send-pkg'
			);
		case 'attachments':
			return entry.origin_label
				? sprintf(
						/* translators: %s: the name of the plugin that sent the email. */
						__(
							'This email had an attachment. Jetpack doesn’t keep attachments, so it can’t send this again. Ask %s to send it again instead.',
							'jetpack-send-pkg'
						),
						entry.origin_label
					)
				: __(
						'This email had an attachment. Jetpack doesn’t keep attachments, so it can’t send this again. Ask the plugin that sent it to send it again instead.',
						'jetpack-send-pkg'
					);
		case 'unsupported':
			return __(
				'Emails like this go through your host’s mail, so they can’t be resent from here.',
				'jetpack-send-pkg'
			);
		case 'redacted':
			return entry.origin === 'core:password_reset'
				? __(
						'This email had a sign-in link. To keep accounts safe, Jetpack removes those from its copy, so it can’t resend it. Send a new password reset from Users.',
						'jetpack-send-pkg'
					)
				: __(
						'This email had a sign-in link. To keep accounts safe, Jetpack removes those from its copy, so it can’t resend it. Your customer can get a new link from your site’s lost password page.',
						'jetpack-send-pkg'
					);
		default:
			return __(
				'Test emails can’t be sent again. Send a new test from Overview instead.',
				'jetpack-send-pkg'
			);
	}
}

export type ResendDialogProps = {
	entry: LogEntry;
	open: boolean;
	onOpenChange: ( open: boolean ) => void;
	/** Open on "Someone else", from a notice's resend action for a wrong address. */
	someoneElse: boolean;
	/** A copy was logged, sent or not. */
	onLogged: () => void;
	/** The copy went out; the dialog closes. */
	onSent: ( result: ResendResult, addresses: string[] ) => void;
	/** Open the copy that didn't go out, once the dialog has closed. */
	onOpenCopy: ( id: string ) => void;
};

/**
 * Resend an email from its side panel: to the same people, to the current user, or to someone
 * else (fields prefilled from the original). Emails with a sign-in link can only go to the same
 * people or the current user; emails that can't be resent say why instead of showing the form.
 *
 * @param props              - Component props.
 * @param props.entry        - The email.
 * @param props.open         - Whether the dialog is open.
 * @param props.onOpenChange - Open or close it.
 * @param props.someoneElse  - Start on "Someone else".
 * @param props.onLogged     - A copy was logged.
 * @param props.onSent       - The copy went out.
 * @param props.onOpenCopy   - Open the failed copy.
 * @return The dialog.
 */
const ResendDialog = ( {
	entry,
	open,
	onOpenChange,
	someoneElse,
	onLogged,
	onSent,
	onOpenCopy,
}: ResendDialogProps ) => {
	const { status } = useSendStatus();
	const domain = status?.account?.domain ?? '';
	const navigate = useNavigate();
	const formId = `jetpack-send-resend-${ useId() }`;
	const locked = entry.resend.locked;
	const original = useMemo( () => originalAddresses( entry ), [ entry ] );
	const startFields = useMemo(
		() => ( {
			to: original.to.join( ', ' ),
			cc: original.cc.join( ', ' ),
			bcc: original.bcc.join( ', ' ),
		} ),
		[ original ]
	);

	const [ choice, setChoice ] = useState< Choice >( 'same' );
	const [ fields, setFields ] = useState< Fields >( startFields );
	const [ busy, setBusy ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
	const [ failed, setFailed ] = useState< ResendResult | null >( null );
	// Each opening starts fresh, from the original's recipients.
	const [ shownOpen, setShownOpen ] = useState( false );
	if ( open !== shownOpen ) {
		setShownOpen( open );
		if ( open ) {
			setChoice( someoneElse && ! locked ? 'other' : 'same' );
			setFields( startFields );
			setError( null );
			setFailed( null );
		}
	}

	const errors = useMemo(
		() =>
			choice === 'other'
				? checkAddresses( fields, [ ...original.to, ...original.cc, ...original.bcc ] )
				: {},
		[ choice, fields, original ]
	);
	const validity = ( field: Field ) =>
		errors[ field ] ? { type: 'invalid' as const, message: errors[ field ] as string } : undefined;
	const setField = ( field: Field ) => ( value: string ) =>
		setFields( current => ( { ...current, [ field ]: value } ) );

	const request = useMemo( (): ResendRequest => {
		if ( choice === 'me' ) {
			return { to: [ status?.current_user_email ?? '' ], cc: [], bcc: [] };
		}
		if ( choice === 'other' ) {
			return {
				to: splitAddresses( fields.to ),
				cc: splitAddresses( fields.cc ),
				bcc: splitAddresses( fields.bcc ),
			};
		}
		return original;
	}, [ choice, fields, original, status?.current_user_email ] );

	const onSubmit = useCallback(
		async ( event: FormEvent< HTMLFormElement > ) => {
			event.preventDefault();
			if ( busy ) {
				return;
			}
			if ( Object.keys( errors ).length ) {
				// Shows each field's message and moves focus to the first one.
				event.currentTarget.reportValidity();
				return;
			}
			setBusy( true );
			setError( null );
			setFailed( null );
			try {
				const result = await resendLogEntry( entry.id, request );
				onLogged();
				if ( result.status === 'sent' ) {
					onSent( result, [ ...request.to, ...request.cc, ...request.bcc ] );
				} else {
					setFailed( result );
				}
			} catch ( e ) {
				setError( errorMessage( e ) );
			} finally {
				setBusy( false );
			}
		},
		[ busy, errors, entry.id, request, onLogged, onSent ]
	);

	// "See the failed copy" closes the dialog first, so the panel never changes under it.
	const pendingCopy = useRef< string | null >( null );
	const seeFailedCopy = useCallback(
		( event: MouseEvent< HTMLAnchorElement > ) => {
			if ( ! failed || event.metaKey || event.ctrlKey || event.shiftKey ) {
				return;
			}
			event.preventDefault();
			pendingCopy.current = failed.log_id;
			onOpenChange( false );
		},
		[ failed, onOpenChange ]
	);
	const onOpenChangeComplete = useCallback(
		( isOpen: boolean ) => {
			const copy = pendingCopy.current;
			if ( ! isOpen && copy ) {
				pendingCopy.current = null;
				onOpenCopy( copy );
			}
		},
		[ onOpenCopy ]
	);

	const popupRef = useRef< HTMLDivElement >( null );
	// Focus the checked choice, as a radio group's own arrow keys expect.
	const initialFocus = useCallback(
		() =>
			popupRef.current?.querySelector< HTMLElement >( '[role="radio"][aria-checked="true"]' ) ??
			true,
		[]
	);

	const message = entry.message;
	const sentAt = parseUtc( entry.created_at );
	const toList = message?.to?.length
		? message.to.map( formatAddress ).join( ', ' )
		: entry.recipients;
	const sameDescription = [
		toList,
		original.cc.length &&
			/* translators: %s: email addresses. */
			sprintf( __( 'Also Cc: %s', 'jetpack-send-pkg' ), original.cc.join( ', ' ) ),
		original.bcc.length &&
			/* translators: %s: email addresses. */
			sprintf( __( 'Also Bcc: %s', 'jetpack-send-pkg' ), original.bcc.join( ', ' ) ),
	]
		.filter( Boolean )
		.join( ' · ' );
	const items = [
		{
			value: 'same',
			label: __( 'The same people', 'jetpack-send-pkg' ),
			description: sameDescription,
		},
		{
			value: 'me',
			label: __( 'Just me', 'jetpack-send-pkg' ),
			description: status?.current_user_email ?? '',
		},
		...( locked ? [] : [ { value: 'other', label: __( 'Someone else', 'jetpack-send-pkg' ) } ] ),
	];
	const block = entry.resend.allowed ? null : entry.resend.reason || 'unsupported';

	const openSettings = useCallback( () => navigate( { href: '/settings' } ), [ navigate ] );
	const checkRecords = useCallback( () => navigate( { href: '/' } ), [ navigate ] );
	const onDialogOpenChange = useCallback(
		( next: boolean ) => ! busy && onOpenChange( next ),
		[ busy, onOpenChange ]
	);
	const onChoiceChange = useCallback( ( value: string ) => setChoice( value as Choice ), [] );

	let blockedAction = null;
	if ( block === 'paused' ) {
		blockedAction = (
			<Dialog.Action onClick={ openSettings }>
				{ __( 'Open Settings', 'jetpack-send-pkg' ) }
			</Dialog.Action>
		);
	} else if ( block === 'not_ready' ) {
		blockedAction = (
			<Dialog.Action onClick={ checkRecords }>
				{ __( 'Check your records', 'jetpack-send-pkg' ) }
			</Dialog.Action>
		);
	}

	return (
		<Dialog.Root
			open={ open }
			onOpenChange={ onDialogOpenChange }
			onOpenChangeComplete={ onOpenChangeComplete }
		>
			<Dialog.Popup
				ref={ popupRef }
				size="small"
				className="jetpack-send-resend"
				initialFocus={ initialFocus }
			>
				<Dialog.Header>
					<Dialog.Title>{ __( 'Resend this email', 'jetpack-send-pkg' ) }</Dialog.Title>
					<Dialog.CloseIconButton disabled={ busy } />
				</Dialog.Header>
				<Dialog.Content>
					{ block ? (
						<Dialog.Description>{ blockedCopy( block, entry ) }</Dialog.Description>
					) : (
						<form id={ formId } onSubmit={ onSubmit } noValidate>
							<Stack direction="column" gap="lg">
								<Dialog.Description>
									{ __(
										'Jetpack sends a new copy, just as it was. The original stays in the log.',
										'jetpack-send-pkg'
									) }
								</Dialog.Description>
								<PanelRows>
									<PanelRow label={ __( 'Subject', 'jetpack-send-pkg' ) } stacked>
										{ message?.subject ||
											entry.subject ||
											__( '(No subject)', 'jetpack-send-pkg' ) }
									</PanelRow>
									<PanelRow label={ __( 'From', 'jetpack-send-pkg' ) }>
										{ message?.from
											? formatAddress( message.from )
											: __( 'Your host’s default sender', 'jetpack-send-pkg' ) }
									</PanelRow>
									<PanelRow
										label={
											// A copy's own time; "First sent" belongs to the original.
											entry.source === 'resend'
												? __( 'Sent', 'jetpack-send-pkg' )
												: __( 'First sent', 'jetpack-send-pkg' )
										}
									>
										{ isNaN( sentAt.getTime() ) ? null : fullTime( sentAt ) }
									</PanelRow>
									<PanelRow label={ __( 'Sent to', 'jetpack-send-pkg' ) }>{ toList }</PanelRow>
								</PanelRows>
								<Stack direction="column" gap="sm">
									<RadioGroupControl
										label={ __( 'Send to', 'jetpack-send-pkg' ) }
										items={ items }
										value={ choice }
										onValueChange={ onChoiceChange }
										disabled={ busy }
									/>
									{ locked && (
										<Text variant="body-md" className="jetpack-send-muted">
											{ __(
												'This email has a sign-in link, so it can only go to the same people or to you.',
												'jetpack-send-pkg'
											) }
										</Text>
									) }
								</Stack>
								{ /* Plain text fields: our own check reads the lists, so a stray comma never
								   gets the browser's own message. */ }
								{ choice === 'other' && (
									<Stack direction="column" gap="md">
										<ValidatedInputControl
											label={ __( 'To', 'jetpack-send-pkg' ) }
											type="text"
											inputMode="email"
											required
											markWhenOptional
											autoComplete="off"
											description={ __( 'Separate addresses with commas.', 'jetpack-send-pkg' ) }
											value={ fields.to }
											onValueChange={ setField( 'to' ) }
											customValidity={ validity( 'to' ) }
											disabled={ busy }
										/>
										{ original.cc.length > 0 && (
											<ValidatedInputControl
												label={ __( 'Cc', 'jetpack-send-pkg' ) }
												type="text"
												inputMode="email"
												markWhenOptional
												autoComplete="off"
												value={ fields.cc }
												onValueChange={ setField( 'cc' ) }
												customValidity={ validity( 'cc' ) }
												disabled={ busy }
											/>
										) }
										{ original.bcc.length > 0 && (
											<ValidatedInputControl
												label={ __( 'Bcc', 'jetpack-send-pkg' ) }
												type="text"
												inputMode="email"
												markWhenOptional
												autoComplete="off"
												value={ fields.bcc }
												onValueChange={ setField( 'bcc' ) }
												customValidity={ validity( 'bcc' ) }
												disabled={ busy }
											/>
										) }
									</Stack>
								) }
								{ failed && (
									<Notice.Root intent="error">
										<Notice.Title>{ __( 'It didn’t go out', 'jetpack-send-pkg' ) }</Notice.Title>
										<Notice.Description>
											{ failed.message ||
												failureMessage( failureReason( { reason: failed.reason } ), domain ) }
										</Notice.Description>
										<Notice.Actions>
											<Notice.ActionLink
												href={ adminHref( logEntryHref( failed.log_id ) ) }
												onClick={ seeFailedCopy }
											>
												{ __( 'See the failed copy', 'jetpack-send-pkg' ) }
											</Notice.ActionLink>
										</Notice.Actions>
									</Notice.Root>
								) }
								{ error && <ErrorNotice message={ error } /> }
							</Stack>
						</form>
					) }
				</Dialog.Content>
				<Dialog.Footer>
					{ block ? (
						<>
							<Dialog.Action variant="outline" tone="neutral">
								{ __( 'Close', 'jetpack-send-pkg' ) }
							</Dialog.Action>
							{ blockedAction }
						</>
					) : (
						<>
							<Dialog.Action variant="outline" tone="neutral" disabled={ busy }>
								{ __( 'Cancel', 'jetpack-send-pkg' ) }
							</Dialog.Action>
							<Button type="submit" form={ formId } loading={ busy }>
								{ __( 'Resend', 'jetpack-send-pkg' ) }
							</Button>
						</>
					) }
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
};

export default ResendDialog;
