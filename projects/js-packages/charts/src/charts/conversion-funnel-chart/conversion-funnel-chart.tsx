import { useTooltip } from '@visx/tooltip';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { type FC, useRef, useMemo, useState, useCallback, useContext, useId } from 'react';
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
import type { FunnelStep, FunnelTooltipContent, ConversionFunnelChartProps } from './types';

/** Chart height (px) below which the funnel tightens its gaps so the bars keep their room. */
const SHORT_CHART_HEIGHT = 180;

const formatStepCount = ( count: number ) =>
	sprintf(
		/* translators: %s: Number of items that reached the funnel step. */
		_n( '%s item', '%s items', count, 'jetpack-charts' ),
		formatMetricValue( count )
	);

const getDefaultTooltipContent = ( step: FunnelStep ): FunnelTooltipContent => ( {
	value: step.count === undefined ? undefined : formatStepCount( step.count ),
	rows: [
		{ label: __( 'Conversion rate', 'jetpack-charts' ), value: formatPercentage( step.rate ) },
	],
} );

const getDefaultTooltipIds = ( tooltipId: string, { rows = [] }: FunnelTooltipContent ) => ( {
	value: `${ tooltipId }-value`,
	rows: rows.map( ( _, index ) => ( {
		label: `${ tooltipId }-row-${ index }-label`,
		value: `${ tooltipId }-row-${ index }-value`,
	} ) ),
} );

// The step's name is its title line, so the description skips it.
const getDefaultTooltipDescriptionIds = ( tooltipId: string, content: FunnelTooltipContent ) => {
	const ids = getDefaultTooltipIds( tooltipId, content );
	return [
		...( content.value ? [ ids.value ] : [] ),
		...ids.rows.flatMap( row => [ row.label, row.value ] ),
	].join( ' ' );
};

