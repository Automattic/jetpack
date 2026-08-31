import { BarChart, parseAsLocalDate } from '@automattic/charts';
import { formatNumber } from '@automattic/number-formatters';
import { Spinner } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { formatPodcastDate } from '../lib/format';
import { getPeriodDayCount } from '../range';
import SectionCard from './section-card';
import type { PodcastStatsPeriod, PodcastStatsRange } from '../types';
import type { ReactNode } from 'react';

type StatsByDayChartProps = {
	byDay?: Record< string, number >;
	range?: PodcastStatsRange;
	period: PodcastStatsPeriod;
	isLoading?: boolean;
	summary?: ReactNode;
};

type DownloadDatum = {
	dateString: string;
	value: number;
};

const AXIS_DATE_FORMATTER = new Intl.DateTimeFormat( undefined, {
	month: 'short',
	day: 'numeric',
} );

const formatAxisTick = ( value: unknown ) => {
	let date: Date;
	if ( value instanceof Date ) {
		date = value;
	} else if ( typeof value === 'number' ) {
		date = new Date( value );
	} else {
		date = parseAsLocalDate( String( value ) );
	}
	return Number.isNaN( date.getTime() ) ? String( value ) : AXIS_DATE_FORMATTER.format( date );
};

// Pick a step that yields integer ticks at roughly 5 stops, so the axis reads
// like wpcom Stats (0, 5, 10) instead of visx's default fractional ticks
// (0, 0.2, 0.4) when daily downloads are small. Walks the 1-2-5 ladder across
// magnitudes so the cadence stays consistent past 500 too.
const computeIntegerTicks = (
	max: number
): { domain: [ number, number ]; tickValues: number[] } => {
	const normalizedMax = Number.isFinite( max ) ? Math.max( max, 0 ) : 0;
	const target = Math.max( normalizedMax, 1 );
	const roughStep = Math.max( target / 5, 1 );
	const magnitude = Math.pow( 10, Math.floor( Math.log10( roughStep ) ) );
	const normalizedStep = roughStep / magnitude;
	let stepMultiplier = 10;
	if ( normalizedStep <= 1 ) {
		stepMultiplier = 1;
	} else if ( normalizedStep <= 2 ) {
		stepMultiplier = 2;
	} else if ( normalizedStep <= 5 ) {
		stepMultiplier = 5;
	}
	const step = magnitude * stepMultiplier;
	const domainMax = Math.max( Math.ceil( normalizedMax / step ) * step, step * 5 );
	const tickValues: number[] = [];
	for ( let tick = 0; tick <= domainMax; tick += step ) {
		tickValues.push( tick );
	}
	return { domain: [ 0, domainMax ], tickValues };
};

const StatsByDayChart = ( {
	byDay = {},
	range,
	period,
	isLoading = false,
	summary,
}: StatsByDayChartProps ) => {
	const downloadsLabel = __( 'Downloads', 'jetpack-podcast' );

	const chartData: DownloadDatum[] = useMemo(
		() =>
			Object.entries( byDay )
				.sort( ( [ a ], [ b ] ) => a.localeCompare( b ) )
				.map( ( [ date, plays ] ) => ( {
					dateString: date,
					value: plays,
				} ) ),
		[ byDay ]
	);

	// @automattic/charts uses options.stroke as the per-series bar color override.
	const seriesData = useMemo(
		() => [ { label: downloadsLabel, data: chartData, options: { stroke: '#3858e9' } } ],
		[ downloadsLabel, chartData ]
	);

	const total = useMemo(
		() => chartData.reduce( ( sum, datum ) => sum + datum.value, 0 ),
		[ chartData ]
	);

	const { domain: yDomain, tickValues: yTickValues } = useMemo( () => {
		const max = chartData.reduce( ( m, datum ) => Math.max( m, datum.value ), 0 );
		return computeIntegerTicks( max );
	}, [ chartData ] );

	// BarChart's default numTicks: 4 leaves the x-axis sparse for 30/90-day
	// ranges; bump toward 15 so the cadence reads like wpcom Stats. Cap at the
	// number of bars to avoid duplicates on short ranges.
	const xNumTicks = Math.min( chartData.length || 1, 15 );

	const rangeDays = getPeriodDayCount( period, range );
	const rangeLabel =
		period === 'all' && range
			? sprintf(
					/* translators: %d is the number of days. */
					_n(
						'Daily downloads, last %d day',
						'Daily downloads, last %d days',
						rangeDays,
						'jetpack-podcast'
					),
					rangeDays
			  )
			: undefined;

	const chartAriaLabel = sprintf(
		/* translators: 1: number of days, 2: total downloads in the period. */
		_n(
			'Daily downloads bar chart, %1$d day, %2$s total downloads.',
			'Daily downloads bar chart, %1$d days, %2$s total downloads.',
			rangeDays,
			'jetpack-podcast'
		),
		rangeDays,
		formatNumber( total )
	);

	const renderTooltip = useCallback( ( tooltipProps: unknown ) => {
		const datum = (
			tooltipProps as { tooltipData?: { nearestDatum?: { datum?: DownloadDatum } } } | undefined
		 )?.tooltipData?.nearestDatum?.datum;
		if ( ! datum?.dateString ) {
			return null;
		}
		return (
			<div className="podcast-stats-chart__tooltip">
				<strong>{ formatPodcastDate( datum.dateString ) }</strong>
				<span className="podcast-stats-chart__tooltip-value">
					{ formatNumber( Number( datum.value ?? 0 ) ) }
				</span>
			</div>
		);
	}, [] );

	let chartContent;
	if ( isLoading ) {
		chartContent = (
			<div className="podcast-stats-chart__loading">
				<Spinner />
			</div>
		);
	} else if ( chartData.length === 0 ) {
		chartContent = (
			<p className="podcast-stats__section-empty">
				{ __( 'No daily download data in this period.', 'jetpack-podcast' ) }
			</p>
		);
	} else {
		chartContent = (
			<div className="podcast-stats-chart__chart" role="img" aria-label={ chartAriaLabel }>
				<BarChart
					data={ seriesData }
					height={ 280 }
					withTooltips
					showLegend={ false }
					gridVisibility="y"
					margin={ { top: 10, right: 16, bottom: 24, left: 32 } }
					renderTooltip={ renderTooltip }
					options={ {
						axis: {
							x: { tickFormat: formatAxisTick, numTicks: xNumTicks },
							y: { tickValues: yTickValues },
						},
						yScale: { type: 'linear', zero: true, nice: false, domain: yDomain },
					} }
				/>
			</div>
		);
	}

	// Render the SummaryTiles (passed via children) regardless of loading/empty
	// so the user sees per-tile loading skeletons rather than a single page-wide spinner.
	return (
		<SectionCard className="podcast-stats-chart" title={ downloadsLabel } metric={ rangeLabel }>
			{ chartContent }
			{ summary && <div className="podcast-stats-chart__summary">{ summary }</div> }
		</SectionCard>
	);
};

export default StatsByDayChart;
