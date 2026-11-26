/**
 * External dependencies
 */
import { useStatsAiProviders } from '@jetpack-premium-analytics/data';
import {
	Leaderboard,
	WIDGET_ROW_LIMIT,
	WidgetRoot,
	useWidgetRootContext,
	type LeaderboardRowInput,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildCompanyRows } from './build-company-rows';
import styles from './style.module.css';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

export type TopAiCompaniesAttributes = Record< never, never >;

type TopAiCompaniesRenderAttributes = TopAiCompaniesAttributes &
	Partial< ReportParamsFieldAttributes >;
type TopAiCompaniesProps = WidgetRenderProps< TopAiCompaniesRenderAttributes > & {
	/**
	 * Host callback to surface a widget error in the dashboard frame.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

function rowAriaLabel( row: LeaderboardRowInput ) {
	return sprintf(
		/* translators: %s: an AI company, or a group of them. */
		__( 'View the bots of %s', 'jetpack-premium-analytics-pkg' ),
		row.label
	);
}

function TopAiCompaniesInner() {
	const { reportParams } = useWidgetRootContext();
	const { primary, isLoading, isFetching, isError, refetch } = useStatsAiProviders( reportParams );
	const providers = primary.data?.data;
	const rows = useMemo(
		() => buildCompanyRows( providers ?? [], WIDGET_ROW_LIMIT ),
		[ providers ]
	);
	const columns = useMemo(
		() => ( {
			label: __( 'Companies', 'jetpack-premium-analytics-pkg' ),
			metric: 'requests' as const,
		} ),
		[]
	);
	const drillDown = useMemo(
		() => ( {
			backLabel: __( 'All companies', 'jetpack-premium-analytics-pkg' ),
			rowAriaLabel,
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
				drillDown={ drillDown }
			/>
		</div>
	);
}

export default function TopAiCompanies( { attributes = {}, setError }: TopAiCompaniesProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<TopAiCompaniesInner />
		</WidgetRoot>
	);
}
