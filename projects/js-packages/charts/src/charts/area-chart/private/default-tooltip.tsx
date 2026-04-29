import { formatNumber } from '@automattic/number-formatters';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import styles from '../area-chart.module.scss';
import type { DataPoint, DataPointDate, SeriesData } from '../../../types';
import type { AreaChartTooltipDatum } from '../types';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';

// Default tooltip content for AreaChart: hovered date as a heading and one
// `label: value` row per visible series, sorted descending by value so the
// largest contributor reads first. The tooltip wrapper background is
// intentionally not painted here — visx's `TooltipInPortal` already draws
// the active theme's `backgroundColor`.
export const renderDefaultTooltip = ( params: RenderTooltipParams< DataPointDate > ) => {
	const { tooltipData } = params;
	const nearestDatum = tooltipData?.nearestDatum?.datum;
	if ( ! nearestDatum ) return null;

	const tooltipPoints: AreaChartTooltipDatum[] = Object.entries( tooltipData?.datumByKey || {} )
		.map( ( [ key, { datum } ] ) => ( {
			key,
			value: datum.value as number,
		} ) )
		.sort( ( a, b ) => b.value - a.value );

	return (
		<div className={ styles[ 'area-chart__tooltip' ] }>
			<div className={ styles[ 'area-chart__tooltip-date' ] }>
				{ nearestDatum.date?.toLocaleDateString() }
			</div>
			{ tooltipPoints.map( point => (
				<Stack
					key={ point.key }
					direction="row"
					align="center"
					justify="space-between"
					className={ styles[ 'area-chart__tooltip-row' ] }
				>
					<span className={ styles[ 'area-chart__tooltip-label' ] }>{ point.key }:</span>
					<span>{ formatNumber( point.value ) }</span>
				</Stack>
			) ) }
		</div>
	);
};

// Up-front data validation: returns a localised error message when the chart
// cannot safely render, otherwise `null`. Catches the cases that would
// otherwise NaN-cascade through the tick formatter and stack layout (empty
// top-level array, empty per-series data, null/NaN values, invalid dates).
export const validateData = ( data: SeriesData[] ) => {
	if ( ! data?.length ) return __( 'No data available', 'jetpack-charts' );

	// Reject empty series.data — downstream tick formatters and stack layout
	// don't tolerate it (Math.min(...[]) → Infinity → NaN cascades).
	const hasEmptySeries = data.some( series => ! series.data?.length );
	if ( hasEmptySeries ) return __( 'No data available', 'jetpack-charts' );

	const hasInvalidData = data.some( series =>
		series.data.some(
			( point: DataPointDate | DataPoint ) =>
				isNaN( point.value as number ) ||
				point.value === null ||
				point.value === undefined ||
				( 'date' in point && point.date && isNaN( point.date.getTime() ) )
		)
	);

	if ( hasInvalidData ) return __( 'Invalid data', 'jetpack-charts' );
	return null;
};
