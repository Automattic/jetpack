/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import {
	calculateDelta,
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRoot,
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

	const { data, comparisonData, hasComparison, isLoading, isError, errorReason } = usePlatformViews(
		{
			reportParams,
			max,
			deviceProperty: platformDimension,
		}
	);

	if ( isError ) {
		return (
			<Stack align="center" justify="center" className={ styles.placeholder }>
				<Text>
					{ errorReason === 'upgrade-required'
						? __(
								'Platform stats are not included in your current plan.',
								'jetpack-premium-analytics'
						  )
						: __( 'Could not load platform data.', 'jetpack-premium-analytics' ) }
				</Text>
			</Stack>
		);
	}

	if ( isLoading && data.length === 0 ) {
		return <WidgetLoadingOverlay />;
	}

	const maxViews = Math.max( ...data.map( d => d.views ), 0 );
	const maxComparisonViews = Math.max( ...comparisonData.map( d => d.views ), 0 );
	const comparisonMap = new Map( comparisonData.map( item => [ item.key, item.views ] ) );
	const leaderboardData: LeaderboardChartData = data.map( ( item, index ) => ( {
		id: `${ index }-${ item.key }`,
		label: (
			<Stack align="center" className={ styles.itemLabel }>
				<Text>{ item.label }</Text>
			</Stack>
		),
		currentValue: item.views,
		currentShare: maxViews > 0 ? ( item.views / maxViews ) * 100 : 0,
		previousValue: comparisonMap.get( item.key ) ?? 0,
		previousShare:
			maxComparisonViews > 0
				? ( ( comparisonMap.get( item.key ) ?? 0 ) / maxComparisonViews ) * 100
				: 0,
		delta: calculateDelta( item.views, comparisonMap.get( item.key ) ?? 0 ),
	} ) );

	return (
		<LeaderboardChart
			data={ leaderboardData }
			loading={ isLoading }
			withComparison={ hasComparison }
			withOverlayLabel
			showLegend={ false }
			emptyStateText={ __( 'No platform data in this period.', 'jetpack-premium-analytics' ) }
			dataFormat={ DATA_FORMAT }
		/>
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
