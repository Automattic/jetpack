import { localPoint } from '@visx/event';
import { useParentSize } from '@visx/responsive';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import clsx from 'clsx';
import { useMemo, forwardRef, useCallback, useContext, useRef } from 'react';
import {
	GlobalChartsProvider,
	GlobalChartsContext,
	useGlobalChartsContext,
	useChartId,
} from '../../providers';
import styles from './segmented-bar.module.scss';
import type { SegmentedBarProps, SegmentedBarSegment, SegmentedBarResponsiveConfig } from './types';
import type { MouseEvent, FC } from 'react';

const DEFAULT_WIDTH = 300;
const DEFAULT_LABEL_FORMATTER = ( value: number ) => value.toString();

/**
 * Normalizes input values to SegmentedBarSegment array without colors.
 * Colors are applied separately using getElementStyles.
 * @param values - Input values array (numbers or segment objects).
 * @return Normalized array of SegmentedBarSegment objects.
 */
const normalizeSegments = ( values: number[] | SegmentedBarSegment[] ): SegmentedBarSegment[] => {
	return ( values || [] ).map( value => {
		return typeof value === 'number' ? { value } : { ...value };
	} );
};

const SegmentedBarComponent = forwardRef< HTMLDivElement, SegmentedBarProps >(
	(
		{
			values,
			mode = 'proportional',
			colors,
			marker,
			showLabels = true,
			width = DEFAULT_WIDTH,
			height: heightProp,
			gap: gapProp,
			borderRadius: borderRadiusProp,
			className,
			chartId: providedChartId,
			labelFormatter = DEFAULT_LABEL_FORMATTER,
			withTooltips = false,
		},
		ref
	) => {
		const { getElementStyles, theme } = useGlobalChartsContext();

		// Get theme defaults
		const height = heightProp ?? theme.segmentedBar.height;
		const gap = gapProp ?? theme.segmentedBar.gap;
		const borderRadius = borderRadiusProp ?? theme.segmentedBar.borderRadius;
		const generatedChartId = useChartId();
		const chartId = providedChartId || generatedChartId;

		// Normalize values to segments with colors from context
		const segments = useMemo( () => {
			const normalizedSegments = normalizeSegments( values );
			return normalizedSegments.map( ( segment, index ) => {
				// Apply color priority: segment.color > colors prop > getElementStyles
				const color = segment.color || colors?.[ index ] || getElementStyles( { index } ).color;
				return { ...segment, color };
			} );
		}, [ values, colors, getElementStyles ] );

		// Calculate total for proportional mode
		const total = useMemo( () => {
			return segments.reduce( ( sum, s ) => sum + s.value, 0 );
		}, [ segments ] );

		// Calculate segment widths as percentages
		const segmentWidths = useMemo( () => {
			if ( segments.length === 0 ) {
				return [];
			}
			if ( mode === 'equal' ) {
				return segments.map( () => 100 / segments.length );
			}
			if ( total === 0 ) {
				return segments.map( () => 100 / segments.length );
			}
			return segments.map( s => ( s.value / total ) * 100 );
		}, [ segments, mode, total ] );

		// Calculate cumulative positions for labels
		const labelPositions = useMemo( () => {
			const positions: Array< { value: number; percent: number } > = [ { value: 0, percent: 0 } ];
			let cumulative = 0;
			let cumulativePercent = 0;

			segments.forEach( ( s, index ) => {
				cumulative += s.value;
				cumulativePercent += segmentWidths[ index ];
				positions.push( { value: cumulative, percent: cumulativePercent } );
			} );

			return positions;
		}, [ segments, segmentWidths ] );

		// Calculate marker position as percentage
		const markerPosition = useMemo( () => {
			if ( ! marker || total === 0 ) {
				return null;
			}
			const percent = ( marker.value / total ) * 100;
			return Math.min( 100, Math.max( 0, percent ) );
		}, [ marker, total ] );

		// Tooltip handling
		const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
			useTooltip< { label?: string; value: number; color: string } >();

		const { containerRef, TooltipInPortal } = useTooltipInPortal( {
			detectBounds: true,
			scroll: true,
		} );

		// Keep a local ref to the container for localPoint calculations
		const internalRef = useRef< HTMLDivElement | null >( null );

		// Merge forwarded ref with containerRef from useTooltipInPortal
		const mergedRef = useCallback(
			( node: HTMLDivElement | null ) => {
				// Store internally for localPoint
				internalRef.current = node;
				// Call the tooltip container ref
				containerRef( node );
				// Forward to the external ref
				if ( ref ) {
					if ( typeof ref === 'function' ) {
						ref( node );
					} else {
						ref.current = node;
					}
				}
			},
			[ containerRef, ref ]
		);

		const createSegmentMouseMoveHandler = useCallback(
			( segment: SegmentedBarSegment ) => ( event: MouseEvent< HTMLDivElement > ) => {
				if ( ! withTooltips || ! internalRef.current ) {
					return;
				}
				// Get coordinates relative to the container element
				const coords = localPoint( internalRef.current, event.nativeEvent );
				if ( ! coords ) {
					return;
				}

				showTooltip( {
					tooltipData: {
						label: segment.label,
						value: segment.value,
						color: segment.color || '#000',
					},
					tooltipLeft: coords.x,
					tooltipTop: coords.y - 10,
				} );
			},
			[ withTooltips, showTooltip ]
		);

		// Memoize handlers for each segment to avoid creating new functions on each render
		const segmentMouseMoveHandlers = useMemo( () => {
			return segments.map( segment => createSegmentMouseMoveHandler( segment ) );
		}, [ segments, createSegmentMouseMoveHandler ] );

		const handleMouseLeave = useCallback( () => {
			if ( withTooltips ) {
				hideTooltip();
			}
		}, [ withTooltips, hideTooltip ] );

		// Handle empty data
		if ( ! values || values.length === 0 ) {
			return (
				<div
					ref={ ref }
					className={ clsx( styles.segmentedBar, styles[ 'segmentedBar--empty' ], className ) }
					style={ { width, height } }
					data-testid="segmented-bar-empty"
				/>
			);
		}

		// Calculate total gap width
		const totalGapWidth = gap * ( segments.length - 1 );
		const availableWidth = width - totalGapWidth;

		return (
			<div
				ref={ mergedRef }
				className={ clsx( styles.segmentedBar, className ) }
				style={ { width } }
				data-testid="segmented-bar"
				data-chart-id={ `segmented-bar-${ chartId }` }
			>
				<div
					className={ styles.segmentedBar__bar }
					style={ {
						height,
						borderRadius,
						gap,
					} }
				>
					{ segments.map( ( segment, index ) => {
						const widthPercent = segmentWidths[ index ];
						const isFirst = index === 0;
						const isLast = index === segments.length - 1;

						return (
							<div
								key={ index }
								className={ clsx( styles.segmentedBar__segment, {
									[ styles[ 'segmentedBar__segment--first' ] ]: isFirst,
									[ styles[ 'segmentedBar__segment--last' ] ]: isLast,
								} ) }
								style={ {
									width: `${ ( widthPercent / 100 ) * availableWidth }px`,
									backgroundColor: segment.color,
									borderTopLeftRadius: isFirst ? borderRadius : 0,
									borderBottomLeftRadius: isFirst ? borderRadius : 0,
									borderTopRightRadius: isLast ? borderRadius : 0,
									borderBottomRightRadius: isLast ? borderRadius : 0,
								} }
								onMouseMove={ segmentMouseMoveHandlers[ index ] }
								onMouseLeave={ handleMouseLeave }
								data-testid={ `segmented-bar-segment-${ index }` }
							/>
						);
					} ) }

					{ marker && markerPosition !== null && (
						<div
							className={ clsx( styles.segmentedBar__marker, {
								[ styles[ 'segmentedBar__marker--animated' ] ]: marker.showAnimation,
							} ) }
							style={ {
								left: `${ markerPosition }%`,
								height: height + 8,
								top: -4,
								backgroundColor: marker.color || theme.segmentedBar.markerColor,
							} }
							data-testid="segmented-bar-marker"
							title={ marker.tooltip }
						/>
					) }
				</div>

				{ showLabels && (
					<div className={ styles.segmentedBar__labels }>
						{ labelPositions.map( ( pos, index ) => (
							<span
								key={ index }
								className={ styles.segmentedBar__label }
								style={ {
									left: `${ pos.percent }%`,
								} }
								data-testid={ `segmented-bar-label-${ index }` }
							>
								{ labelFormatter( pos.value ) }
							</span>
						) ) }
					</div>
				) }

				{ withTooltips && tooltipOpen && tooltipData && (
					<TooltipInPortal top={ tooltipTop || 0 } left={ tooltipLeft || 0 }>
						<div className={ styles.segmentedBar__tooltip } role="tooltip">
							{ tooltipData.label && (
								<span className={ styles.segmentedBar__tooltip__label }>
									{ tooltipData.label }:{ ' ' }
								</span>
							) }
							<span className={ styles.segmentedBar__tooltip__value }>{ tooltipData.value }</span>
						</div>
					</TooltipInPortal>
				) }
			</div>
		);
	}
);

