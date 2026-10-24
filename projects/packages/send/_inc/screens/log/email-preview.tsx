import { speak } from '@wordpress/a11y';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { close, send, trash, wordpress } from '@wordpress/icons';
import { useNavigate } from '@wordpress/route';
import {
	Button,
	Card,
	IconButton,
	Link,
	Notice,
	Skeleton,
	Spinner,
	Stack,
	Text,
} from '@wordpress/ui';
import Avatar from '../../components/avatar';
import { EmailTime } from '../../components/email-time';
import ErrorNotice from '../../components/error-notice';
import { PanelRow, PanelRows, PanelSection, formatAddress } from '../../components/panel-parts';
import { ResentBadge } from '../../components/resent-badge';
import { errorMessage, fetchLogEntry } from '../../data/api';
import { fullTime, parseUtc } from '../../data/dates';
import { LOG_ENTRY_PARAM, adminHref, logEntryHref } from '../../data/log-link';
import { sendStore, useSendStatus } from '../../data/store';
import { OriginIcon } from '../overview/dashboard/list-icons';
import FailureNotice from './failure-notice';
import ResendDialog from './resend-dialog';
import StatusBadge, { statusLabels } from './status-badge';
import TechnicalDetails, { hasTechnicalDetails } from './technical-details';
import TestBadge from './test-badge';
import useCloseOnEscape from './use-close-on-escape';
import type { LogEntry, LogMessage, LogRow, ResendResult } from '../../data/types';
import type { MouseEvent, ReactNode } from 'react';
import './style.scss';

/** The panel's heading, which takes focus when an email opens. */
export const PANEL_TITLE_ID = 'jetpack-send-panel-title';

// With no sandbox tokens for scripts or same-origin, the CSP only has to stop frames, objects, and fetches.
const FRAME_META = [
	'<meta charset="utf-8">',
	`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: http: data:; style-src 'unsafe-inline' https: http:; font-src https: http: data:">`,
	'<base target="_blank">',
].join( '' );

// Tokens can't reach inside the frame, so their current values are copied into its base style.
// The padding matches the card's, so the email lines up with the section title.
const FRAME_STYLE: [ string, string ][] = [
	[ 'padding-top', 'var(--wpds-dimension-padding-lg)' ],
	[ 'font-family', 'var(--wpds-typography-font-family-body)' ],
	[ 'font-size', 'var(--wpds-typography-font-size-lg)' ],
	[ 'line-height', 'var(--wpds-typography-line-height-md)' ],
	[ 'color', 'var(--wpds-color-foreground-content-neutral)' ],
];

/** The element `frameHead()` measures, so tests can count its runs. */
export const FRAME_PROBE_CLASS = 'jetpack-send-email__probe';

/**
 * The frame's head: the security policy, links in a new tab, and the page's body text style,
 * read from a probe so the tokens resolve to values the frame can use.
 *
 * @return The head markup.
 */
function frameHead(): string {
	const probe = document.createElement( 'div' );
	probe.className = FRAME_PROBE_CLASS;
	FRAME_STYLE.forEach( ( [ property, value ] ) => probe.style.setProperty( property, value ) );
	document.body.appendChild( probe );
	const computed = window.getComputedStyle( probe );
	const rules = FRAME_STYLE.map( ( [ property ] ) => {
		const value = computed.getPropertyValue( property ).trim().replace( /[<>]/g, '' );
		return value ? `${ property === 'padding-top' ? 'padding' : property }:${ value };` : '';
	} ).join( '' );
	probe.remove();
	// `break-word`, not `anywhere`: in a 400 panel, `anywhere` let table cells split prices like "$148.0|0".
	return `${ FRAME_META }<style>body{margin:0;overflow-wrap:break-word;${ rules }}</style>`;
}

/**
 * Addresses for a sentence: "a@example.com, b@example.com", or "a@example.com and 2 more" past two.
 *
 * @param addresses - The addresses.
 * @return The text.
 */
export function shortAddresses( addresses: string[] ): string {
	if ( addresses.length <= 2 ) {
		return addresses.join( ', ' );
	}
	return sprintf(
		/* translators: 1: an email address, 2: how many more addresses. */
		__( '%1$s and %2$d more', 'jetpack-send-pkg' ),
		addresses[ 0 ],
		addresses.length - 1
	);
}

