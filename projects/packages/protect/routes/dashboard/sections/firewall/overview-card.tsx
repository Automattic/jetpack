import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { dateI18n } from '@wordpress/date';
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
import { Button, EmptyState, Stack, Text } from '@wordpress/ui';
import {
	CardRow,
	ProtectCard,
	SettingsErrorRow,
	Stat,
	UnavailableCard,
} from '../../components/card';
import formatNumber from '../../components/format-number';
import TabLink from '../../components/tab-link';
import isModuleActive from '../../data/is-module-active';
import { createStore, useIsDocumentHidden } from '../scan/store';
import {
	CrossOriginError,
	FIREWALL_PATH,
	SELF_CHECK_RULE_ID,
	TimeoutError,
	runFirewallTest,
} from './firewall-test';
import FirewallToggle from './firewall-toggle';
import FirewallUpsell from './firewall-upsell';
import HostFirewallCard from './host-firewall-card';
import shieldFlame from './icon';
import IpRule from './ip-rule';
import RecentBlocks from './recent-blocks';
import { AUTOMATIC_RULES, IP_ALLOW_LIST, IP_BLOCK_LIST } from './settings-keys';
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
	blockedToday: null,
	blockedLast30Days: null,
	recentBlocks: [],
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

/** Forget refreshed counts, so tests start from the page state. */
export const resetFirewallBlocks = (): void => {
	blocksStore.reset();
	readsStarted = 0;
	readApplied = 0;
	lastReadAt = Date.now();
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
	const wasActive = useRef( activeAtLoad );

	useEffect( () => {
		const turnedOn = active && ! wasActive.current;
		wasActive.current = active;
		if ( ! active || isHidden ) {
			return;
		}
		// Covers a return to the browser tab or to this dashboard tab, which remounts the card.
		if ( turnedOn || Date.now() - lastReadAt >= BLOCKS_REFRESH_INTERVAL ) {
			refreshQuietly();
		}
		const timer = setInterval( refreshQuietly, BLOCKS_REFRESH_INTERVAL );
		return () => clearInterval( timer );
	}, [ active, isHidden ] );
}

const hasAnyBlocks = ( { blockedCount, recentBlocks }: FirewallBlocks ) =>
	( blockedCount ?? recentBlocks.length ) > 0;

