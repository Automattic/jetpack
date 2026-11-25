import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { useNavigate, useSearch } from '@wordpress/route';
import {
	AlertDialog,
	Button,
	Card,
	Collapsible,
	CollapsibleCard,
	InputControl,
	InputLayout,
	SelectControl,
	Stack,
	SwitchControl,
	Text,
} from '@wordpress/ui';
import Avatar from '../../components/avatar';
import { CopyIconButton } from '../../components/copy-button';
import ErrorNotice from '../../components/error-notice';
import RouteLink from '../../components/route-link';
import { devModeHint } from '../../components/send-page';
import { errorMessage, postAction } from '../../data/api';
import { formatCount, fullTime, siteDate } from '../../data/dates';
import { DEBUG_LOG_HREF, SETTINGS_EDIT_PARAM, SETTINGS_HREF } from '../../data/log-link';
import { retentionLabel } from '../../data/period';
import { sendStore, useSendAction } from '../../data/store';
import { providerName } from '../overview/setup-step';
import EmailLogCard from './email-log-card';
import type {
	Account,
	DebugLogDays,
	DebugLogState,
	DnsPurpose,
	DnsRecord,
	SendStatus,
	SpfSuggestion,
} from '../../data/types';
import type { FormEvent, Ref } from 'react';

type Props = { status: SendStatus; account: Account };

/**
 * The technical name of a record, for the details panel only.
 *
 * @param purpose - Record purpose.
 * @return The name.
 */
function technicalName( purpose: DnsPurpose ): string {
	if ( purpose === 'lockdown' ) {
		return __( 'Sending permission', 'jetpack-send-pkg' );
	}
	return purpose === 'spf' ? __( 'SPF', 'jetpack-send-pkg' ) : __( 'DKIM', 'jetpack-send-pkg' );
}

/**
 * A record's value as Settings shows it: the SPF record is the version to publish, merged into the
 * one the domain already has, so the details and the SPF row never show two different values.
 *
 * @param record - The record.
 * @param status - Send status.
 * @return The value.
 */
function shownValue( record: DnsRecord, status: SendStatus ): string {
	return record.purpose === 'spf' && status.spf_suggestion?.value
		? status.spf_suggestion.value
		: record.value;
}

/** Remembers whether Advanced is open while the tab stays open, so coming back keeps it as it was. */
const ADVANCED_OPEN_KEY = 'jetpack-send-settings-advanced-open';

/**
 * Whether Advanced was left open this session. Storage can be blocked, so it falls back to closed.
 *
 * @return Open.
 */
function readAdvancedOpen(): boolean {
	try {
		return window.sessionStorage.getItem( ADVANCED_OPEN_KEY ) === '1';
	} catch {
		return false;
	}
}

/**
 * Remember Advanced's open state for this session.
 *
 * @param open - Open.
 */
function saveAdvancedOpen( open: boolean ) {
	try {
		window.sessionStorage.setItem( ADVANCED_OPEN_KEY, open ? '1' : '0' );
	} catch {
		// Blocked storage: it just closes again next time.
	}
}

/**
 * The labels in the technical details, in order.
 *
 * @return Labels.
 */
function technicalLabels(): string[] {
	return [
		__( 'Sending account ID', 'jetpack-send-pkg' ),
		__( 'Managed by', 'jetpack-send-pkg' ),
		__( 'Nameservers', 'jetpack-send-pkg' ),
	];
}

