import { useEffect, useId, useMemo } from 'react';
import { useGlobalChartsContext } from './global-charts-provider';
import type { BaseLegendItem } from '../../components/legend/types';

export const useChartId = ( providedId?: string ): string => {
	const generatedId = useId();
	return providedId || generatedId;
};

export const useChartRegistration = ( {
	chartId,
	legendItems,
	chartType,
	isDataValid,
	metadata,
}: {
	chartId: string;
	legendItems: BaseLegendItem[];
	chartType: string;
	isDataValid: boolean;
	metadata?: Record< string, unknown >;
} ): void => {
	const { registerChart, unregisterChart } = useGlobalChartsContext();

	// Memoize metadata to prevent unnecessary re-renders
	const memoizedMetadata = useMemo( () => metadata, [ metadata ] );

	// Memoize legendItems to prevent unnecessary re-renders - use deep comparison
	const legendItemsJson = JSON.stringify( legendItems );
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const memoizedLegendItems = useMemo( () => legendItems, [ legendItemsJson ] );

	useEffect( () => {
		// Only register if data is valid
		if ( isDataValid ) {
			registerChart( chartId, {
				legendItems: memoizedLegendItems,
				chartType,
				metadata: memoizedMetadata,
			} );
		}

		return () => {
			unregisterChart( chartId );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		chartId,
		memoizedLegendItems,
		chartType,
		memoizedMetadata,
		isDataValid,
		// Removed registerChart and unregisterChart from dependencies
		// They are stable functions created with useCallback and empty deps
	] );
};
