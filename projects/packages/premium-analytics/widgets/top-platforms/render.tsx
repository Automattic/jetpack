/**
 * External dependencies
 */
import { device } from '@jetpack-premium-analytics/icons';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@jetpack-premium-analytics/externals';
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
import usePlatformViews, {
	isPlatformDimension,
	type PlatformDimension,
} from './use-platform-views';
import { type TopPlatformsAttributes } from './widget';
/**
 * Types
 */
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type TopPlatformsRenderAttributes = TopPlatformsAttributes & Partial< ReportParamsFieldAttributes >;
type TopPlatformsWidgetProps = WidgetRenderProps< TopPlatformsRenderAttributes >;

const COUNT_DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};
// WPCOM returns `screensize` as percentage shares rather than view counts, and
// the shared percentage formatter takes a 0-1 ratio.
const PERCENTAGE_DATA_FORMAT = {
	type: 'percentage' as const,
	options: { decimals: 1, signDisplay: 'auto' as const },
};

type TopPlatformsInnerProps = {
	/**
	 * Max rows to display.
	 */
	max: number;
	/**
	 * Device dimension to rank: screen sizes, browsers, or operating systems.
	 */
	platformDimension: PlatformDimension;
};

function TopPlatformsInner( { max, platformDimension }: TopPlatformsInnerProps ) {
	const { reportParams } = useWidgetRootContext();

	const { data, hasComparison, isLoading, isFetching, isError, error, refetch } = usePlatformViews(
		{
			reportParams,
			max,
			deviceProperty: platformDimension,
		}
	);

	const isShare = platformDimension === 'screensize';
	// Only the number printed on the row changes unit; the percentage formatter
	// takes a 0-1 ratio while WPCOM sends screensize as 0-100.
	const toDisplayValue = ( value: number ) => ( isShare ? value / 100 : value );

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
			currentValue: toDisplayValue( item.views ),
			// Bar widths come from the raw values on purpose: the ratio to `maxViews`
			// is the same before and after the unit conversion.
			currentShare: sharePercentage( item.views, maxViews ),
			previousValue: previousValue === undefined ? undefined : toDisplayValue( previousValue ),
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
					dataFormat={ isShare ? PERCENTAGE_DATA_FORMAT : COUNT_DATA_FORMAT }
				/>
			</WidgetState>
		</div>
	);
}

/**
 * Screen size, browser, or OS breakdown as a ranked leaderboard. The active
 * dimension is the `platformDimension` attribute (`relevance: 'high'`), exposed
 * as a control by the widget host.
 */
export default function TopPlatformsWidget( { attributes = {} }: TopPlatformsWidgetProps ) {
	const max = attributes.max ?? 10;
	// Attributes are persisted, so a stale layout can name a dimension this
	// widget no longer knows. Unchecked it becomes the `stats/devices/{property}`
	// path segment, which WPCOM rejects with a 400.
	const storedDimension = attributes.platformDimension ?? 'browser';
	const platformDimension = isPlatformDimension( storedDimension ) ? storedDimension : 'browser';

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<TopPlatformsInner max={ max } platformDimension={ platformDimension } />
			</div>
		</WidgetRoot>
	);
}
