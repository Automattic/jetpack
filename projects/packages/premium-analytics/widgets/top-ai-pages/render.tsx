/**
 * External dependencies
 */
import { useSiteHomeUrl, useStatsTopAiUrls } from '@jetpack-premium-analytics/data';
import {
	Leaderboard,
	WIDGET_ROW_LIMIT,
	WidgetRoot,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildPageRows } from './build-page-rows';
import styles from './style.module.css';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

export type TopAiPagesAttributes = Record< never, never >;

type TopAiPagesRenderAttributes = TopAiPagesAttributes & Partial< ReportParamsFieldAttributes >;
type TopAiPagesProps = WidgetRenderProps< TopAiPagesRenderAttributes > & {
	/**
	 * Host callback to surface a widget error in the dashboard frame.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

function TopAiPagesInner() {
	const { reportParams } = useWidgetRootContext();
	const homeUrl = useSiteHomeUrl();
	const params = useMemo(
		() => ( { ...reportParams, limit: WIDGET_ROW_LIMIT } ),
		[ reportParams ]
	);
	const { primary, isLoading, isFetching, isError, refetch } = useStatsTopAiUrls( params );
	const urls = primary.data?.data;
	const rows = useMemo( () => buildPageRows( urls ?? [], homeUrl ), [ urls, homeUrl ] );
	const columns = useMemo(
		() => ( {
			label: __( 'Page', 'jetpack-premium-analytics-pkg' ),
			metric: 'requests' as const,
		} ),
		[]
	);

	return (
		<div className={ styles.root }>
			<Leaderboard
				rows={ rows }
				// Placeholder rows from the previous window outlive a failed refetch.
				status={ { isLoading, isFetching, isError: isError && ! rows.length, refetch } }
				empty={ {
					description: __(
						'No requests from AI bots in this period.',
						'jetpack-premium-analytics-pkg'
					),
				} }
				columns={ columns }
			/>
		</div>
	);
}

export default function TopAiPages( { attributes = {}, setError }: TopAiPagesProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<TopAiPagesInner />
		</WidgetRoot>
	);
}
