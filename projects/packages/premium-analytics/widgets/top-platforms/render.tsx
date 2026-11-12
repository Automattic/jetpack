/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	WIDGET_ROW_LIMIT,
	describeError,
	LeaderboardChart,
	LeaderboardSkeleton,
	buildLeaderboardRow,
	WidgetRoot,
	WidgetState,
	useReportActions,
	useWidgetRootContext,
	type CsvColumn,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useNoViewsEmptyState } from '../use-no-views-empty-state';
import styles from './style.module.css';
import usePlatformViews, { type PlatformView } from './use-platform-views';
import { type TopPlatformsAttributes } from './widget';
/**
 * Types
 */
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type TopPlatformsRenderAttributes = TopPlatformsAttributes & Partial< ReportParamsFieldAttributes >;
type TopPlatformsWidgetProps = WidgetRenderProps< TopPlatformsRenderAttributes >;

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

type PlatformMode = 'browser' | 'platform';

type TopPlatformsInnerProps = {
	/**
	 * Device dimension to rank: browsers or operating systems.
	 */
	platformDimension: PlatformMode;
};

function TopPlatformsInner( { platformDimension }: TopPlatformsInnerProps ) {
	const { reportParams } = useWidgetRootContext();

	const { data, hasComparison, isLoading, isFetching, isError, csvIsError, error, refetch } =
		usePlatformViews( {
			reportParams,
			max: WIDGET_ROW_LIMIT,
			deviceProperty: platformDimension,
		} );

	const emptyState = useNoViewsEmptyState(
		{ isLoading, isError, isEmpty: data.length === 0 },
		__( 'You don’t have platforms recorded yet.', 'jetpack-premium-analytics-pkg' )
	);

	const isOs = platformDimension === 'platform';
	const columns = useMemo< CsvColumn< PlatformView >[] >(
		() => [
			{
				label: isOs
					? __( 'Operating system', 'jetpack-premium-analytics-pkg' )
					: __( 'Browser', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.label,
			},
			{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.views },
		],
		[ isOs ]
	);
	useReportActions( {
		csv: {
			rows: data,
			columns,
			filenamePrefix: isOs ? 'top-operating-systems' : 'top-browsers',
			hasDateRange: true,
			status: { isLoading, isFetching, isError: csvIsError },
		},
	} );

	const leaderboardData: LeaderboardChartData = data.map( ( item, index ) => ( {
		id: `${ index }-${ item.key }`,
		...buildLeaderboardRow( {
			label: item.label,
			media: { kind: 'none' },
			action: { kind: 'static' },
		} ),
		currentValue: item.views,
		previousValue: item.previousViews,
	} ) );

	return (
		<div className={ styles.content }>
			<WidgetState
				isLoading={ emptyState.isLoading }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ data.length === 0 }
				error={ describeError( error, {
					retryDescription: __(
						"We couldn't load platform data. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					onRetry: refetch,
				} ) }
				empty={ emptyState.empty }
				renderLoading={ <LeaderboardSkeleton rows={ WIDGET_ROW_LIMIT } /> }
			>
				<LeaderboardChart
					data={ leaderboardData }
					withComparison={ hasComparison }
					withOverlayLabel
					showLegend={ false }
					dataFormat={ DATA_FORMAT }
					columns={ {
						label:
							platformDimension === 'platform'
								? __( 'Operating systems', 'jetpack-premium-analytics-pkg' )
								: __( 'Browsers', 'jetpack-premium-analytics-pkg' ),
						metric: 'views',
					} }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * Browser or OS breakdown as a ranked leaderboard. The active dimension is the
 * `platformDimension` attribute (`relevance: 'high'`), exposed as a control by
 * the widget host.
 */
export default function TopPlatformsWidget( { attributes }: TopPlatformsWidgetProps ) {
	const platformDimension = attributes?.platformDimension ?? 'browser';

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<TopPlatformsInner platformDimension={ platformDimension } />
			</div>
		</WidgetRoot>
	);
}
