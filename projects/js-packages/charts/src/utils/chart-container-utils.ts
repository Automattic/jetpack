// Utility functions for chart container CSS classes and logic
// Addresses CHARTS-41: Extract common container logic into shared helper

export type LegendPosition =
	| 'top'
	| 'bottom'
	| 'left'
	| 'right'
	| 'top-left'
	| 'top-right'
	| 'bottom-left'
	| 'bottom-right';

export type LegendAlignment = 'left' | 'center' | 'right';
export type LegendVerticalAlignment = 'top' | 'center' | 'bottom';
export type LegendOrientation = 'horizontal' | 'vertical';

export interface ChartContainerConfig {
	legendPosition?: LegendPosition;
	legendAlignment?: LegendAlignment;
	legendVerticalAlignment?: LegendVerticalAlignment;
	legendOrientation?: LegendOrientation;
	useSubgrid?: boolean;
	theme?: 'default' | 'jetpack' | 'woo' | 'dark';
	spacing?: 'compact' | 'default' | 'spacious';
}

/**
 * Generates CSS class names for chart container based on legend configuration
 * Eliminates the need for inline styles and reduces duplication across components
 * @param config
 */
export function getChartContainerClasses( config: ChartContainerConfig = {} ): string {
	const classes: string[] = [ 'chartContainer' ];

	// Legend position classes
	if ( config.legendPosition ) {
		const positionMap: Record< LegendPosition, string > = {
			top: 'legendTop',
			bottom: 'legendBottom',
			left: 'legendLeft',
			right: 'legendRight',
			'top-left': 'legendTopLeft',
			'top-right': 'legendTopRight',
			'bottom-left': 'legendBottomLeft',
			'bottom-right': 'legendBottomRight',
		};
		classes.push( positionMap[ config.legendPosition ] );
	}

	// Subgrid enhancement
	if ( config.useSubgrid ) {
		classes.push( 'useSubgrid' );
	}

	// Theme classes
	if ( config.theme && config.theme !== 'default' ) {
		classes.push( `chart-theme-${ config.theme }` );
	}

	// Spacing classes
	if ( config.spacing && config.spacing !== 'default' ) {
		classes.push( `chart-spacing-${ config.spacing }` );
	}

	return classes.join( ' ' );
}

/**
 * Generates CSS class names for legend area based on configuration
 * Fixes alignment issues mentioned in CHARTS-39
 * @param config
 */
export function getLegendAreaClasses( config: ChartContainerConfig = {} ): string {
	const classes: string[] = [ 'legendArea' ];

	// Add position-specific class
	if ( config.legendPosition ) {
		const positionMap: Record< LegendPosition, string > = {
			top: 'legendTop',
			bottom: 'legendBottom',
			left: 'legendLeft',
			right: 'legendRight',
			'top-left': 'legendTopLeft',
			'top-right': 'legendTopRight',
			'bottom-left': 'legendBottomLeft',
			'bottom-right': 'legendBottomRight',
		};
		classes.push( positionMap[ config.legendPosition ] );
	}

	return classes.join( ' ' );
}

/**
 * Generates CSS class names for legend component based on configuration
 * Addresses alignment and orientation issues from CHARTS-39
 * @param config
 */
export function getLegendClasses( config: ChartContainerConfig = {} ): string {
	const classes: string[] = [ 'legend' ];

	// Orientation
	if ( config.legendOrientation ) {
		classes.push( `legend--${ config.legendOrientation }` );
	}

	// Horizontal alignment
	if ( config.legendAlignment ) {
		classes.push( `legend--horizontal-align-${ config.legendAlignment }` );
	}

	// Vertical alignment for vertical legends
	if ( config.legendOrientation === 'vertical' && config.legendVerticalAlignment ) {
		classes.push( `legend--vertical-align-${ config.legendVerticalAlignment }` );
	}

	// Grid positioning enhancement
	classes.push( 'legend--grid-positioned' );

	return classes.join( ' ' );
}

/**
 * Calculates responsive legend position based on viewport width
 * Helps with mobile optimization mentioned in chart-container responsive styles
 * @param position
 * @param viewportWidth
 */
export function getResponsiveLegendPosition(
	position: LegendPosition,
	viewportWidth: number = window.innerWidth
): LegendPosition {
	const mobileBreakpoint = 768; // matches --chart-breakpoint-mobile

	if ( viewportWidth <= mobileBreakpoint ) {
		// Simplify complex positions on mobile
		switch ( position ) {
			case 'left':
			case 'right':
				return 'bottom';
			case 'top-left':
			case 'top-right':
				return 'top';
			case 'bottom-left':
			case 'bottom-right':
				return 'bottom';
			default:
				return position;
		}
	}

	return position;
}

/**
 * Helper to detect CSS Grid and Subgrid support
 * Subgrid has excellent browser support: Firefox 71+, Safari 16.5+, Chrome/Edge 117+ (~75% global)
 */
export function getGridSupport() {
	if ( typeof window === 'undefined' ) {
		return { grid: false, subgrid: false };
	}

	const testElement = document.createElement( 'div' );

	return {
		grid: CSS.supports( 'display', 'grid' ),
		subgrid: CSS.supports( 'grid-template-rows', 'subgrid' ),
	};
}

/**
 * Generate inline styles fallback for browsers without CSS Grid support
 * Maintains compatibility while providing progressive enhancement
 * @param config
 */
export function getContainerStylesFallback(
	config: ChartContainerConfig = {}
): React.CSSProperties {
	const { grid } = getGridSupport();

	// Only provide fallback styles if CSS Grid is not supported
	if ( grid ) {
		return {};
	}

	// Flexbox fallback
	const styles: React.CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
	};

	if ( config.legendPosition === 'top' ) {
		styles.flexDirection = 'column-reverse';
	} else if ( config.legendPosition === 'left' ) {
		styles.flexDirection = 'row-reverse';
	} else if ( config.legendPosition === 'right' ) {
		styles.flexDirection = 'row';
	}

	return styles;
}
