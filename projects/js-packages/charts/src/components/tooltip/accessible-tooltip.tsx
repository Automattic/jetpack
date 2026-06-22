import { Tooltip, TooltipContext } from '@visx/xychart';
import { useContext, useEffect, useCallback, useMemo } from 'react';
import type { SeriesData, DataPointDate } from '../../types';
import type { RenderTooltipParams, XyChartTooltipProps } from '../../visx/types';
import type { ReactNode } from 'react';

// Type for flattened tooltip data used in individual mode
export type FlattenedTooltipData = {
	datum: DataPointDate;
	seriesLabel: string;
	seriesIndex: number;
	dataPointIndex: number;
};

// Enhanced tooltip with keyboard navigation and accessibility
interface AccessibleTooltipProps
	extends Omit< XyChartTooltipProps< DataPointDate >, 'renderTooltip' > {
	renderTooltip?: ( params: RenderTooltipParams< DataPointDate > ) => ReactNode;
	selectedIndex?: number | undefined;
	tooltipRef?: ( element: HTMLDivElement | null ) => void;
	keyboardFocusedClassName?: string;
	/**
	 * Flattened tooltip data prepared by parent component
	 * Each index corresponds to one tooltip to show
	 */
	tooltipData?: FlattenedTooltipData[];
	/**
	 * For line charts: series data to show all series at selected data point
	 * When provided, shows all series instead of individual tooltips
	 */
	series?: SeriesData[];
	/**
	 * Whether to combine tooltip information from multiple series into a single tooltip. This is useful for line charts.
	 * Or to show individual tooltips for each series. This is useful for bar charts.
	 */
	mode?: 'individual' | 'group';
}

