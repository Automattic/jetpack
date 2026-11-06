import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { dateI18n, humanTimeDiff } from '@wordpress/date';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, caution, check, closeSmall, info } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { Badge, Button, Text } from '@wordpress/ui';
import { CardRow, ProtectCard, SettingsErrorRow, UnavailableCard } from '../../components/card';
import { getIpList, splitIps } from '../../components/settings/ip-list';
import TabLink from '../../components/tab-link';
import useRerenderEvery from '../../components/use-rerender-every';
import isModuleActive from '../../data/is-module-active';
import { createStore, useIsDocumentHidden } from '../scan/store';
import BlocksSummary from './blocks-summary';
import { FirewallFooter, NoBlockListState, NoBlocksState, UPSELL_EVENT } from './empty-state';
import {
	CrossOriginError,
	FIREWALL_PATH,
	SELF_CHECK_RULE_ID,
	TimeoutError,
	runFirewallTest,
} from './firewall-test';
import FirewallToggle from './firewall-toggle';
import HostFirewallCard from './host-firewall-card';
import shieldFlame from './icon';
import { IpListDialog } from './ip-list-dialog';
import NothingToBlockNotice from './nothing-to-block-notice';
import { AUTOMATIC_RULES, IP_BLOCK_LIST, enabledKey } from './settings-keys';
import TestDetails from './test-details';
import UpgradeGap from './upgrade-gap';
import type { TestOutcome, TestResult } from './firewall-test';
import type { FirewallBlocks, FirewallContext, FirewallState } from './types';
import type { JSX } from 'react';
import './style.scss';

const UNAVAILABLE: FirewallState = {
	available: false,
	active: false,
	blockedCount: null,
	blockedLast30Days: null,
	recentBlocks: [],
	hasBlocked: false,
	lastTestAt: null,
	hasScan: false,
	upgradeUrl: '',
	currentIp: '',
	ipRules: {},
	rulesUpdatedAt: null,
	providedByHost: false,
};

// The only setting this card saves.
const FIREWALL_KEYS = [ 'waf' ];

// The card unmounts on a tab switch, so a test's refreshed counts live here.
const blocksStore = createStore< FirewallBlocks | undefined >( () => undefined );

// How often an open page re-reads the counts.
export const BLOCKS_REFRESH_INTERVAL = 60 * 1000;

// Reads land in start order, so an older answer can't replace a newer one.
let readsStarted = 0;
let readApplied = 0;
let lastReadAt = Date.now();
// Outlives the card, so coming back to this tab doesn't count as turning the firewall on.
let lastSeenActive: boolean | null = null;

/** Forget refreshed counts, so tests start from the page state. */
export const resetFirewallBlocks = (): void => {
	blocksStore.reset();
	readsStarted = 0;
	readApplied = 0;
	lastReadAt = Date.now();
	lastSeenActive = null;
};

/**
 * Read the blocks and counts into the store, unless a later read already landed.
 *
 * @return The fresh blocks.
 */
async function refreshBlocks(): Promise< FirewallBlocks > {
	const read = ++readsStarted;
	const fresh = await apiFetch< FirewallBlocks >( { path: `${ FIREWALL_PATH }/blocks` } );
	if ( read > readApplied ) {
		readApplied = read;
		lastReadAt = Date.now();
		blocksStore.set( () => fresh );
	}
	return fresh;
}

/** Refresh in the background; a failed read keeps the counts as they were. */
const refreshQuietly = () => {
	refreshBlocks().catch( () => {} );
};

/**
 * Keep the counts current while the firewall is on: on an interval, when they're older than that, and when it's turned on.
 *
 * @param active       - Whether the firewall is on now.
 * @param activeAtLoad - Whether it was on at page load, so turning it on from the Settings tab counts too.
 */
