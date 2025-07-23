// Hook for integrating CSS Grid chart container with existing legend props
// Provides backward compatibility while enabling new CSS Grid features

import { useMemo } from 'react';
import { 
	getChartContainerClasses, 
	getLegendAreaClasses, 
	getLegendClasses, 
	type ChartContainerConfig 
} from '../utils/chart-container-utils';
import type { BaseLegendProps } from '../components/legend/types';

export interface UseChartLayoutProps {
	showLegend?: boolean;
	legendOrientation?: BaseLegendProps['orientation'];
	legendAlignmentHorizontal?: BaseLegendProps['alignmentHorizontal'];
	legendAlignmentVertical?: BaseLegendProps['alignmentVertical'];
	className?: string;
	theme?: 'default' | 'jetpack' | 'woo' | 'dark';
	spacing?: 'compact' | 'default' | 'spacious';
}

export interface ChartLayoutClasses {
	containerClass: string;
	chartAreaClass: string;
	legendAreaClass: string;
	legendClass: string;
	// Backward compatibility - returns margin object for legacy layout support
	chartMargin: {
		top?: number;
		right?: number;
		bottom?: number;
		left?: number;
	};
}

/**
 * Hook to provide CSS Grid layout classes and backward compatibility
 * Bridges the gap between old margin-based legend positioning and new CSS Grid system
 */
export function useChartLayout(props: UseChartLayoutProps): ChartLayoutClasses {
	const {
		showLegend = false,
		legendOrientation = 'horizontal',
		legendAlignmentHorizontal = 'center',
		legendAlignmentVertical = 'bottom',
		className = '',
		theme = 'default',
		spacing = 'default'
	} = props;

	return useMemo(() => {
		// If no legend, use simple container
		if (!showLegend) {
			const containerClass = `chartContainer ${className}`.trim();
			return {
				containerClass,
				chartAreaClass: 'chartArea',
				legendAreaClass: '',
				legendClass: '',
				chartMargin: {}
			};
		}

		// Determine legend position from alignment props
		const legendPosition = getLegendPosition(legendAlignmentVertical, legendAlignmentHorizontal);
		
		const config: ChartContainerConfig = {
			legendPosition,
			legendAlignment: legendAlignmentHorizontal,
			legendVerticalAlignment: legendAlignmentVertical,
			legendOrientation,
			theme,
			spacing,
			useSubgrid: true // Enable subgrid by default given good browser support
		};

		const containerClass = `${getChartContainerClasses(config)} ${className}`.trim();
		const legendAreaClass = getLegendAreaClasses(config);
		const legendClass = getLegendClasses(config);

		// For backward compatibility - provide margin fallback
		// This helps maintain existing chart sizing until full migration is complete
		const chartMargin = getLegacyMarginFallback(legendPosition, legendOrientation);

		return {
			containerClass,
			chartAreaClass: 'chartArea',
			legendAreaClass,
			legendClass,
			chartMargin
		};
	}, [
		showLegend,
		legendOrientation,
		legendAlignmentHorizontal,
		legendAlignmentVertical,
		className,
		theme,
		spacing
	]);
}

/**
 * Maps legend alignment props to position for CSS Grid areas
 */
function getLegendPosition(
	vertical: BaseLegendProps['alignmentVertical'], 
	horizontal: BaseLegendProps['alignmentHorizontal']
): ChartContainerConfig['legendPosition'] {
	// Handle corner positions first (for WooCommerce top-right requirement)
	if (vertical === 'top' && horizontal === 'right') {
		return 'top-right';
	}
	if (vertical === 'top' && horizontal === 'left') {
		return 'top-left';
	}
	if (vertical === 'bottom' && horizontal === 'right') {
		return 'bottom-right';
	}
	if (vertical === 'bottom' && horizontal === 'left') {
		return 'bottom-left';
	}

	// Handle standard positions
	if (vertical === 'top') {
		return 'top';
	}
	if (vertical === 'bottom') {
		return 'bottom';
	}

	// For center vertical alignment, use horizontal preference
	if (horizontal === 'left') {
		return 'left';
	}
	if (horizontal === 'right') {
		return 'right';
	}

	// Default fallback
	return 'bottom';
}

/**
 * Provides margin fallback for backward compatibility
 * Helps maintain existing chart behavior during transition
 */
function getLegacyMarginFallback(
	position: ChartContainerConfig['legendPosition'],
	orientation: BaseLegendProps['orientation']
) {
	const legendSize = orientation === 'horizontal' ? 40 : 80; // Approximate legend size

	switch (position) {
		case 'top':
		case 'top-left':
		case 'top-right':
			return { top: legendSize };
		case 'bottom':
		case 'bottom-left':
		case 'bottom-right':
			return { bottom: legendSize };
		case 'left':
			return { left: legendSize };
		case 'right':
			return { right: legendSize };
		default:
			return {};
	}
}