import { DataContext } from '@visx/xychart';
import { useEffect, useState, useCallback } from 'react';
import LineChartAnnotation from './line-chart-annotation';
import styles from './line-chart.module.scss';
import type { LineChartRef } from './line-chart';
import type { LineChartAnnotationProps } from './line-chart-annotation';

interface LineChartAnnotationsProps {
	chartRef: React.RefObject< LineChartRef >;
	annotations: LineChartAnnotationProps[];
	chartWidth: number;
	chartHeight: number;
}

const LineChartAnnotations: React.FC< LineChartAnnotationsProps > = ( {
	chartRef,
	annotations,
	chartWidth,
	chartHeight,
} ) => {
	const [ scales, setScales ] = useState< { xScale: unknown; yScale: unknown } | null >( null );
	const [ isReady, setIsReady ] = useState( false );

	// Get scales from chart ref
	const updateScales = useCallback( () => {
		if ( chartRef.current ) {
			const scaleData = chartRef.current.getScales();
			if ( scaleData ) {
				setScales( scaleData );
				setIsReady( true );
			}
		}
	}, [ chartRef ] );

	// Update scales when component mounts and when chart updates
	useEffect( () => {
		updateScales();

		// Set up a timer to retry getting scales if not immediately available
		const timer = setTimeout( updateScales, 100 );

		return () => clearTimeout( timer );
	}, [ updateScales ] );

	// Don't render anything if scales aren't ready
	if ( ! isReady || ! scales ) {
		return null;
	}

	// Create a DataContext value that mimics what visx provides
	// We're intentionally providing minimal context for annotations to work
	const dataContextValue = {
		xScale: scales.xScale,
		yScale: scales.yScale,
		// Add minimal required properties for DataContext
		theme: {},
		margin: { top: 0, right: 0, bottom: 0, left: 0 },
		width: chartWidth,
		height: chartHeight,
		// Additional visx DataContext properties that may be needed
		colorScale: undefined,
		dataRegistry: new Map(),
		registerData: () => {},
		unregisterData: () => {},
	} as unknown as Parameters< typeof DataContext.Provider >[ 0 ][ 'value' ];

	return (
		<DataContext.Provider value={ dataContextValue }>
			<svg
				width={ chartWidth }
				height={ chartHeight }
				className={ styles[ 'line-chart__annotations-overlay' ] }
			>
				{ annotations.map( ( annotation, index ) => (
					<LineChartAnnotation
						key={ `overlay-annotation-${ index }` }
						testId={ `overlay-annotation-${ index }` }
						datum={ annotation.datum }
						title={ annotation.title }
						subtitle={ annotation.subtitle }
						subjectType={ annotation.subjectType }
						styles={ annotation.styles }
						dx={ annotation.dx }
						dy={ annotation.dy }
						renderLabel={ annotation.renderLabel }
					/>
				) ) }
			</svg>
		</DataContext.Provider>
	);
};

export default LineChartAnnotations;
