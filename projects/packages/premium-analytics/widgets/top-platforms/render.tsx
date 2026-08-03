/**
 * External dependencies
 */
import { device } from '@jetpack-premium-analytics/icons';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import {
	calculateDelta,
	describeError,
	getCombinedPeriodMax,
	LeaderboardChart,
	sharePercentage,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import usePlatformViews from './use-platform-views';
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
	 * Max rows to display.
	 */
	max: number;
	/**
	 * Device dimension to rank: browsers or operating systems.
	 */
	platformDimension: PlatformMode;
};

/**
 * Inner component — rendered inside WidgetRoot.
 *
 * @param {TopPlatformsInnerProps} props - The component props.
 * @return The rendered leaderboard or state placeholder.
 */
function TopPlatformsInner( { max, platformDimension }: TopPlatformsInnerProps ) {
	const { reportParams } = useWidgetRootContext();

	const { data, hasComparison, isLoading, isFetching, isError, error, refetch } = usePlatformViews(
		{
			reportParams,
			max,
			deviceProperty: platformDimension,
		}
	);

	const maxViews = getCombinedPeriodMax(
		data.map( item => item.views ),
		hasComparison ? data.map( item => item.previousViews ) : []
	);
	const leaderboardData: LeaderboardChartData = data.map( ( item, index ) => {
		const previousValue = item.previousViews;

		return {
			id: `${ index }-${ item.key }`,
			label: (
				<Stack align="center" className={ styles.itemLabel }>
					<Text>{ item.label }</Text>
				</Stack>
			),
			currentValue: item.views,
			currentShare: sharePercentage( item.views, maxViews ),
			previousValue,
			previousShare:
				hasComparison && previousValue !== undefined
					? sharePercentage( previousValue, maxViews )
					: undefined,
			delta:
				hasComparison && previousValue !== undefined
					? calculateDelta( item.views, previousValue )
					: undefined,
		};
	} );

	return (
		<div className={ styles.content }>
			<WidgetState
				isLoading={ isLoading }
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
				empty={ {
					icon: device,
					description: __( 'No platform data in this period.', 'jetpack-premium-analytics-pkg' ),
				} }
			>
				<LeaderboardChart
					data={ leaderboardData }
					withComparison={ hasComparison }
					withOverlayLabel
					showLegend={ false }
					dataFormat={ DATA_FORMAT }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * Top Platforms widget render component.
 *
 * Shows browser or OS breakdown as a ranked leaderboard. The active
 * dimension is the `platformDimension` attribute (`relevance: 'high'`),
 * exposed as a control by the widget host.
 *
 * @param {TopPlatformsWidgetProps} props - The widget render props.
 * @return The rendered widget content.
 */
export default function TopPlatformsWidget( { attributes }: TopPlatformsWidgetProps ) {
	const max = attributes?.max ?? 10;
	const platformDimension = attributes?.platformDimension ?? 'browser';

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<TopPlatformsInner max={ max } platformDimension={ platformDimension } />
			</div>
		</WidgetRoot>
	);
}
