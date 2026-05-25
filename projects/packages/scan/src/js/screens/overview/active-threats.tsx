import { ThreatsDataViews } from '@automattic/jetpack-scan';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
import { siteScanQuery } from '../../data/query-options';
import { useTrackEvent } from '../../data/use-track-event';
import { useSetHeaderActions } from '../../header-actions-context';
import BulkFixModal from './bulk-fix-modal';
import EmptyState from './empty-state';
import { FixThreatModal } from './fix-threat-modal';
import { IgnoreThreatModal } from './ignore-threat-modal';
import ScanNowButton from './scan-now-button';
import ScanStatus from './scan-status';
import { useThreatActions } from './use-threat-actions';
import { ViewDetailsModal } from './view-details-modal';
import type { FC } from 'react';

/**
 * Active threats panel — lists the un-ignored, un-fixed threats from the
 * most recent scan. Wraps the existing `ThreatsDataViews` component from
 * `@automattic/jetpack-scan` (the js-package) so the table fields,
 * sort/search/pagination, and severity badge stay in sync with the
 * legacy Protect surface. Action handlers are stubbed in Phase 1; the
 * fix / ignore / unignore / view-details modals wire up in Phases 3–4.
 *
 * Empty + error states are handled inside the DataViews shell — passing
 * `data={ [] }` renders the table chrome with DataViews' built-in
 * "no items" body so reviewers always see column headers + filter
 * controls (Phase 1+ wires up search / sort persistence on top).
 *
 * @return The active threats panel.
 */
const ActiveThreats: FC = () => {
	const { data, isLoading, error } = useQuery( siteScanQuery() );
	const { onFixThreats } = useThreatActions();
	const setHeaderActions = useSetHeaderActions();

	const threats = useMemo( () => data?.threats ?? [], [ data ] );
	const fixableCount = useMemo(
		() => threats.filter( threat => !! threat.fixable ).length,
		[ threats ]
	);

	const scanState = data?.state;
	const isScanRunning = scanState === 'enqueued' || scanState === 'running';

	const trackEvent = useTrackEvent();
	const onTrackDataViewsEvent = useCallback(
		( event: string, properties?: Record< string, unknown > ) =>
			trackEvent( `jetpack_scan_${ event }`, properties ),
		[ trackEvent ]
	);
	const [ isBulkFixOpen, setBulkFixOpen ] = useState( false );
	const openBulkFix = useCallback( () => {
		trackEvent( 'jetpack_scan_fix_threats_cta_click', { threat_count: fixableCount } );
		trackEvent( 'jetpack_scan_bulk_fix_threats_modal_open', { threat_count: fixableCount } );
		setBulkFixOpen( true );
	}, [ trackEvent, fixableCount ] );
	const closeBulkFix = useCallback( () => setBulkFixOpen( false ), [] );

	// Slot the "Scan now" + optional "Auto-fix N threats" CTAs into the
	// AdminPage header. Cleared on tab switch / unmount so the History tab
	// doesn't inherit them.
	useEffect( () => {
		setHeaderActions(
			<>
				<ScanNowButton disabled={ isScanRunning } />
				{ fixableCount > 0 && ! isScanRunning && (
					<Button variant="solid" onClick={ openBulkFix }>
						{ sprintf(
							/* translators: %d is the count of threats Jetpack Scan can auto-fix. */
							_n( 'Auto-fix %d threat', 'Auto-fix %d threats', fixableCount, 'jetpack-scan-page' ),
							fixableCount
						) }
					</Button>
				) }
			</>
		);
		return () => setHeaderActions( null );
	}, [ fixableCount, isScanRunning, setHeaderActions, openBulkFix ] );

	if ( isLoading ) {
		return (
			<Stack align="center" justify="center" style={ { minHeight: 360 } }>
				<Spinner />
			</Stack>
		);
	}

	if ( error ) {
		return (
			<p>{ __( 'Unable to load active threats. Please try again later.', 'jetpack-scan-page' ) }</p>
		);
	}

	if ( isScanRunning ) {
		return <ScanStatus state={ scanState } progress={ data?.current?.progress } />;
	}

	return (
		<>
			<ThreatsDataViews
				data={ threats }
				onFixThreats={ onFixThreats }
				RenderFixModal={ FixThreatModal }
				RenderIgnoreModal={ IgnoreThreatModal }
				RenderViewModal={ ViewDetailsModal }
				showStatusFilter={ false }
				persistKey="jetpack-scan:active-threats:view"
				onTrackEvent={ onTrackDataViewsEvent }
				empty={
					<EmptyState
						heading={ __( "You're set up. No active threats.", 'jetpack-scan-page' ) }
						body={ __(
							'Jetpack Scan watches your site for vulnerabilities and suspicious files. New findings will appear here.',
							'jetpack-scan-page'
						) }
					/>
				}
			/>
			{ isBulkFixOpen && <BulkFixModal threats={ threats } onClose={ closeBulkFix } /> }
		</>
	);
};

export default ActiveThreats;