const SenderCard = ( { status, account }: Props ) => {
	const { settings } = status;
	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	// "Change sender" on the Overview lands here with the form open.
	const editRequested = search?.[ SETTINGS_EDIT_PARAM ] === 'sender';
	const [ editing, setEditing ] = useState( editRequested );
	const nameRef = useRef< HTMLInputElement >( null );
	const [ fromName, setFromName ] = useState( settings.from_name );
	const [ localPart, setLocalPart ] = useState( settings.from_local_part );
	const [ replyTo, setReplyTo ] = useState( settings.reply_to ?? '' );
	const [ justSaved, setJustSaved ] = useState( false );
	const { run, busy, error } = useSendAction();

	const dirty =
		fromName !== settings.from_name ||
		localPart !== settings.from_local_part ||
		replyTo.trim() !== ( settings.reply_to ?? '' );
	// The preview follows the form while editing and the saved settings otherwise.
	const shownName = ( editing ? fromName : settings.from_name ).trim() || status.site_title;
	const shownLocal = ( editing ? localPart : settings.from_local_part ).trim() || 'wordpress';
	const address = `${ shownLocal }@${ account.domain }`;
	const savedReplyTo = settings.reply_to ?? '';

	const startEditing = useCallback( () => {
		setFromName( settings.from_name );
		setLocalPart( settings.from_local_part );
		setReplyTo( settings.reply_to ?? '' );
		setEditing( true );
		setJustSaved( false );
	}, [ settings ] );
	const cancel = useCallback( () => setEditing( false ), [] );

	useEffect( () => {
		if ( ! editRequested ) {
			return;
		}
		startEditing();
		window.requestAnimationFrame( () => nameRef.current?.focus() );
		// Once read, the param leaves the address so a reload doesn't open the form again.
		navigate( { href: SETTINGS_HREF, replace: true, viewTransition: false } );
		// Runs once per landing; startEditing changes whenever the settings do.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ editRequested ] );
	const onSubmit = useCallback(
		async ( event: FormEvent ) => {
			event.preventDefault();
			const saved = await run( 'settings', {
				from_name: fromName,
				from_local_part: localPart,
				reply_to: replyTo.trim(),
			} );
			if ( saved ) {
				setJustSaved( true );
				setEditing( false );
			}
		},
		[ run, fromName, localPart, replyTo ]
	);

	// The avatar is the saved address's; while typing a new one, the initial stands in until Save.
	const avatarUrl = status.sender_avatar?.email === address ? status.sender_avatar.url : null;

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ __( 'Sender', 'jetpack-send-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					<div className="jetpack-send-sender">
						<Avatar
							size="lg"
							name={ shownName }
							url={ avatarUrl }
							fallbackUrl={ status.site_icon_url }
						/>
						<span className="jetpack-send-sender__text">
							<Text variant="body-lg">{ shownName }</Text>
							<Text variant="body-md" className="jetpack-send-muted">
								{ address }
							</Text>
						</span>
						{ ! editing && (
							<Button
								variant="minimal"
								tone="neutral"
								size="compact"
								className="jetpack-send-sender__change"
								onClick={ startEditing }
							>
								{ __( 'Change', 'jetpack-send-pkg' ) }
							</Button>
						) }
					</div>
					{ ! editing && savedReplyTo && (
						<Text variant="body-md" render={ <p /> } className="jetpack-send-card__text">
							{ sprintf(
								/* translators: %s: email address replies go to. */
								__( 'Replies go to %s.', 'jetpack-send-pkg' ),
								savedReplyTo
							) }
						</Text>
					) }
					{ ! editing && justSaved && (
						<Text variant="body-md" className="jetpack-send-saved" role="status">
							{ __( 'Saved', 'jetpack-send-pkg' ) }
						</Text>
					) }
					{ editing && (
						<form onSubmit={ onSubmit }>
							<Stack direction="column" gap="lg">
								<InputControl
									ref={ nameRef }
									label={ __( 'Name', 'jetpack-send-pkg' ) }
									description={ __( 'Leave blank to use your site title.', 'jetpack-send-pkg' ) }
									placeholder={ status.site_title }
									value={ fromName }
									onValueChange={ setFromName }
								/>
								<InputControl
									label={ __( 'Address', 'jetpack-send-pkg' ) }
									description={ __(
										'Pick something people recognize, like hello or orders.',
										'jetpack-send-pkg'
									) }
									value={ localPart }
									onValueChange={ setLocalPart }
									suffix={ <InputLayout.Slot>{ `@${ account.domain }` }</InputLayout.Slot> }
								/>
								<InputControl
									type="email"
									label={ __( 'Replies go to', 'jetpack-send-pkg' ) }
									description={ __(
										'Use an inbox you check. Leave blank to send replies to the address above.',
										'jetpack-send-pkg'
									) }
									placeholder={ status.admin_email }
									value={ replyTo }
									onValueChange={ setReplyTo }
								/>
								{ error && <ErrorNotice message={ error } /> }
								<Stack direction="row" gap="sm" align="center" wrap="wrap">
									<Button
										type="submit"
										variant="solid"
										loading={ !! busy }
										disabled={ !! busy || ! dirty || ! localPart.trim() }
									>
										{ __( 'Save', 'jetpack-send-pkg' ) }
									</Button>
									<Button variant="minimal" tone="neutral" onClick={ cancel }>
										{ __( 'Cancel', 'jetpack-send-pkg' ) }
									</Button>
								</Stack>
							</Stack>
						</form>
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

const DomainCard = ( { status, account }: Props ) => {
	const { receiveStatus } = useDispatch( sendStore );
	const navigate = useNavigate();
	const [ confirmReset, setConfirmReset ] = useState( false );
	const [ detailsOpen, setDetailsOpen ] = useState( false );
	const provider = providerName( status );
	const nameservers = account.dns_host?.nameservers ?? [];

	const onReset = useCallback( async () => {
		try {
			receiveStatus( await postAction( 'reset' ) );
		} catch ( e ) {
			return { close: false, error: errorMessage( e ) };
		}
		navigate( { href: '/' } );
	}, [ receiveStatus, navigate ] );
	const openConfirm = useCallback( () => setConfirmReset( true ), [] );

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ __( 'Domain', 'jetpack-send-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					{ /* One grid for both lists, so their labels and values line up. */ }
					<div className="jetpack-send-details-grid">
						<Text variant="body-lg" render={ <dl /> } className="jetpack-send-details">
							{ /* The technical labels sit unseen under this one, so the value column doesn't move when they open. */ }
							<dt className="jetpack-send-details__sized">
								<span>{ __( 'Sending from', 'jetpack-send-pkg' ) }</span>
								{ technicalLabels().map( label => (
									<span key={ label } aria-hidden="true" className="jetpack-send-details__sizer">
										{ label }
									</span>
								) ) }
							</dt>
							<dd>{ account.domain }</dd>
							{ provider && (
								<>
									<dt>{ __( 'Managed at', 'jetpack-send-pkg' ) }</dt>
									<dd>{ provider }</dd>
								</>
							) }
							{ /* Not before the domain first connects: until then it isn't set up. */ }
							{ ( status.can_enable || !! status.onboarding?.closed_at ) && (
								<>
									<dt>{ __( 'Set up on', 'jetpack-send-pkg' ) }</dt>
									<dd>{ siteDate( account.provisioned_at ) }</dd>
								</>
							) }
						</Text>
						<Collapsible.Root
							open={ detailsOpen }
							onOpenChange={ setDetailsOpen }
							className="jetpack-send-technical-toggle"
						>
							<Collapsible.Trigger
								render={ <Button variant="minimal" tone="neutral" size="compact" /> }
							>
								<Button.Icon icon={ detailsOpen ? chevronUp : chevronDown } />
								{ detailsOpen
									? __( 'Hide technical details', 'jetpack-send-pkg' )
									: __( 'Show technical details', 'jetpack-send-pkg' ) }
							</Collapsible.Trigger>
							<Collapsible.Panel className="jetpack-send-technical">
								<Stack direction="column" gap="md">
									{ /* Record detail, at the size of the record labels below and setup's record rows. */ }
									<Text variant="body-md" render={ <dl /> } className="jetpack-send-details">
										<dt>{ technicalLabels()[ 0 ] }</dt>
										<dd>
											<code className="jetpack-send-code">{ account.handle }</code>
										</dd>
										<dt>{ technicalLabels()[ 1 ] }</dt>
										<dd>
											{ account.provider === 'wpcom' ? (
												__( 'WordPress.com', 'jetpack-send-pkg' )
											) : (
												<Stack direction="column" gap="xs">
													<span>{ __( 'Development provisioner', 'jetpack-send-pkg' ) }</span>
													<Text variant="body-md" className="jetpack-send-muted">
														{ devModeHint() }
													</Text>
												</Stack>
											) }
										</dd>
										{ nameservers.length > 0 && (
											<>
												<dt>{ technicalLabels()[ 2 ] }</dt>
												<dd>{ nameservers.join( ', ' ) }</dd>
											</>
										) }
									</Text>
									<ul className="jetpack-send-technical__records">
										{ account.dns_records.map( record => (
											<li key={ `${ record.purpose }-${ record.name }` }>
												<Text variant="heading-md">
													{ `${ technicalName( record.purpose ) } · ${ record.type }` }
												</Text>
												<code className="jetpack-send-code">{ record.name }</code>
												<code className="jetpack-send-code">{ shownValue( record, status ) }</code>
											</li>
										) ) }
									</ul>
									{ !! account.zone_records?.length && (
										<>
											<Text
												variant="body-md"
												render={ <p /> }
												className="jetpack-send-card__text jetpack-send-muted"
											>
												{ __(
													'Jetpack publishes these records so the ones above work.',
													'jetpack-send-pkg'
												) }
											</Text>
											<ul className="jetpack-send-technical__records">
												{ account.zone_records.map( record => (
													<li key={ record.name }>
														<code className="jetpack-send-code">{ record.name }</code>
														<code className="jetpack-send-code">{ record.value }</code>
													</li>
												) ) }
											</ul>
										</>
									) }
								</Stack>
							</Collapsible.Panel>
						</Collapsible.Root>
					</div>
					<div className="jetpack-send-danger">
						<Stack direction="column" gap="xs" className="jetpack-send-danger__text">
							<Text variant="body-lg">
								{ __( 'Change domain or start over', 'jetpack-send-pkg' ) }
							</Text>
							<Text
								variant="body-md"
								render={ <p /> }
								className="jetpack-send-card__text jetpack-send-muted"
							>
								{ __(
									'This turns off sending and removes your site’s sending account. The records you added stay where your domain is managed until you delete them. You can set Send up again anytime.',
									'jetpack-send-pkg'
								) }
							</Text>
						</Stack>
						<Button variant="outline" tone="neutral" onClick={ openConfirm }>
							{ __( 'Start over…', 'jetpack-send-pkg' ) }
						</Button>
					</div>
				</Stack>
			</Card.Content>
			<AlertDialog.Root
				open={ confirmReset }
				onOpenChange={ setConfirmReset }
				onConfirm={ onReset }
			>
				<AlertDialog.Popup
					intent="irreversible"
					title={ __( 'Start over?', 'jetpack-send-pkg' ) }
					description={ sprintf(
						/* translators: %s: domain name. */
						__(
							'Your site goes back to your host’s mail and its sending account is removed. To use Send again, you’ll set it up from the start, for %s or a different domain.',
							'jetpack-send-pkg'
						),
						account.domain
					) }
					confirmButtonText={ __( 'Start over', 'jetpack-send-pkg' ) }
				/>
			</AlertDialog.Root>
		</Card.Root>
	);
};

/**
 * The hint under the optional SPF record.
 *
 * @param state - Suggestion state.
 * @param value - The suggested record.
 * @return The hint, or '' when none applies.
 */
function spfHint( state: SpfSuggestion[ 'state' ], value = '' ): string {
	// Cloudflare Email Routing's own record is locked until it's unlocked there.
	if ( state === 'merge' && /include:_spf\.mx\.cloudflare\.net/i.test( value ) ) {
		return __(
			'Cloudflare Email Routing manages your domain’s record. Unlock it in your Email Routing settings at Cloudflare, then edit it to this version.',
			'jetpack-send-pkg'
		);
	}
	if ( state === 'merge' ) {
		return __(
			'Your domain already has one of these. Edit it to this version, don’t add a second one.',
			'jetpack-send-pkg'
		);
	}
	return state === 'present'
		? __( 'Your domain’s record already lists Jetpack Send.', 'jetpack-send-pkg' )
		: '';
}

const SpfRecord = ( {
	status,
	account,
	headingRef,
	needed = false,
}: Props & { headingRef?: Ref< HTMLSpanElement >; needed?: boolean } ) => {
	const hasDkim = account.dns_records.some( record => record.purpose === 'dkim' );
	const record = account.dns_records.find( item => item.purpose === 'spf' && item.optional );
	if ( ! record || ! hasDkim ) {
		return null;
	}
	const suggestion = status.spf_suggestion;
	const value = shownValue( record, status );
	const host = record.host ?? record.name;
	const hint = suggestion ? spfHint( suggestion.state, suggestion.value ) : '';

	return (
		<Stack direction="column" gap="sm">
			{ /* Focused when the "sender list" failure's action opens Advanced. Named as Technical
			   details names it, and not optional once it has blocked an email. */ }
			<Text
				variant="heading-md"
				ref={ headingRef }
				tabIndex={ -1 }
				className="jetpack-send-landing-heading"
			>
				{ needed
					? __( 'Sender list (SPF)', 'jetpack-send-pkg' )
					: __( 'Sender list (SPF), optional', 'jetpack-send-pkg' ) }
			</Text>
			<Text
				variant="body-md"
				render={ <p /> }
				className={ `jetpack-send-card__text${ needed ? '' : ' jetpack-send-muted' }` }
			>
				{ needed
					? __(
							'Your domain’s sender list blocked an email because it doesn’t include Jetpack. Add Jetpack to it now with this value.',
							'jetpack-send-pkg'
						)
					: __(
							'Your signing record already shows inboxes your emails are genuine. Add this too if you send more than 5,000 emails a day to Gmail addresses.',
							'jetpack-send-pkg'
						) }
			</Text>
			<Text variant="body-md" render={ <dl /> } className="jetpack-send-details">
				<dt>{ __( 'Type', 'jetpack-send-pkg' ) }</dt>
				<dd>{ record.type }</dd>
				<dt>{ __( 'Name', 'jetpack-send-pkg' ) }</dt>
				<dd className="jetpack-send-details__copy">
					<code className="jetpack-send-code">{ host }</code>
					<CopyIconButton
						text={ host }
						label={ __( 'Copy name, SPF record', 'jetpack-send-pkg' ) }
					/>
				</dd>
				<dt>{ __( 'Value', 'jetpack-send-pkg' ) }</dt>
				<dd className="jetpack-send-details__copy">
					<code className="jetpack-send-code">{ value }</code>
					<CopyIconButton
						text={ value }
						label={ __( 'Copy value, SPF record', 'jetpack-send-pkg' ) }
					/>
				</dd>
			</Text>
			{ hint && (
				<Text variant="body-md" render={ <p /> } className="jetpack-send-card__text">
					{ hint }
				</Text>
			) }
		</Stack>
	);
};

/** The debug log while the status payload has none (older servers). */
const DEBUG_OFF: DebugLogState = { enabled: false, days: 7, until: null, entries: 0 };

/** How long the debug log records once turned on. */
const DEBUG_DAYS: DebugLogDays[] = [ 1, 7, 30 ];

/**
 * Settings › Advanced's debug log: the switch, how long it records, and a link to its entries.
 *
 * @param props           - Component props.
 * @param props.debug     - The debug log's state.
 * @param props.busy      - A save is running.
 * @param props.onChange  - Save debug settings.
 * @param props.switchRef - The switch, focused when a link lands on it.
 * @return The controls.
 */
const DebugLogControls = ( {
	debug,
	busy,
	onChange,
	switchRef,
}: {
	debug: DebugLogState;
	busy: boolean;
	onChange: ( update: { debug_log?: boolean; debug_log_days?: DebugLogDays } ) => void;
	switchRef: Ref< HTMLSpanElement >;
} ) => {
	const items = useMemo(
		() => DEBUG_DAYS.map( days => ( { value: String( days ), label: retentionLabel( days ) } ) ),
		[]
	);
	const onCheckedChange = useCallback(
		( next: boolean ) => onChange( { debug_log: next } ),
		[ onChange ]
	);
	const onDaysChange = useCallback(
		( item: { value: string } | null ) => {
			const days = Number( item?.value );
			if ( DEBUG_DAYS.includes( days as DebugLogDays ) && days !== debug.days ) {
				onChange( { debug_log_days: days as DebugLogDays } );
			}
		},
		[ onChange, debug.days ]
	);
	const until = debug.until ? new Date( debug.until ) : null;

	return (
		<Stack direction="column" gap="lg">
			<SwitchControl
				ref={ switchRef }
				label={ __( 'Keep a debug log', 'jetpack-send-pkg' ) }
				description={
					debug.enabled && until && ! isNaN( until.getTime() )
						? sprintf(
								/* translators: %s: date and time, e.g. "October 26, 2026 2:10 pm". */
								__( 'Recording until %s. It turns itself off then.', 'jetpack-send-pkg' ),
								fullTime( until )
							)
						: __(
								'Records each step Jetpack Send takes, to help you or support find a problem.',
								'jetpack-send-pkg'
							)
				}
				checked={ debug.enabled }
				disabled={ busy }
				onCheckedChange={ onCheckedChange }
			/>
			{ debug.enabled && (
				<SelectControl
					label={ __( 'Turn off after', 'jetpack-send-pkg' ) }
					description={ sprintf(
						/* translators: %s: how long, e.g. "1 week". */
						__( 'Each entry is deleted %s after it’s recorded.', 'jetpack-send-pkg' ),
						retentionLabel( debug.days )
					) }
					items={ items }
					value={ items.find( item => item.value === String( debug.days ) ) ?? null }
					onValueChange={ onDaysChange }
					disabled={ busy }
				/>
			) }
			{ ( debug.enabled || debug.entries > 0 ) && (
				<Text variant="body-md" render={ <p /> } className="jetpack-send-card__text">
					<RouteLink href={ DEBUG_LOG_HREF }>
						{ sprintf(
							/* translators: %s: number of entries. */
							_n(
								'View debug log (%s entry)',
								'View debug log (%s entries)',
								debug.entries,
								'jetpack-send-pkg'
							),
							formatCount( debug.entries )
						) }
					</RouteLink>
				</Text>
			) }
		</Stack>
	);
};

const AdvancedCard = ( { status, account }: Props ) => {
	const { enabled, fallback, auto_enable: autoEnable } = status.settings;
	const { run, busy, error } = useSendAction();
	const { receiveStatus } = useDispatch( sendStore );
	const [ confirm, setConfirm ] = useState< 'pause' | 'fallback' | null >( null );
	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	// The debug log's and the sender list failure's links open Advanced on what they're about.
	const edit = search?.[ SETTINGS_EDIT_PARAM ];
	const landing = edit === 'debug' || edit === 'advanced' ? edit : null;
	const [ advancedOpen, setAdvancedOpen ] = useState( () => !! landing || readAdvancedOpen() );
	// Opened from an email the sender list blocked: that record is needed now, not optional.
	const [ spfNeeded, setSpfNeeded ] = useState( landing === 'advanced' );
	const onToggle = useCallback( ( next: boolean ) => {
		setAdvancedOpen( next );
		saveAdvancedOpen( next );
	}, [] );
	const debugRef = useRef< HTMLSpanElement >( null );
	const spfRef = useRef< HTMLSpanElement >( null );
	useEffect( () => {
		if ( ! landing ) {
			return;
		}
		setAdvancedOpen( true );
		saveAdvancedOpen( true );
		if ( landing === 'advanced' ) {
			setSpfNeeded( true );
		}
		window.requestAnimationFrame( () =>
			( landing === 'advanced'
				? ( spfRef.current ?? debugRef.current )
				: debugRef.current
			)?.focus()
		);
		navigate( { href: SETTINGS_HREF, replace: true, viewTransition: false } );
		// Runs once per landing.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ landing ] );
	const onDebugChange = useCallback(
		( update: { debug_log?: boolean; debug_log_days?: DebugLogDays } ) => run( 'settings', update ),
		[ run ]
	);

	// Pausing and turning fallback off can lose mail, so they ask first; the reverse is safe.
	const onPauseChange = useCallback(
		( pause: boolean ) => ( pause ? setConfirm( 'pause' ) : run( 'settings', { enabled: true } ) ),
		[ run ]
	);
	const onFallbackChange = useCallback(
		( next: boolean ) =>
			next ? run( 'settings', { fallback: true } ) : setConfirm( 'fallback' ),
		[ run ]
	);
	const onAutoEnableChange = useCallback(
		( next: boolean ) => run( 'settings', { auto_enable: next } ),
		[ run ]
	);
	const onOpenChange = useCallback( ( open: boolean ) => ! open && setConfirm( null ), [] );
	const onConfirm = useCallback( async () => {
		const update = confirm === 'pause' ? { enabled: false } : { fallback: false };
		try {
			receiveStatus( await postAction( 'settings', update ) );
		} catch ( e ) {
			return { close: false, error: errorMessage( e ) };
		}
	}, [ confirm, receiveStatus ] );

	const canResume = enabled || status.can_enable;
	let pauseDescription: string = __(
		'While paused, your site’s emails go out through your host.',
		'jetpack-send-pkg'
	);
	if ( ! canResume ) {
		pauseDescription = sprintf(
			/* translators: %s: domain name. */
			__( 'Sending can start once %s is connected.', 'jetpack-send-pkg' ),
			account.domain
		);
	}

	return (
		<CollapsibleCard.Root open={ advancedOpen } onOpenChange={ onToggle }>
			<CollapsibleCard.Header render={ <h2 /> }>
				<Card.Title>{ __( 'Advanced', 'jetpack-send-pkg' ) }</Card.Title>
				<CollapsibleCard.HeaderDescription>
					{ __( 'Pause sending, backup mail, debug log and more', 'jetpack-send-pkg' ) }
				</CollapsibleCard.HeaderDescription>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="xl">
					<SwitchControl
						label={ __( 'Pause sending', 'jetpack-send-pkg' ) }
						description={ pauseDescription }
						// Before the domain connects there's nothing to pause, so don't show it as paused.
						checked={ canResume && ! enabled }
						disabled={ !! busy || ! canResume }
						onCheckedChange={ onPauseChange }
					/>
					<SwitchControl
						label={ __( 'Turn on sending when the records pass', 'jetpack-send-pkg' ) }
						description={
							autoEnable
								? sprintf(
										/* translators: %s: domain name. */
										__(
											'When %s’s records check out, sending starts by itself.',
											'jetpack-send-pkg'
										),
										account.domain
									)
								: __(
										'When the records pass, you’ll turn sending on from the Overview.',
										'jetpack-send-pkg'
									)
						}
						checked={ autoEnable }
						disabled={ !! busy }
						onCheckedChange={ onAutoEnableChange }
					/>
					<SwitchControl
						label={ __( 'Use your host’s mail as a backup', 'jetpack-send-pkg' ) }
						description={
							fallback
								? __(
										'If an email can’t go out through Jetpack Send, your host’s mail sends it instead, so password resets and receipts keep flowing. These emails show as Sent by your host in the Log.',
										'jetpack-send-pkg'
									)
								: __(
										'If an email can’t go out through Jetpack Send, it isn’t sent. Failed emails show in the Log.',
										'jetpack-send-pkg'
									)
						}
						checked={ fallback }
						disabled={ !! busy }
						onCheckedChange={ onFallbackChange }
					/>
					<DebugLogControls
						debug={ status.debug_log ?? DEBUG_OFF }
						busy={ !! busy }
						onChange={ onDebugChange }
						switchRef={ debugRef }
					/>
					{ error && <ErrorNotice message={ error } /> }
					<SpfRecord
						status={ status }
						account={ account }
						headingRef={ spfRef }
						needed={ spfNeeded }
					/>
				</Stack>
			</CollapsibleCard.Content>
			<AlertDialog.Root open={ !! confirm } onOpenChange={ onOpenChange } onConfirm={ onConfirm }>
				<AlertDialog.Popup
					title={
						confirm === 'pause'
							? __( 'Pause sending?', 'jetpack-send-pkg' )
							: __( 'Turn off backup mail?', 'jetpack-send-pkg' )
					}
					description={
						confirm === 'pause'
							? __(
									'Your site’s emails go back to your host’s mail until you turn sending back on. Your records and settings stay as they are.',
									'jetpack-send-pkg'
								)
							: __(
									'Emails that can’t go out through Jetpack Send won’t be sent at all, including password resets and order receipts. You can turn backup mail back on anytime.',
									'jetpack-send-pkg'
								)
					}
					confirmButtonText={
						confirm === 'pause'
							? __( 'Pause', 'jetpack-send-pkg' )
							: __( 'Turn off', 'jetpack-send-pkg' )
					}
				/>
			</AlertDialog.Root>
		</CollapsibleCard.Root>
	);
};

const SettingsScreen = ( { status, account }: Props ) => (
	<>
		<SenderCard status={ status } account={ account } />
		<DomainCard status={ status } account={ account } />
		<EmailLogCard status={ status } />
		<AdvancedCard status={ status } account={ account } />
	</>
);

export default SettingsScreen;
