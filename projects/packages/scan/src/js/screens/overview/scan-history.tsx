import { LoadingPlaceholder } from '@automattic/jetpack-components';
import { ThreatsDataViews } from '@automattic/jetpack-scan';
import { useQuery } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { siteScanHistoryQuery } from '../../data/query-options';
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

	if ( isLoading ) {
		return <LoadingPlaceholder width="100%" height={ 400 } />;
	}

	if ( error ) {
		return (
			<p>{ __( 'Unable to load scan history. Please try again later.', 'jetpack-scan-page' ) }</p>
		);
	}

	return <ThreatsDataViews data={ data?.threats ?? [] } />;
};

export default ScanHistory;
