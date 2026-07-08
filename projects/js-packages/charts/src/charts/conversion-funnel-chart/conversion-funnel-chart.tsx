import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { type FC, useRef, useMemo, useEffect, useCallback, useContext } from 'react';
import { usePrefersReducedMotion } from '../../hooks';
import {
	GlobalChartsProvider,
	GlobalChartsContext,
	useChartId,
	useChartRegistration,
	useGlobalChartsTheme,
	useGlobalChartsContext,
} from '../../providers';
import { formatPercentage, hexToRgba } from '../../utils';
import styles from './conversion-funnel-chart.module.scss';
import { useFunnelSelection } from './private';
import type { FunnelStep, ConversionFunnelChartProps } from './types';

/**
 * Internal ConversionFunnelChart component with chart registration
 *
 * @param props                  - Component props
 * @param props.chartId          - Optional unique identifier for the chart
 * @param props.mainRate         - Main conversion rate to highlight
 * @param props.changeIndicator  - Change indicator (e.g., +2%, -1.5%)
 * @param props.steps            - Array of funnel steps
 * @param props.loading          - Whether the chart is in loading state
 * @param props.animation        - Whether to show chart animation on initial render or not
 * @param props.className        - Additional CSS class name
 * @param props.height           - Height of the chart container. Falls back to style.height if set, otherwise defaults to "100%".
 * @param props.style            - Custom styling
 * @param props.renderStepLabel  - Custom render function for step labels
 * @param props.renderStepRate   - Custom render function for step rates
 * @param props.renderMainMetric - Custom render function for the entire main metric section
 * @param props.renderTooltip    - Custom render function for tooltip content
 * @return JSX element representing the conversion funnel chart
 */
