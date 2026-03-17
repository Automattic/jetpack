import { DataContext } from '@visx/xychart';
import { useEffect, useState, useCallback } from 'react';
import { useSingleChartContext } from '../../private/single-chart-context';
import styles from '../line-chart.module.scss';
import type { AxisScale } from '@visx/axis';
import type { FC, ReactNode } from 'react';

export interface LineChartAnnotationsProps {
	children?: ReactNode;
}

interface ScaleData {
	xScale: AxisScale< Date >;
	yScale: AxisScale< number >;
}

const LineChartAnnotationsOverlay: FC< LineChartAnnotationsProps > = ( { children } ) => {
	const { chartRef, chartWidth, chartHeight } = useSingleChartContext();

	const [ scales, setScales ] = useState< ScaleData | null >( null );
	const [ scalesStable, setScalesStable ] = useState< boolean >( false );

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

	if ( ! chartRef || ! children || ! chartWidth || ! chartHeight ) {
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

	return (
		<DataContext.Provider value={ dataContextValue }>
			<svg
				width={ chartWidth }
				height={ chartHeight }
				className={ styles[ 'line-chart__annotations-overlay' ] }
				data-testid="line-chart-annotations-overlay"
			>
				{ children }
			</svg>
		</DataContext.Provider>
	);
};

export default LineChartAnnotationsOverlay;
