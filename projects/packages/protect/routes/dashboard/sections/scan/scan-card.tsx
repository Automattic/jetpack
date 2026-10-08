import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { shield } from '@wordpress/icons';
import { Button, Card, Link, Notice, Stack, Text } from '@wordpress/ui';
import { CardRow, ProtectCard, Stat } from '../../components/card';
import TabLink from '../../components/tab-link';
import { HISTORY_STATUS_PARAM } from '../history/store';
import SafeState from './safe-state';
import ScanButton from './scan-button';
import ScanningState from './scanning-state';
import { SCAN_PATH, mergeScan, setScan, useScan } from './store';
import { loadIgnored } from './threat-actions';
import ThreatsList from './threats-list';
import type { ScanState } from './types';
import './style.scss';

// Like the Protect plugin: quick checks first, then back off.
const pollInterval = ( polls: number ) => ( polls < 5 ? 5000 : 15000 );

// Open Scan history on a given list, not whichever was open last.
const FIXED_PARAMS = { [ HISTORY_STATUS_PARAM ]: 'fixed' };
const IGNORED_PARAMS = { [ HISTORY_STATUS_PARAM ]: 'ignored' };

// About ten minutes of polling before asking the user to check again.
const MAX_POLLS = 40;

// How long a requested scan may stay unreported before we stop assuming it is starting.
const REQUESTED_SCAN_TTL = 5 * 60 * 1000;

/**
 * Whether a scan was requested but WordPress.com doesn't report it yet, as the Protect plugin checks.
 *
 * @param scan        - The latest report.
 * @param requestedAt - When this page requested a scan, if it did.
 * @return True while the request is recent and no newer report exists.
 */
function isRequestedScanNotStarted( scan: ScanState, requestedAt: number | null ): boolean {
	if ( ! requestedAt || Date.now() - requestedAt > REQUESTED_SCAN_TTL ) {
		return false;
	}
	const lastChecked = scan.lastChecked
		? new Date( scan.lastChecked.replace( ' ', 'T' ) + 'Z' ).getTime()
		: 0;
	return ! ( lastChecked > requestedAt );
}

/**
 * Whether the page is in a background tab, kept up to date.
 *
 * @return True while the document is hidden.
 */
function useIsDocumentHidden(): boolean {
	const [ isHidden, setIsHidden ] = useState( () => document.hidden );
	useEffect( () => {
		const onChange = () => setIsHidden( document.hidden );
		document.addEventListener( 'visibilitychange', onChange );
		return () => document.removeEventListener( 'visibilitychange', onChange );
	}, [] );
	return isHidden;
}

/**
 * The Scan card: start a scan, then review what it found or see that the site is safe.
 *
 * @param props         - Component props.
 * @param props.openTab - Switches dashboard tabs, for the link to Scan history.
 * @return The card.
 */
