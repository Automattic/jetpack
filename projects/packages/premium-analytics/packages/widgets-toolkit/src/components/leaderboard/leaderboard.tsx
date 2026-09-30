/**
 * External dependencies
 */
import { Stack } from '@jetpack-premium-analytics/externals';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
/**
 * Internal dependencies
 */
import { WIDGET_ROW_LIMIT } from '../../constants/rows';
import { useWidgetDrillDown } from '../../hooks/use-widget-drill-down';
import { useWidgetNavigationSearch } from '../../hooks/use-widget-navigation-search';
import { LeaderboardChart, type LegendLabels } from '../chart-leaderboard/leaderboard-chart';
import { LeaderboardSkeleton } from '../chart-leaderboard/leaderboard-skeleton';
import { WidgetBackLink } from '../widget-back-link';
import { WidgetFooter } from '../widget-footer';
import { WidgetState, type WidgetStateEmpty, type WidgetStateError } from '../widget-state';
import {
	buildLeaderboardChartData,
	type LeaderboardRowInput,
} from './build-leaderboard-chart-data';
import { resolveDrillDownTrail } from './drill-down-trail';
import styles from './leaderboard.module.scss';
import type { DataFormat } from '../../types';

/**
 * What the widget knows about its request, in the data layer's terms.
 */
export type LeaderboardStatus = {
	/**
	 * Nothing on screen answers the current params.
	 */
	isLoading: boolean;
	/**
	 * Unchanged params being revalidated.
	 */
	isFetching?: boolean;
	/**
	 * The request failed.
	 */
	isError?: boolean;
	/**
	 * The comparison period is on and at least one row has a match there.
	 */
	hasComparison?: boolean;
	/**
	 * Re-runs the request; the default error state offers it as Retry.
	 */
	refetch?: () => unknown;
};

/**
 * The copy a drill-down needs. Rows with `children` become buttons that show them, under a
 * back link; deeper levels are labelled after the row they return to.
 */
export type LeaderboardDrillDown = {
	/**
	 * Back link label of the top level, e.g. "All clicks".
	 */
	backLabel: string;
	/**
	 * Accessible name of the top-level back link. Defaults to `backLabel`.
	 */
	backAriaLabel?: string;
	/**
	 * Accessible name of a row that drills down, e.g. "View clicked links for %s".
	 */
	rowAriaLabel: ( row: LeaderboardRowInput ) => string;
};

export type LeaderboardProps = {
	/**
	 * Ranked rows, in display order.
	 */
	rows: readonly LeaderboardRowInput[];
	/**
	 * Request state, from the widget's data hook.
	 */
	status: LeaderboardStatus;
	/**
	 * Error copy. Without `actions`, a `status.refetch` becomes the Retry action.
	 */
	error?: WidgetStateError;
	/**
	 * A widget's own empty state; omit for the generic one.
	 */
	empty?: WidgetStateEmpty;
	/**
	 * Top-level rows shown, and the skeleton's height. Defaults to the widget row limit.
	 */
	maxRows?: number;
	/**
	 * Value format. Defaults to compact integers.
	 */
	format?: DataFormat;
	/**
	 * Draw the value over the bar.
	 */
	withOverlayLabel?: boolean;
	/**
	 * Labels of the period legend under the chart. No legend when omitted.
	 */
	legend?: LegendLabels;
	/**
	 * Lets rows with `children` drill down into them. A widget whose rows change under a
	 * control of its own resets the selection by giving the leaderboard a `key`.
	 */
	drillDown?: LeaderboardDrillDown;
	/**
	 * Destination tab and origin report for the detail links, see `useWidgetNavigationSearch()`.
	 */
	navigation?: Parameters< typeof useWidgetNavigationSearch >[ 0 ];
	/**
	 * Rendered in the widget footer, typically a `ReportLink`.
	 */
	footer?: ReactNode;
	/**
	 * Additional CSS classes.
	 */
	className?: string;
};

