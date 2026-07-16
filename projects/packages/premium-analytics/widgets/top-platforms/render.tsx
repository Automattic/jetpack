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

	const { data, hasComparison, isLoading, isFetching, isError, errorReason, refetch } =
		usePlatformViews( {
			reportParams,
			max,
			deviceProperty: platformDimension,
		} );

	const maxViews = Math.max( ...data.map( d => d.views ), 0 );
	const maxComparisonViews = Math.max( ...data.map( d => d.previousViews ?? 0 ), 0 );
	const withComparison = hasComparison;
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
			currentShare: maxViews > 0 ? ( item.views / maxViews ) * 100 : 0,
			previousValue,
			previousShare:
				withComparison && previousValue !== undefined
					? sharePercentage( previousValue, maxComparisonViews )
					: undefined,
			delta:
				withComparison && previousValue !== undefined
					? calculateDelta( item.views, previousValue )
					: undefined,
		};
	} );

	// A plan error can't be fixed by retrying, so the Retry action is only
	// offered for regular fetch failures.
	const isPlanError = errorReason === 'upgrade-required';

	return (
		<div className={ styles.content }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ data.length === 0 }
				error={ {
					description: isPlanError
						? __(
								'Platform stats are not included in your current plan.',
								'jetpack-premium-analytics'
						  )
						: __(
								"We couldn't load platform data. Please try again in a moment.",
								'jetpack-premium-analytics'
						  ),
					actions: isPlanError
						? undefined
						: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
				} }
				empty={ {
					icon: device,
					description: __( 'No platform data in this period.', 'jetpack-premium-analytics' ),
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
