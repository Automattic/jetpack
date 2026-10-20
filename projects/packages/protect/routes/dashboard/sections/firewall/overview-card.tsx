import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, caution, check, closeSmall, info, shield } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { Button, Stack } from '@wordpress/ui';
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
import {
	CrossOriginError,
	FIREWALL_PATH,
	SELF_CHECK_RULE_ID,
	TimeoutError,
	runFirewallTest,
} from './firewall-test';
import FirewallToggle from './firewall-toggle';
import IpRule from './ip-rule';
import RecentBlocks from './recent-blocks';
import { IP_ALLOW_LIST, IP_BLOCK_LIST } from './settings-keys';
import TestDetails from './test-details';
import type { TestOutcome, TestResult } from './firewall-test';
import type { FirewallBlocks, FirewallContext, FirewallState } from './types';
import './style.scss';

const UNAVAILABLE: FirewallState = {
	available: false,
	active: false,
	blockedCount: null,
	recentBlocks: [],
	hasScan: false,
	currentIp: '',
	ipRules: {},
};

// The only setting this card saves.
const FIREWALL_KEYS = [ 'waf' ];

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
	const [ blocks, setBlocks ] = useState< FirewallBlocks >( {
		blockedCount: firewall.blockedCount,
		recentBlocks: firewall.recentBlocks,
	} );
	const [ isTesting, setIsTesting ] = useState( false );
	const [ result, setResult ] = useState< TestResult | null >( null );
	const [ recorded, setRecorded ] = useState< boolean | null >( null );
	const [ detailsOpen, setDetailsOpen ] = useState( false );
	const active = isModuleActive( settings.settings, 'waf', firewall.active );
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
			const fresh = await apiFetch< FirewallBlocks >( { path: `${ FIREWALL_PATH }/blocks` } );
			setBlocks( fresh );
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

	if ( ! firewall.available ) {
		return <UnavailableCard icon={ shield } title={ title } />;
	}

	return (
		<ProtectCard
			icon={ shield }
			title={ title }
			description={ __(
				'Blocks malicious requests before they reach your site.',
				'jetpack-protect-pkg'
			) }
			actions={
				<Button variant="outline" size="compact" onClick={ runTest } loading={ isTesting }>
					{ __( 'Test firewall', 'jetpack-protect-pkg' ) }
				</Button>
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
			{ active && (
				<CardRow className="jp-protect-firewall-overview__columns">
					<Stack direction="column" gap="md" align="start">
						<Stat
							label={ __( 'All-time blocked requests', 'jetpack-protect-pkg' ) }
							value={ blocks.blockedCount === null ? '—' : formatNumber( blocks.blockedCount ) }
						/>
						<TabLink tab="settings" params={ SETTINGS_PARAMS } onOpen={ openTab }>
							{ __( 'Configure Firewall', 'jetpack-protect-pkg' ) }
						</TabLink>
					</Stack>
					<RecentBlocks blocks={ blocks.recentBlocks } />
				</CardRow>
			) }
			{ active && (
				<CardRow className="jp-protect-firewall-overview__columns">
					<IpRule
						data={ ipData }
						name={ IP_BLOCK_LIST }
						label={ __( 'Block specific IP addresses', 'jetpack-protect-pkg' ) }
						description={ __(
							'Stop specific visitors from accessing your site by their IP address.',
							'jetpack-protect-pkg'
						) }
						editLabel={ __( 'Edit block list', 'jetpack-protect-pkg' ) }
						dialogTitle={ __( 'Blocked IP addresses', 'jetpack-protect-pkg' ) }
					/>
					<IpRule
						data={ ipData }
						name={ IP_ALLOW_LIST }
						label={ __( 'Always allow specific IP addresses', 'jetpack-protect-pkg' ) }
						description={ __(
							'IP addresses added to this list are always allowed to access your site.',
							'jetpack-protect-pkg'
						) }
						editLabel={ __( 'Edit allow list', 'jetpack-protect-pkg' ) }
						dialogTitle={ __( 'Always allowed IP addresses', 'jetpack-protect-pkg' ) }
						currentIp={ firewall.currentIp }
					/>
				</CardRow>
			) }
		</ProtectCard>
	);
}
