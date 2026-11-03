import { speak } from '@wordpress/a11y';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Badge, Button, ButtonLink, Notice, Skeleton, Spinner, Stack, Text } from '@wordpress/ui';
import {
	OTHER_SLUG,
	UNSURE_SLUG,
	getProvider,
	isNamedProvider,
	providerPageUrl,
	providerTip,
} from '../../../components/onboarding/providers';
import CloudflareConnect, {
	optionalRecordNote,
} from '../../../components/onboarding/steps/cloudflare-connect';
import Delegate from '../../../components/onboarding/steps/delegate';
import TextAction from '../../../components/text-action';
import { fetchDnsHost, fetchStatus, saveOnboarding } from '../../../data/api';
import { sendStore, useSendAction } from '../../../data/store';
import { domainBadge, fixAdvice } from '../domain-state';
import { STALLED_AFTER_MS, msSinceSetup } from '../setup-step';
import AutoAddPanel from './auto-add-panel';
import { foundCount, headingDomain } from './model';
import ProviderSelect, { detectedProvider, mismatchText, pointsToClue } from './provider-select';
import RecordRows from './record-rows';
import { displayRecords } from './records';
import TaskCard, { focusTaskCard } from './task-card';
import { testRecipient } from './use-test-email';
import WaitingNote from './waiting-note';
import type { AutoKind } from './auto-add-panel';
import type { TaskState } from './model';
import type { DnsPollingState } from '../../../components/onboarding/use-dns-polling';
import type {
	CloudflareApplyResult,
	DnsHost,
	DnsLookupRecord,
	DnsPurpose,
	ProviderSlug,
	SendStatus,
} from '../../../data/types';
import type { ReactNode } from 'react';

/** How long the card waits for detection before asking where the domain is managed. */
export const DETECT_TIMEOUT = 5000;

type Props = {
	status: SendStatus;
	state: TaskState;
	polling: DnsPollingState;
	open: boolean;
	onOpenChange: ( open: boolean ) => void;
};

/**
 * Task 2: add the records at the DNS host, ticked off as they appear.
 *
 * @param props              - Component props.
 * @param props.status       - Send status.
 * @param props.state        - Task state.
 * @param props.polling      - The page's DNS polling.
 * @param props.open         - Whether the card is open.
 * @param props.onOpenChange - Open or close the card.
 * @return The task card.
 */
