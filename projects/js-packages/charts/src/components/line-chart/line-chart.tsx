import { formatNumberCompact } from '@automattic/number-formatters';
import { curveCatmullRom, curveLinear, curveMonotoneX } from '@visx/curve';
import { LinearGradient } from '@visx/gradient';
import { XYChart, AreaSeries, Tooltip, Grid, Axis, DataContext } from '@visx/xychart';
import clsx from 'clsx';
import { useId, useMemo, useContext } from 'react';
import { useXYChartTheme, useChartTheme } from '../../providers/theme/theme-provider';
import { Legend } from '../legend';
import { parseAsLocalDate } from '../shared/date-parsing';
import { DefaultGlyph } from '../shared/default-glyph';
import { useChartMargin } from '../shared/use-chart-margin';
import { useElementHeight } from '../shared/use-element-height';
import { withResponsive } from '../shared/with-responsive';
import LineChartAnnotation from './line-chart-annotation';
import styles from './line-chart.module.scss';
import type { LineChartAnnotationProps } from './line-chart-annotation';
import type { BaseChartProps, DataPoint, DataPointDate, SeriesData } from '../../types';
import type { TickFormatter } from '@visx/axis';
import type { GlyphProps } from '@visx/xychart';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import type { FC, ReactNode } from 'react';

type CurveType = 'smooth' | 'linear' | 'monotone';

const X_TICK_WIDTH = 100;

export type RenderLineStartGlyphProps< Datum extends object > = GlyphProps< Datum > & {
	glyphStyle?: React.SVGProps< SVGCircleElement >;
};

const defaultRenderGlyph = < Datum extends object >(
	props: RenderLineStartGlyphProps< Datum >
) => {
	return <DefaultGlyph { ...props } key={ props.key } />;
};

const toNumber = ( val?: number | string | null ): number | undefined => {
	const num = typeof val === 'number' ? val : parseFloat( val );
	return isNaN( num ) ? undefined : num;
};

const StartGlyph: FC< {
	data: SeriesData;
	index: number;
	color: string;
	renderGlyph: < Datum extends object >( props: RenderLineStartGlyphProps< Datum > ) => ReactNode;
	accessors: {
		xAccessor: ( d: DataPointDate | DataPoint ) => Date;
		yAccessor: ( d: DataPointDate | DataPoint ) => number | null;
	};
	glyphStyle?: React.SVGProps< SVGCircleElement >;
} > = ( { data, index, color, glyphStyle, renderGlyph, accessors } ) => {
	const { xScale, yScale } = useContext( DataContext ) || {};
	if ( ! xScale || ! yScale ) return null;

	if ( data.data.length === 0 ) return null;

	const firstPoint = data.data[ 0 ];

	const x = xScale( accessors.xAccessor( firstPoint ) );
	const y = yScale( accessors.yAccessor( firstPoint ) );

	if ( typeof x !== 'number' || typeof y !== 'number' ) return null;

	const size = Math.max( 0, toNumber( glyphStyle?.radius ) ?? 4 );

	return renderGlyph( {
		key: `start-glyph-${ data.label }`,
		index,
		datum: firstPoint,
		color,
		size,
		x,
		y,
		glyphStyle,
	} );
};

/**
 * Determines the curve type for the line chart based on the provided type and smoothing parameters
 *
 * @param {CurveType} type      - The explicit curve type to use
 * @param {boolean}   smoothing - Legacy smoothing parameter
 * @return The curve function to use for the line
 */
const getCurveType = ( type?: CurveType, smoothing?: boolean ) => {
	// If no type specified, use legacy smoothing behavior
	if ( ! type ) {
		return smoothing ? curveCatmullRom : curveLinear;
	}

	// Handle explicit curve types
	switch ( type ) {
		case 'smooth':
			return curveCatmullRom;
		case 'monotone':
			return curveMonotoneX;
		case 'linear':
			return curveLinear;
		default:
			return curveLinear;
	}
};

interface LineChartProps extends BaseChartProps< SeriesData[] > {
	withGradientFill: boolean;
	smoothing?: boolean;
	curveType?: CurveType;
	renderTooltip?: ( params: RenderTooltipParams< DataPointDate > ) => ReactNode;
	withStartGlyphs?: boolean;
	renderGlyph?: < Datum extends object >( props: GlyphProps< Datum > ) => ReactNode;
	glyphStyle?: React.SVGProps< SVGCircleElement >;
	withLegendGlyph: boolean;
	withTooltipCrosshairs?: {
		showVertical?: boolean;
		showHorizontal?: boolean;
	};
	annotations?: LineChartAnnotationProps[];
}

type TooltipDatum = {
	key: string;
	value: number;
};

