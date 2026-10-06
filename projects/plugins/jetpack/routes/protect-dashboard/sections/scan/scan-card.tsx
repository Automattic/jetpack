import { ThreatsDataViews } from '@automattic/jetpack-scan';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { bug, chevronDown, chevronUp } from '@wordpress/icons';
import { Button, Icon, Link, Notice, Spinner, Stack, Text } from '@wordpress/ui';
import { CardRow, ProtectCard, Stat } from '../../components/card';
import SafeState from './safe-state';
import ScanButton from './scan-button';
import type { ScanState } from './types';
import './style.scss';

const SCAN_PATH = '/jetpack/v4/protect-dashboard/scan';

// Like the Protect plugin: quick checks first, then back off.
const pollInterval = ( polls: number ) => ( polls < 5 ? 5000 : 15000 );

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
 * @param props      - Component props.
 * @param props.scan - The report the page loaded with.
 * @return The card.
 */
export default function ScanCard( { scan: initialScan }: { scan: ScanState } ) {
	const [ scan, setScan ] = useState( initialScan );
	const [ isStarting, setIsStarting ] = useState( false );
	const [ isFetching, setIsFetching ] = useState( false );
	const [ startError, setStartError ] = useState< string | null >( null );
	const [ requestedAt, setRequestedAt ] = useState< number | null >( null );
	const [ polls, setPolls ] = useState( 0 );
	const isHidden = useIsDocumentHidden();
	const threats = scan.threats ?? [];
	const hasThreats = threats.length > 0;
	const [ isOpen, setIsOpen ] = useState( hasThreats );
	const toggle = useCallback( () => setIsOpen( open => ! open ), [] );
	const isScanning =
		! scan.error && ( !! scan.scanning || isRequestedScanNotStarted( scan, requestedAt ) );

	// Show what a scan found as soon as it finds something.
	useEffect( () => {
		if ( hasThreats ) {
			setIsOpen( true );
		}
	}, [ hasThreats ] );

	const fetchScan = useCallback(
		() =>
			apiFetch< ScanState >( { path: SCAN_PATH } )
				.then( next => setScan( current => ( { ...current, ...next } ) ) )
				.catch( () => setScan( current => ( { ...current, error: true, scanning: false } ) ) ),
		[]
	);

	const refresh = useCallback( () => {
		setIsFetching( true );
		setPolls( 0 );
		fetchScan().finally( () => setIsFetching( false ) );
	}, [ fetchScan ] );

	const startScan = useCallback( () => {
		const requested = Date.now();
		setIsStarting( true );
		setStartError( null );
		apiFetch< ScanState >( { path: SCAN_PATH, method: 'POST' } )
			.then( next => {
				if ( next.hasPlan && ! next.error ) {
					setRequestedAt( requested );
				}
				setPolls( 0 );
				setScan( current => ( { ...current, ...next } ) );
			} )
			.catch( ( e: { message?: string } ) =>
				setStartError( e?.message || __( 'The scan couldn’t be started.', 'jetpack' ) )
			)
			.finally( () => setIsStarting( false ) );
	}, [] );

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

	let body;
	if ( isScanning ) {
		body = (
			<CardRow>
				<Stack className="jp-protect-safe" direction="column" align="center" gap="md">
					<Spinner />
					<Text variant="body-lg">{ __( 'Scanning your site…', 'jetpack' ) }</Text>
					{ polls >= MAX_POLLS && (
						<Button variant="outline" onClick={ refresh } loading={ isFetching }>
							{ __( 'Check again', 'jetpack' ) }
						</Button>
					) }
				</Stack>
			</CardRow>
		);
	} else if ( scan.error ) {
		body = (
			<CardRow>
				<Stack direction="column" gap="sm" align="start">
					<Text variant="body-md">
						{ __( 'We couldn’t check your site for vulnerabilities right now.', 'jetpack' ) }
					</Text>
					<Button variant="outline" onClick={ refresh } loading={ isFetching }>
						{ __( 'Try again', 'jetpack' ) }
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
				<div className="jp-protect-card__stats">
					<Stat
						label={ __( 'All vulnerabilities found', 'jetpack' ) }
						value={ threats.length }
						warning
					/>
					<Stat label={ __( 'Plugins checked', 'jetpack' ) } value={ scan.pluginsChecked ?? 0 } />
					<Stat label={ __( 'Themes checked', 'jetpack' ) } value={ scan.themesChecked ?? 0 } />
				</div>
				<CardRow className="jp-protect-card__disclosure">
					<button
						type="button"
						className="jp-protect-card__disclosure-toggle"
						aria-expanded={ isOpen }
						onClick={ toggle }
					>
						<Text variant="body-lg">{ __( 'Review and fix threats', 'jetpack' ) }</Text>
						<Icon icon={ isOpen ? chevronUp : chevronDown } size={ 24 } />
					</button>
				</CardRow>
				{ isOpen && (
					<div className="jp-protect-card__threats">
						<ThreatsDataViews
							data={ threats }
							showStatusFilter={ false }
							persistKey="jetpack-protect-dashboard:threats:view"
						/>
					</div>
				) }
			</>
		);
	}

	return (
		<ProtectCard
			icon={ bug }
			title={ __( 'Scan', 'jetpack' ) }
			status={
				scan.hasPlan
					? { label: __( 'Active', 'jetpack' ), intent: 'stable' }
					: { label: __( 'Vulnerability checks only', 'jetpack' ), intent: 'informational' }
			}
			actions={
				hasThreats &&
				! isScanning && (
					<ScanButton
						scan={ scan }
						isStarting={ isStarting }
						onScan={ startScan }
						label={ __( 'Scan now', 'jetpack' ) }
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
				<Link href={ scan.url } openInNewTab={ scan.hasPlan }>
					{ scan.hasPlan
						? __( 'View scan history', 'jetpack' )
						: __( 'Get Scan for daily malware scanning and one-click fixes', 'jetpack' ) }
				</Link>
			</CardRow>
		</ProtectCard>
	);
}