const formatCount = ( count?: number | null ) =>
	typeof count === 'number' ? formatNumber( count ) : '—';

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
				blockedToday: firewall.blockedToday,
				blockedLast30Days: firewall.blockedLast30Days,
				recentBlocks: firewall.recentBlocks,
			},
		[ refreshed, firewall ]
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

	const hasBlocks = hasAnyBlocks( blocks );
	const isEmpty = active && ! hasBlocks;

	// A test from the empty state that logs a block swaps its Run test for the header's; focus follows, unless it moved on.
	const emptyState = useRef< HTMLDivElement >( null );
	const headerTest = useRef< HTMLButtonElement >( null );
	const focusHeaderTest = useRef( false );
	useEffect( () => {
		const button = headerTest.current;
		if ( ! isEmpty && focusHeaderTest.current && button ) {
			focusHeaderTest.current = false;
			const { activeElement, body } = button.ownerDocument;
			if ( ! activeElement || activeElement === body ) {
				button.focus();
			}
		}
	}, [ isEmpty ] );

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
		const empty = emptyState.current;
		const fromEmptyState = !! empty?.contains( empty.ownerDocument.activeElement );
		notify( 'testing' );
		// Set before any read lands, as a background read can also swap the empty state for the counts.
		focusHeaderTest.current = fromEmptyState;
		const lastId = blocks.recentBlocks[ 0 ]?.id ?? 0;
		let testResult: TestResult;
		try {
			testResult = await runFirewallTest( active );
		} catch ( e ) {
			focusHeaderTest.current = false;
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
			if ( ! hasAnyBlocks( fresh ) ) {
				focusHeaderTest.current = false;
			}
			isRecorded = fresh.recentBlocks.some(
				block => block.id > lastId && block.ruleId === SELF_CHECK_RULE_ID
			);
		} catch {
			// The counts stay as they were.
			focusHeaderTest.current = false;
		}
		if ( ! isMounted.current ) {
			return;
		}
		setResult( testResult );
		setRecorded( isRecorded );
		notify( testResult.outcome, { learnMore: () => setDetailsOpen( true ) } );
		setIsTesting( false );
	}, [ active, blocks.recentBlocks ] );

	if ( firewall.providedByHost ) {
		return <HostFirewallCard />;
	}

	if ( ! firewall.available ) {
		return <UnavailableCard icon={ shieldFlame } title={ title } />;
	}

	const runTestLabel = __( 'Run test', 'jetpack-protect-pkg' );

	return (
		<ProtectCard
			icon={ shieldFlame }
			title={ title }
			description={ __(
				'Blocks malicious requests before they reach your site.',
				'jetpack-protect-pkg'
			) }
			actions={
				! isEmpty && (
					<Button ref={ headerTest } size="compact" onClick={ runTest } loading={ isTesting }>
						{ runTestLabel }
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
			{ active && hasBlocks && (
				<CardRow>
					<Stack direction="column" gap="lg" align="start">
						<Stat
							label={ __( 'Blocked in the last 30 days', 'jetpack-protect-pkg' ) }
							value={ formatCount( blocks.blockedLast30Days ) }
						/>
						<RecentBlocks blocks={ blocks.recentBlocks } />
					</Stack>
				</CardRow>
			) }
			{ isEmpty && (
				<CardRow className="jp-protect-firewall-overview__empty">
					<EmptyState.Root ref={ emptyState }>
						<EmptyState.Visual>
							<Icon icon={ check } size={ 48 } className="jp-protect-firewall-overview__check" />
						</EmptyState.Visual>
						<Text variant="heading-xl" render={ <h3 /> } className="jp-protect-card__title">
							{ __( 'No requests blocked yet', 'jetpack-protect-pkg' ) }
						</Text>
						<EmptyState.Description>
							{ __(
								'Get started by testing your firewall and start blocking requests from suspicious IPs.',
								'jetpack-protect-pkg'
							) }
						</EmptyState.Description>
						<EmptyState.Actions>
							<Button size="compact" onClick={ runTest } loading={ isTesting }>
								{ runTestLabel }
							</Button>
						</EmptyState.Actions>
					</EmptyState.Root>
				</CardRow>
			) }
			{ ! firewall.hasScan && rulesUpdatedAt === null && (
				<FirewallUpsell url={ firewall.upgradeUrl } />
			) }
			{ ! firewall.hasScan && rulesUpdatedAt !== null && (
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
					event="jetpack_protect_dashboard_firewall_upsell"
					eventProps={ { state: 'stopped' } }
				/>
			) }
			{ active && (
				<CardRow className="jp-protect-firewall-overview__links">
					<IpRule
						data={ ipData }
						name={ IP_BLOCK_LIST }
						editLabel={ __( 'Edit block list', 'jetpack-protect-pkg' ) }
						dialogTitle={ __( 'Blocked IP addresses', 'jetpack-protect-pkg' ) }
					/>
					<IpRule
						data={ ipData }
						name={ IP_ALLOW_LIST }
						editLabel={ __( 'Edit allow list', 'jetpack-protect-pkg' ) }
						dialogTitle={ __( 'Always allowed IP addresses', 'jetpack-protect-pkg' ) }
						currentIp={ firewall.currentIp }
					/>
					<TabLink tab="settings" params={ SETTINGS_PARAMS } onOpen={ openTab }>
						{ __( 'Configure Firewall', 'jetpack-protect-pkg' ) }
					</TabLink>
				</CardRow>
			) }
		</ProtectCard>
	);
}
