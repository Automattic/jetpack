import { LineChart } from '@automattic/charts';
import '@automattic/charts/style.css';
import { SelectControl } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Stack } from '@wordpress/ui';
import type { ChartCompare, Granularity, StatsSeriesPoint } from '../../types/stats';
import type { ReactElement } from 'react';

type Props = {
	series: StatsSeriesPoint[];
	compare: ChartCompare;
	granularity: Granularity;
	isLoading: boolean;
	onChangeCompare: ( next: ChartCompare ) => void;
	onChangeGranularity: ( next: Granularity ) => void;
};

const CHART_HEIGHT = 240;

const COMPARE_OPTIONS: { label: string; value: ChartCompare }[] = [
	{ label: __( 'vs visitors', 'jetpack-videopress-pkg' ), value: 'visitors' },
	{ label: __( 'vs previous period', 'jetpack-videopress-pkg' ), value: 'previous_period' },
	{
		label: __( 'vs visitors / previous period', 'jetpack-videopress-pkg' ),
		value: 'visitors_and_previous_period',
	},
];

const GRANULARITY_OPTIONS: { label: string; value: Granularity }[] = [
	{ label: __( 'Days', 'jetpack-videopress-pkg' ), value: 'days' },
	{ label: __( 'Weeks', 'jetpack-videopress-pkg' ), value: 'weeks' },
	{ label: __( 'Months', 'jetpack-videopress-pkg' ), value: 'months' },
];

type ChartSeries = { label: string; data: { date: Date; value: number }[] };

/**
 * Build the chart's series list from the active stats series and the
 * compare selection. "Views" is always present; "Visitors" appears
 * unless compare is `previous_period`; "Previous period" appears unless
 * compare is `visitors`.
 *
 * @param series  - Active range's series points.
 * @param compare - Active compare selection.
 * @return Series list consumable by `@automattic/charts` LineChart.
 */
function buildSeriesData( series: StatsSeriesPoint[], compare: ChartCompare ): ChartSeries[] {
	const out: ChartSeries[] = [
		{
			label: __( 'Views', 'jetpack-videopress-pkg' ),
			data: series.map( p => ( { date: new Date( p.date ), value: p.views } ) ),
		},
	];
	if ( compare !== 'previous_period' ) {
		out.push( {
			label: __( 'Visitors', 'jetpack-videopress-pkg' ),
			data: series.map( p => ( { date: new Date( p.date ), value: p.visitors } ) ),
		} );
	}
	if ( compare !== 'visitors' ) {
		out.push( {
			label: __( 'Previous period', 'jetpack-videopress-pkg' ),
			data: series.map( p => ( { date: new Date( p.date ), value: p.previousPeriodViews } ) ),
		} );
	}
	return out;
}

/**
 * "Views trends" card: title + two right-aligned SelectControls + a
 * `@automattic/charts` LineChart. The chart auto-wraps with
 * GlobalChartsProvider when not already in one, so no explicit
 * ThemeProvider is needed here.
 *
 * @param props                     - Component props.
 * @param props.series              - Series points for the active range.
 * @param props.compare             - Currently selected compare.
 * @param props.granularity         - Currently selected granularity.
 * @param props.isLoading           - When true, the chart canvas is left blank but reserves height so the page does not reflow when data arrives.
 * @param props.onChangeCompare     - Called with the next compare value.
 * @param props.onChangeGranularity - Called with the next granularity.
 * @return The card element.
 */
export default function ViewsTrendsCard( {
	series,
	compare,
	granularity,
	isLoading,
	onChangeCompare,
	onChangeGranularity,
}: Props ): ReactElement {
	// Memoize data so the chart doesn't see new array/object identities on
	// every parent render — that re-triggers the chart's internal hooks
	// (legend registration, scale computation, …), which feeds back as
	// further parent renders and visibly grows the y-axis until the lines
	// flatten to invisibility.
	const chartData = useMemo( () => buildSeriesData( series, compare ), [ series, compare ] );

	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="row" justify="space-between" align="center" expanded>
					<Card.Title>{ __( 'Views trends', 'jetpack-videopress-pkg' ) }</Card.Title>
					<Stack direction="row" gap="sm">
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Compare', 'jetpack-videopress-pkg' ) }
							hideLabelFromVision
							value={ compare }
							options={ COMPARE_OPTIONS }
							onChange={ next => onChangeCompare( next as ChartCompare ) }
						/>
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Granularity', 'jetpack-videopress-pkg' ) }
							hideLabelFromVision
							value={ granularity }
							options={ GRANULARITY_OPTIONS }
							onChange={ next => onChangeGranularity( next as Granularity ) }
						/>
					</Stack>
				</Stack>
			</Card.Header>
			<Card.Content>
				<div className="vp-overview__chart-frame" style={ { height: CHART_HEIGHT } }>
					{ ! isLoading && (
						<LineChart
							data={ chartData }
							showLegend
							withGradientFill={ false }
							height={ CHART_HEIGHT }
						/>
					) }
				</div>
			</Card.Content>
		</Card.Root>
	);
}
