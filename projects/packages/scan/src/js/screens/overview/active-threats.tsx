import { LoadingPlaceholder } from '@automattic/jetpack-components';
import { ThreatsDataViews } from '@automattic/jetpack-scan';
import { useQuery } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { siteScanQuery } from '../../data/query-options';
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

	if ( isLoading ) {
		return <LoadingPlaceholder width="100%" height={ 400 } />;
	}

	if ( error ) {
		return (
			<p>{ __( 'Unable to load active threats. Please try again later.', 'jetpack-scan-page' ) }</p>
		);
	}

	return <ThreatsDataViews data={ data?.threats ?? [] } />;
};

export default ActiveThreats;
