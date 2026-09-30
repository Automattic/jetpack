/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useMemo, type ReactNode } from 'react';
/**
 * Internal dependencies
 */
import { WIDGET_ROW_LIMIT } from '../../constants/rows';
import { useWidgetNavigationSearch } from '../../hooks/use-widget-navigation-search';
import { LeaderboardChart, type LegendLabels } from '../chart-leaderboard/leaderboard-chart';
import { LeaderboardSkeleton } from '../chart-leaderboard/leaderboard-skeleton';
import { WidgetFooter } from '../widget-footer';
import { WidgetState, type WidgetStateEmpty, type WidgetStateError } from '../widget-state';
import {
	buildLeaderboardChartData,
	type LeaderboardRowInput,
} from './build-leaderboard-chart-data';
import styles from './leaderboard.module.scss';
import type { DataFormat } from '../../types';

/**
 * What the widget knows about its request, in the data layer's terms.
 */
export type LeaderboardStatus = {
	/** Nothing on screen answers the current params. */
	isLoading: boolean;
	/** Unchanged params being revalidated. */
	isFetching?: boolean;
	/** The request failed. */
	isError?: boolean;
	/** The comparison period is on and at least one row has a match there. */
	hasComparison?: boolean;
	/** Re-runs the request; the default error state offers it as Retry. */
	refetch?: () => unknown;
};

export type LeaderboardProps = {
	/** Ranked rows, in display order. */
	rows: readonly LeaderboardRowInput[];
	/** Request state, from the widget's data hook. */
	status: LeaderboardStatus;
	/** Error copy. Without `actions`, a `status.refetch` becomes the Retry action. */
	error?: WidgetStateError;
	/** A widget's own empty state; omit for the generic one. */
	empty?: WidgetStateEmpty;
	/** Rows shown, and the skeleton's height. Defaults to the widget row limit. */
	maxRows?: number;
	/** Value format. Defaults to compact integers. */
	format?: DataFormat;
	/** Draw the value over the bar. */
	withOverlayLabel?: boolean;
	showLegend?: boolean;
	legendLabels?: LegendLabels;
	/** Destination tab and origin report for detail links, see `useWidgetNavigationSearch()`. */
	navigation?: Parameters< typeof useWidgetNavigationSearch >[ 0 ];
	/** Rendered above the chart, inside the content column. */
	header?: ReactNode;
	/** Rendered in the widget footer, typically a `ReportLink`. */
	footer?: ReactNode;
	className?: string;
};

const DEFAULT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * A ranked-rows widget body: the leaderboard chart with its loading, error and empty
 * states, the row limit, the comparison shares and deltas, and the dashboard window on
 * detail links. Renders inside `WidgetRoot`, which provides the report params it reads.
 */
export function Leaderboard( {
	rows,
	status,
	error,
	empty,
	maxRows = WIDGET_ROW_LIMIT,
	format = DEFAULT_FORMAT,
	withOverlayLabel = true,
	showLegend = false,
	legendLabels,
	navigation,
	header,
	footer,
	className,
}: LeaderboardProps ) {
	const detailSearch = useWidgetNavigationSearch( navigation );
	const hasComparison = !! status.hasComparison;
	const refetch = status.refetch;

	const data = useMemo(
		() => buildLeaderboardChartData( rows, { hasComparison, maxRows, detailSearch } ),
		[ rows, hasComparison, maxRows, detailSearch ]
	);

	const errorState = useMemo< WidgetStateError | undefined >( () => {
		if ( error?.actions || ! refetch ) {
			return error;
		}
		return {
			...error,
			description:
				error?.description ??
				__(
					"We couldn't load this data. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
			actions: [
				{
					label: __( 'Retry', 'jetpack-premium-analytics-pkg' ),
					onClick: () => {
						void refetch();
					},
				},
			],
		};
	}, [ error, refetch ] );

	return (
		<div className={ clsx( styles.root, className ) }>
			<div className={ styles.content }>
				{ header }
				<WidgetState
					isLoading={ status.isLoading }
					isFetching={ status.isFetching }
					isError={ !! status.isError }
					isEmpty={ data.length === 0 }
					error={ errorState }
					empty={ empty }
					renderLoading={ <LeaderboardSkeleton rows={ maxRows } /> }
				>
					<LeaderboardChart
						data={ data }
						withComparison={ hasComparison }
						withOverlayLabel={ withOverlayLabel }
						showLegend={ showLegend }
						legendLabels={ legendLabels }
						dataFormat={ format }
					/>
				</WidgetState>
			</div>
			{ footer && <WidgetFooter>{ footer }</WidgetFooter> }
		</div>
	);
}
