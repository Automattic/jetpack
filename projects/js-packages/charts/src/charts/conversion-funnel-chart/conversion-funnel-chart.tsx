import { useTooltip } from '@visx/tooltip';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import {
	type FC,
	useRef,
	useMemo,
	useEffect,
	useState,
	useCallback,
	useContext,
	useId,
} from 'react';
import { BoundedTooltip } from '../../components/tooltip/private/bounded-tooltip';
import { useElementSize, usePrefersReducedMotion } from '../../hooks';
import {
	GlobalChartsProvider,
	GlobalChartsContext,
	ChartScopeContext,
	useChartId,
	useChartRegistration,
	useGlobalChartsContext,
} from '../../providers';
import { CATALOG_POINTERS } from '../../providers/chart-context/private/catalog-pointers';
import { useStandaloneScopeClass } from '../../providers/chart-scope';
import { formatMetricValue, formatPercentage } from '../../utils';
import styles from './conversion-funnel-chart.module.scss';
import { useFunnelSelection, useRovingStepFocus } from './private';
import type { FunnelStep, ConversionFunnelChartProps } from './types';

/** Chart height (px) below which the funnel tightens its gaps so the bars keep their room. */
const SHORT_CHART_HEIGHT = 180;

const formatStepCount = ( count: number ) =>
	sprintf(
		/* translators: %s: Number of items that reached the funnel step. */
		_n( '%s item', '%s items', count, 'jetpack-charts' ),
		formatMetricValue( count )
	);

const getDefaultStepDescription = ( step: FunnelStep ) =>
	step.count === undefined
		? formatPercentage( step.rate )
		: sprintf(
				/* translators: 1: Conversion rate of a funnel step, e.g. 71.1%. 2: Its item count, e.g. "7,110 items". */
				__( '%1$s, %2$s', 'jetpack-charts' ),
				formatPercentage( step.rate ),
				formatStepCount( step.count )
			);

/**
 * Internal ConversionFunnelChart component with chart registration
 *
 * @param props                    - Component props
 * @param props.chartId            - Optional unique identifier for the chart
 * @param props.mainRate           - Main conversion rate to highlight
 * @param props.changeIndicator    - Change indicator (e.g., +2%, -1.5%)
 * @param props.steps              - Array of funnel steps
 * @param props.loading            - Whether the chart is in loading state
 * @param props.animation          - Whether to show chart animation on initial render or not
 * @param props.className          - Additional CSS class name
 * @param props.ariaLabel          - Accessible name for the chart group
 * @param props.height             - Height of the chart container. Falls back to style.height if set, otherwise defaults to "100%".
 * @param props.style              - Custom styling
 * @param props.renderStepLabel    - Custom render function for step labels
 * @param props.renderStepRate     - Custom render function for step rates
 * @param props.renderMainMetric   - Custom render function for the entire main metric section
 * @param props.renderTooltip      - Custom render function for tooltip content
 * @param props.tooltipStyle       - Inline styles merged over the tooltip box defaults
 * @param props.getStepDescription - Plain text screen readers read after each step's name, matching its tooltip
 * @return JSX element representing the conversion funnel chart
 */
