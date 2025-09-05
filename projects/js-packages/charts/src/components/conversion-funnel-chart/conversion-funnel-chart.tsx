import { localPoint } from '@visx/event';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import clsx from 'clsx';
import { type FC, useRef, useMemo, useEffect, useCallback } from 'react';
import { useGlobalChartsTheme } from '../../providers';
import { hexToRgba, formatPercentage } from '../../utils';
import styles from './conversion-funnel-chart.module.scss';
import { useFunnelSelection } from './private';

/**
 * Represents a single step in the conversion funnel
 */
export interface FunnelStep {
	/** Step identifier */
	id: string;
	/** Display label for the step */
	label: string;
	/** Conversion rate as percentage (0-100) */
	rate: number;
	/** Absolute count (optional, for tooltip/details) */
	count?: number;
}

/**
 * Render prop for customizing step labels
 */
export interface StepLabelRenderProps {
	step: FunnelStep;
	index: number;
	className?: string;
}

/**
 * Render prop for customizing step rates
 */
export interface StepRateRenderProps {
	step: FunnelStep;
	index: number;
	className?: string;
}

/**
 * Render prop for customizing the entire main metric section
 */
export interface MainMetricRenderProps {
	mainRate: number;
	changeIndicator?: string;
	className?: string;
	changeColor?: string;
}

/**
 * Render prop for customizing tooltip content
 */
export interface TooltipRenderProps {
	step: FunnelStep;
	index: number;
	top: number;
	left: number;
	className?: string;
}

/**
 * Props for the ConversionFunnelChart component
 */
export interface ConversionFunnelChartProps {
	/** Main conversion rate to highlight */
	mainRate: number;
	/** Change indicator (e.g., +2%, -1.5%) */
	changeIndicator?: string;
	/** Array of funnel steps */
	steps: FunnelStep[];
	/** Whether the chart is in loading state */
	loading?: boolean;
	/** Additional CSS class name */
	className?: string;
	/** Custom styling */
	style?: React.CSSProperties;
	/** Custom render function for step labels */
	renderStepLabel?: ( props: StepLabelRenderProps ) => React.ReactNode;
	/** Custom render function for step rates */
	renderStepRate?: ( props: StepRateRenderProps ) => React.ReactNode;
	/** Custom render function for the entire main metric section */
	renderMainMetric?: ( props: MainMetricRenderProps ) => React.ReactNode;
	/** Custom render function for tooltip content */
	renderTooltip?: ( props: TooltipRenderProps ) => React.ReactNode;
}

/**
 * Default settings for ConversionFunnelChart component
 */
const DEFAULT_FUNNEL_SETTINGS = {
	primaryColor: '#4F46E5',
	backgroundColor: '#F3F4F6',
	positiveChangeColor: '#10B981',
	negativeChangeColor: '#EF4444',
} as const;

/**
 * ConversionFunnelChart component displays a conversion funnel with main metric and visualization
 *
 * @param props                  - Component props
 * @param props.mainRate         - Main conversion rate to highlight
 * @param props.changeIndicator  - Change indicator (e.g., +2%, -1.5%)
 * @param props.steps            - Array of funnel steps
 * @param props.loading          - Whether the chart is in loading state
 * @param props.className        - Additional CSS class name
 * @param props.style            - Custom styling
 * @param props.renderStepLabel  - Custom render function for step labels
 * @param props.renderStepRate   - Custom render function for step rates
 * @param props.renderMainMetric - Custom render function for the entire main metric section
 * @param props.renderTooltip    - Custom render function for tooltip content
 * @return JSX element representing the conversion funnel chart
 */
