import { DataContext } from '@visx/xychart';
import { useEffect, useState, useCallback, useMemo, isValidElement, cloneElement } from 'react';
import LineChartAnnotationsKeyboardNavigation from './line-chart-annotations-keyboard-navigation';
import { useLineChartContext } from './line-chart-context';
import styles from './line-chart.module.scss';
import type { AxisScale } from '@visx/axis';
import type { FC, ReactNode, ReactElement } from 'react';

export interface LineChartAnnotationsProps {
	children?: ReactNode;
}

interface ScaleData {
	xScale: AxisScale< Date >;
	yScale: AxisScale< number >;
}

const LineChartAnnotationsOverlay: FC< LineChartAnnotationsProps > = ( { children } ) => {
	const { chartRef, chartWidth, chartHeight } = useLineChartContext();

	const [ scales, setScales ] = useState< ScaleData | null >( null );
	const [ scalesStable, setScalesStable ] = useState< boolean >( false );
	const [ selectedIndex, setSelectedIndex ] = useState< number | undefined >( undefined );

	// Track interactive annotations (those with renderLabelPopover)
	const interactiveAnnotations = useMemo( () => {
		if ( ! children ) return [];

		const annotations: ReactElement[] = [];

		const processChild = ( child: ReactNode ): void => {
			if ( isValidElement( child ) && child.props?.renderLabelPopover ) {
				annotations.push( child );
			}
		};

		if ( Array.isArray( children ) ) {
			children.forEach( processChild );
		} else {
			processChild( children );
		}

		return annotations;
	}, [ children ] );

	// Clone children to pass navigation props to interactive annotations
	const enhancedChildren = useMemo( () => {
		if ( ! children ) return null;

		let interactiveIndex = 0;

		const processChild = ( child: ReactNode ): ReactNode => {
			if ( isValidElement( child ) && child.props?.renderLabelPopover ) {
				const isSelected = selectedIndex === interactiveIndex;
				const currentIndex = interactiveIndex++;

				return cloneElement( child, {
					...child.props,
					isSelected,
					navigationIndex: currentIndex,
					tabIndex: -1, // Remove from tab order
				} );
			}
			return child;
		};

		if ( Array.isArray( children ) ) {
			return children.map( processChild );
		}

		return processChild( children );
	}, [ children, selectedIndex ] );

	const hasInteractiveAnnotations = interactiveAnnotations.length > 0;

	// Create a signature for scale data to enable easy comparison
	const createScaleSignature = useCallback( ( scaleData: ScaleData ) => {
		const xDomain = scaleData.xScale.domain();
		const yDomain = scaleData.yScale.domain();
		const xRange = scaleData.xScale.range();
		const yRange = scaleData.yScale.range();

		return `${ xDomain.join( ',' ) }-${ yDomain.join( ',' ) }-${ xRange.join(
			','
		) }-${ yRange.join( ',' ) }`;
	}, [] );

	// Get scales from chart ref and return them with signature for comparison
	const getScalesData = useCallback( () => {
		if ( chartRef?.current ) {
			const scaleData = chartRef.current.getScales();

			if ( scaleData ) {
				const scaleInfo = {
					xScale: scaleData.xScale as AxisScale< Date >,
					yScale: scaleData.yScale as AxisScale< number >,
				};

				return {
					scales: scaleInfo,
					signature: createScaleSignature( scaleInfo ),
				};
			}
		}

		return null;
	}, [ chartRef, createScaleSignature ] );

	// The chart resizes on render so we need to monitor the scales until they stabilize
	useEffect( () => {
		let timeoutId: number | null = null;
		let lastSignature: string | null = null;
		let retryCount = 0;
		const maxRetries = 20; // 20 * 50ms = 1 second max
		const checkInterval = 50; // Check every 50ms

		// Reset stability state when monitoring starts
		setScalesStable( false );

		const monitorScales = () => {
			const currentScaleData = getScalesData();

			// If we got scales, compare signatures
			if ( currentScaleData ) {
				// Check if scales have settled by comparing signatures
				const scalesSettled = lastSignature && currentScaleData.signature === lastSignature;

				if ( scalesSettled ) {
					// Scales have stabilized, mark as stable
					setScalesStable( true );
					return;
				}

				// Update scales and remember signature for next comparison
				setScales( currentScaleData.scales );
				lastSignature = currentScaleData.signature;
			}

			// Continue monitoring if we haven't exceeded max retries
			if ( retryCount < maxRetries ) {
				retryCount++;
				timeoutId = setTimeout( monitorScales, checkInterval ) as unknown as number;
			}
		};

		monitorScales();

		return () => {
			if ( timeoutId ) {
				clearTimeout( timeoutId );
			}
		};
	}, [ getScalesData, chartWidth, chartHeight ] );

	// Early return if no chart data available
	if ( ! chartRef || ! children ) {
		return null;
	}

	if ( ! scales || ! scalesStable ) {
		return null;
	}

	// Create a DataContext value that mimics what visx provides
	// We're intentionally providing minimal context for annotations to work
	const dataContextValue = {
		xScale: scales.xScale,
		yScale: scales.yScale,
		margin: { top: 0, right: 0, bottom: 0, left: 0 },
		width: chartWidth,
		height: chartHeight,
	} as unknown as Parameters< typeof DataContext.Provider >[ 0 ][ 'value' ];

	// SVG content that will be used in both cases
	const svgContent = (
		<svg
			width={ chartWidth }
			height={ chartHeight }
			className={ styles[ 'line-chart__annotations-overlay' ] }
			data-testid="line-chart-annotations-overlay"
		>
			{ enhancedChildren }
		</svg>
	);

	return (
		<DataContext.Provider value={ dataContextValue }>
			{ hasInteractiveAnnotations ? (
				<LineChartAnnotationsKeyboardNavigation
					chartWidth={ chartWidth }
					chartHeight={ chartHeight }
					totalInteractiveAnnotations={ interactiveAnnotations.length }
					selectedIndex={ selectedIndex }
					setSelectedIndex={ setSelectedIndex }
					children={ svgContent }
				/>
			) : (
				svgContent
			) }
		</DataContext.Provider>
	);
};

export default LineChartAnnotationsOverlay;