const ConversionFunnelChartInternal: FC< ConversionFunnelChartProps > = ( {
	mainRate,
	changeIndicator,
	steps,
	loading = false,
	animation,
	className,
	ariaLabel,
	chartId: providedChartId,
	height,
	style,
	renderStepLabel,
	renderStepRate,
	renderMainMetric,
	renderTooltip,
	tooltipStyle,
	getStepDescription = getDefaultStepDescription,
} ) => {
	const chartId = useChartId( providedChartId );
	const { getElementStyles, isColorPaletteResolved } = useGlobalChartsContext();
	const chartRef = useRef< HTMLDivElement >( null );
	const selectedBarRef = useRef< HTMLDivElement | null >( null );
	const [ scopeNode, setScopeNode ] = useState< HTMLElement | null >( null );
	const descriptionIdPrefix = useId();

	// Use @visx/tooltip hooks for tooltip positioning
	const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
		useTooltip();

	// Use custom hook for selection management
	const { clickedStep, handleBarClick, handleBarKeyDown, clearSelection, getStepState } =
		useFunnelSelection( hideTooltip );
	const stepIds = useMemo( () => steps?.map( step => step.id ) ?? [], [ steps ] );
	const { getTabIndex, setStepElement, handleStepFocus, handleNavigationKey } = useRovingStepFocus(
		stepIds,
		clickedStep
	);
	const standaloneScopeClass = useStandaloneScopeClass();
	const [ measureChartRef, , chartHeight ] = useElementSize< HTMLDivElement >();
	// A zero height is an unmeasured or hidden chart, not a short one.
	const isShort = chartHeight > 0 && chartHeight < SHORT_CHART_HEIGHT;
	const gap = isShort ? 'sm' : 'xl';
	// Stable identity so React doesn't detach/reattach (and re-render the scope context) on every commit. Keep it firing on unmount (node === null).
	const setChartRef = useCallback(
		( node: HTMLDivElement | null ) => {
			chartRef.current = node;
			setScopeNode( node );
			measureChartRef( node );
		},
		[ measureChartRef ]
	);

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

	// The chart root positions the tooltip, so coordinates are taken relative to it.
	const getMouseTooltipCoords = useCallback( ( event: React.MouseEvent ) => {
		const bounds = chartRef.current?.getBoundingClientRect();
		if ( ! bounds ) {
			return null;
		}

		return {
			x: event.clientX - bounds.left,
			y: event.clientY - bounds.top,
		};
	}, [] );

	// Keyboard interaction anchors the tooltip at the top centre of the focused step.
	const getKeyboardTooltipCoords = useCallback( ( event: React.KeyboardEvent ) => {
		const bounds = chartRef.current?.getBoundingClientRect();
		if ( ! bounds ) {
			return null;
		}

		const rect = event.currentTarget.getBoundingClientRect();
		return {
			x: rect.left + rect.width / 2 - bounds.left,
			y: rect.top - bounds.top,
		};
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
				onKeyDown: ( event: React.KeyboardEvent< HTMLElement > ) => void;
				onFocus: () => void;
				ref: ( element: HTMLDivElement | null ) => void;
			}
		>();

		steps.forEach( step => {
			const onClick = ( event: React.MouseEvent ) => {
				event.stopPropagation();
				handleStepInteraction( step, event, 'click' );
			};

			const onKeyDown = ( event: React.KeyboardEvent< HTMLElement > ) => {
				if ( handleNavigationKey( step.id, event ) ) {
					return;
				}

				if ( event.key === 'Enter' || event.key === ' ' ) {
					handleStepInteraction( step, event, 'keyboard' );
				} else {
					handleBarKeyDown( step.id, event );
				}
			};

			const onFocus = () => handleStepFocus( step.id );
			const ref = ( element: HTMLDivElement | null ) => setStepElement( step.id, element );

			handlers.set( step.id, { onClick, onKeyDown, onFocus, ref } );
		} );

		return handlers;
	}, [
		steps,
		handleStepInteraction,
		handleBarKeyDown,
		handleNavigationKey,
		handleStepFocus,
		setStepElement,
	] );

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

	// The bar takes the first palette slot; move `--a8c-charts-color-series-1` to change it.
	const { color: barColor } = getElementStyles
		? getElementStyles( { index: 0 } )
		: { color: '#000000' };

	const isPositiveChange = changeIndicator?.startsWith( '+' );
	// Only for `renderMainMetric`, which hands a consumer's own markup something to paint with.
	const changeColor = isPositiveChange ? CATALOG_POINTERS.trendUp : CATALOG_POINTERS.trendDown;

	// Default main metric rendering function
	const renderDefaultMainMetric = () => (
		<>
			<span className={ styles[ 'main-rate' ] }>{ formatPercentage( mainRate ) }</span>
			{ changeIndicator && (
				<span
					className={ clsx(
						styles[ 'change-indicator' ],
						styles[ isPositiveChange ? 'change-indicator--positive' : 'change-indicator--negative' ]
					) }
				>
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
				{ step.count !== undefined && ` • ${ formatStepCount( step.count ) }` }
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
				ref={ setScopeNode }
				className={ clsx(
					'conversion-funnel-chart',
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

	const tooltipStep = tooltipOpen ? ( tooltipData as FunnelStep | undefined ) : undefined;
	let tooltipContent: React.ReactNode = null;
	if ( tooltipStep ) {
		tooltipContent = renderTooltip
			? renderTooltip( {
					step: tooltipStep,
					index: steps.findIndex( s => s.id === tooltipStep.id ),
					top: tooltipTop,
					left: tooltipLeft,
				} )
			: renderDefaultTooltip( tooltipStep );
	}

	return (
		<Stack
			direction="column"
			gap={ gap }
			data-testid="conversion-funnel-chart"
			role="group"
			aria-label={ ariaLabel ?? __( 'Conversion funnel chart', 'jetpack-charts' ) }
			ref={ setChartRef }
			className={ clsx(
				'conversion-funnel-chart',
				styles[ 'conversion-funnel-chart' ],
				loading && styles[ 'conversion-funnel-chart--loading' ],
				className
			) }
			style={ { ...style, height: resolvedHeight } }
		>
			<ChartScopeContext.Provider value={ scopeNode }>
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
				<Stack
					direction="row"
					align="flex-end"
					gap="lg"
					role="toolbar"
					aria-label={ __( 'Funnel steps', 'jetpack-charts' ) }
					className={ styles[ 'funnel-container' ] }
				>
					{ steps.map( ( step, index ) => {
						const barHeight = ( step.rate / maxRate ) * 100;
						const { isClicked, isBlurred } = getStepState( step.id );
						const handlers = stepHandlers.get( step.id );
						const description = getStepDescription( step, index );
						const descriptionId = `${ descriptionIdPrefix }-${ index }`;

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
								gap={ gap }
							>
								{ /* Step Label and Rate */ }
								<Stack direction="column" gap="xs" className={ styles[ 'step-text' ] }>
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
									ref={ handlers?.ref }
									onClick={ handlers?.onClick }
									onKeyDown={ handlers?.onKeyDown }
									onFocus={ handlers?.onFocus }
									role="button"
									tabIndex={ getTabIndex( step.id ) }
									aria-label={ step.label }
									aria-pressed={ isClicked }
									aria-describedby={ description ? descriptionId : undefined }
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
								{ description && (
									<span id={ descriptionId } hidden>
										{ description }
									</span>
								) }
							</Stack>
						);
					} ) }
				</Stack>
			</ChartScopeContext.Provider>

			{ tooltipContent && (
				<BoundedTooltip
					top={ tooltipTop }
					left={ tooltipLeft }
					className={ standaloneScopeClass }
					style={ tooltipStyle }
				>
					<div role="tooltip">{ tooltipContent }</div>
				</BoundedTooltip>
			) }
		</Stack>
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
