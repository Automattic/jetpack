import { formatNumberCompact, formatNumber } from '@automattic/number-formatters';
import { curveCatmullRom, curveLinear, curveMonotoneX } from '@visx/curve';
import { LinearGradient } from '@visx/gradient';
import { scaleTime } from '@visx/scale';
import { XYChart, AreaSeries, Grid, Axis, DataContext } from '@visx/xychart';
import { __ } from '@wordpress/i18n';
import '@wordpress/theme/design-tokens.css';
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { differenceInHours, differenceInYears } from 'date-fns';
import { useMemo, useContext, forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { Legend, useChartLegendItems } from '../../components/legend';
import { AccessibleTooltip, useKeyboardNavigation } from '../../components/tooltip';
import {
	useXYChartTheme,
	useChartDataTransform,
	useChartMargin,
	useElementHeight,
	usePrefersReducedMotion,
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
import { DefaultGlyph } from '../private/default-glyph';
import { SingleChartContext, type SingleChartRef } from '../private/single-chart-context';
import { withResponsive } from '../private/with-responsive';
import styles from './line-chart.module.scss';
import { LineChartAnnotation, LineChartAnnotationsOverlay, LineChartGlyph } from './private';
import type { CurveType, RenderLineGlyphProps, LineChartProps, TooltipDatum } from './types';
import type { DataPoint, DataPointDate, SeriesData, Optional } from '../../types';
import type { ResponsiveConfig } from '../private/with-responsive';
import type { TickFormatter } from '@visx/axis';
import type { GlyphProps } from '@visx/xychart';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import type { FC, Ref } from 'react';

const X_TICK_WIDTH = 60;

const defaultRenderGlyph = < Datum extends object >( props: RenderLineGlyphProps< Datum > ) => {
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
					<span className={ styles[ 'line-chart__tooltip-value' ] }>
						{ formatNumber( point.value ) }
					</span>
				</div>
			) ) }
		</div>
	);
};

const formatYearTick = ( timestamp: number ) => {
	const date = new Date( timestamp );
	return date.toLocaleDateString( undefined, {
		year: 'numeric',
	} );
};

const formatDateTick = ( timestamp: number ) => {
	const date = new Date( timestamp );
	return date.toLocaleDateString( undefined, {
		month: 'short',
		day: 'numeric',
	} );
};

const formatHourTick = ( timestamp: number ) => {
	const date = new Date( timestamp );
	return date.toLocaleTimeString( undefined, {
		hour: 'numeric',
		hour12: true,
	} );
};

const getFormatter = ( sortedData: ReturnType< typeof useChartDataTransform > ) => {
	const minX = Math.min( ...sortedData.map( datom => datom.data.at( 0 )?.date ) );
	const maxX = Math.max( ...sortedData.map( datom => datom.data.at( -1 )?.date ) );

	const diffInHours = Math.abs( differenceInHours( maxX, minX ) );
	if ( diffInHours <= 24 ) {
		return formatHourTick;
	}

	const diffInYears = Math.abs( differenceInYears( maxX, minX ) );
	if ( diffInYears <= 1 ) {
		return formatDateTick;
	}

	return formatYearTick;
};