type SenderProps = {
	message: LogMessage;
	/** The From address's avatar. */
	avatarUrl?: string | null;
	/** The site icon, shown under it. */
	siteIconUrl?: string | null;
};

/**
 * Who it came from: avatar, name and address, the way Newsletter heads a subscriber.
 *
 * @param props             - Component props.
 * @param props.message     - The kept message.
 * @param props.avatarUrl   - The sender's avatar.
 * @param props.siteIconUrl - The site icon.
 * @return The sender.
 */
const Sender = ( { message, avatarUrl, siteIconUrl }: SenderProps ) => {
	const { from } = message;
	const name = from
		? from.name || from.email
		: __( 'Your host’s default sender', 'jetpack-send-pkg' );
	return (
		<Stack direction="row" align="center" gap="md" className="jetpack-send-panel__sender">
			<Avatar
				size="lg"
				name={ from ? formatAddress( from ) : name }
				url={ avatarUrl }
				// The host's default sender keeps the WordPress glyph, not the site icon.
				fallbackUrl={ from ? siteIconUrl : null }
				icon={ from ? undefined : wordpress }
			/>
			<Stack direction="column" gap="xs" className="jetpack-send-panel__sender-text">
				<Text variant="body-lg">{ name }</Text>
				{ from?.name && (
					<Text variant="body-md" className="jetpack-send-muted">
						{ from.email }
					</Text>
				) }
			</Stack>
		</Stack>
	);
};

const SenderSkeleton = () => (
	<Stack direction="row" align="center" gap="md" aria-hidden="true">
		<Skeleton className="jetpack-send-panel__skeleton jetpack-send-panel__skeleton--avatar" />
		<Stack direction="column" gap="xs" className="jetpack-send-panel__sender-text">
			<Skeleton className="jetpack-send-panel__skeleton jetpack-send-panel__skeleton--name" />
			<Skeleton className="jetpack-send-panel__skeleton jetpack-send-panel__skeleton--address" />
		</Stack>
	</Stack>
);

type EntryLinkProps = {
	id: string;
	children: ReactNode;
	onOpen: ( id: string ) => void;
};

/**
 * A link to another email in the Log, opened in this panel; the list keeps its filters.
 *
 * @param props          - Component props.
 * @param props.id       - The email's log id.
 * @param props.children - The label.
 * @param props.onOpen   - Opens it here.
 * @return The link.
 */
const EntryLink = ( { id, children, onOpen }: EntryLinkProps ) => {
	const onClick = useCallback(
		( event: MouseEvent< HTMLAnchorElement > ) => {
			if ( event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0 ) {
				return;
			}
			event.preventDefault();
			onOpen( id );
		},
		[ id, onOpen ]
	);
	return (
		<Link tone="neutral" href={ adminHref( logEntryHref( id ) ) } onClick={ onClick }>
			{ children }
		</Link>
	);
};

/** Copies listed in Details before "and N more". */
const RESENDS_SHOWN = 3;

/**
 * When, who to, what sent it and what kind, as label and value rows, plus the links between an
 * email and the copies resent from it.
 *
 * @param props        - Component props.
 * @param props.row    - The log row.
 * @param props.entry  - The full entry, once loaded.
 * @param props.onOpen - Opens another email here.
 * @return The rows.
 */