/**
 * Internal ConversionFunnelChart component with chart registration
 *
 * @param props                   - Component props
 * @param props.chartId           - Optional unique identifier for the chart
 * @param props.mainRate          - Main conversion rate to highlight
 * @param props.changeIndicator   - Change indicator (e.g., +2%, -1.5%)
 * @param props.steps             - Array of funnel steps
 * @param props.loading           - Whether the chart is in loading state
 * @param props.animation         - Whether to show chart animation on initial render or not
 * @param props.className         - Additional CSS class name
 * @param props.ariaLabel         - Accessible name for the chart group
 * @param props.height            - Height of the chart container. Falls back to style.height if set, otherwise defaults to "100%".
 * @param props.style             - Custom styling
 * @param props.renderStepLabel   - Custom render function for step labels
 * @param props.renderStepRate    - Custom render function for step rates
 * @param props.renderMainMetric  - Custom render function for the entire main metric section
 * @param props.renderTooltip     - Custom render function for tooltip content
 * @param props.tooltipStyle      - Inline styles merged over the tooltip box defaults
 * @param props.getTooltipContent - What each step's tooltip shows, which screen readers also read
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
	getTooltipContent = getDefaultTooltipContent,
} ) => {
	const chartId = useChartId( providedChartId );
	const { getElementStyles, isColorPaletteResolved } = useGlobalChartsContext();
	const chartRef = useRef< HTMLDivElement >( null );
	const isPointerFocusRef = useRef( false );
	const [ scopeNode, setScopeNode ] = useState< HTMLElement | null >( null );
	const tooltipId = useId();

	// Use @visx/tooltip hooks for tooltip positioning
	const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
		useTooltip();

	const { selectedStepId, selectStep, clearSelection, getStepState } =
		useFunnelSelection( hideTooltip );
	const stepIds = useMemo( () => steps?.map( step => step.id ) ?? [], [ steps ] );
	const { getTabIndex, setStepElement, handleStepFocus, handleNavigationKey } = useRovingStepFocus(
		stepIds,
		selectedStepId
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

	// Selecting a step shows its tooltip, anchored at the given point relative to the chart root.
	const selectStepAt = useCallback(
		( step: FunnelStep, x: number, y: number ) => {
			selectStep( step.id );
			const bounds = chartRef.current?.getBoundingClientRect();
			if ( bounds ) {
				showTooltip( {
					tooltipData: step,
					tooltipLeft: x - bounds.left,
					tooltipTop: y - bounds.top - 10,
				} );
			}
		},
		[ selectStep, showTooltip ]
	);

	const selectStepAtElement = useCallback(
		( step: FunnelStep, element: HTMLElement ) => {
			const rect = element.getBoundingClientRect();
			selectStepAt( step, rect.left + rect.width / 2, rect.top );
		},
		[ selectStepAt ]
	);

	const stepHandlers = useMemo( () => {
		const handlers = new Map<
			string,
			{
				onPointerDown: () => void;
				onClick: ( event: React.MouseEvent ) => void;
				onKeyDown: ( event: React.KeyboardEvent< HTMLElement > ) => void;
				onFocus: ( event: React.FocusEvent< HTMLElement > ) => void;
				ref: ( element: HTMLDivElement | null ) => void;
			}
		>();

		steps.forEach( step => {
			// A press focuses the step before its click, which places the tooltip at the pointer instead.
			const onPointerDown = () => {
				isPointerFocusRef.current = true;
			};

			const onClick = ( event: React.MouseEvent ) => {
				isPointerFocusRef.current = false;
				selectStepAt( step, event.clientX, event.clientY );
			};

			const onFocus = ( event: React.FocusEvent< HTMLElement > ) => {
				handleStepFocus( step.id );
				if ( isPointerFocusRef.current ) {
					isPointerFocusRef.current = false;
				} else if ( step.id !== selectedStepId ) {
					selectStepAtElement( step, event.currentTarget );
				}
			};

			const onKeyDown = ( event: React.KeyboardEvent< HTMLElement > ) => {
				isPointerFocusRef.current = false;
				if ( handleNavigationKey( step.id, event ) ) {
					return;
				}

				if ( event.key === 'Enter' || event.key === ' ' ) {
					event.preventDefault();
					selectStepAtElement( step, event.currentTarget );
				} else if ( event.key === 'Escape' && selectedStepId !== null ) {
					event.preventDefault();
					clearSelection();
				}
			};

			const ref = ( element: HTMLDivElement | null ) => setStepElement( step.id, element );

			handlers.set( step.id, { onPointerDown, onClick, onKeyDown, onFocus, ref } );
		} );

		return handlers;
	}, [
		steps,
		selectedStepId,
		selectStepAt,
		selectStepAtElement,
		clearSelection,
		handleNavigationKey,
		handleStepFocus,
		setStepElement,
	] );

	const handleStepsBlur = useCallback(
		( event: React.FocusEvent< HTMLElement > ) => {
			const leavesFunnel =
				! event.currentTarget.contains( event.relatedTarget ) && document.hasFocus();
			if ( leavesFunnel ) {
				isPointerFocusRef.current = false;
				clearSelection();
			}
		},
		[ clearSelection ]
	);

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

	const renderDefaultTooltip = ( step: FunnelStep, content: FunnelTooltipContent ) => {
		const ids = getDefaultTooltipIds( tooltipId, content );
		return (
			<Stack direction="column" gap="xs">
				<Stack direction="row" justify="space-between" align="baseline" gap="sm">
					<span className={ styles[ 'tooltip-title' ] }>{ step.label }</span>
					{ content.value && (
						<span id={ ids.value } className={ styles[ 'tooltip-value' ] }>
							{ content.value }
						</span>
					) }
				</Stack>
				{ content.rows?.map( ( row, index ) => (
					<Stack
						key={ row.label }
						direction="row"
						justify="space-between"
						align="baseline"
						gap="sm"
					>
						<span id={ ids.rows[ index ].label } className={ styles[ 'tooltip-label' ] }>
							{ row.label }
						</span>
						<span id={ ids.rows[ index ].value } className={ styles[ 'tooltip-value' ] }>
							{ row.value }
						</span>
					</Stack>
				) ) }
			</Stack>
		);
	};

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
	let tooltipDescriptionIds = '';
	if ( tooltipStep ) {
		const index = steps.findIndex( s => s.id === tooltipStep.id );
		const content = getTooltipContent( tooltipStep, index );
		if ( renderTooltip ) {
			tooltipContent = renderTooltip( {
				step: tooltipStep,
				index,
				content,
				top: tooltipTop,
				left: tooltipLeft,
			} );
			tooltipDescriptionIds = tooltipId;
		} else {
			tooltipContent = renderDefaultTooltip( tooltipStep, content );
			tooltipDescriptionIds = getDefaultTooltipDescriptionIds( tooltipId, content );
		}
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
					role="listbox"
					aria-label={ __( 'Funnel steps', 'jetpack-charts' ) }
					aria-orientation="horizontal"
					onBlur={ handleStepsBlur }
					className={ styles[ 'funnel-container' ] }
				>
					{ steps.map( ( step, index ) => {
						const barHeight = ( step.rate / maxRate ) * 100;
						const { isSelected, isBlurred } = getStepState( step.id );
						const handlers = stepHandlers.get( step.id );
						const isDescribedByTooltip =
							Boolean( tooltipContent && tooltipDescriptionIds ) && tooltipStep?.id === step.id;

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
								{ /* Step label and rate. The option's name and description carry them, and a listbox may hold only options. */ }
								<Stack
									direction="column"
									gap="xs"
									className={ styles[ 'step-text' ] }
									aria-hidden="true"
								>
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
									onPointerDown={ handlers?.onPointerDown }
									onClick={ handlers?.onClick }
									onKeyDown={ handlers?.onKeyDown }
									onFocus={ handlers?.onFocus }
									role="option"
									tabIndex={ getTabIndex( step.id ) }
									aria-label={ sprintf(
										/* translators: 1: Funnel step name, such as "Cart". 2: Its rate, such as "71.1%". */
										__( '%1$s, %2$s', 'jetpack-charts' ),
										step.label,
										formatPercentage( step.rate )
									) }
									aria-selected={ isSelected }
									aria-describedby={ isDescribedByTooltip ? tooltipDescriptionIds : undefined }
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
			</ChartScopeContext.Provider>

			{ tooltipContent && (
				<BoundedTooltip
					top={ tooltipTop }
					left={ tooltipLeft }
					className={ standaloneScopeClass }
					style={ tooltipStyle }
				>
					{ /* Read through the selected step's description, never on its own. */ }
					<div id={ tooltipId } aria-hidden="true" data-testid="funnel-tooltip">
						{ tooltipContent }
					</div>
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
