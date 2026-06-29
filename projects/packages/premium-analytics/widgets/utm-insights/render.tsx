/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import {
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
import useUtmInsights from './use-utm-insights';
import type { UtmInsightsAttributes } from './widget';
/**
 * Types
 */
import type { StatsUtmParam } from '@jetpack-premium-analytics/data';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type UtmInsightsRenderAttributes = UtmInsightsAttributes & Partial< ReportParamsFieldAttributes >;

const DATA_FORMAT = { type: 'number' as const, options: { useMultipliers: true, decimals: 0 } };

const DEFAULT_UTM_PARAM: StatsUtmParam = 'utm_source,utm_medium';

const UTM_PARAM_OPTIONS: { label: string; value: StatsUtmParam }[] = [
	{
		label: __( 'Source / Medium', 'jetpack-premium-analytics' ),
		value: 'utm_source,utm_medium',
	},
	{
		label: __( 'Campaign / Source / Medium', 'jetpack-premium-analytics' ),
		value: 'utm_campaign,utm_source,utm_medium',
	},
	{ label: __( 'Source', 'jetpack-premium-analytics' ), value: 'utm_source' },
	{ label: __( 'Medium', 'jetpack-premium-analytics' ), value: 'utm_medium' },
	{ label: __( 'Campaign', 'jetpack-premium-analytics' ), value: 'utm_campaign' },
];

type UtmInsightsInnerProps = {
	utmParam: StatsUtmParam;
	max: number;
	setAttributes: WidgetRenderProps< UtmInsightsRenderAttributes >[ 'setAttributes' ];
};

/**
 * Inner component — rendered inside WidgetRoot.
 *
 * @param props               - Props.
 * @param props.utmParam      - Active UTM dimension.
 * @param props.max           - Max rows to display.
 * @param props.setAttributes - Widget attribute setter (persists utmParam selection).
 * @return The rendered leaderboard or state placeholder.
 */
function UtmInsightsInner( { utmParam, max, setAttributes }: UtmInsightsInnerProps ) {
	const { reportParams } = useWidgetRootContext();

	const handleParamChange = useCallback(
		( value: string ) => {
			setAttributes( { utmParam: value as StatsUtmParam } );
		},
		[ setAttributes ]
	);

	const { data, isLoading, isError } = useUtmInsights( { reportParams, utmParam, max } );

	if ( isError ) {
		return (
			<Stack align="center" justify="center" className={ styles.placeholder }>
				<Text>{ __( 'Could not load UTM data.', 'jetpack-premium-analytics' ) }</Text>
			</Stack>
		);
	}

	if ( isLoading && data.length === 0 ) {
		return <WidgetLoadingOverlay />;
	}

	const maxValue = Math.max( ...data.map( d => d.value ), 1 );
	const leaderboardData: LeaderboardChartData = data.map( ( item, index ) => ( {
		id: `${ index }-${ item.label }`,
		label: (
			<Stack align="center" className={ styles.itemLabel }>
				<Text>{ item.label }</Text>
			</Stack>
		),
		currentValue: item.value,
		currentShare: ( item.value / maxValue ) * 100,
		previousValue: 0,
		previousShare: 0,
		delta: 0,
	} ) );

	return (
		<>
			<Stack
				direction="row"
				justify="space-between"
				align="center"
				className={ styles.widgetHeader }
			>
				<Text variant="heading-md" render={ <h3 /> }>
					{ __( 'UTM Insights', 'jetpack-premium-analytics' ) }
				</Text>
				<SelectControl
					__nextHasNoMarginBottom
					label={ __( 'UTM parameter', 'jetpack-premium-analytics' ) }
					hideLabelFromVision
					value={ utmParam }
					options={ UTM_PARAM_OPTIONS }
					onChange={ handleParamChange }
					className={ styles.paramSelect }
				/>
			</Stack>
			<div className={ styles.content }>
				<LeaderboardChart
					data={ leaderboardData }
					loading={ isLoading }
					withOverlayLabel
					showLegend={ false }
					emptyStateText={ __( 'No UTM data in this period.', 'jetpack-premium-analytics' ) }
					dataFormat={ DATA_FORMAT }
				/>
			</div>
		</>
	);
}

/**
 * UTM Insights widget render component.
 *
 * Shows traffic breakdown by UTM parameter as a ranked leaderboard. The active
 * dimension (source/medium, campaign, etc.) is switched via a dropdown in the
 * widget header and persisted in widget attributes.
 *
 * @param props               - Render props.
 * @param props.attributes    - Widget attributes (utmParam, max).
 * @param props.setAttributes - Attribute setter.
 * @return The rendered widget content.
 */
export default function UtmInsightsWidget( {
	attributes = {},
	setAttributes,
}: WidgetRenderProps< UtmInsightsRenderAttributes > ) {
	const utmParam = attributes.utmParam ?? DEFAULT_UTM_PARAM;
	const max = attributes.max ?? 10;

	return (
		<WidgetRoot attributes={ attributes }>
			<div className={ styles.root }>
				<UtmInsightsInner utmParam={ utmParam } max={ max } setAttributes={ setAttributes } />
			</div>
		</WidgetRoot>
	);
}
