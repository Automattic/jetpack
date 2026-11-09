import { BarChart } from '@automattic/charts';
import { dateI18n } from '@wordpress/date';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Tabs, Text } from '@wordpress/ui';
import { dayLabel, formatCount } from '../../../data/dates';
import { chartScale, chartTicks, hourFormat } from './dashboard-state';
import type { ChartBucket, ChartUnit, Metric } from './dashboard-state';
import type { DataPointDate } from '@automattic/charts';
import type { ReactNode } from 'react';
import '@automattic/charts/style.css';

type Props = {
	metrics: Metric[];
	/** The bars, oldest first; the metrics' series follow them. */
	buckets: ChartBucket[];
	unit: ChartUnit;
	/** The period and unit, so each gets its own chart. */
	chartKey: string;
	/** Phone width, where fewer labels fit. */
	narrow?: boolean;
};

type TooltipParams = { tooltipData?: { nearestDatum?: { datum: DataPointDate } } };

const HOUR_MS = 3600000;

/**
 * Two labels as one span, e.g. "2 pm – 3 pm" or "Oct 6 – Oct 12".
 *
 * @param first - The first label.
 * @param last  - The last label.
 * @return The span.
 */
const span = ( first: string, last: string ) =>
	/* translators: 1: where it starts, 2: where it ends, e.g. "Oct 6 – Oct 12". */
	sprintf( __( '%1$s – %2$s', 'jetpack-send-pkg' ), first, last );

/**
 * A bar's label under the chart: its hour, day or week's first day, or "Now", "Today" and
 * "This week" for the one still filling up.
 *
 * @param bucket - The bar.
 * @param unit   - What a bar stands for.
 * @return The label.
 */
function tickLabel( bucket: ChartBucket, unit: ChartUnit ): string {
	if ( unit === 'hour' ) {
		return bucket.partial ? __( 'Now', 'jetpack-send-pkg' ) : dateI18n( hourFormat(), bucket.date );
	}
	if ( bucket.partial ) {
		return unit === 'week'
			? __( 'This week', 'jetpack-send-pkg' )
			: __( 'Today', 'jetpack-send-pkg' );
	}
	return dayLabel( bucket.start );
}

/**
 * A bar's tooltip title: "2 pm – 3 pm", "Mon, Oct 13", or "Oct 6 – Oct 12".
 *
 * @param bucket - The bar.
 * @param unit   - What a bar stands for.
 * @return The title.
 */
function tooltipTitle( bucket: ChartBucket, unit: ChartUnit ): string {
	if ( unit === 'hour' ) {
		const format = hourFormat();
		return span(
			dateI18n( format, bucket.date ),
			dateI18n( format, new Date( bucket.date.getTime() + HOUR_MS ) )
		);
	}
	if ( unit === 'week' ) {
		return span( dayLabel( bucket.start ), dayLabel( bucket.end ) );
	}
	return dayLabel( bucket.start, 'D, M j' );
}

/**
 * Metric cards that switch one bar chart, ported from the Jetpack Stats overview's chart tabs.
 * Every tab owns its own chart, and arrow keys switch the chart as they move focus.
 *
 * @param props          - Component props.
 * @param props.metrics  - The metrics, in tab order.
 * @param props.buckets  - The bars.
 * @param props.unit     - What a bar stands for.
 * @param props.chartKey - The period and unit.
 * @param props.narrow   - Phone width.
 * @return The tabs and chart.
 */
