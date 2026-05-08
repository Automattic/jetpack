import { ThreatsDataViews } from '@automattic/jetpack-scan';
import { useQuery } from '@tanstack/react-query';
/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { Spinner, __experimentalVStack as VStack } from '@wordpress/components';
/* eslint-enable @wordpress/no-unsafe-wp-apis */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { siteScanHistoryQuery } from '../../data/query-options';
import { useTrackEvent } from '../../data/use-track-event';
import EmptyState from './empty-state';
import { UnignoreThreatModal } from './unignore-threat-modal';
import { ViewDetailsModal } from './view-details-modal';
import type { FC } from 'react';

/**
 * Scan history panel — lists past threats (fixed + ignored) from the
 * `/site/scan/history` bridge. Reuses `ThreatsDataViews` from
 * `@automattic/jetpack-scan` (the js-package) and lets users search /
 * filter / sort the same way Calypso's `scan-history/` does.
 *
 * Empty + error states are handled inside the DataViews shell — passing
 * `data={ [] }` renders the table chrome with DataViews' built-in
 * "no items" body so reviewers always see column headers + filter
 * controls.
 *
 * @return The history panel.
 */
const ScanHistory: FC = () => {
	const { data, isLoading, error } = useQuery( siteScanHistoryQuery() );
	const trackEvent = useTrackEvent();

	const onTrackDataViewsEvent = useCallback(
		( event: string, properties?: Record< string, unknown > ) =>
			trackEvent( `jetpack_scan_${ event }`, properties ),
		[ trackEvent ]
	);

	if ( isLoading ) {
		return (
			<VStack alignment="center" style={ { minHeight: 360 } }>
				<Spinner />
			</VStack>
		);
	}

	if ( error ) {
		return (
			<p>{ __( 'Unable to load scan history. Please try again later.', 'jetpack-scan-page' ) }</p>
		);
	}

	return (
		<ThreatsDataViews
			data={ data?.threats ?? [] }
			RenderUnignoreModal={ UnignoreThreatModal }
			RenderViewModal={ ViewDetailsModal }
			showStatusFilter={ false }
			persistKey="jetpack-scan:scan-history:view"
			onTrackEvent={ onTrackDataViewsEvent }
			empty={
				<EmptyState
					heading={ __( 'No scan history yet', 'jetpack-scan-page' ) }
					body={ __(
						'Past scan results will appear here once your site has been scanned.',
						'jetpack-scan-page'
					) }
				/>
			}
		/>
	);
};

export default ScanHistory;