export const ConversionFunnelChart: FC< ConversionFunnelChartProps > = ( {
	mainRate,
	changeIndicator,
	steps,
	loading = false,
	className,
	style,
	renderStepLabel,
	renderStepRate,
	renderMainMetric,
	renderTooltip,
} ) => {
	const theme = useGlobalChartsTheme();
	const chartRef = useRef< HTMLDivElement >( null );
	const selectedBarRef = useRef< HTMLDivElement | null >( null );

	// Use @visx/tooltip hooks for tooltip positioning
	const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
		useTooltip();

	// Use custom hook for selection management
	const { handleBarClick, handleBarKeyDown, clearSelection, getStepState } =
		useFunnelSelection( hideTooltip );
	const { containerRef: portalContainerRef, TooltipInPortal } = useTooltipInPortal( {
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
	const getMouseTooltipCoords = useCallback( ( event: React.MouseEvent ) => {
		const containerElement = chartRef.current;
		if ( containerElement ) {
			const coords = localPoint( containerElement, event.nativeEvent );
			if ( coords ) {
				return { x: coords.x, y: coords.y };
			}
		}
		return null;
	}, [] );

	// Helper function to get tooltip coordinates for keyboard events
	const getKeyboardTooltipCoords = useCallback( ( event: React.KeyboardEvent ) => {
		const rect = event.currentTarget.getBoundingClientRect();
		const containerElement = chartRef.current;
		if ( containerElement ) {
			const containerRect = containerElement.getBoundingClientRect();
			const x = rect.left + rect.width / 2 - containerRect.left;
			const y = rect.top - containerRect.top;
			return { x, y };
		}
		return null;
	}, [] );

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

	// Get component settings from theme with fallbacks
	const funnelSettings = theme.conversionFunnelChart;
	const primaryColor = funnelSettings?.primaryColor || DEFAULT_FUNNEL_SETTINGS.primaryColor;
	const positiveChangeColor =
		funnelSettings?.positiveChangeColor || DEFAULT_FUNNEL_SETTINGS.positiveChangeColor;
	const negativeChangeColor =
		funnelSettings?.negativeChangeColor || DEFAULT_FUNNEL_SETTINGS.negativeChangeColor;

	// Determine change indicator color
	const isPositiveChange = changeIndicator?.startsWith( '+' );
	const changeColor = isPositiveChange ? positiveChangeColor : negativeChangeColor;

	// Create light background version of primary color
	const lightBackgroundColor = hexToRgba( primaryColor, 0.08 );

	const chartStyle = {
		'--primary-color': primaryColor,
		'--light-background-color': lightBackgroundColor,
		'--change-indicator-color': changeColor,
		...style,
	} as React.CSSProperties;

	// Default main metric rendering function
	const renderDefaultMainMetric = () => (
		<>
			<span className={ styles[ 'main-rate' ] }>{ formatPercentage( mainRate ) }</span>
			{ changeIndicator && (
				<span className={ styles[ 'change-indicator' ] }>{ changeIndicator }</span>
			) }
		</>
	);

	// Default tooltip rendering function
	const renderDefaultTooltip = ( step: FunnelStep ) => (
		<>
			<div className={ styles[ 'tooltip-title' ] }>{ step.label }</div>
			<div className={ styles[ 'tooltip-content' ] }>
				{ formatPercentage( step.rate ) }
				{ step.count && ` • ${ step.count.toLocaleString() } items` }
			</div>
		</>
	);

	// Handle empty or undefined data
	if ( ! steps || steps.length === 0 ) {
		return (
			<div
				className={ clsx( styles.conversionFunnelChart, loading && styles.loading, className ) }
				style={ chartStyle }
			>
				<div className={ styles[ 'empty-state' ] }>
					{ loading ? 'Loading...' : 'No data available' }
				</div>
			</div>
		);
	}

	// Calculate bar heights relative to the maximum (first step)
	const maxRate = Math.max( ...steps.map( step => step.rate ) );

	return (
		<>
			<div
				ref={ node => {
					// Set containerRef for @visx coordinate system
					portalContainerRef( node );
					chartRef.current = node;
				} }
				className={ clsx( styles.conversionFunnelChart, loading && styles.loading, className ) }
				style={ chartStyle }
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
					<div className={ styles[ 'main-metric' ] }>{ renderDefaultMainMetric() }</div>
				) }

				{ /* Funnel Steps */ }
				<div className={ styles[ 'funnel-container' ] }>
					{ steps.map( ( step, index ) => {
						const barHeight = ( step.rate / maxRate ) * 100;
						const { isClicked, isBlurred } = getStepState( step.id );

						return (
							<div
								key={ step.id }
								className={ clsx( styles[ 'funnel-step' ], isBlurred && styles.blurred ) }
							>
								{ /* Step Label and Rate */ }
								<div className={ styles[ 'step-header' ] }>
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
								</div>

								{ /* Funnel Bar */ }
								<div
									className={ clsx(
										styles[ 'bar-container' ],
										isClicked && styles.selected,
										isBlurred && styles.disabled
									) }
									onClick={ stepHandlers.get( step.id )?.onClick }
									onKeyDown={ stepHandlers.get( step.id )?.onKeyDown }
									role="button"
									tabIndex={ isBlurred ? -1 : 0 }
									aria-label={ step.label }
								>
									<div
										className={ clsx( styles[ 'funnel-bar' ], isClicked && styles.selected ) }
										style={ {
											height: `${ barHeight }%`,
											backgroundColor: primaryColor,
										} }
									/>
								</div>
							</div>
						);
					} ) }
				</div>
			</div>

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

export default ConversionFunnelChart;