const guessOptimalNumTicks = (
	data: ReturnType< typeof useChartDataTransform >,
	chartWidth: number,
	tickFormatter: ( timestamp: number, index?: number, values?: unknown ) => string
) => {
	const minX = Math.min( ...data.map( datom => datom.data.at( 0 )?.date ) );
	const maxX = Math.max( ...data.map( datom => datom.data.at( -1 )?.date ) );
	const xScale = scaleTime( { domain: [ minX, maxX ] } );

	// Calculate upper bound of tick numbers based on data points and chart width
	const upperBound = Math.min(
		data[ 0 ]?.data.length || 3, // A sane fallback to avoid NaN when no data is present
		Math.ceil( chartWidth / X_TICK_WIDTH )
	);
	let secondBestGuess = 1; // a tick number that's no greater than upperBound

	for ( let numTicks = upperBound; numTicks > 1; --numTicks ) {
		const ticks = xScale.ticks( numTicks ).map( d => tickFormatter( d.getTime() ) );

		// The .ticks() function doesn't properly respect the requested number of ticks, so we need to check the length
		if ( ticks.length > upperBound ) {
			continue;
		}

		secondBestGuess = Math.max( secondBestGuess, ticks.length );

		const uniqueTicks = Array.from( new Set( ticks ) );
		if ( uniqueTicks.length === 1 ) {
			// All ticks are the same, so skip further processing
			return 1;
		}

		// Example: OCT 1 JAN 1 APR 1 JUL 1 OCT 1
		// Here, the two OCTs are not duplicates as they represent October of two different years.
		const hasConsecutiveDuplicate = ticks.some(
			( tick, idx ) => idx > 0 && tick === ticks[ idx - 1 ]
		);

		if ( hasConsecutiveDuplicate ) {
			continue;
		}

		return ticks.length;
	}

	return secondBestGuess;
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
			legendItemClassName,
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
			legendInteractive = false,
			animation,
			options = {},
			onPointerDown = undefined,
			onPointerUp = undefined,
			onPointerMove = undefined,
			onPointerOut = undefined,
			children,
			gridVisibility,
			gap = 'md',
		},
		ref
	) => {
		const providerTheme = useGlobalChartsTheme();
		const theme = useXYChartTheme( data );
		const chartId = useChartId( providedChartId );
		const [ svgWrapperRef, svgWrapperHeight ] = useElementHeight< HTMLDivElement >();
		const chartRef = useRef< HTMLDivElement >( null );
		const [ selectedIndex, setSelectedIndex ] = useState< number | undefined >( undefined );
		const [ isNavigating, setIsNavigating ] = useState( false );
		const internalChartRef = useRef< SingleChartRef >( null );

		// Use the measured SVG wrapper height, falling back to the passed height initially
		const chartHeight = svgWrapperHeight > 0 ? svgWrapperHeight : height;

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
		const { getElementStyles, isSeriesVisible } = useGlobalChartsContext();

		// Add visibility information to series when using interactive legends
		const seriesWithVisibility = useMemo( () => {
			if ( ! chartId || ! legendInteractive ) {
				return dataSorted.map( ( series, index ) => ( { series, index, isVisible: true } ) );
			}
			return dataSorted.map( ( series, index ) => ( {
				series,
				index,
				isVisible: isSeriesVisible( chartId, series.label ),
			} ) );
		}, [ dataSorted, chartId, isSeriesVisible, legendInteractive ] );

		// Check if all series are hidden
		const allSeriesHidden = useMemo( () => {
			return seriesWithVisibility.every( ( { isVisible } ) => ! isVisible );
		}, [ seriesWithVisibility ] );

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
			const formatter = options?.axis?.x?.tickFormat || getFormatter( dataSorted );

			return {
				axis: {
					x: {
						orientation: 'bottom' as const,
						numTicks: guessOptimalNumTicks( dataSorted, width, formatter ),
						tickFormat: formatter,
						display: true,
						...options?.axis?.x,
					},
					y: {
						orientation: 'left' as const,
						numTicks: 4,
						tickFormat: formatNumberCompact as TickFormatter< number >,
						display: true,
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

		const prefersReducedMotion = usePrefersReducedMotion();

		const accessors = {
			xAccessor: ( d: DataPointDate ) => d?.date,
			yAccessor: ( d: DataPointDate ) => d?.value,
		};

		// Create a custom renderTooltip that includes focus capability
		if ( error ) {
			return <div className={ clsx( 'line-chart', styles[ 'line-chart' ] ) }>{ error }</div>;
		}

		const legendElement = showLegend && (
			<Legend
				orientation={ legendOrientation }
				alignment={ legendAlignment }
				position={ legendPosition }
				maxWidth={ legendMaxWidth }
				textOverflow={ legendTextOverflow }
				legendItemClassName={ legendItemClassName }
				className={ styles[ 'line-chart__legend' ] }
				shape={ legendShape }
				chartId={ chartId }
				interactive={ legendInteractive }
			/>
		);

		return (
			<SingleChartContext.Provider
				value={ {
					chartId,
					chartRef: internalChartRef,
					chartWidth: width,
					chartHeight,
				} }
			>
				<Stack
					direction="column"
					gap={ gap }
					className={ clsx(
						'line-chart',
						styles[ 'line-chart' ],
						{ [ styles[ 'line-chart--animated' ] ]: animation && ! prefersReducedMotion },
						className
					) }
					data-testid="line-chart"
					style={ {
						width,
						height,
					} }
				>
					{ legendPosition === 'top' && legendElement }

					<div
						className={ styles[ 'line-chart__svg-wrapper' ] }
						ref={ svgWrapperRef }
						role="grid"
						aria-label={ __( 'Line chart', 'jetpack-charts' ) }
						tabIndex={ 0 }
						onKeyDown={ onChartKeyDown }
						onFocus={ onChartFocus }
						onBlur={ onChartBlur }
					>
						<div ref={ chartRef }>
							<XYChart
								theme={ theme }
								width={ width }
								height={ chartHeight }
								margin={ {
									...defaultMargin,
									...margin,
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
								{ gridVisibility !== 'none' && <Grid columns={ false } numTicks={ 4 } /> }
								{ chartOptions.axis.x.display && <Axis { ...chartOptions.axis.x } /> }
								{ chartOptions.axis.y.display && <Axis { ...chartOptions.axis.y } /> }

								{ allSeriesHidden ? (
									<text
										x={ width / 2 }
										y={ chartHeight / 2 }
										textAnchor="middle"
										fill={ providerTheme.gridStyles?.stroke || '#ccc' }
										fontSize="14"
										fontFamily="-apple-system,BlinkMacSystemFont,Roboto,Helvetica Neue,sans-serif"
									>
										{ __(
											'All series are hidden. Click legend items to show data.',
											'jetpack-charts'
										) }
									</text>
								) : null }

								{ seriesWithVisibility.map( ( { series: seriesData, index, isVisible } ) => {
									// Skip rendering invisible series
									if ( ! isVisible ) {
										return null;
									}

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
															key={ `${ stop.offset }-${ stop.color || color }` }
															offset={ stop.offset }
															stopColor={ stop.color || color }
															stopOpacity={ stop.opacity ?? 1 }
															data-testid={ `line-gradient-stop-${ chartId }-${ index }-${ stopIndex }` }
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
					</div>

					{ legendPosition === 'bottom' && legendElement }

					{ children }
				</Stack>
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