const MetricTabs = ( { metrics, buckets, unit, chartKey, narrow = false }: Props ) => {
	const [ selected, setSelected ] = useState< Metric[ 'key' ] >( metrics[ 0 ]?.key ?? 'emails' );
	const byTime = useMemo(
		() => new Map( buckets.map( bucket => [ bucket.date.getTime(), bucket ] ) ),
		[ buckets ]
	);
	const ticks = useMemo(
		() =>
			chartTicks(
				buckets.map( bucket => bucket.date ),
				unit,
				narrow
			),
		[ buckets, unit, narrow ]
	);
	const tickFormat = useCallback(
		( value: unknown ) => {
			const time = value instanceof Date ? value.getTime() : Number( value );
			const bucket = byTime.get( time );
			return bucket ? tickLabel( bucket, unit ) : '';
		},
		[ byTime, unit ]
	);
	const renderTooltip = useCallback(
		( { tooltipData }: TooltipParams ): ReactNode => {
			const datum = tooltipData?.nearestDatum?.datum;
			const bucket = datum?.date ? byTime.get( datum.date.getTime() ) : undefined;
			if ( ! datum || ! bucket ) {
				return null;
			}
			const count = datum.value ?? 0;
			return (
				<span className="jetpack-send-metric-tabs__tooltip">
					<Text variant="body-md">{ tooltipTitle( bucket, unit ) }</Text>
					<Text variant="body-md" className="jetpack-send-metric-tabs__tooltip-value">
						{ bucket.partial
							? sprintf(
									/* translators: %s: number of emails in the hour, day or week so far. */
									_n( '%s email so far', '%s emails so far', count, 'jetpack-send-pkg' ),
									formatCount( count )
								)
							: sprintf(
									/* translators: %s: number of emails. */
									_n( '%s email', '%s emails', count, 'jetpack-send-pkg' ),
									formatCount( count )
								) }
					</Text>
				</span>
			);
		},
		[ byTime, unit ]
	);
	const chartOptions = ( values: number[] ) => {
		const scale = chartScale( values );
		return {
			yScale: { domain: [ 0, scale.max ] as [ number, number ] },
			axis: {
				x: { tickValues: ticks, tickFormat },
				y: { tickValues: scale.ticks },
			},
		};
	};
	const perUnit = ( label: string ) => {
		if ( unit === 'hour' ) {
			/* translators: %s: a metric, like "Sent". */
			return sprintf( __( '%s per hour', 'jetpack-send-pkg' ), label );
		}
		if ( unit === 'week' ) {
			/* translators: %s: a metric, like "Sent". */
			return sprintf( __( '%s per week', 'jetpack-send-pkg' ), label );
		}
		/* translators: %s: a metric, like "Sent". */
		return sprintf( __( '%s per day', 'jetpack-send-pkg' ), label );
	};

	return (
		<Tabs.Root
			value={ selected }
			onValueChange={ setSelected }
			className="jetpack-send-metric-tabs"
		>
			<Tabs.List
				variant="minimal"
				activateOnFocus
				aria-label={ __( 'Email activity', 'jetpack-send-pkg' ) }
				className="jetpack-send-metric-tabs__list"
			>
				{ metrics.map( metric => (
					<Tabs.Tab
						key={ metric.key }
						value={ metric.key }
						className="jetpack-send-metric-tabs__tab"
					>
						<span className="jetpack-send-metric-tabs__content">
							<Text variant="body-lg" className="jetpack-send-muted">
								{ metric.label }
							</Text>
							<Text
								variant="heading-2xl"
								className={ metric.value === 0 ? 'jetpack-send-muted' : undefined }
							>
								{ formatCount( metric.value ) }
							</Text>
						</span>
					</Tabs.Tab>
				) ) }
			</Tabs.List>
			{ metrics.map( metric => (
				<Tabs.Panel
					key={ metric.key }
					value={ metric.key }
					className={ `jetpack-send-metric-tabs__chart jetpack-send-metric-tabs__chart--${ metric.key }` }
				>
					<BarChart
						chartId={ `jetpack-send-${ metric.key }-${ chartKey }` }
						ariaLabel={ perUnit( metric.label ) }
						data={ [ { label: metric.label, data: metric.series } ] }
						withTooltips
						renderTooltip={ renderTooltip }
						showZeroValues={ false }
						showLegend={ false }
						options={ chartOptions( metric.series.map( point => point.value ) ) }
					/>
				</Tabs.Panel>
			) ) }
		</Tabs.Root>
	);
};

export default MetricTabs;