const Details = ( {
	row,
	entry,
	onOpen,
}: {
	row: LogRow;
	entry: LogEntry | null;
	onOpen: ( id: string ) => void;
} ) => {
	const message = entry?.message ?? null;
	const sentAt = parseUtc( row.created_at );
	const valid = ! isNaN( sentAt.getTime() );
	const { origin, origin_label: originLabel } = row;
	const copies = entry?.resends ?? [];
	const moreCopies = Math.max( 0, ( entry?.resend_count ?? copies.length ) - RESENDS_SHOWN );
	const originalEntry = entry?.resend_of_entry ?? null;

	// One value or null: PanelRow hides only a null row, not a list of empty parts.
	let original: ReactNode = null;
	if ( originalEntry?.exists ) {
		original = (
			// As the Resent row writes its copies: when, then how it went ("2 hours ago · Failed").
			<EntryLink id={ originalEntry.id } onOpen={ onOpen }>
				{ originalEntry.created_at ? <EmailTime createdAt={ originalEntry.created_at } /> : null }
				{ originalEntry.status && statusLabels()[ originalEntry.status ]
					? ` · ${ statusLabels()[ originalEntry.status ] }`
					: null }
			</EntryLink>
		);
	} else if ( originalEntry ) {
		original = (
			<span className="jetpack-send-muted">
				{ __( 'No longer in the log', 'jetpack-send-pkg' ) }
			</span>
		);
	}

	let type: ReactNode = __( 'Site email', 'jetpack-send-pkg' );
	if ( row.source === 'test' ) {
		type = <TestBadge />;
	} else if ( row.source === 'resend' ) {
		type = <ResentBadge />;
	}

	return (
		<PanelRows>
			<PanelRow label={ __( 'Status', 'jetpack-send-pkg' ) }>
				<StatusBadge status={ row.status } />
			</PanelRow>
			<PanelRow label={ __( 'Date', 'jetpack-send-pkg' ) }>
				{ valid ? <time dateTime={ sentAt.toISOString() }>{ fullTime( sentAt ) }</time> : null }
			</PanelRow>
			<PanelRow label={ __( 'To', 'jetpack-send-pkg' ) }>{ row.recipients }</PanelRow>
			<PanelRow label={ __( 'Cc', 'jetpack-send-pkg' ) }>
				{ message?.cc.map( formatAddress ).join( ', ' ) }
			</PanelRow>
			<PanelRow label={ __( 'Bcc', 'jetpack-send-pkg' ) }>
				{ message?.bcc.map( formatAddress ).join( ', ' ) }
			</PanelRow>
			<PanelRow label={ __( 'Reply to', 'jetpack-send-pkg' ) }>
				{ message?.reply_to ? formatAddress( message.reply_to ) : null }
			</PanelRow>
			<PanelRow label={ __( 'Source', 'jetpack-send-pkg' ) }>
				{ origin && originLabel ? (
					<Stack
						direction="row"
						align="center"
						gap="sm"
						render={ <span /> }
						className="jetpack-send-panel__source"
					>
						<OriginIcon originKey={ origin } label={ originLabel } url={ row.origin_icon_url } />
						{ originLabel }
					</Stack>
				) : null }
			</PanelRow>
			<PanelRow label={ __( 'Type', 'jetpack-send-pkg' ) }>{ type }</PanelRow>
			<PanelRow label={ __( 'Resent', 'jetpack-send-pkg' ) }>
				{ copies.length > 0 ? (
					<Stack direction="column" align="flex-end" gap="xs" render={ <span /> }>
						{ copies.slice( 0, RESENDS_SHOWN ).map( copy => (
							<EntryLink key={ copy.id } id={ copy.id } onOpen={ onOpen }>
								<EmailTime createdAt={ copy.created_at } />
								{ ` · ${ statusLabels()[ copy.status ] }` }
							</EntryLink>
						) ) }
						{ moreCopies > 0 &&
							sprintf(
								/* translators: %d: how many more copies were resent. */
								__( 'and %d more', 'jetpack-send-pkg' ),
								moreCopies
							) }
					</Stack>
				) : null }
			</PanelRow>
			<PanelRow label={ __( 'Original email', 'jetpack-send-pkg' ) }>{ original }</PanelRow>
			<PanelRow label={ __( 'Resent by', 'jetpack-send-pkg' ) }>
				{ entry?.resent_by || null }
			</PanelRow>
		</PanelRows>
	);
};

/**
 * The HTML in a locked-down frame. The frame's head is worked out once per email: it measures the
 * page's styles, which re-renders don't change.
 *
 * @param props      - Component props.
 * @param props.html - The email's HTML.
 * @return The frame.
 */
const HtmlBody = ( { html }: { html: string } ) => {
	const head = useMemo( frameHead, [] );
	return (
		<Card.FullBleed>
			<iframe
				className="jetpack-send-email__frame"
				title={ __( 'Email content', 'jetpack-send-pkg' ) }
				sandbox="allow-popups allow-popups-to-escape-sandbox"
				srcDoc={ `<!doctype html><html><head>${ head }</head><body>${ html }</body></html>` }
			/>
		</Card.FullBleed>
	);
};

