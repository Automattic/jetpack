import { formatNumberCompact } from '@automattic/number-formatters';
import { curveCatmullRom, curveLinear, curveMonotoneX } from '@visx/curve';
import { LinearGradient } from '@visx/gradient';
import { XYChart, AreaSeries, Grid, Axis, DataContext } from '@visx/xychart';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useMemo, useContext, forwardRef, useImperativeHandle, useState, useRef } from 'react';
import {
	useXYChartTheme,
	useChartDataTransform,
	useChartMargin,
	useElementHeight,
} from '../../hooks';
import {
	GlobalChartsProvider,
	GlobalChartsContext,
	useChartId,
	useChartRegistration,
	useGlobalChartsContext,
	useGlobalChartsTheme,
} from '../../providers';
import { attachSubComponents } from '../../utils';
import { Legend, useChartLegendItems } from '../legend';
import { DefaultGlyph } from '../private/default-glyph';
import { SingleChartContext, type SingleChartRef } from '../private/single-chart-context';
import { withResponsive } from '../private/with-responsive';
import { AccessibleTooltip, useKeyboardNavigation } from '../tooltip';
import styles from './line-chart.module.scss';
import { LineChartAnnotation, LineChartAnnotationsOverlay, LineChartGlyph } from './private';
import type { CurveType, RenderLineStartGlyphProps, LineChartProps, TooltipDatum } from './types';
import type { DataPoint, DataPointDate, SeriesData, Optional } from '../../types';
import type { ResponsiveConfig } from '../private/with-responsive';
import type { TickFormatter } from '@visx/axis';
import type { GlyphProps } from '@visx/xychart';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import type { FC, Ref } from 'react';

const X_TICK_WIDTH = 100;

const defaultRenderGlyph = < Datum extends object >(
	props: RenderLineStartGlyphProps< Datum >
) => {
	return <DefaultGlyph { ...props } key={ props.key } />;
};

const toNumber = ( val?: number | string | null ): number | undefined => {
	const num = typeof val === 'number' ? val : parseFloat( val );
	return isNaN( num ) ? undefined : num;
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
			( point: DataPointDate | DataPoint ) =>
				isNaN( point.value as number ) ||
				point.value === null ||
				point.value === undefined ||
				( 'date' in point && point.date && isNaN( point.date.getTime() ) )
		)
	);

	if ( hasInvalidData ) return 'Invalid data';
	return null;
};

// Inner component to access DataContext and provide scale data to ref
const LineChartScalesRef: FC< {
	chartRef?: Ref< SingleChartRef >;
	width: number;
	height: number;
	margin?: { top?: number; right?: number; bottom?: number; left?: number };
} > = ( { chartRef, width, height, margin } ) => {
	const context = useContext( DataContext );

	useImperativeHandle(
		chartRef,
		() => ( {
			getScales: () => {
				if ( ! context?.xScale || ! context?.yScale ) {
					return null;
				}
				return {
					xScale: context.xScale,
					yScale: context.yScale,
				};
			},
			getChartDimensions: () => ( {
				width,
				height,
				margin: margin || {},
			} ),
		} ),
		[ context, width, height, margin ]
	);

	return null; // This component only provides the ref interface
};

