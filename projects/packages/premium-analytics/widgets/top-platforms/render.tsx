/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
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

const MODE_OPTIONS = [
	{ label: __( 'Browser', 'jetpack-premium-analytics' ), value: 'browser' },
	{ label: __( 'OS', 'jetpack-premium-analytics' ), value: 'platform' },
] as const;

type PlatformMode = 'browser' | 'platform';

/**
 * Inner component — rendered inside WidgetRoot.
 *
 * @param props     - Props.
 * @param props.max - Max rows to display.
 * @return The rendered leaderboard or state placeholder.
 */
function TopPlatformsInner( { max }: { max: number } ) {
	const { reportParams } = useWidgetRootContext();
	const [ mode, setMode ] = useState< PlatformMode >( 'browser' );

	const handleModeChange = useCallback( ( value: string ) => {
		setMode( value as PlatformMode );
	}, [] );

	const { data, comparisonData, hasComparison, isLoading, isError, errorReason } = usePlatformViews(
		{
			reportParams,
			max,
			deviceProperty: mode,
		}
	);

	const bodyHeader = (
		<Stack direction="row" justify="flex-end" align="center" className={ styles.bodyHeader }>
			<SelectControl
				__nextHasNoMarginBottom
				label={ __( 'View by', 'jetpack-premium-analytics' ) }
				hideLabelFromVision
				value={ mode }
				options={ MODE_OPTIONS }
				onChange={ handleModeChange }
				className={ styles.modeSelect }
			/>
		</Stack>
	);

	if ( isError ) {
		return (
			<div className={ styles.content }>
				{ bodyHeader }
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
			</div>
		);
	}

	if ( isLoading && data.length === 0 ) {
		return (
			<div className={ styles.content }>
				{ bodyHeader }
				<WidgetLoadingOverlay />
			</div>
		);
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
		<div className={ styles.content }>
			{ bodyHeader }
			<LeaderboardChart
				data={ leaderboardData }
				loading={ isLoading }
				withComparison={ hasComparison }
				withOverlayLabel
				showLegend={ false }
				emptyStateText={ __( 'No platform data in this period.', 'jetpack-premium-analytics' ) }
				dataFormat={ DATA_FORMAT }
			/>
		</div>
	);
}

/**
 * Top Platforms widget render component.
 *
 * Shows browser or OS breakdown as a ranked leaderboard. The active
 * dimension is switched via a runtime dropdown in the widget body.
 *
 * @param props            - Render props.
 * @param props.attributes - Widget attributes (max).
 * @return The rendered widget content.
 */
export default function TopPlatformsWidget( { attributes }: TopPlatformsWidgetProps ) {
	const max = attributes?.max ?? 10;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<TopPlatformsInner max={ max } />
			</div>
		</WidgetRoot>
	);
}