function useBlocksRefresh( active: boolean, activeAtLoad: boolean ): void {
	const isHidden = useIsDocumentHidden();

	useEffect( () => {
		const turnedOn = active && ! ( lastSeenActive ?? activeAtLoad );
		lastSeenActive = active;
		if ( ! active || isHidden ) {
			return;
		}
		// Covers a return to the browser tab or to this dashboard tab, which remounts the card.
		if ( turnedOn || Date.now() - lastReadAt >= BLOCKS_REFRESH_INTERVAL ) {
			refreshQuietly();
		}
		const timer = setInterval( refreshQuietly, BLOCKS_REFRESH_INTERVAL );
		return () => clearInterval( timer );
	}, [ active, isHidden, activeAtLoad ] );
}

// One id for the test's snackbars, so the result replaces "Testing the firewall…".
const NOTICE_ID = 'jetpack-protect-firewall-test';

/** Opens the Settings tab at this section's card. */
const SETTINGS_PARAMS = { section: 'firewall' };

type NoticeStatus = 'success' | 'info' | 'warning' | 'error';

// Icon SVGs default to black; currentColor picks up the snackbar's light text.
const snackbarIcon = ( icon: JSX.Element ) => <Icon icon={ icon } fill="currentColor" />;

const OUTCOMES: Record<
	TestOutcome | 'testing' | 'cross-origin' | 'timed-out' | 'error',
	{ status: NoticeStatus; message: () => string; icon?: JSX.Element }
> = {
	testing: {
		status: 'info',
		message: () => __( 'Testing the firewall…', 'jetpack-protect-pkg' ),
	},
	blocked: {
		status: 'success',
		icon: snackbarIcon( check ),
		message: () =>
			__( 'The firewall blocked the test request. It’s working.', 'jetpack-protect-pkg' ),
	},
	'blocked-while-off': {
		status: 'warning',
		icon: snackbarIcon( caution ),
		message: () =>
			__(
				'The firewall is off, but it still blocked the test request. Your server may still be loading it.',
				'jetpack-protect-pkg'
			),
	},
	silent: {
		status: 'warning',
		icon: snackbarIcon( caution ),
		message: () =>
			__(
				'The firewall caught the test request but let it through, because it’s only logging requests.',
				'jetpack-protect-pkg'
			),
	},
	allowed: {
		status: 'info',
		icon: snackbarIcon( info ),
		message: () =>
			__(
				'The test request got through, because your IP address is on the always-allowed list.',
				'jetpack-protect-pkg'
			),
	},
	'not-blocked': {
		status: 'error',
		icon: snackbarIcon( closeSmall ),
		message: () =>
			__(
				'The test request wasn’t blocked. The firewall may not be running on this site.',
				'jetpack-protect-pkg'
			),
	},
	off: {
		status: 'info',
		icon: snackbarIcon( info ),
		message: () =>
			__(
				'The test request got through, because the firewall is off. Turn it on and test again to see it blocked.',
				'jetpack-protect-pkg'
			),
	},
	'cross-origin': {
		status: 'error',
		icon: snackbarIcon( closeSmall ),
		message: () =>
			__(
				'The firewall can’t be tested from here, because your site and this dashboard are on different addresses.',
				'jetpack-protect-pkg'
			),
	},
	'timed-out': {
		status: 'error',
		icon: snackbarIcon( closeSmall ),
		message: () =>
			__(
				'The firewall test timed out, because your site took too long to respond. Try again.',
				'jetpack-protect-pkg'
			),
	},
	error: {
		status: 'error',
		icon: snackbarIcon( closeSmall ),
		message: () => __( 'The firewall test couldn’t run. Try again.', 'jetpack-protect-pkg' ),
	},
};

/**
 * Show the firewall test's progress or result as a snackbar.
 *
 * @param outcome           - Which message to show.
 * @param options           - Optional extras.
 * @param options.learnMore - Opens the test's steps; the result has it, progress doesn't.
 * @param options.message   - Replaces the outcome's own message.
 */