export const AccessibleTooltip: React.FC< AccessibleTooltipProps > = ( {
	renderTooltip,
	selectedIndex,
	tooltipRef,
	keyboardFocusedClassName,
	series = [],
	mode = 'group',
	...props
} ) => {
	const tooltipContext = useContext( TooltipContext );

	const tooltipData = useMemo( () => {
		if ( mode !== 'individual' ) return [];
		if ( series.length === 0 ) return [];

		const maxDataPoints = Math.max( ...series.map( s => s.data.length ) );
		const flattened: Array< {
			datum: DataPointDate;
			seriesLabel: string;
			seriesIndex: number;
			dataPointIndex: number;
		} > = [];

		// Pattern: [series1[0], series2[0], series3[0], series1[1], series2[1], series3[1], ...]
		for ( let dataPointIndex = 0; dataPointIndex < maxDataPoints; dataPointIndex++ ) {
			for ( let seriesIndex = 0; seriesIndex < series.length; seriesIndex++ ) {
				const seriesData = series[ seriesIndex ];
				if ( dataPointIndex < seriesData.data.length ) {
					flattened.push( {
						datum: seriesData.data[ dataPointIndex ] as DataPointDate,
						seriesLabel: seriesData.label,
						seriesIndex,
						dataPointIndex,
					} );
				}
			}
		}

		return flattened;
	}, [ series, mode ] );

	// Handle tooltip highlighting for keyboard navigation
	useEffect( () => {
		if ( selectedIndex === undefined ) {
			tooltipContext?.hideTooltip();
			return;
		}

		if ( mode === 'group' ) {
			// Show all series at the selected data point index in single tooltip.
			series.forEach( ( s, index ) => {
				if ( selectedIndex < s.data.length ) {
					const datum = s.data[ selectedIndex ];

					tooltipContext?.showTooltip( {
						datum,
						key: s.label,
						index,
					} );
				}
			} );
		} else if ( mode === 'individual' ) {
			// Show individual tooltips for each datapoint from each series.
			if ( selectedIndex < tooltipData.length ) {
				const tooltipItem = tooltipData[ selectedIndex ];

				tooltipContext?.showTooltip( {
					datum: tooltipItem.datum,
					key: tooltipItem.seriesLabel,
					index: tooltipItem.seriesIndex,
				} );
			}
		}

		// Don't include tooltipContext in the dependency array to avoid loop.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ selectedIndex, tooltipData, series ] );

	// Create a focusable renderTooltip that includes accessibility features
	const focusableRenderTooltip = useMemo( () => {
		if ( ! renderTooltip ) return undefined;

		return ( params: RenderTooltipParams< DataPointDate > ) => {
			const tooltipContent = renderTooltip( params );

			if ( selectedIndex !== undefined ) {
				return (
					<div
						ref={ tooltipRef }
						tabIndex={ -1 }
						role="tooltip"
						aria-atomic="true"
						className={ keyboardFocusedClassName }
						data-testid={ `chart-tooltip-${ selectedIndex }` }
						key={ `chart-tooltip-${ selectedIndex }` }
					>
						{ tooltipContent }
					</div>
				);
			}

			return (
				<div role="tooltip" aria-live="polite">
					{ tooltipContent }
				</div>
			);
		};
	}, [ renderTooltip, selectedIndex, tooltipRef, keyboardFocusedClassName ] );

	return <Tooltip { ...props } renderTooltip={ focusableRenderTooltip } />;
};

// Keyboard navigation hook for charts
interface UseKeyboardNavigationProps {
	selectedIndex: number | undefined;
	setSelectedIndex: ( index: number | undefined ) => void;
	isNavigating: boolean;
	setIsNavigating: ( navigating: boolean ) => void;
	chartRef: React.RefObject< HTMLDivElement >;
	/**
	 * Total number of navigation points (length of tooltip data array)
	 */
	totalPoints: number;
}

export const useKeyboardNavigation = ( {
	selectedIndex,
	setSelectedIndex,
	isNavigating,
	setIsNavigating,
	chartRef,
	totalPoints,
}: UseKeyboardNavigationProps ) => {
	// Focus the tooltip as soon as it is rendered
	const tooltipRef = useCallback(
		( element: HTMLDivElement | null ) => {
			if ( element && selectedIndex !== undefined ) {
				element.focus();
			}
		},
		[ selectedIndex ]
	);

	// On each focus of chart, reset the selectedIndex to 0, if keyboard navigation is not already active
	const onChartFocus = useCallback( () => {
		if ( ! isNavigating && selectedIndex !== undefined ) {
			setSelectedIndex( 0 );
		}
	}, [ isNavigating, selectedIndex, setSelectedIndex ] );

	// On each blur of chart, keyboard navigation should restart from first tooltip
	const onChartBlur = useCallback( () => {
		setIsNavigating( false );
	}, [ setIsNavigating ] );

	const onChartKeyDown = useCallback(
		( event: React.KeyboardEvent< HTMLDivElement > ) => {
			if ( totalPoints === 0 ) return;

			// Keep focus on the chart if tab is pressed
			if ( event.key === 'Tab' ) {
				chartRef.current?.focus();
				setSelectedIndex( undefined );
				setIsNavigating( false );
				return;
			}

			const currentSelectedIndex = selectedIndex === undefined ? -1 : selectedIndex;

			if ( currentSelectedIndex + 1 >= totalPoints && [ 'ArrowRight' ].includes( event.key ) ) {
				chartRef.current?.focus();
				setSelectedIndex( undefined );
				setIsNavigating( false );
				return;
			}

			event.preventDefault();

			if ( [ 'ArrowRight' ].includes( event.key ) ) {
				setIsNavigating( true );
				setSelectedIndex( ( currentSelectedIndex + 1 ) % totalPoints );
			} else if ( [ 'ArrowLeft' ].includes( event.key ) ) {
				setIsNavigating( true );
				setSelectedIndex( ( currentSelectedIndex - 1 + totalPoints ) % totalPoints );
			} else if ( event.key === 'Escape' ) {
				setSelectedIndex( undefined );
				setIsNavigating( false );
				chartRef.current?.focus();
			}
		},
		[ totalPoints, selectedIndex, setSelectedIndex, setIsNavigating, chartRef ]
	);

	return {
		tooltipRef,
		onChartFocus,
		onChartBlur,
		onChartKeyDown,
	};
};

// Re-export the base Tooltip for backwards compatibility
export { Tooltip };