/**
 * The email as it went out, or why there's nothing to show, then its attachments.
 *
 * @param props         - Component props.
 * @param props.message - The kept message; null when nothing was kept.
 * @return The body.
 */
const Body = ( { message }: { message: LogMessage | null } ) => {
	let content: ReactNode;
	if ( message && typeof message.body === 'string' ) {
		content =
			message.content_type === 'text/html' ? (
				<HtmlBody html={ message.body } />
			) : (
				<Text variant="body-lg" render={ <div /> } className="jetpack-send-email__text">
					{ message.body }
				</Text>
			);
	} else {
		let note: string = __( 'No preview is available for this email.', 'jetpack-send-pkg' );
		if ( message?.kept === 'off' ) {
			note = __(
				'This email’s content wasn’t kept. Your site’s code turned that off.',
				'jetpack-send-pkg'
			);
		} else if ( message?.kept === 'too_large' ) {
			note = __( 'This email was too big to keep a copy.', 'jetpack-send-pkg' );
		}
		content = (
			<Text
				variant="body-lg"
				render={ <p /> }
				className="jetpack-send-email__empty jetpack-send-muted"
			>
				{ note }
			</Text>
		);
	}
	return (
		<>
			{ content }
			{ !! message?.attachments.length && (
				<ul
					className="jetpack-send-email__attachments"
					aria-label={ __( 'Attachments', 'jetpack-send-pkg' ) }
				>
					{ message.attachments.map( ( filename, index ) => (
						<li key={ `${ index }-${ filename }` }>{ filename }</li>
					) ) }
				</ul>
			) }
		</>
	);
};

type TestNoticeProps = {
	row: LogRow;
	domain: string;
	isAuto: boolean;
};

/**
 * A test that went out: when it was handed over, and whether it was the automatic one.
 *
 * @param props        - Component props.
 * @param props.row    - The test's row.
 * @param props.domain - The sending domain.
 * @param props.isAuto - It was sent when the domain finished connecting.
 * @return The notice.
 */
const TestNotice = ( { row, domain, isAuto }: TestNoticeProps ) => {
	const handedOver = sprintf(
		/* translators: 1: date and time the email was sent, 2: recipient email address. */
		__(
			'Jetpack handed it to the mail service at %1$s. If it isn’t in %2$s’s inbox, check spam.',
			'jetpack-send-pkg'
		),
		fullTime( parseUtc( row.created_at ) ),
		row.recipients
	);
	let automatic = '';
	if ( isAuto ) {
		automatic = domain
			? sprintf(
					/* translators: %s: the sending domain, e.g. example.com. */
					__( 'We sent this automatically when %s finished connecting.', 'jetpack-send-pkg' ),
					domain
				)
			: __(
					'We sent this automatically when your domain finished connecting.',
					'jetpack-send-pkg'
				);
	}
	return (
		<Notice.Root intent="success">
			<Notice.Title>{ __( 'This is your test email.', 'jetpack-send-pkg' ) }</Notice.Title>
			<Notice.Description>
				{ automatic ? `${ handedOver } ${ automatic }` : handedOver }
			</Notice.Description>
		</Notice.Root>
	);
};

type Props = {
	/** The log id of the email to show. */
	id: string;
	onClose: () => void;
};

/**
 * One email in the Log's side panel, built like Newsletter › Subscribers' panel: a bar with the
 * actions and Close, the subject and sender, any notice, then Details, Message and technical details.
 *
 * @param props         - Component props.
 * @param props.id      - The email's log id.
 * @param props.onClose - Close the panel.
 * @return The panel's content.
 */