function notify(
	outcome: keyof typeof OUTCOMES,
	{ learnMore, message: custom }: { learnMore?: () => void; message?: string } = {}
) {
	const { status, message, icon } = OUTCOMES[ outcome ];
	dispatch( noticesStore ).createNotice( status, custom || message(), {
		type: 'snackbar',
		id: NOTICE_ID,
		// @ts-expect-error -- Typed as a string, but the snackbar renders any element.
		icon,
		// Results stay until dismissed, so there's time to read them and open Learn more.
		explicitDismiss: status !== 'info' || !! learnMore,
		actions: learnMore
			? [ { label: __( 'Learn more', 'jetpack-protect-pkg' ), onClick: learnMore } ]
			: [],
	} );
}

/**
 * Report a test that couldn't run.
 *
 * @param error - What `runFirewallTest()` threw.
 */
function notifyFailure( error: unknown ) {
	if ( error instanceof CrossOriginError ) {
		notify( 'cross-origin' );
	} else if ( error instanceof TimeoutError ) {
		notify( 'timed-out' );
	} else {
		// A REST error says why; a failed connection only has api-fetch's generic text.
		const { code, message } = ( error ?? {} ) as { code?: string; message?: string };
		notify( 'error', { message: code && code !== 'fetch_error' ? message : undefined } );
	}
}

/**
 * The firewall's Overview card: blocked requests, and a test that shows the firewall working.
 *
 * @param props          - The dashboard context.
 * @param props.state    - The firewall's state from page load.
 * @param props.settings - Jetpack settings, for the live on/off state.
 * @param props.openTab  - Switches dashboard tabs, for the link to Settings.
 * @return The card.
 */
