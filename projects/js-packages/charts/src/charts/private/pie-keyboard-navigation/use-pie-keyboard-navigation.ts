import { useCallback, useRef, useState } from 'react';
import { useKeyboardNavigation } from '../../../components/tooltip';

interface UsePieKeyboardNavigationProps {
	/** Number of visible segments. Indexes run over them in `orderArcsForNavigation` order. */
	segmentCount: number;
}

export const usePieKeyboardNavigation = ( { segmentCount }: UsePieKeyboardNavigationProps ) => {
	const chartRef = useRef< HTMLDivElement >( null );
	const [ selectedIndex, setSelectedIndex ] = useState< number | undefined >( undefined );
	const [ isNavigating, setIsNavigating ] = useState( false );

	const { tooltipRef, onChartFocus, onChartBlur, onChartKeyDown, onChartPointerMove } =
		useKeyboardNavigation( {
			selectedIndex,
			setSelectedIndex,
			isNavigating,
			setIsNavigating,
			chartRef,
			totalPoints: segmentCount,
		} );

	const getPositionInChart = useCallback( ( svg: SVGSVGElement | null, x: number, y: number ) => {
		const chartBounds = chartRef.current?.getBoundingClientRect();
		const svgBounds = svg?.getBoundingClientRect();
		if ( ! chartBounds || ! svgBounds ) {
			return undefined;
		}
		return {
			left: svgBounds.left - chartBounds.left + x,
			top: svgBounds.top - chartBounds.top + y,
		};
	}, [] );

	return {
		chartRef,
		selectedIndex,
		tooltipRef,
		getPositionInChart,
		onSegmentPointerMove: onChartPointerMove,
		chartProps: {
			role: 'application',
			tabIndex: 0,
			onKeyDown: onChartKeyDown,
			onFocus: onChartFocus,
			onBlur: onChartBlur,
		} as const,
	};
};