const EmailPanel = ( { id, onClose }: Props ) => {
	const { status } = useSendStatus();
	const domain = status?.account?.domain ?? '';
	const autoTestLogId = status?.onboarding?.auto_test_log_id ?? null;
	const devMode = status?.provisioner === 'local';
	const listed = useSelect( select => select( sendStore ).getLogRow( id ), [ id ] );
	const { logChanged, requestLogDelete } = useDispatch( sendStore );

	const [ entry, setEntry ] = useState< LogEntry | null >( null );
	const [ error, setError ] = useState< string | null >( null );
	// Goes up after a resend, so the copies listed in Details load again.
	const [ entryVersion, setEntryVersion ] = useState( 0 );
	useEffect( () => {
		let cancelled = false;
		setError( null );
		fetchLogEntry( id )
			.then( result => ! cancelled && setEntry( result ) )
			.catch( e => ! cancelled && setError( errorMessage( e ) ) );
		return () => {
			cancelled = true;
		};
	}, [ id, entryVersion ] );

	// The list's copy shows at once; the full entry replaces it when it lands.
	const row: LogRow | null = entry?.id === id ? entry : listed;
	const loaded = entry?.id === id ? entry : null;

	// The resend dialog, and the copy it sent, shown until another email opens.
	const [ resendOpen, setResendOpen ] = useState( false );
	const [ someoneElse, setSomeoneElse ] = useState( false );
	const [ resent, setResent ] = useState< { id: string; logId: string; to: string[] } | null >(
		null
	);
	useEffect( () => {
		setResendOpen( false );
		setResent( current => ( current?.id === id ? current : null ) );
	}, [ id ] );

	// Opening moves focus to the subject, once per email, unless it's already in the panel.
	const titleRef = useRef< HTMLHeadingElement >( null );
	const closeRef = useRef< HTMLButtonElement >( null );
	const panelRef = useRef< HTMLElement >( null );
	const focusedFor = useRef< string | null >( null );
	useEffect( () => {
		if ( focusedFor.current === id || ( ! row && ! error ) ) {
			return;
		}
		focusedFor.current = id;
		const panel = panelRef.current;
		if ( ! panel?.contains( panel.ownerDocument.activeElement ) ) {
			( titleRef.current ?? closeRef.current )?.focus( { preventScroll: true } );
		}
	}, [ id, row, error ] );

	useCloseOnEscape( onClose );
	const navigate = useNavigate();
	const onNavigate = useCallback( ( href: string ) => navigate( { href } ), [ navigate ] );
	const openEntry = useCallback(
		( logId: string ) =>
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					// A number, as `/log?entry=12` parses, so the address doesn't quote it.
					[ LOG_ENTRY_PARAM ]: /^\d+$/.test( logId ) ? Number( logId ) : logId,
				} ),
			} as Parameters< typeof navigate >[ 0 ] ),
		[ navigate ]
	);
	const requestDelete = useCallback(
		() => row && requestLogDelete( row ),
		[ row, requestLogDelete ]
	);
	const openResend = useCallback( ( other = false ) => {
		setSomeoneElse( other );
		setResendOpen( true );
	}, [] );
	const openResendFromBar = useCallback( () => openResend(), [ openResend ] );
	const onLogged = useCallback( () => {
		logChanged();
		setEntryVersion( version => version + 1 );
	}, [ logChanged ] );
	const onSent = useCallback(
		( result: ResendResult, addresses: string[] ) => {
			setResendOpen( false );
			setResent( { id, logId: result.log_id, to: addresses } );
			speak(
				/* translators: %s: email addresses. */
				sprintf( __( 'Sent again to %s.', 'jetpack-send-pkg' ), shortAddresses( addresses ) )
			);
		},
		[ id ]
	);
	const openCopy = useCallback( () => resent && openEntry( resent.logId ), [ resent, openEntry ] );

	let content: ReactNode;
	if ( ! row ) {
		content = error ? (
			<ErrorNotice message={ error } />
		) : (
			<Stack
				direction="row"
				align="center"
				justify="center"
				className="jetpack-send-panel__loading"
			>
				<Spinner />
			</Stack>
		);
	} else {
		let sender: ReactNode = null;
		if ( ! loaded && ! error ) {
			sender = <SenderSkeleton />;
		} else if ( loaded?.message ) {
			sender = (
				<Sender
					message={ loaded.message }
					avatarUrl={ loaded.from_avatar_url }
					siteIconUrl={ status?.site_icon_url ?? null }
				/>
			);
		}
		let body: ReactNode = (
			<Stack direction="row" justify="center">
				<Spinner />
			</Stack>
		);
		if ( error ) {
			body = <ErrorNotice message={ error } />;
		} else if ( loaded ) {
			body = <Body message={ loaded.message } />;
		}
		content = (
			<Stack direction="column" gap="lg">
				<Stack direction="column" gap="md">
					<Text
						variant="heading-lg"
						render={ <h2 id={ PANEL_TITLE_ID } ref={ titleRef } tabIndex={ -1 } /> }
						className="jetpack-send-panel__title"
					>
						{ row.subject || __( '(No subject)', 'jetpack-send-pkg' ) }
					</Text>
					{ sender }
				</Stack>
				{ resent?.id === id && (
					<Notice.Root intent="success">
						<Notice.Title>{ __( 'Sent again', 'jetpack-send-pkg' ) }</Notice.Title>
						<Notice.Description>
							{ sprintf(
								/* translators: %s: email addresses, e.g. "jordan@example.com and 2 more". */
								__( 'Sent to %s just now.', 'jetpack-send-pkg' ),
								shortAddresses( resent.to )
							) }
						</Notice.Description>
						<Notice.Actions>
							<Notice.ActionButton variant="outline" onClick={ openCopy }>
								{ __( 'Open the new copy', 'jetpack-send-pkg' ) }
							</Notice.ActionButton>
						</Notice.Actions>
					</Notice.Root>
				) }
				{ row.source === 'test' && row.status === 'sent' && (
					<TestNotice
						row={ row }
						domain={ domain }
						isAuto={ !! autoTestLogId && autoTestLogId === row.id }
					/>
				) }
				{ row.status !== 'sent' && (
					<FailureNotice
						row={ row }
						detail={ loaded?.detail ?? null }
						supportText={ loaded?.support_text ?? '' }
						canResend={ !! loaded?.resend.allowed }
						domain={ domain }
						devMode={ devMode }
						onNavigate={ onNavigate }
						onResend={ openResend }
					/>
				) }
				<PanelSection title={ __( 'Details', 'jetpack-send-pkg' ) }>
					<Details row={ row } entry={ loaded } onOpen={ openEntry } />
				</PanelSection>
				<PanelSection title={ __( 'Message', 'jetpack-send-pkg' ) }>{ body }</PanelSection>
				{ hasTechnicalDetails( row, loaded ) && <TechnicalDetails row={ row } entry={ loaded } /> }
			</Stack>
		);
	}

	return (
		<section
			className="jetpack-send-panel"
			ref={ panelRef }
			aria-labelledby={ row ? PANEL_TITLE_ID : undefined }
		>
			<Stack
				direction="row"
				align="center"
				justify="space-between"
				gap="xs"
				className="jetpack-send-panel__header"
			>
				{ row ? (
					<Stack direction="row" gap="xs">
						{ /* Tests have Send a test instead; shown once the entry says whether it can go again. */ }
						{ loaded && row.source !== 'test' && (
							<Button variant="minimal" tone="neutral" size="compact" onClick={ openResendFromBar }>
								<Button.Icon icon={ send } />
								{ __( 'Resend', 'jetpack-send-pkg' ) }
							</Button>
						) }
						<Button variant="minimal" tone="neutral" size="compact" onClick={ requestDelete }>
							<Button.Icon icon={ trash } />
							{ __( 'Delete', 'jetpack-send-pkg' ) }
						</Button>
					</Stack>
				) : (
					<span />
				) }
				<IconButton
					ref={ closeRef }
					icon={ close }
					label={ __( 'Close', 'jetpack-send-pkg' ) }
					variant="minimal"
					tone="neutral"
					size="compact"
					onClick={ onClose }
				/>
			</Stack>
			<div className="jetpack-send-panel__body">{ content }</div>
			{ loaded && loaded.source !== 'test' && (
				<ResendDialog
					entry={ loaded }
					open={ resendOpen }
					onOpenChange={ setResendOpen }
					someoneElse={ someoneElse }
					onLogged={ onLogged }
					onSent={ onSent }
					onOpenCopy={ openEntry }
				/>
			) }
		</section>
	);
};

export default EmailPanel;
