import { BarChart, parseAsLocalDate } from '@automattic/charts';
import { formatNumber } from '@automattic/number-formatters';
import { Card, CardBody, Spinner } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { formatPodcastDate } from '../lib/format';
import { getPeriodDayCount } from '../range';
import type { PodcastStatsPeriod, PodcastStatsRange } from '../types';
import type { ReactNode } from 'react';

type StatsByDayChartProps = {
	byDay?: Record< string, number >;
	range?: PodcastStatsRange;
	period: PodcastStatsPeriod;
	isLoading?: boolean;
	children?: ReactNode;
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

const StatsByDayChart = ( {
	byDay = {},
	range,
	period,
	isLoading = false,
	children,
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

	const seriesData = useMemo(
		() => [ { label: downloadsLabel, data: chartData } ],
		[ downloadsLabel, chartData ]
	);

	const total = useMemo(
		() => chartData.reduce( ( sum, datum ) => sum + datum.value, 0 ),
		[ chartData ]
	);

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
							x: { tickFormat: formatAxisTick },
						},
						yScale: { type: 'linear', zero: true },
					} }
				/>
			</div>
		);
	}

	return (
		<Card className="podcast-stats__section-card podcast-stats-chart">
			<CardBody className="podcast-stats-chart__body">
				<div className="podcast-stats-chart__header">
					<h3 className="podcast-stats__section-title">{ downloadsLabel }</h3>
					{ rangeLabel && <p className="podcast-stats__section-metric">{ rangeLabel }</p> }
				</div>
				{ chartContent }
				{ children && <div className="podcast-stats-chart__summary">{ children }</div> }
			</CardBody>
		</Card>
	);
};

export default StatsByDayChart;
