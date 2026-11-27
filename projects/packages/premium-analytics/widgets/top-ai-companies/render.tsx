/**
 * External dependencies
 */
import { isAiProvidersRangeTooLong, useStatsAiProviders } from '@jetpack-premium-analytics/data';
import {
	Leaderboard,
	WIDGET_ROW_LIMIT,
	WidgetRoot,
	describeError,
	useWidgetRootContext,
	type LeaderboardRowInput,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { OTHER_COMPANIES_ID, buildCompanyRows } from './build-company-rows';
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
	if ( row.id === OTHER_COMPANIES_ID ) {
		return __( 'View the other companies', 'jetpack-premium-analytics-pkg' );
	}
	return sprintf(
		/* translators: %s: an AI company. */
		__( 'View the bots of %s', 'jetpack-premium-analytics-pkg' ),
		row.label
	);
}

function TopAiCompaniesInner() {
	const { reportParams } = useWidgetRootContext();
	const { primary, isLoading, isFetching, isError, error, refetch } =
		useStatsAiProviders( reportParams );
	const isRangeTooLong = isAiProvidersRangeTooLong( reportParams );
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
				error={ describeError( error, {
					retryDescription: __(
						"We couldn't load the AI companies. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					onRetry: refetch,
				} ) }
				empty={
					isRangeTooLong
						? {
								description: __(
									'Requests are available for up to a year at a time. Choose a shorter period.',
									'jetpack-premium-analytics-pkg'
								),
							}
						: undefined
				}
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
