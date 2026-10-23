import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { shield } from '@wordpress/icons';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import { CardRow, ProtectCard, Stat } from '../../components/card';
import TabLink from '../../components/tab-link';
import { HISTORY_STATUS_PARAM } from '../history/store';
import LastScanned from './last-scanned';
import SafeState from './safe-state';
import ScanUpsell from './scan-upsell';
import ScanningState from './scanning-state';
import { checkScanAgain, startScan, useIsScanning, useScan, useScanRequest } from './store';
import { loadIgnored } from './threat-actions';
import threatsIcon from './threats-icon';
import ThreatsList from './threats-list';
import type { DashboardContext } from '../types';
import type { ScanState } from './types';
import './style.scss';

// Open Scan history on a given list, not whichever was open last.
const FIXED_PARAMS = { [ HISTORY_STATUS_PARAM ]: 'fixed' };
const IGNORED_PARAMS = { [ HISTORY_STATUS_PARAM ]: 'ignored' };

/**
 * The Scan card: start a scan, then review what it found or see that the site is safe.
 *
 * @param props         - Component props.
 * @param props.openTab - Switches dashboard tabs, for the link to Scan history.
 * @return The card.
 */
export default function ScanCard( { openTab }: Pick< DashboardContext, 'openTab' > ) {
	// The section only renders this card once PHP has printed the Scan state.
	const scan = useScan() as ScanState;
	const { isStarting, startError, hasStoppedPolling } = useScanRequest();
	const [ isFetching, setIsFetching ] = useState( false );
	const threats = scan.threats ?? [];
	const hasThreats = threats.length > 0;
	const ignored = scan.ignored;
	const { hasPlan } = scan;
	const isScanning = useIsScanning();

	// Scans finished while the page is open: picks the safe state's animation and replays it.
	const [ finishedScans, setFinishedScans ] = useState( 0 );
	const wasScanning = useRef( isScanning );
	const wasStarting = useRef( isStarting );
	useEffect( () => {
		// The free check never reports as scanning; its answer is in once the request settles.
		const freeCheckDone = ! hasPlan && wasStarting.current && ! isStarting && ! startError;
		if (
			( wasScanning.current && ! isScanning && ! scan.error && ! startError ) ||
			freeCheckDone
		) {
			setFinishedScans( count => count + 1 );
		}
		wasScanning.current = isScanning;
		wasStarting.current = isStarting;
	}, [ isScanning, isStarting, startError, scan.error, hasPlan ] );

	// Ignored threats come from Scan history, which only a Scan plan has.
	useEffect( () => {
		if ( hasPlan ) {
			loadIgnored();
		}
	}, [ hasPlan ] );

	const refresh = useCallback( () => {
		setIsFetching( true );
		checkScanAgain().finally( () => setIsFetching( false ) );
	}, [] );

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
						onCheckAgain={ hasStoppedPolling ? refresh : undefined }
						isChecking={ isFetching }
					/>
				</Card.Content>
			</Card.Root>
		);
	}

	const safeState = (
		<SafeState
			key={ finishedScans }
			scan={ scan }
			isStarting={ isStarting }
			onScan={ startScan }
			justScanned={ finishedScans > 0 }
		/>
	);

	let body;
	if ( scan.error ) {
		body = (
			<CardRow className="jp-protect-scan__state">
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
		body = <CardRow className="jp-protect-scan__state">{ safeState }</CardRow>;
	} else {
		body = (
			<>
				<CardRow className="jp-protect-card__cells jp-protect-card__stats">
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
				<CardRow className="jp-protect-card__threats">
					<ThreatsList threats={ threats } canAct={ hasPlan } empty={ safeState } />
				</CardRow>
			</>
		);
	}

	return (
		<ProtectCard
			icon={ hasThreats ? threatsIcon : shield }
			title={ __( 'Scan', 'jetpack-protect-pkg' ) }
			description={
				hasPlan
					? __(
							'Daily malware and vulnerability checks for your files, WordPress, plugins and themes.',
							'jetpack-protect-pkg'
						)
					: __(
							'Daily vulnerability checks for WordPress, plugins and themes.',
							'jetpack-protect-pkg'
						)
			}
			titleAside={ scan.lastChecked ? <LastScanned lastChecked={ scan.lastChecked } /> : undefined }
		>
			{ body }
			{ ! scan.hasPlan && ! scan.error && (
				<ScanUpsell
					variant={ scan.upsellVariant }
					forced={ scan.upsellVariantForced }
					url={ scan.url }
				/>
			) }
			{ scan.hasPlan && (
				<CardRow>
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
				</CardRow>
			) }
		</ProtectCard>
	);
}