const DEFAULT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * A ranked-rows widget body: the leaderboard chart with its loading, error and empty
 * states, the row limit, the comparison shares and deltas, the drill-down into child rows,
 * and the dashboard window on detail links. Renders inside `WidgetRoot`, which provides
 * the report params it reads.
 *
 * @param {LeaderboardProps} props - The props for the Leaderboard component.
 * @return {JSX.Element} The Leaderboard component.
 */
export function Leaderboard( {
	rows,
	status,
	error,
	empty,
	maxRows = WIDGET_ROW_LIMIT,
	format = DEFAULT_FORMAT,
	withOverlayLabel = true,
	legend,
	drillDown,
	navigation,
	footer,
	className,
}: LeaderboardProps ): JSX.Element {
	const detailSearch = useWidgetNavigationSearch( navigation );
	const refetch = status.refetch;
	const { isLoading, isFetching, isError } = status;

	const {
		drillDownItem: path,
		drillDown: setPath,
		resetDrillDown,
	} = useWidgetDrillDown< string[] >();
	const trail = useMemo( () => resolveDrillDownTrail( rows, path ), [ rows, path ] );
	const parent = trail.length ? trail[ trail.length - 1 ] : null;

	// Trim a selection the data no longer backs only once the data has settled, so a valid
	// one survives in-flight fetches and transient failures.
	useEffect( () => {
		if ( ! path?.length || trail.length === path.length || isLoading || isFetching || isError ) {
			return;
		}
		if ( trail.length ) {
			setPath( trail.map( row => row.id ) );
		} else {
			resetDrillDown();
		}
	}, [ path, trail, isLoading, isFetching, isError, setPath, resetDrillDown ] );

	const select = useCallback(
		( row: LeaderboardRowInput ) => setPath( [ ...( path ?? [] ), row.id ] ),
		[ path, setPath ]
	);
	const goBack = useCallback( () => {
		const next = trail.slice( 0, -1 );
		if ( next.length ) {
			setPath( next.map( row => row.id ) );
		} else {
			resetDrillDown();
		}
	}, [ trail, setPath, resetDrillDown ] );

	const activeRows = useMemo(
		() => ( parent ? ( parent.children ?? [] ) : rows ),
		[ parent, rows ]
	);
	const hasComparison = parent ? !! parent.childrenHaveComparison : !! status.hasComparison;

	const data = useMemo(
		() =>
			buildLeaderboardChartData( activeRows, {
				hasComparison,
				maxRows: parent ? 0 : maxRows,
				detailSearch,
				drillDown: drillDown
					? { onSelect: select, rowAriaLabel: drillDown.rowAriaLabel }
					: undefined,
			} ),
		[ activeRows, hasComparison, parent, maxRows, detailSearch, drillDown, select ]
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

	// Labelled after the list it returns to: the parent row, or the top level.
	const grandparent = trail.length > 1 ? trail[ trail.length - 2 ] : null;
	const backLink =
		parent && drillDown ? (
			<WidgetBackLink
				label={ grandparent ? grandparent.label : drillDown.backLabel }
				ariaLabel={
					grandparent
						? sprintf(
								/* translators: %s is the label of the list the back link returns to. */
								__( 'Back to %s', 'jetpack-premium-analytics-pkg' ),
								grandparent.label
							)
						: ( drillDown.backAriaLabel ?? drillDown.backLabel )
				}
				onClick={ goBack }
			/>
		) : null;

	return (
		<Stack direction="column" className={ clsx( styles.root, className ) }>
			<Stack direction="column" className={ styles.content }>
				{ backLink }
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					isError={ !! isError }
					isEmpty={ data.length === 0 }
					error={ errorState }
					empty={ empty }
					renderLoading={ <LeaderboardSkeleton rows={ maxRows } /> }
				>
					<LeaderboardChart
						data={ data }
						withComparison={ hasComparison }
						withOverlayLabel={ withOverlayLabel }
						showLegend={ !! legend }
						legendLabels={ legend }
						dataFormat={ format }
					/>
				</WidgetState>
			</Stack>
			{ footer && <WidgetFooter>{ footer }</WidgetFooter> }
		</Stack>
	);
}