const LineChartInternal = forwardRef< SingleChartRef, LineChartProps >(
	(
		{
			data,
			chartId: providedChartId,
			width,
			height,
			className,
			margin,
			withTooltips = true,
			withTooltipCrosshairs,
			showLegend = false,
			legendOrientation = 'horizontal',
			legendAlignment = 'center',
			legendPosition = 'bottom',
			legendMaxWidth,
			legendTextOverflow = 'wrap',
			renderGlyph = defaultRenderGlyph,
			glyphStyle = {},
			legendShape = 'line',
			withLegendGlyph = false,
			withGradientFill = false,
			smoothing = true,
			curveType,
			renderTooltip = renderDefaultTooltip,
			withStartGlyphs = false,
			withEndGlyphs = false,
			options = {},
			onPointerDown = undefined,
			onPointerUp = undefined,
			onPointerMove = undefined,
			onPointerOut = undefined,
			children,
		},
		ref
	) => {
		const providerTheme = useGlobalChartsTheme();
		const theme = useXYChartTheme( data );
		const chartId = useChartId( providedChartId );
		const [ legendRef, legendHeight ] = useElementHeight< HTMLDivElement >();
		const chartRef = useRef< HTMLDivElement >( null );
		const [ selectedIndex, setSelectedIndex ] = useState< number | undefined >( undefined );
		const [ isNavigating, setIsNavigating ] = useState( false );
		const internalChartRef = useRef< SingleChartRef >( null );

		// Forward the external ref to the internal ref
		useImperativeHandle(
			ref,
			() => ( {
				getScales: () => internalChartRef.current?.getScales() || null,
				getChartDimensions: () =>
					internalChartRef.current?.getChartDimensions() || { width: 0, height: 0, margin: {} },
			} ),
			[ internalChartRef ]
		);

		const dataSorted = useChartDataTransform( data );
		const { getElementStyles } = useGlobalChartsContext();

		// Use the keyboard navigation hook
		const { tooltipRef, onChartFocus, onChartBlur, onChartKeyDown } = useKeyboardNavigation( {
			selectedIndex,
			setSelectedIndex,
			isNavigating,
			setIsNavigating,
			chartRef,
			totalPoints: dataSorted[ 0 ]?.data.length || 0,
		} );

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
					series =>
						series.label === props.key || series.data.includes( props.datum as DataPointDate )
				);

				const seriesData = dataSorted[ seriesIndex ];

				const { color, glyph: themeGlyph } = getElementStyles( {
					data: seriesData,
					index: seriesIndex,
				} );

				const propsWithResolvedColor = { ...props, color };

				return themeGlyph
					? themeGlyph( propsWithResolvedColor )
					: renderGlyph( propsWithResolvedColor );
			};
		}, [ dataSorted, renderGlyph, getElementStyles ] );

		const defaultMargin = useChartMargin( height, chartOptions, dataSorted, theme );

		const error = validateData( dataSorted );
		const isDataValid = ! error;

		// Memoize legend options to prevent unnecessary re-calculations
		const legendOptions = useMemo(
			() => ( {
				withGlyph: withLegendGlyph,
				glyphSize: Math.max( 0, toNumber( glyphStyle?.radius ) ?? 4 ),
				renderGlyph,
			} ),
			[ withLegendGlyph, glyphStyle?.radius, renderGlyph ]
		);

		// Create legend items using the reusable hook
		const legendItems = useChartLegendItems( dataSorted, legendOptions, legendShape );

		// Memoize metadata to prevent unnecessary re-registration
		const chartMetadata = useMemo(
			() => ( {
				withGradientFill,
				smoothing,
				curveType,
				withStartGlyphs,
				withEndGlyphs,
				withLegendGlyph,
			} ),
			[ withGradientFill, smoothing, curveType, withStartGlyphs, withEndGlyphs, withLegendGlyph ]
		);

		// Register chart with context only if data is valid
		useChartRegistration( {
			chartId,
			legendItems,
			chartType: 'line',
			isDataValid,
			metadata: chartMetadata,
		} );

		const accessors = {
			xAccessor: ( d: DataPointDate ) => d?.date,
			yAccessor: ( d: DataPointDate ) => d?.value,
		};

		// Create a custom renderTooltip that includes focus capability
		if ( error ) {
			return <div className={ clsx( 'line-chart', styles[ 'line-chart' ] ) }>{ error }</div>;
		}

		return (
			<SingleChartContext.Provider
				value={ {
					chartId,
					chartRef: internalChartRef,
					chartWidth: width,
					chartHeight: height - ( showLegend ? legendHeight : 0 ),
				} }
			>
				<div
					className={ clsx( 'line-chart', styles[ 'line-chart' ], className ) }
					data-testid="line-chart"
					style={ {
						width,
						height,
						display: 'flex',
						flexDirection: showLegend && legendPosition === 'top' ? 'column-reverse' : 'column',
						position: 'relative',
					} }
				>
					<div
						role="grid"
						aria-label={ __( 'Line chart', 'jetpack-charts' ) }
						tabIndex={ 0 }
						onKeyDown={ onChartKeyDown }
						onFocus={ onChartFocus }
						onBlur={ onChartBlur }
						ref={ chartRef }
					>
						<XYChart
							theme={ theme }
							width={ width }
							height={ height - ( showLegend ? legendHeight : 0 ) }
							margin={ {
								...defaultMargin,
								...margin,
								...( showLegend && legendPosition === 'top'
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
								const { color, lineStyles, glyph } = getElementStyles( {
									data: seriesData,
									index,
								} );

								const lineProps = {
									stroke: color,
									...lineStyles,
								};

								return (
									<g key={ seriesData?.label || index }>
										{ withGradientFill && (
											<LinearGradient
												id={ `area-gradient-${ chartId }-${ index + 1 }` }
												from={ color }
												fromOpacity={ 0.4 }
												toOpacity={ 0.1 }
												to={ providerTheme.backgroundColor }
												{ ...seriesData.options?.gradient }
												data-testid="line-gradient"
											>
												{ seriesData.options?.gradient?.stops?.map( ( stop, stopIndex ) => (
													<stop
														key={ stopIndex }
														offset={ stop.offset }
														stopColor={ stop.color }
														stopOpacity={ stop.opacity ?? 1 }
													/>
												) ) }
											</LinearGradient>
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

										{ withStartGlyphs && (
											<LineChartGlyph
												index={ index }
												data={ seriesData }
												color={ color }
												renderGlyph={ glyph ?? renderGlyph }
												accessors={ accessors }
												glyphStyle={ glyphStyle }
												position="start"
											/>
										) }

										{ withEndGlyphs && (
											<LineChartGlyph
												index={ index }
												data={ seriesData }
												color={ color }
												renderGlyph={ glyph ?? renderGlyph }
												accessors={ accessors }
												glyphStyle={ glyphStyle }
												position="end"
											/>
										) }
									</g>
								);
							} ) }

							{ withTooltips && (
								<AccessibleTooltip
									detectBounds
									snapTooltipToDatumX
									snapTooltipToDatumY
									showSeriesGlyphs
									renderTooltip={ renderTooltip }
									renderGlyph={ tooltipRenderGlyph }
									glyphStyle={ glyphStyle }
									showVerticalCrosshair={ withTooltipCrosshairs?.showVertical }
									showHorizontalCrosshair={ withTooltipCrosshairs?.showHorizontal }
									selectedIndex={ selectedIndex }
									tooltipRef={ tooltipRef }
									keyboardFocusedClassName={ styles[ 'line-chart__tooltip--keyboard-focused' ] }
									series={ dataSorted }
								/>
							) }

							{ /* Component to expose scale data via ref */ }
							<LineChartScalesRef
								chartRef={ internalChartRef }
								width={ width }
								height={ height }
								margin={ margin }
							/>
						</XYChart>
					</div>

					{ showLegend && (
						<Legend
							orientation={ legendOrientation }
							alignment={ legendAlignment }
							position={ legendPosition }
							maxWidth={ legendMaxWidth }
							textOverflow={ legendTextOverflow }
							className={ styles[ 'line-chart-legend' ] }
							shape={ legendShape }
							chartId={ chartId }
							ref={ legendRef }
						/>
					) }

					{ children }
				</div>
			</SingleChartContext.Provider>
		);
	}
);