export default function ScanCard( { openTab }: { openTab: ( tab: string ) => void } ) {
	// The section only renders this card once PHP has printed the Scan state.
	const scan = useScan() as ScanState;
	const [ isStarting, setIsStarting ] = useState( false );
	const [ isFetching, setIsFetching ] = useState( false );
	const [ startError, setStartError ] = useState< string | null >( null );
	const [ requestedAt, setRequestedAt ] = useState< number | null >( null );
	const [ polls, setPolls ] = useState( 0 );
	const isHidden = useIsDocumentHidden();
	const threats = scan.threats ?? [];
	const hasThreats = threats.length > 0;
	const ignored = scan.ignored;
	const { hasPlan } = scan;
	const isScanning =
		! scan.error && ( !! scan.scanning || isRequestedScanNotStarted( scan, requestedAt ) );

	// Ignored threats come from Scan history, which only a Scan plan has.
	useEffect( () => {
		if ( hasPlan ) {
			loadIgnored();
		}
	}, [ hasPlan ] );

	const fetchScan = useCallback(
		() =>
			apiFetch< ScanState >( { path: SCAN_PATH } )
				.then( mergeScan )
				.catch( () => setScan( current => ( { ...current, error: true, scanning: false } ) ) ),
		[]
	);

	const refresh = useCallback( () => {
		setIsFetching( true );
		setPolls( 0 );
		fetchScan().finally( () => setIsFetching( false ) );
	}, [ fetchScan ] );

	const startScan = useCallback( () => {
		setIsStarting( true );
		setStartError( null );
		// With Scan, show the scan as started right away; the free check only re-reads its report.
		setRequestedAt( hasPlan ? Date.now() : null );
		apiFetch< ScanState >( { path: SCAN_PATH, method: 'POST' } )
			.then( next => {
				setPolls( 0 );
				mergeScan( next );
			} )
			.catch( ( e: { message?: string } ) => {
				setRequestedAt( null );
				setStartError( e?.message || __( 'The scan couldn’t be started.', 'jetpack-protect-pkg' ) );
			} )
			.finally( () => setIsStarting( false ) );
	}, [ hasPlan ] );

	// Poll while a scan runs, pausing in background tabs and after MAX_POLLS.
	useEffect( () => {
		if ( ! isScanning || isHidden || polls >= MAX_POLLS ) {
			return;
		}
		const timer = setTimeout(
			() => fetchScan().finally( () => setPolls( count => count + 1 ) ),
			pollInterval( polls )
		);
		return () => clearTimeout( timer );
	}, [ isScanning, isHidden, polls, fetchScan ] );

	// The running scan gets the whole card, without the header and footer.
	if ( isScanning ) {
		return (
			<Card.Root
				render={ <section /> }
				className="jp-protect-card"
				aria-label={ __( 'Scan', 'jetpack-protect-pkg' ) }
			>
				<Card.Content>
					<ScanningState
						scan={ scan }
						onCheckAgain={ polls >= MAX_POLLS ? refresh : undefined }
						isChecking={ isFetching }
					/>
				</Card.Content>
			</Card.Root>
		);
	}

	let body;
	if ( scan.error ) {
		body = (
			<CardRow>
				<Stack direction="column" gap="sm" align="start">
					<Text variant="body-md">
						{ __(
							'We couldn’t check your site for vulnerabilities right now.',
							'jetpack-protect-pkg'
						) }
					</Text>
					<Button variant="outline" onClick={ refresh } loading={ isFetching }>
						{ __( 'Try again', 'jetpack-protect-pkg' ) }
					</Button>
				</Stack>
			</CardRow>
		);
	} else if ( ! hasThreats ) {
		body = (
			<CardRow>
				<SafeState scan={ scan } isStarting={ isStarting } onScan={ startScan } />
			</CardRow>
		);
	} else {
		body = (
			<>
				{ hasThreats && (
					<CardRow className="jp-protect-card__stats">
						<Stat
							label={ __( 'All vulnerabilities found', 'jetpack-protect-pkg' ) }
							value={ threats.length }
							warning
						/>
						<Stat
							label={ __( 'Plugins checked', 'jetpack-protect-pkg' ) }
							value={ scan.pluginsChecked ?? 0 }
						/>
						<Stat
							label={ __( 'Themes checked', 'jetpack-protect-pkg' ) }
							value={ scan.themesChecked ?? 0 }
						/>
					</CardRow>
				) }
				<CardRow className="jp-protect-card__threats">
					<ThreatsList
						threats={ threats }
						canAct={ hasPlan }
						empty={ <SafeState scan={ scan } isStarting={ isStarting } onScan={ startScan } /> }
					/>
				</CardRow>
			</>
		);
	}

	return (
		<ProtectCard
			icon={ shield }
			title={ __( 'Scan', 'jetpack-protect-pkg' ) }
			status={
				scan.hasPlan
					? { label: __( 'Active', 'jetpack-protect-pkg' ), intent: 'stable' }
					: {
							label: __( 'Vulnerability checks only', 'jetpack-protect-pkg' ),
							intent: 'informational',
						}
			}
			actions={
				hasThreats &&
				! isScanning && (
					<ScanButton
						scan={ scan }
						isStarting={ isStarting }
						onScan={ startScan }
						label={ __( 'Scan now', 'jetpack-protect-pkg' ) }
						variant="outline"
						size="compact"
					/>
				)
			}
		>
			{ startError && (
				<CardRow>
					<Notice.Root intent="error">
						<Notice.Description>{ startError }</Notice.Description>
					</Notice.Root>
				</CardRow>
			) }
			{ body }
			<CardRow>
				{ scan.hasPlan ? (
					<Stack direction="row" gap="lg" wrap="wrap">
						<TabLink tab="history" params={ FIXED_PARAMS } onOpen={ openTab }>
							{ __( 'View scan history', 'jetpack-protect-pkg' ) }
						</TabLink>
						{ !! ignored?.length && (
							<TabLink tab="history" params={ IGNORED_PARAMS } onOpen={ openTab }>
								{ sprintf(
									/* translators: %d is a number of threats. */
									_n(
										'View %d ignored threat',
										'View %d ignored threats',
										ignored.length,
										'jetpack-protect-pkg'
									),
									ignored.length
								) }
							</TabLink>
						) }
					</Stack>
				) : (
					<Link href={ scan.url }>
						{ __(
							'Get Scan for daily malware scanning and one-click fixes',
							'jetpack-protect-pkg'
						) }
					</Link>
				) }
			</CardRow>
		</ProtectCard>
	);
}