SegmentedBarComponent.displayName = 'SegmentedBarComponent';

const SegmentedBarUnresponsive: FC< SegmentedBarProps > = props => {
	const existingContext = useContext( GlobalChartsContext );

	// If we're already in a GlobalChartsProvider context, render the core component directly
	if ( existingContext ) {
		return <SegmentedBarComponent { ...props } />;
	}

	// Otherwise, wrap with our own GlobalChartsProvider
	return (
		<GlobalChartsProvider>
			<SegmentedBarComponent { ...props } />
		</GlobalChartsProvider>
	);
};

SegmentedBarUnresponsive.displayName = 'SegmentedBarUnresponsive';

const SegmentedBar: FC<
	Omit< SegmentedBarProps, 'width' > & SegmentedBarResponsiveConfig & { width?: number }
> = ( { resizeDebounceTime = 300, maxWidth = 1200, ...chartProps } ) => {
	const { parentRef, width: parentWidth } = useParentSize( {
		debounceTime: resizeDebounceTime,
		enableDebounceLeadingCall: true,
	} );

	const containerWidth = parentWidth > 0 ? Math.min( parentWidth, maxWidth ) : 0;

	return (
		<div
			ref={ parentRef }
			style={ {
				width: chartProps.width ?? '100%',
			} }
		>
			<SegmentedBarUnresponsive
				{ ...chartProps }
				width={ containerWidth || chartProps.width || DEFAULT_WIDTH }
			/>
		</div>
	);
};

SegmentedBar.displayName = 'SegmentedBar';

export { SegmentedBar as default, SegmentedBarUnresponsive };