// Component type definitions for composition API
type LineChartAnnotationComponents = {
	AnnotationsOverlay: typeof LineChartAnnotationsOverlay;
	Annotation: typeof LineChartAnnotation;
	Legend: typeof Legend;
};

type LineChartBaseProps = Optional< LineChartProps, 'width' | 'height' | 'size' >;

type LineChartComponent = React.ForwardRefExoticComponent<
	LineChartBaseProps & React.RefAttributes< SingleChartRef >
> &
	LineChartAnnotationComponents;

type LineChartResponsiveComponent = React.ForwardRefExoticComponent<
	LineChartBaseProps & ResponsiveConfig & React.RefAttributes< SingleChartRef >
> &
	LineChartAnnotationComponents;

const LineChartWithProvider = forwardRef< SingleChartRef, LineChartProps >( ( props, ref ) => {
	const existingContext = useContext( GlobalChartsContext );

	// If we're already in a GlobalChartsProvider context, render the core component directly
	if ( existingContext ) {
		return <LineChartInternal { ...props } ref={ ref } />;
	}

	// Otherwise, wrap with our own GlobalChartsProvider
	return (
		<GlobalChartsProvider>
			<LineChartInternal { ...props } ref={ ref } />
		</GlobalChartsProvider>
	);
} );

LineChartWithProvider.displayName = 'LineChart';

const LineChart = attachSubComponents( LineChartWithProvider, {
	Legend: Legend,
	AnnotationsOverlay: LineChartAnnotationsOverlay,
	Annotation: LineChartAnnotation,
} ) as LineChartComponent;

const LineChartResponsive = attachSubComponents(
	withResponsive< LineChartProps >( LineChartWithProvider ),
	{
		Legend: Legend,
		AnnotationsOverlay: LineChartAnnotationsOverlay,
		Annotation: LineChartAnnotation,
	}
) as LineChartResponsiveComponent;

export { LineChartResponsive as default, LineChart as LineChartUnresponsive };