const renderDefaultTooltip = ( params: RenderTooltipParams< DataPointDate > ) => {
	const { tooltipData } = params;
	const nearestDatum = tooltipData?.nearestDatum?.datum;
	if ( ! nearestDatum ) return null;

	const tooltipPoints: TooltipDatum[] = Object.entries( tooltipData?.datumByKey || {} )
		.map( ( [ key, { datum } ] ) => ( {
			key,
			value: datum.value as number,
		} ) )
		.sort( ( a, b ) => b.value - a.value );

	return (
		<div className={ styles[ 'line-chart__tooltip' ] }>
			<div className={ styles[ 'line-chart__tooltip-date' ] }>
				{ nearestDatum.date?.toLocaleDateString() }
			</div>
			{ tooltipPoints.map( point => (
				<div key={ point.key } className={ styles[ 'line-chart__tooltip-row' ] }>
					<span className={ styles[ 'line-chart__tooltip-label' ] }>{ point.key }:</span>
					<span className={ styles[ 'line-chart__tooltip-value' ] }>{ point.value }</span>
				</div>
			) ) }
		</div>
	);
};

const formatDateTick = ( timestamp: number ) => {
	const date = new Date( timestamp );
	return date.toLocaleDateString( undefined, {
		month: 'short',
		day: 'numeric',
	} );
};

const validateData = ( data: SeriesData[] ) => {
	if ( ! data?.length ) return 'No data available';

	const hasInvalidData = data.some( series =>
		series.data.some(
			point =>
				isNaN( point.value as number ) ||
				point.value === null ||
				point.value === undefined ||
				isNaN( point.date.getTime() )
		)
	);

	if ( hasInvalidData ) return 'Invalid data';
	return null;
};