const ConnectTask = ( { status, state, polling, open, onOpenChange }: Props ) => {
	const { receiveStatus } = useDispatch( sendStore );
	const { run, busy: actionBusy, error: actionError } = useSendAction();
	const account = status.account;
	const domain = account?.domain ?? status.suggested_domain;
	const verified = status.can_enable;

	const [ fetchedHost, setFetchedHost ] = useState< DnsHost | null >( null );
	const [ detectFailed, setDetectFailed ] = useState( false );
	const [ localPick, setLocalPick ] = useState< ProviderSlug | null >( null );
	const [ pickerOpen, setPickerOpen ] = useState( false );
	const [ tokenOpen, setTokenOpen ] = useState( false );
	const [ delegateOpen, setDelegateOpen ] = useState( false );
	const [ manual, setManual ] = useState( false );
	const [ autoNotice, setAutoNotice ] = useState< string | null >( null );
	const notRightRef = useRef< HTMLButtonElement >( null );
	const selectRef = useRef< HTMLButtonElement >( null );
	const letJetpackRef = useRef< HTMLButtonElement >( null );
	const mounted = useRef( true );
	useEffect(
		() => () => {
			mounted.current = false;
		},
		[]
	);

	const storedHost = account?.dns_host ?? null;
	let dnsHost: DnsHost | null = null;
	if ( fetchedHost?.domain === domain ) {
		dnsHost = fetchedHost;
	} else if ( storedHost?.domain === domain ) {
		dnsHost = storedHost;
	}

	// Detect once per domain; the server caches it, so later reads are cheap.
	useEffect( () => {
		if ( ! account || dnsHost ) {
			return;
		}
		setDetectFailed( false );
		let settled = false;
		const timer = setTimeout( () => {
			if ( ! settled && mounted.current ) {
				setDetectFailed( true );
			}
		}, DETECT_TIMEOUT );
		fetchDnsHost( !! storedHost )
			.then( host => {
				if ( ! mounted.current ) {
					return;
				}
				setFetchedHost( host );
				// Refresh the store so the rest of the page names the provider too.
				fetchStatus()
					.then( next => mounted.current && receiveStatus( next ) )
					.catch( () => undefined );
			} )
			.catch( () => mounted.current && setDetectFailed( true ) )
			.finally( () => {
				settled = true;
				clearTimeout( timer );
			} );
		return () => clearTimeout( timer );
		// Runs again only when the domain changes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ account?.domain ] );

	const picked = localPick ?? status.onboarding?.dns_provider ?? null;
	const detected = detectedProvider( dnsHost );
	const lowConfidence = !! dnsHost && dnsHost.confidence !== 'high';
	const detecting = !! account && ! dnsHost && ! detectFailed && ! picked;
	const mustPick = !! account && ! detecting && ! picked && ( ! detected || lowConfidence );
	const showPicker = pickerOpen || mustPick;

	const activeSlug = picked ?? ( lowConfidence ? null : detected );
	const known = isNamedProvider( activeSlug );
	const provider = getProvider( known ? activeSlug : OTHER_SLUG );
	const providerName = known ? provider.name : '';
	const unsure = picked === UNSURE_SLUG;

	const records = useMemo( () => displayRecords( status, dnsHost ), [ status, dnsHost ] );
	const rows = useMemo( () => {
		const byPurpose: Partial< Record< DnsPurpose, DnsLookupRecord > > = {};
		records.forEach( record => {
			const row = polling.lookup?.records.find( item => item.purpose === record.purpose );
			// Once the mail service has passed the records, an older lookup can't say they're missing.
			byPurpose[ record.purpose ] =
				verified && row?.state !== 'found'
					? {
							purpose: record.purpose,
							name: record.name,
							host: record.host ?? '',
							type: record.type,
							state: 'verified',
							expected: '',
						}
					: row;
		} );
		return byPurpose;
	}, [ records, polling.lookup, verified ] );
	const fixes = ( polling.lookup?.records ?? [] ).filter( row => row.state === 'needs_fix' );
	// Records that need a fix get one line between them; the live-domain check keeps its own notice.
	const recordFixes = fixes.filter( row =>
		records.some( record => record.purpose === row.purpose )
	);
	const domainFixes = fixes.filter( row => ! recordFixes.includes( row ) );
	const advice = fixAdvice( recordFixes, domain, providerName, false );
	const { found } = foundCount( polling.lookup, records.length );
	const shownFound = verified ? records.length : found;

	const mismatch = mismatchText( domain, detected, picked );
	useEffect( () => {
		if ( mismatch ) {
			speak( mismatch );
		}
	}, [ mismatch ] );

	// Unsure: someone else will have to add them, so the steps to send open straight away.
	useEffect( () => {
		if ( unsure ) {
			setDelegateOpen( true );
		}
	}, [ unsure ] );

	const cloudflareAvailable =
		activeSlug === 'cloudflare' && dnsHost?.cloudflare_api?.supported === true;
	const onDetectedHost = !! detected && activeSlug === detected;
	let autoKind: AutoKind | null = null;
	if ( onDetectedHost && dnsHost?.wpcom_dns?.supported === true ) {
		autoKind = 'wpcom';
	} else if ( onDetectedHost && dnsHost?.one_click?.supported === true ) {
		autoKind = 'oneclick';
	}
	const showAuto = !! autoKind && ! manual && ! verified;

	const openPicker = useCallback( () => {
		setPickerOpen( true );
		window.requestAnimationFrame( () => selectRef.current?.focus() );
	}, [] );
	const closePicker = useCallback( () => {
		setPickerOpen( false );
		window.requestAnimationFrame( () => notRightRef.current?.focus() );
	}, [] );
	const onPick = useCallback(
		( slug: ProviderSlug ) => {
			setLocalPick( slug );
			setManual( false );
			setAutoNotice( null );
			closePicker();
			saveOnboarding( { dns_provider: slug } )
				.then( next => {
					receiveStatus( next );
					// Offers like the Cloudflare one follow the pick, so read detection again.
					return fetchDnsHost();
				} )
				.then( host => mounted.current && setFetchedHost( host ) )
				.catch( () => undefined );
		},
		[ closePicker, receiveStatus ]
	);

	const openToken = useCallback( () => setTokenOpen( true ), [] );
	const closeToken = useCallback( () => {
		setTokenOpen( false );
		window.requestAnimationFrame( () =>
			letJetpackRef.current ? letJetpackRef.current.focus() : focusTaskCard( 'connect' )
		);
	}, [] );
	const { checkNow, nudge } = polling;
	const [ optionalNote, setOptionalNote ] = useState( '' );
	const onTokenApplied = useCallback(
		( result: CloudflareApplyResult ) => {
			setOptionalNote( optionalRecordNote( result ) );
			closeToken();
			checkNow();
		},
		[ closeToken, checkNow ]
	);
	const toggleDelegate = useCallback( () => setDelegateOpen( isOpen => ! isOpen ), [] );
	const onAutoManual = useCallback( ( notice?: string ) => {
		setAutoNotice( notice ?? null );
		setManual( true );
	}, [] );
	const turnOn = useCallback( () => run( 'settings', { enabled: true } ), [ run ] );

	const recordCount = records.length || 2;
	const titleDomain = headingDomain( status );
	let title: string;
	if ( ! account || detecting ) {
		// Nothing is known about the host yet, so the title doesn't guess and then flip; it only
		// gains "at {provider}" once that's known.
		title = sprintf(
			/* translators: %d: number of records. */
			_n( 'Add %d record', 'Add %d records', recordCount, 'jetpack-send-pkg' ),
			recordCount
		);
	} else if ( known ) {
		title = sprintf(
			/* translators: 1: number of records, 2: provider name, e.g. Cloudflare. */
			_n( 'Add %1$d record at %2$s', 'Add %1$d records at %2$s', recordCount, 'jetpack-send-pkg' ),
			recordCount,
			provider.name
		);
	} else if ( titleDomain ) {
		title = sprintf(
			/* translators: %s: domain name, e.g. example.com. */
			__( 'Connect %s', 'jetpack-send-pkg' ),
			titleDomain
		);
	} else {
		title = __( 'Connect your domain', 'jetpack-send-pkg' );
	}

	let headerEnd = null;
	if ( state === 'done' ) {
		headerEnd =
			records.length === 2
				? __( 'Both found', 'jetpack-send-pkg' )
				: __( 'All found', 'jetpack-send-pkg' );
	} else if ( detecting ) {
		headerEnd = <Spinner />;
	} else if ( state === 'needs_fix' ) {
		const badge = domainBadge( recordFixes.length ? 'mismatch' : 'not_live', recordFixes );
		headerEnd = <Badge intent={ badge.intent }>{ badge.label }</Badge>;
	} else if ( state === 'no_answer' ) {
		headerEnd = <Badge intent="informational">{ __( 'Checking', 'jetpack-send-pkg' ) }</Badge>;
	} else if ( account && ! mustPick ) {
		headerEnd = sprintf(
			/* translators: 1: records found so far, 2: records needed. */
			__( '%1$d of %2$d found', 'jetpack-send-pkg' ),
			shownFound,
			records.length
		);
	}

	let subtitle: ReactNode;
	if ( ! account ) {
		subtitle = __(
			'Two short records at your domain let Jetpack send for you.',
			'jetpack-send-pkg'
		);
	} else if ( detecting ) {
		subtitle = null;
	} else if ( state === 'done' ) {
		subtitle = known
			? sprintf(
					/* translators: %s: provider name, e.g. Cloudflare. */
					_n(
						'The record is in place at %s.',
						'Both records are in place at %s.',
						records.length,
						'jetpack-send-pkg'
					),
					provider.name
				)
			: _n(
					'The record is in place.',
					'Both records are in place.',
					records.length,
					'jetpack-send-pkg'
				);
	} else if ( known ) {
		subtitle = (
			<>
				{ sprintf(
					/* translators: 1: domain name, 2: provider name, e.g. Cloudflare. */
					__(
						'Paste these into the DNS page for %1$s at %2$s. We tick each one off as soon as we see it.',
						'jetpack-send-pkg'
					),
					domain,
					provider.name
				) }{ ' ' }
				<TextAction ref={ notRightRef } onClick={ openPicker } aria-expanded={ showPicker }>
					{ sprintf(
						/* translators: %s: provider name, e.g. Cloudflare. */
						__( 'Not %s?', 'jetpack-send-pkg' ),
						provider.name
					) }
				</TextAction>
			</>
		);
	} else {
		subtitle = (
			<>
				{ sprintf(
					/* translators: %s: domain name, e.g. example.com. */
					__(
						'Paste these where you change DNS settings for %s. We tick each one off as soon as we see it.',
						'jetpack-send-pkg'
					),
					domain
				) }
				{ ! mustPick && (
					<>
						{ ' ' }
						<TextAction ref={ notRightRef } onClick={ openPicker } aria-expanded={ showPicker }>
							{ __( 'Change where it’s managed', 'jetpack-send-pkg' ) }
						</TextAction>
					</>
				) }
			</>
		);
	}

	const remaining = Math.max( 0, records.length - found );
	const stalled = msSinceSetup( status, Date.now() ) > STALLED_AFTER_MS;
	// The server's watch gives up after a week; then nothing turns on until someone checks.
	const watchStopped = !! account && ! verified && ! status.next_check_at;
	const stoppedText = __(
		'We’ve stopped checking automatically. Check now when they’re in.',
		'jetpack-send-pkg'
	);
	let leave: string = status.settings.auto_enable
		? sprintf(
				/* translators: %s: email address the automatic test goes to. */
				__(
					'You can leave: sending turns on by itself and we’ll send a test to %s.',
					'jetpack-send-pkg'
				),
				status.onboarding.test_to || testRecipient( status )
			)
		: __( 'You can leave this page. We’ll show it here when both are found.', 'jetpack-send-pkg' );
	if ( watchStopped ) {
		leave = stoppedText;
	}
	let lead: string;
	let detail: string;
	if ( recordFixes.length ) {
		// The records are there but need a change, so nothing turns on until it's made.
		lead = _n(
			'Waiting for your change',
			'Waiting for your changes',
			remaining,
			'jetpack-send-pkg'
		);
		if ( watchStopped ) {
			detail = __(
				'We’ve stopped checking automatically. Check now once you’ve made the change.',
				'jetpack-send-pkg'
			);
		} else {
			detail = status.settings.auto_enable
				? __(
						'We keep checking. Sending turns on by itself once both records are right.',
						'jetpack-send-pkg'
					)
				: __(
						'We keep checking and will show it here once both records are right.',
						'jetpack-send-pkg'
					);
		}
	} else if ( domainFixes.length && ! recordFixes.length && records.length && remaining === 0 ) {
		// The records are in; only the domain is holding things up, and the badge already says so.
		lead = __( 'Checking every few minutes', 'jetpack-send-pkg' );
		detail = leave;
	} else if ( stalled ) {
		lead = sprintf(
			/* translators: %s: domain name, e.g. example.com. */
			__( 'Still waiting on %s', 'jetpack-send-pkg' ),
			domain
		);
		detail = `${ __(
			'Most hosts are done by now, so check the records match exactly.',
			'jetpack-send-pkg'
		) } ${ leave }`;
	} else if ( records.length && remaining === 0 ) {
		lead = __( 'Both records found', 'jetpack-send-pkg' );
		detail = `${ __( 'Finishing the last check. This is usually quick.', 'jetpack-send-pkg' ) } ${ leave }`;
	} else {
		lead = sprintf(
			/* translators: %d: number of records not found yet. */
			_n(
				'Still looking for %d record',
				'Still looking for %d records',
				remaining,
				'jetpack-send-pkg'
			),
			remaining
		);
		detail = `${ __( 'Usually a few minutes, sometimes hours.', 'jetpack-send-pkg' ) } ${ leave }`;
	}

	// When the records' notice already says to turn the proxy off, the tip doesn't say it again.
	const proxyFix = recordFixes.some( row => row.problem === 'proxied' );
	const tip = known ? providerTip( provider, records, proxyFix ) : '';
	const pageUrl = known ? providerPageUrl( provider, domain ) : null;
	const notEditable = !! dnsHost && ! dnsHost.editable;
	const clue = mustPick ? pointsToClue( dnsHost ) : '';
	const turnOnNeeded = verified && ! status.settings.enabled;

	return (
		<TaskCard
			id="connect"
			state={ state }
			title={ title }
			headerEnd={ headerEnd }
			subtitle={ subtitle }
			open={ open }
			onOpenChange={ onOpenChange }
		>
			{ ! account && (
				<Text variant="body-lg" render={ <p /> } className="jetpack-send-setup__hint">
					{ __( 'Available once you choose who your emails come from.', 'jetpack-send-pkg' ) }
				</Text>
			) }

			{ detecting && (
				<Stack direction="column" gap="md" className="jetpack-send-setup__body">
					<Text variant="body-md" role="status" className="jetpack-send-setup__weak">
						{ sprintf(
							/* translators: %s: domain name, e.g. example.com. */
							__( 'Finding where %s is managed…', 'jetpack-send-pkg' ),
							domain
						) }
					</Text>
					<Skeleton className="jetpack-send-setup__skeleton" />
					<Skeleton className="jetpack-send-setup__skeleton" />
				</Stack>
			) }

			{ account && ! detecting && (
				<Stack direction="column" gap="lg" className="jetpack-send-setup__body">
					{ notEditable && (
						<Notice.Root intent="warning">
							<Notice.Description>
								{ sprintf(
									/* translators: %s: domain name, e.g. example.com. */
									__(
										'%s is a temporary address, so it can’t hold these records. Change the domain in the first step.',
										'jetpack-send-pkg'
									),
									domain
								) }
							</Notice.Description>
						</Notice.Root>
					) }

					{ showPicker && ! verified && (
						<Stack direction="column" gap="sm">
							<ProviderSelect
								domain={ domain }
								dnsHost={ dnsHost }
								// A low-confidence guess stays a hint ("Detected"), not a choice nothing has applied.
								value={ picked ?? ( mustPick ? null : activeSlug ) }
								onChange={ onPick }
								inputRef={ selectRef }
							/>
							{ clue && (
								<Text variant="body-md" className="jetpack-send-setup__weak">
									{ clue }
								</Text>
							) }
							{ pickerOpen && ! mustPick && (
								<div>
									<Button variant="minimal" tone="neutral" onClick={ closePicker }>
										{ __( 'Cancel', 'jetpack-send-pkg' ) }
									</Button>
								</div>
							) }
						</Stack>
					) }

					{ mismatch && ! verified && (
						<Notice.Root intent="warning">
							<Notice.Description>{ mismatch }</Notice.Description>
						</Notice.Root>
					) }

					<RecordRows
						records={ records }
						provider={ provider }
						rows={ rows }
						onCopy={ nudge }
						notes={ verified ? undefined : advice.notes }
					/>

					{ tip && ! verified && (
						<Text variant="body-md" render={ <p /> }>
							{ tip }
						</Text>
					) }

					{ /* One notice for the records, said once even when both need the same fix. */ }
					{ /* The row badges say which record; this says what to do, once, in the badges' tone. */ }
					{ ! verified && advice.summary && (
						<Notice.Root intent="warning">
							<Notice.Description>{ advice.summary }</Notice.Description>
						</Notice.Root>
					) }
					{ /* The header badge names it; this says what that means, once. */ }
					{ ! verified && domainFixes.length > 0 && (
						<Notice.Root intent="error">
							<Notice.Description>
								{ sprintf(
									/* translators: %s: domain name, e.g. example.com. */
									__( '%s isn’t pointing at a website or mailbox yet.', 'jetpack-send-pkg' ),
									domain
								) }
							</Notice.Description>
						</Notice.Root>
					) }

					{ state === 'no_answer' && (
						<Notice.Root intent="info">
							<Notice.Description>
								{ sprintf(
									/* translators: %s: domain name, e.g. example.com. */
									__( 'We can’t reach %s’s DNS right now. We’ll keep trying.', 'jetpack-send-pkg' ),
									domain
								) }
							</Notice.Description>
						</Notice.Root>
					) }

					{ polling.error && ! verified && (
						<Notice.Root intent="info">
							<Notice.Description>
								{ __( 'We couldn’t check just now. We’ll try again shortly.', 'jetpack-send-pkg' ) }
							</Notice.Description>
						</Notice.Root>
					) }

					{ autoNotice && (
						<Notice.Root intent="warning">
							<Notice.Description>{ autoNotice }</Notice.Description>
						</Notice.Root>
					) }

					{ optionalNote && (
						<Notice.Root intent="info">
							<Notice.Description>{ optionalNote }</Notice.Description>
						</Notice.Root>
					) }

					{ ! verified && showAuto && autoKind && (
						<AutoAddPanel
							kind={ autoKind }
							providerName={ provider.name }
							verified={ verified }
							onStatus={ receiveStatus }
							onNudge={ nudge }
							onManual={ onAutoManual }
						/>
					) }

					{ ! verified && ! showAuto && tokenOpen && (
						<CloudflareConnect
							domain={ domain }
							onApplied={ onTokenApplied }
							onCancel={ closeToken }
						/>
					) }

					{ ! verified && ! showAuto && ! tokenOpen && ( pageUrl || cloudflareAvailable ) && (
						<Stack direction="row" align="center" gap="sm" wrap="wrap">
							{ pageUrl && (
								<ButtonLink variant="solid" href={ pageUrl } openInNewTab>
									{ sprintf(
										/* translators: %s: provider name, e.g. Cloudflare. */
										__( 'Open %s', 'jetpack-send-pkg' ),
										provider.name
									) }
								</ButtonLink>
							) }
							{ cloudflareAvailable && (
								<Button
									ref={ letJetpackRef }
									variant="outline"
									tone="neutral"
									onClick={ openToken }
								>
									{ __( 'Let Jetpack add them', 'jetpack-send-pkg' ) }
								</Button>
							) }
						</Stack>
					) }

					{ ! verified && (
						<Stack direction="column" gap="md">
							<Text variant="body-lg" render={ <div /> }>
								<TextAction onClick={ toggleDelegate } aria-expanded={ delegateOpen }>
									{ __( 'Send these steps to someone', 'jetpack-send-pkg' ) }
								</TextAction>
							</Text>
							{ delegateOpen && (
								<Delegate domain={ domain } provider={ provider } records={ records } />
							) }
						</Stack>
					) }

					{ turnOnNeeded && (
						<Stack direction="column" gap="sm">
							<Text variant="body-lg" render={ <p /> }>
								{ __(
									'Both records are in. Turn sending on when you are ready.',
									'jetpack-send-pkg'
								) }
							</Text>
							{ actionError && (
								<Notice.Root intent="error">
									<Notice.Description>{ actionError }</Notice.Description>
								</Notice.Root>
							) }
							<div>
								<Button
									variant="solid"
									onClick={ turnOn }
									loading={ actionBusy === 'settings' }
									loadingAnnouncement={ __( 'Turning sending on…', 'jetpack-send-pkg' ) }
								>
									{ __( 'Turn sending on', 'jetpack-send-pkg' ) }
								</Button>
							</div>
						</Stack>
					) }

					{ ! verified && (
						<WaitingNote
							lead={ lead }
							detail={ detail }
							lastCheckedAt={ polling.lastCheckedAt }
							checking={ polling.checking }
							onCheckNow={ checkNow }
						/>
					) }
				</Stack>
			) }
		</TaskCard>
	);
};

export default ConnectTask;