const ConversionFunnelChartInternal: FC< ConversionFunnelChartProps > = ( {
	mainRate,
	changeIndicator,
	steps,
	loading = false,
	animation,
	className,
	chartId: providedChartId,
	height,
	style,
	renderStepLabel,
	renderStepRate,
	renderMainMetric,
	renderTooltip,
} ) => {
	const chartId = useChartId( providedChartId );
	const { conversionFunnelChart: conversionFunnelChartSettings } = useGlobalChartsTheme();
	const { getElementStyles, isColorPaletteResolved } = useGlobalChartsContext();
	const chartRef = useRef< HTMLDivElement >( null );
	const selectedBarRef = useRef< HTMLDivElement | null >( null );

	// Use @visx/tooltip hooks for tooltip positioning
	const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
		useTooltip();

	// Use custom hook for selection management
	const { handleBarClick, handleBarKeyDown, clearSelection, getStepState } =
		useFunnelSelection( hideTooltip );
	const {
		containerRef: portalContainerRef,
		TooltipInPortal,
		containerBounds,
	} = useTooltipInPortal( {
		// use TooltipWithBounds for boundary detection
		detectBounds: true,
		// when tooltip containers are scrolled, this will correctly update the Tooltip position
		scroll: true,
	} );

	// Wrapper to clear selectedBarRef after clearing selection
	const clearSelectionAndRef = useCallback( () => {
		clearSelection();
		selectedBarRef.current = null;
		hideTooltip();
	}, [ clearSelection, hideTooltip ] );

	// Helper function to show tooltip at specific coordinates
	const showTooltipAt = useCallback(
		( step: FunnelStep, x: number, y: number ) => {
			showTooltip( {
				tooltipData: step,
				tooltipLeft: x,
				tooltipTop: y - 10,
			} );
		},
		[ showTooltip ]
	);

	// Helper function to get tooltip coordinates for mouse events
	// Use clientX/Y and subtract containerBounds to cancel out any stale offset.
	// TooltipInPortal calculates: tooltipLeft + containerBounds.left + scrollX
	// By passing (clientX - containerBounds.left), we get correct page coordinates
	// regardless of whether bounds are stale (e.g., after dashboard customization).
	const getMouseTooltipCoords = useCallback(
		( event: React.MouseEvent ) => {
			// Don't return coords until container bounds are measured
			if ( containerBounds.width === 0 || containerBounds.height === 0 ) {
				return null;
			}

			return {
				x: event.clientX - containerBounds.left,
				y: event.clientY - containerBounds.top,
			};
		},
		[ containerBounds.width, containerBounds.height, containerBounds.left, containerBounds.top ]
	);

	// Helper function to get tooltip coordinates for keyboard events
	// Use fresh getBoundingClientRect() and subtract containerBounds to cancel out stale offset.
	const getKeyboardTooltipCoords = useCallback(
		( event: React.KeyboardEvent ) => {
			// Don't return coords until container bounds are measured
			if ( containerBounds.width === 0 || containerBounds.height === 0 ) {
				return null;
			}

			const rect = event.currentTarget.getBoundingClientRect();
			// Calculate center of element in viewport coordinates, then subtract containerBounds
			const x = rect.left + rect.width / 2 - containerBounds.left;
			const y = rect.top - containerBounds.top;
			return { x, y };
		},
		[ containerBounds.width, containerBounds.height, containerBounds.left, containerBounds.top ]
	);

	// Helper function to handle step interaction (both click and keyboard)
	const handleStepInteraction = useCallback(
		(
			step: FunnelStep,
			event: React.MouseEvent | React.KeyboardEvent,
			interactionType: 'click' | 'keyboard'
		) => {
			// Store reference to the interacted element
			selectedBarRef.current = event.currentTarget as HTMLDivElement;

			// Check if deselecting the same step
			const { isClicked } = getStepState( step.id );
			if ( isClicked ) {
				// Deselecting - clear selection (tooltip will be hidden by hook)
				if ( interactionType === 'click' ) {
					handleBarClick( step.id );
				} else {
					handleBarKeyDown( step.id, event as React.KeyboardEvent );
				}
				return;
			}

			// Selecting - handle selection and show tooltip
			if ( interactionType === 'click' ) {
				handleBarClick( step.id );
				const coords = getMouseTooltipCoords( event as React.MouseEvent );
				if ( coords ) {
					showTooltipAt( step, coords.x, coords.y );
				}
			} else {
				handleBarKeyDown( step.id, event as React.KeyboardEvent );
				const coords = getKeyboardTooltipCoords( event as React.KeyboardEvent );
				if ( coords ) {
					showTooltipAt( step, coords.x, coords.y );
				}
			}
		},
		[
			getStepState,
			handleBarClick,
			handleBarKeyDown,
			showTooltipAt,
			getMouseTooltipCoords,
			getKeyboardTooltipCoords,
		]
	);

	// Create handler factories to avoid arrow functions in JSX
	const stepHandlers = useMemo( () => {
		const handlers = new Map<
			string,
			{
				onClick: ( event: React.MouseEvent ) => void;
				onKeyDown: ( event: React.KeyboardEvent ) => void;
			}
		>();

		steps.forEach( step => {
			const onClick = ( event: React.MouseEvent ) => {
				event.stopPropagation();
				handleStepInteraction( step, event, 'click' );
			};

			const onKeyDown = ( event: React.KeyboardEvent ) => {
				if ( event.key === 'Enter' || event.key === ' ' ) {
					handleStepInteraction( step, event, 'keyboard' );
				} else {
					// For other keys (like Escape), just handle the selection
					selectedBarRef.current = event.currentTarget as HTMLDivElement;
					handleBarKeyDown( step.id, event );
				}
			};

			handlers.set( step.id, { onClick, onKeyDown } );
		} );

		return handlers;
	}, [ steps, handleStepInteraction, handleBarKeyDown ] );

	// Handle document-level click to clear selection when clicking outside selected bar
	useEffect( () => {
		const handleDocumentClick = ( event: MouseEvent ) => {
			// Only clear selection if there's an active selection and click is outside the selected bar
			if ( selectedBarRef.current && ! selectedBarRef.current.contains( event.target as Node ) ) {
				clearSelectionAndRef();
			}
		};

		document.addEventListener( 'mousedown', handleDocumentClick );

		return () => {
			document.removeEventListener( 'mousedown', handleDocumentClick );
		};
	}, [ clearSelectionAndRef ] );

	// Resolve height: explicit height prop > style.height > default 100%
	const resolvedHeight = height ?? style?.height ?? '100%';

	// Get component settings from theme with fallbacks
	const { primaryColor, backgroundColor, positiveChangeColor, negativeChangeColor } =
		conversionFunnelChartSettings;

	// Resolve bar color using getElementStyles with primaryColor as override
	const { color: barColor } = getElementStyles
		? getElementStyles( {
				index: 0,
				overrideColor: primaryColor,
		  } )
		: { color: primaryColor || '#000000' };

	// Determine change indicator color
	const isPositiveChange = changeIndicator?.startsWith( '+' );
	const changeColor = isPositiveChange ? positiveChangeColor : negativeChangeColor;

	// Create light background version of primary color if not set
	const barBackgroundColor =
		backgroundColor || hexToRgba( barColor, 0.08 ) || 'rgba(0, 0, 0, 0.08)';

	// Default main metric rendering function
	const renderDefaultMainMetric = () => (
		<>
			<span className={ styles[ 'main-rate' ] }>{ formatPercentage( mainRate ) }</span>
			{ changeIndicator && (
				<span className={ styles[ 'change-indicator' ] } style={ { color: changeColor } }>
					{ changeIndicator }
				</span>
			) }
		</>
	);

	// Default tooltip rendering function
	const renderDefaultTooltip = ( step: FunnelStep ) => (
		<Stack direction="column" align="flex-start" gap="xs">
			<div className={ styles[ 'tooltip-title' ] }>{ step.label }</div>
			<div className={ styles[ 'tooltip-content' ] }>
				{ formatPercentage( step.rate ) }
				{ ` • ${ step.count ?? 'no' } items` }
			</div>
		</Stack>
	);

	// Validate data
	const isDataValid = Boolean( steps && steps.length > 0 );

	// Memoize metadata to prevent unnecessary re-registration
	const chartMetadata = useMemo(
		() => ( {
			mainRate,
			changeIndicator,
			stepsCount: steps?.length || 0,
		} ),
		[ mainRate, changeIndicator, steps?.length ]
	);

	useChartRegistration( {
		chartId,
		legendItems: [],
		chartType: 'conversion-funnel',
		isDataValid,
		metadata: chartMetadata,
	} );

	const prefersReducedMotion = usePrefersReducedMotion();

	// Handle empty or undefined data
	if ( ! isDataValid ) {
		return (
			<Stack
				direction="column"
				align="center"
				justify="center"
				data-testid="conversion-funnel-chart"
				className={ clsx(
					styles[ 'conversion-funnel-chart' ],
					loading && styles[ 'conversion-funnel-chart--loading' ],
					className
				) }
				style={ { ...style, height: resolvedHeight } }
			>
				<div className={ styles[ 'empty-state' ] }>
					{ loading ? 'Loading...' : 'No data available' }
				</div>
			</Stack>
		);
	}

	// Calculate bar heights relative to the maximum (first step)
	const maxRate = Math.max( ...steps.map( step => step.rate ) );

	return (
		<>
			<Stack
				direction="column"
				gap="xl"
				data-testid="conversion-funnel-chart"
				ref={ node => {
					// Set containerRef for @visx coordinate system
					portalContainerRef( node );
					chartRef.current = node;
				} }
				className={ clsx(
					styles[ 'conversion-funnel-chart' ],
					loading && styles[ 'conversion-funnel-chart--loading' ],
					className
				) }
				style={ { ...style, height: resolvedHeight } }
			>
				{ /* Main Metric */ }
				{ renderMainMetric ? (
					renderMainMetric( {
						mainRate,
						changeIndicator,
						className: styles[ 'main-metric' ],
						changeColor,
					} )
				) : (
					<Stack direction="row" align="baseline" gap="sm" className={ styles[ 'main-metric' ] }>
						{ renderDefaultMainMetric() }
					</Stack>
				) }

				{ /* Funnel Steps */ }
				<Stack direction="row" align="flex-end" gap="lg" className={ styles[ 'funnel-container' ] }>
					{ steps.map( ( step, index ) => {
						const barHeight = ( step.rate / maxRate ) * 100;
						const { isBlurred } = getStepState( step.id );

						return (
							<Stack
								key={ step.id }
								direction="column"
								data-testid="funnel-step"
								className={ clsx(
									styles[ 'funnel-step' ],
									isColorPaletteResolved && styles[ 'funnel-step--animated' ],
									isBlurred && styles[ 'funnel-step--blurred' ]
								) }
								gap="xl"
							>
								{ /* Step Label and Rate */ }
								<Stack direction="column" gap="xs">
									{ renderStepLabel ? (
										renderStepLabel( {
											step,
											index,
											className: styles[ 'step-label' ],
										} )
									) : (
										<span className={ styles[ 'step-label' ] }>{ step.label }</span>
									) }
									{ renderStepRate ? (
										renderStepRate( {
											step,
											index,
											className: styles[ 'step-rate' ],
										} )
									) : (
										<span className={ styles[ 'step-rate' ] }>
											{ formatPercentage( step.rate ) }
										</span>
									) }
								</Stack>

								{ /* Funnel Bar */ }
								<Stack
									direction="column"
									justify="flex-end"
									className={ styles[ 'bar-container' ] }
									onClick={ stepHandlers.get( step.id )?.onClick }
									onKeyDown={ stepHandlers.get( step.id )?.onKeyDown }
									role="button"
									tabIndex={ isBlurred ? -1 : 0 }
									aria-label={ step.label }
									style={ { backgroundColor: barBackgroundColor } }
								>
									<div
										className={ clsx( styles[ 'funnel-bar' ], {
											[ styles[ 'funnel-bar--animated' ] ]:
												animation && ! loading && ! prefersReducedMotion,
										} ) }
										style={ {
											height: `${ barHeight }%`,
											backgroundColor: barColor,
										} }
									/>
								</Stack>
							</Stack>
						);
					} ) }
				</Stack>
			</Stack>

			{ /* Tooltip Portal */ }
			{ tooltipOpen &&
				tooltipData &&
				( () => {
					const tooltipContent = renderTooltip
						? renderTooltip( {
								step: tooltipData as FunnelStep,
								index: steps.findIndex( s => s.id === ( tooltipData as FunnelStep ).id ),
								top: tooltipTop,
								left: tooltipLeft,
								className: styles[ 'tooltip-wrapper' ],
						  } )
						: renderDefaultTooltip( tooltipData as FunnelStep );

					// Don't render tooltip if renderTooltip returns falsy
					if ( ! tooltipContent ) return null;

					return (
						<TooltipInPortal
							// set this to random so it correctly updates with parent bounds
							key={ Math.random() }
							top={ tooltipTop }
							left={ tooltipLeft }
							className={ styles[ 'tooltip-wrapper' ] }
						>
							{ tooltipContent }
						</TooltipInPortal>
					);
				} )() }
		</>
	);
};

/**
 * ConversionFunnelChart component with provider wrapper
 *
 * @param props - Component props
 * @return JSX element representing the conversion funnel chart
 */
const ConversionFunnelChartWithProvider: FC< ConversionFunnelChartProps > = props => {
	const existingContext = useContext( GlobalChartsContext );

	// If we're already in a GlobalChartsProvider context, don't create a new one
	if ( existingContext ) {
		return <ConversionFunnelChartInternal { ...props } />;
	}

	// Otherwise, create our own GlobalChartsProvider
	return (
		<GlobalChartsProvider>
			<ConversionFunnelChartInternal { ...props } />
		</GlobalChartsProvider>
	);
};

ConversionFunnelChartWithProvider.displayName = 'ConversionFunnelChart';

export { ConversionFunnelChartWithProvider as default };
