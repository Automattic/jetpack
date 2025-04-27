import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { curveMonotoneX } from '@visx/curve';
import { LegendOrdinal } from '@visx/legend';
import { ParentSize } from '@visx/responsive';
import { scaleOrdinal } from '@visx/scale';
import { Axis, Grid, LineSeries, Tooltip, XYChart, buildChartTheme } from '@visx/xychart';
import { useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { SERIES_COLORS, SERIES_LABELS, TRACKS_EVENT_NAME_PREFIX } from '../constants';
import {
	calcLeftAxisMargin,
	formatAxisTickDate,
	formatDate,
	formatNumber,
	getXAxisTickValues,
	transformData,
} from '../helpers';
import type { SubscriberTotalsByDate, ChartSubscriptionDataPoint } from '../types';
import type {
	RenderTooltipGlyphProps,
	RenderTooltipParams,
} from '@visx/xychart/lib/components/Tooltip';

// Create a scale for the legend
const legendScale = scaleOrdinal( {
	domain: [ 'all', 'paid' ],
	range: [ SERIES_COLORS.all, SERIES_COLORS.paid ],
} );

const chartTheme = buildChartTheme( {
	backgroundColor: 'white',
	colors: [ SERIES_COLORS.all, SERIES_COLORS.paid ],
	gridColor: '#e0e0e0',
	gridColorDark: '#e0e0e0',
	tickLength: 0,
	gridStyles: {
		strokeWidth: 1,
	},
	svgLabelSmall: {
		fill: '#1e1e1e',
		fontSize: 13,
		fontWeight: 400,
	},
} );

// Chart accessors
const getDate = ( d: ChartSubscriptionDataPoint ) => d.date;
const getAllSubscribers = ( d: ChartSubscriptionDataPoint ) => d.all;
const getPaidSubscribers = ( d: ChartSubscriptionDataPoint ) => d.paid;
const getLineColor = ( k: string ) => SERIES_COLORS[ k ];
const getLegendLabel = ( k: string ) => SERIES_LABELS[ k ];

// Custom rendering for tooltip glyphs to match the line colors
const renderGlyph = ( {
	key,
	color,
	x,
	y,
}: RenderTooltipGlyphProps< ChartSubscriptionDataPoint > ) => {
	const fillColor = SERIES_COLORS[ key ] || color;

	return (
		<circle
			key={ `glyph-${ key }` }
			cx={ x }
			cy={ y }
			r={ 4 }
			fill={ fillColor }
			stroke="white"
			strokeWidth={ 2 }
		/>
	);
};

const renderTooltip = ( { tooltipData }: RenderTooltipParams< ChartSubscriptionDataPoint > ) => {
	if ( ! tooltipData?.nearestDatum ) return null;

	const datum = tooltipData.nearestDatum.datum;
	const date = getDate( datum );

	return (
		<>
			<div className="subscribers-chart__tooltip-date">{ formatDate( date, 'full' ) }</div>
			<div className="subscribers-chart__tooltip-stats">
				<div className="subscribers-chart__tooltip-stat">
					<div
						style={ { backgroundColor: SERIES_COLORS.all } }
						className="subscribers-chart__tooltip-indicator"
					/>

					<span>
						{ sprintf(
							// translators: %s is the total number of subscribers.
							__( 'All: %s', 'jetpack' ),
							formatNumber( getAllSubscribers( datum ) )
						) }
					</span>
				</div>
				<div className="subscribers-chart__tooltip-stat">
					<div
						style={ { backgroundColor: SERIES_COLORS.paid } }
						className="subscribers-chart__tooltip-indicator"
					/>
					<span>
						{ sprintf(
							// translators: %s is the number of paid subscribers.
							__( 'Paid: %s', 'jetpack' ),
							formatNumber( getPaidSubscribers( datum ) )
						) }
					</span>
				</div>
			</div>
		</>
	);
};

interface SubscribersChartProps {
	subscriberTotalsByDate: SubscriberTotalsByDate;
}

export const SubscribersChart = ( { subscriberTotalsByDate }: SubscribersChartProps ) => {
	const { tracks } = useAnalytics();

	useEffect( () => {
		tracks.recordEvent( `${ TRACKS_EVENT_NAME_PREFIX }chart_view` );
	}, [ tracks ] );

	if ( Object.keys( subscriberTotalsByDate ).length === 0 ) {
		return <div>{ __( 'No data available', 'jetpack' ) }</div>;
	}

	const data = transformData( subscriberTotalsByDate );

	return (
		<>
			<div className="subscribers-chart">
				<ParentSize>
					{ ( { width, height } ) => {
						if ( ! width || ! height ) return null;

						return (
							<XYChart
								height={ height }
								width={ width }
								xScale={ { type: 'time' } }
								yScale={ { type: 'linear', nice: true } }
								theme={ chartTheme }
								margin={ { top: 10, right: 30, bottom: 30, left: calcLeftAxisMargin( data ) } }
							>
								<Grid columns={ false } numTicks={ 5 } />

								<LineSeries
									dataKey="all"
									data={ data }
									xAccessor={ getDate }
									yAccessor={ getAllSubscribers }
									colorAccessor={ getLineColor }
									strokeWidth={ 2 }
									curve={ curveMonotoneX }
								/>

								<LineSeries
									dataKey="paid"
									data={ data }
									xAccessor={ getDate }
									yAccessor={ getPaidSubscribers }
									colorAccessor={ getLineColor }
									strokeWidth={ 2 }
									curve={ curveMonotoneX }
								/>

								<Axis orientation="left" hideAxisLine hideTicks hideZero numTicks={ 5 } />

								<Axis
									orientation="bottom"
									tickFormat={ formatAxisTickDate }
									hideAxisLine
									hideTicks
									numTicks={ 5 }
									tickValues={ getXAxisTickValues( data ) }
								/>

								<Tooltip< ChartSubscriptionDataPoint >
									showVerticalCrosshair
									showSeriesGlyphs
									className="subscribers-chart__tooltip"
									renderTooltip={ renderTooltip }
									renderGlyph={ renderGlyph }
								/>
							</XYChart>
						);
					} }
				</ParentSize>
			</div>
			<LegendOrdinal
				scale={ legendScale }
				direction="row"
				labelFormat={ getLegendLabel }
				shape="circle"
				shapeWidth={ 10 }
				shapeHeight={ 10 }
				itemMargin={ 5 }
				className="subscribers-chart__legend"
			/>
		</>
	);
};