const LineChart: FC< LineChartProps > = ( {
	data,
	width,
	height,
	className,
	margin,
	withTooltips = true,
	withTooltipCrosshairs,
	showLegend = false,
	legendOrientation = 'horizontal',
	legendAlignmentHorizontal = 'center',
	legendAlignmentVertical = 'bottom',
	renderGlyph = defaultRenderGlyph,
	glyphStyle = {},
	legendShape = 'line',
	withLegendGlyph = false,
	withGradientFill = false,
	smoothing = true,
	curveType,
	renderTooltip = renderDefaultTooltip,
	withStartGlyphs = false,
	options = {},
	annotations,
	onPointerDown = undefined,
	onPointerUp = undefined,
	onPointerMove = undefined,
	onPointerOut = undefined,
} ) => {
	const providerTheme = useChartTheme();
	const theme = useXYChartTheme( data );
	const chartId = useId(); // Ensure unique ids for gradient fill.
	const [ legendRef, legendHeight ] = useElementHeight< HTMLDivElement >();

	const dataSorted = useMemo(
		() =>
			data.map( series => ( {
				...series,
				data: series.data
					.map( point => ( {
						...point,
						date: point.date ? point.date : parseAsLocalDate( point.dateString ),
					} ) )
					.sort( ( a, b ) => a.date.getTime() - b.date.getTime() ),
			} ) ),
		[ data ]
	);

	const chartOptions = useMemo( () => {
		const xNumTicks = Math.min( dataSorted[ 0 ]?.data.length, Math.ceil( width / X_TICK_WIDTH ) );
		return {
			axis: {
				x: {
					orientation: 'bottom' as const,
					numTicks: xNumTicks,
					tickFormat: formatDateTick,
					...options?.axis?.x,
				},
				y: {
					orientation: 'left' as const,
					numTicks: 4,
					tickFormat: formatNumberCompact as TickFormatter< number >,
					...options?.axis?.y,
				},
			},
			xScale: {
				type: 'time' as const,
				...options?.xScale,
			},
			yScale: {
				type: 'linear' as const,
				nice: true,
				zero: false,
				...options?.yScale,
			},
		};
	}, [ options, dataSorted, width ] );

	const tooltipRenderGlyph = useMemo( () => {
		return ( props: GlyphProps< DataPointDate > ) => {
			const seriesIndex = dataSorted.findIndex(
				series => series.label === props.key || series.data.includes( props.datum as DataPointDate )
			);
			const themeGlyph = providerTheme.glyphs?.[ seriesIndex ];
			return themeGlyph ? themeGlyph( props ) : renderGlyph( props );
		};
	}, [ dataSorted, providerTheme.glyphs, renderGlyph ] );

	const defaultMargin = useChartMargin( height, chartOptions, dataSorted, theme );

	const error = validateData( dataSorted );
	if ( error ) {
		return <div className={ clsx( 'line-chart', styles[ 'line-chart' ] ) }>{ error }</div>;
	}

	// Create legend items from group labels, this iterates over groups rather than data points
	const legendItems = dataSorted.map( ( group, index ) => ( {
		label: group.label, // Label for each unique group
		value: '', // Empty string since we don't want to show a specific value
		color: group?.options?.stroke ?? providerTheme.colors[ index % providerTheme.colors.length ],
		shapeStyle: group?.options?.legendShapeStyle,
		renderGlyph: withLegendGlyph ? providerTheme.glyphs?.[ index ] ?? renderGlyph : undefined,
		glyphSize: Math.max( 0, toNumber( glyphStyle?.radius ) ?? 4 ),
	} ) );

	const accessors = {
		xAccessor: ( d: DataPointDate ) => d?.date,
		yAccessor: ( d: DataPointDate ) => d?.value,
	};

	return (
		<div
			className={ clsx( 'line-chart', styles[ 'line-chart' ], className ) }
			data-testid="line-chart"
			role="img"
			aria-label="line chart"
			style={ {
				width,
				height,
				position: 'relative',
			} }
		>
			<XYChart
				theme={ theme }
				width={ width }
				height={ height - ( showLegend ? legendHeight : 0 ) }
				margin={ {
					...defaultMargin,
					...margin,
					...( showLegend && legendAlignmentVertical === 'top'
						? { top: ( defaultMargin.top || 0 ) + legendHeight }
						: {} ),
				} }
				// xScale and yScale could be set in Axis as well, but they are `scale` props there.
				xScale={ chartOptions.xScale }
				yScale={ chartOptions.yScale }
				onPointerDown={ onPointerDown }
				onPointerUp={ onPointerUp }
				onPointerMove={ onPointerMove }
				onPointerOut={ onPointerOut }
				pointerEventsDataKey="nearest"
			>
				<Grid columns={ false } numTicks={ 4 } />
				<Axis { ...chartOptions.axis.x } />
				<Axis { ...chartOptions.axis.y } />

				{ dataSorted.map( ( seriesData, index ) => {
					const stroke = seriesData.options?.stroke ?? theme.colors[ index % theme.colors.length ];
					const lineProps =
						seriesData.options?.seriesLineStyle ??
						providerTheme?.seriesLineStyles?.[ index % providerTheme.seriesLineStyles.length ] ??
						{};
					return (
						<g key={ seriesData?.label || index }>
							{ withStartGlyphs && (
								<StartGlyph
									index={ index }
									data={ seriesData }
									color={ stroke }
									renderGlyph={ providerTheme.glyphs?.[ index ] ?? renderGlyph }
									accessors={ accessors }
									glyphStyle={ glyphStyle }
								/>
							) }

							{ withGradientFill && (
								<LinearGradient
									id={ `area-gradient-${ chartId }-${ index + 1 }` }
									from={ stroke }
									fromOpacity={ 0.4 }
									toOpacity={ 0.1 }
									to={ theme.backgroundColor }
									{ ...seriesData.options?.gradient }
									data-testid="line-gradient"
								/>
							) }
							<AreaSeries
								key={ seriesData?.label }
								dataKey={ seriesData?.label }
								data={ seriesData.data as DataPointDate[] }
								{ ...accessors }
								fill={
									withGradientFill
										? `url(#area-gradient-${ chartId }-${ index + 1 })`
										: 'transparent'
								}
								renderLine={ true }
								curve={ getCurveType( curveType, smoothing ) }
								lineProps={ lineProps }
							/>
						</g>
					);
				} ) }

				{ withTooltips && (
					<Tooltip
						detectBounds
						snapTooltipToDatumX
						snapTooltipToDatumY
						showSeriesGlyphs
						renderTooltip={ renderTooltip }
						renderGlyph={ tooltipRenderGlyph }
						glyphStyle={ glyphStyle }
						showVerticalCrosshair={ withTooltipCrosshairs?.showVertical }
						showHorizontalCrosshair={ withTooltipCrosshairs?.showHorizontal }
					/>
				) }

				{ annotations?.length &&
					annotations.map(
						( { datum, title, subtitle, subjectType, styles: datumStyles }, index ) =>
							datum ? (
								<LineChartAnnotation
									key={ `annotation-${ datum.date?.getTime() }-${ datum.value }` }
									testId={ `annotation-${ index }` }
									datum={ datum }
									title={ title }
									subtitle={ subtitle }
									subjectType={ subjectType }
									styles={ datumStyles }
								/>
							) : null
					) }
			</XYChart>

			{ showLegend && (
				<Legend
					items={ legendItems }
					orientation={ legendOrientation }
					alignmentHorizontal={ legendAlignmentHorizontal }
					alignmentVertical={ legendAlignmentVertical }
					className={ styles[ 'line-chart-legend' ] }
					shape={ legendShape }
					ref={ legendRef }
				/>
			) }
		</div>
	);
};

export default withResponsive< LineChartProps >( LineChart );