export default function FirewallOverviewCard( { state, settings, openTab }: FirewallContext ) {
	const firewall = state ?? UNAVAILABLE;
	const title = __( 'Firewall', 'jetpack-protect-pkg' );
	const refreshed = useSyncExternalStore( blocksStore.subscribe, blocksStore.get );
	const blocks = useMemo< FirewallBlocks >(
		() =>
			refreshed ?? {
				blockedCount: firewall.blockedCount,
				blockedLast30Days: firewall.blockedLast30Days,
				recentBlocks: firewall.recentBlocks,
				hasBlocked: firewall.hasBlocked,
				lastTestAt: firewall.lastTestAt,
			},
		[ refreshed, firewall ]
	);
	const [ blockListOpen, setBlockListOpen ] = useState( false );
	// Only the calls to action turn the list on when saving; Edit block list leaves it on or off.
	const [ enableBlockList, setEnableBlockList ] = useState( false );
	// A save can swap out the button that opened the dialog; focus then goes to the footer's link.
	const blockListOpener = useRef< Element | null >( null );
	const editBlockListLink = useRef< HTMLButtonElement >( null );
	const openBlockList = useCallback( ( opener: Element | null, enable: boolean ) => {
		blockListOpener.current = opener;
		setEnableBlockList( enable );
		setBlockListOpen( true );
	}, [] );
	const editBlockList = useCallback(
		( event?: { currentTarget: Element } ) => openBlockList( event?.currentTarget ?? null, false ),
		[ openBlockList ]
	);
	const addToBlockList = useCallback(
		( event?: { currentTarget: Element } ) => openBlockList( event?.currentTarget ?? null, true ),
		[ openBlockList ]
	);
	const blockListFinalFocus = useCallback(
		() => blockListOpener.current?.isConnected || ( editBlockListLink.current ?? true ),
		[]
	);
	const [ isTesting, setIsTesting ] = useState( false );
	const [ result, setResult ] = useState< TestResult | null >( null );
	const [ recorded, setRecorded ] = useState< boolean | null >( null );
	const [ detailsOpen, setDetailsOpen ] = useState( false );
	const active = isModuleActive( settings.settings, 'waf', firewall.active );
	useBlocksRefresh( active && firewall.available && ! firewall.providedByHost, firewall.active );
	// Turning the automatic rules off on the Settings tab hides their date; the date itself is from page load.
	const rulesUpdatedAt =
		settings.settings?.[ AUTOMATIC_RULES ] === false ? null : firewall.rulesUpdatedAt;
	// Settings load on the Settings tab; until then the IP lists come from page load.
	const ipData = useMemo(
		() => ( { ...settings, settings: { ...firewall.ipRules, ...settings.settings } } ),
		[ settings, firewall.ipRules ]
	);

	// "Learn more" opens this card's dialog, so the snackbar can't outlive the card, nor can a test it started.
	const isMounted = useRef( false );
	useEffect( () => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
			dispatch( noticesStore ).removeNotice( NOTICE_ID );
		};
	}, [] );

	const runTest = useCallback( async () => {
		setIsTesting( true );
		notify( 'testing' );
		const lastId = blocks.recentBlocks[ 0 ]?.id ?? 0;
		let testResult: TestResult;
		try {
			testResult = await runFirewallTest( active );
		} catch ( e ) {
			if ( isMounted.current ) {
				notifyFailure( e );
				setIsTesting( false );
			}
			return;
		}

		// The test has run by now, so a failed refresh mustn't replace its result with an error.
		let isRecorded: boolean | null = null;
		try {
			const fresh = await refreshBlocks();
			isRecorded = fresh.recentBlocks.some(
				block => block.id > lastId && block.ruleId === SELF_CHECK_RULE_ID
			);
		} catch {
			// The counts stay as they were.
		}
		if ( ! isMounted.current ) {
			return;
		}
		setResult( testResult );
		setRecorded( isRecorded );
		notify( testResult.outcome, { learnMore: () => setDetailsOpen( true ) } );
		setIsTesting( false );
	}, [ active, blocks.recentBlocks ] );

	// The server leaves the firewall's own tests out of whether it has blocked anything.
	const hasBlocks = Boolean( blocks.hasBlocked );
	const { lastTestAt } = blocks;
	const isEmpty = active && ! hasBlocks;

	// A read that swaps the empty state for the counts takes focus from it to the header's Run test, unless focus moved on.
	const emptyState = useRef< HTMLDivElement >( null );
	const headerTest = useRef< HTMLButtonElement >( null );
	const focusHeaderTest = useRef( false );
	const wasEmpty = useRef( isEmpty );
	if ( wasEmpty.current !== isEmpty ) {
		// Read focus now, before the commit removes the empty state.
		const empty = emptyState.current;
		focusHeaderTest.current = ! isEmpty && !! empty?.contains( empty.ownerDocument.activeElement );
		wasEmpty.current = isEmpty;
	}
	useEffect( () => {
		const button = headerTest.current;
		if ( ! focusHeaderTest.current || ! button ) {
			return;
		}
		focusHeaderTest.current = false;
		const { activeElement, body } = button.ownerDocument;
		if ( ! activeElement || activeElement === body ) {
			button.focus();
		}
	}, [ isEmpty ] );
	const hasBlockListIps = splitIps( getIpList( ipData.settings, IP_BLOCK_LIST ) ).length > 0;
	const isBlockListOff = hasBlockListIps && ! ipData.settings?.[ enabledKey( IP_BLOCK_LIST ) ];
	const needsBlockList = ! firewall.hasScan && ( ! hasBlockListIps || isBlockListOff );
	// Without automatic rules either, nothing more can be blocked.
	const hasNoRules = needsBlockList && rulesUpdatedAt === null;
	const isFreeEmptyState = isEmpty && hasNoRules;
	const hasNothingToBlock = active && hasBlocks && hasNoRules;
	const showStaleRules = ! firewall.hasScan && rulesUpdatedAt !== null;
	useRerenderEvery( 30000, !! lastTestAt );

	if ( firewall.providedByHost ) {
		return <HostFirewallCard />;
	}

	if ( ! firewall.available ) {
		return <UnavailableCard icon={ shieldFlame } title={ title } />;
	}

	const settingsLink = (
		<TabLink tab="settings" params={ SETTINGS_PARAMS } onOpen={ openTab }>
			{ __( 'Configure Firewall', 'jetpack-protect-pkg' ) }
		</TabLink>
	);

	return (
		<ProtectCard
			icon={ shieldFlame }
			title={ title }
			description={ __(
				'Malicious requests blocked before they reach your site.',
				'jetpack-protect-pkg'
			) }
			titleAside={
				lastTestAt && (
					<time dateTime={ lastTestAt } title={ dateI18n( 'M j, Y g:i A', lastTestAt, undefined ) }>
						<Badge intent="draft">
							{ sprintf(
								/* translators: %s is how long ago, such as "1 hour ago". */
								__( 'Latest test ran %s', 'jetpack-protect-pkg' ),
								humanTimeDiff( lastTestAt )
							) }
						</Badge>
					</time>
				)
			}
			actions={
				hasBlocks && (
					<Button
						ref={ headerTest }
						variant="outline"
						size="compact"
						onClick={ runTest }
						loading={ isTesting }
					>
						{ __( 'Run test', 'jetpack-protect-pkg' ) }
					</Button>
				)
			}
		>
			{ result && (
				<TestDetails
					result={ result }
					recorded={ recorded }
					open={ detailsOpen }
					onOpenChange={ setDetailsOpen }
				/>
			) }
			<SettingsErrorRow settings={ settings } keys={ FIREWALL_KEYS } />
			{ ! active && (
				<CardRow>
					<FirewallToggle data={ settings } />
				</CardRow>
			) }
			{ isFreeEmptyState && (
				<NoBlockListState
					rootRef={ emptyState }
					upgradeUrl={ firewall.upgradeUrl }
					onAddIps={ addToBlockList }
					isListOff={ isBlockListOff }
				/>
			) }
			{ isEmpty && ! isFreeEmptyState && (
				<NoBlocksState
					rootRef={ emptyState }
					lastTestAt={ lastTestAt }
					isTesting={ isTesting }
					onTest={ runTest }
				/>
			) }
			{ hasNothingToBlock && (
				<NothingToBlockNotice
					upgradeUrl={ firewall.upgradeUrl }
					onAddIps={ addToBlockList }
					isListOff={ isBlockListOff }
				/>
			) }
			{ active && hasBlocks && <BlocksSummary blocks={ blocks } /> }
			{ active && (
				<FirewallFooter
					data={ ipData }
					currentIp={ firewall.currentIp }
					onEditBlockList={ isFreeEmptyState ? undefined : editBlockList }
					editBlockListRef={ editBlockListLink }
					settingsLink={ settingsLink }
					aside={
						hasBlocks &&
						rulesUpdatedAt !== null && (
							<Text variant="body-sm" className="jp-protect-card__muted">
								{ sprintf(
									/* translators: %s is a date, such as "Mar 14, 2026". */
									__( 'Rules updated %s', 'jetpack-protect-pkg' ),
									dateI18n( 'M j, Y', rulesUpdatedAt * 1000, undefined )
								) }
							</Text>
						)
					}
				/>
			) }
			{ active && (
				// Kept outside the states that open it, so a save that changes the state can't unmount it.
				<IpListDialog
					data={ ipData }
					name={ IP_BLOCK_LIST }
					dialogTitle={ __( 'Blocked IP addresses', 'jetpack-protect-pkg' ) }
					open={ blockListOpen }
					onOpenChange={ setBlockListOpen }
					finalFocus={ blockListFinalFocus }
					enableOnSave={ enableBlockList }
				/>
			) }
			{ showStaleRules && (
				<UpgradeGap
					title={ __(
						'Your automatic firewall rules have stopped updating',
						'jetpack-protect-pkg'
					) }
					description={ sprintf(
						/* translators: %s is a date, such as "Mar 14, 2026". */
						__(
							'Your rules were last updated on %s. Attacks on WordPress plugins discovered since then can get through. Upgrade to get a new rule as soon as an attack is found.',
							'jetpack-protect-pkg'
						),
						dateI18n( 'M j, Y', rulesUpdatedAt * 1000, undefined )
					) }
					url={ firewall.upgradeUrl }
					event={ UPSELL_EVENT }
					eventProps={ { state: 'stopped' } }
				/>
			) }
		</ProtectCard>
	);
}
