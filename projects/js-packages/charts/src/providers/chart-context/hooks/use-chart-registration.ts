import { useEffect, useMemo } from 'react';
import { useDeepMemo } from '../../../hooks';
import { useGlobalChartsContext } from './use-global-charts-context';
import type { BaseLegendItem } from '../../../components/legend';
import type { ChartType } from '../../../types';

export const useChartRegistration = ( {
	chartId,
	legendItems,
	chartType,
	isDataValid,
	metadata,
}: {
	chartId: string;
	legendItems: BaseLegendItem[];
	chartType: ChartType;
	isDataValid: boolean;
	metadata?: Record< string, unknown >;
} ): void => {
	const { registerChart, unregisterChart } = useGlobalChartsContext();

	// Memoize legendItems with deep comparison to prevent infinite loops
	const stableLegendItems = useDeepMemo( legendItems );

	// Memoize metadata to prevent unnecessary re-renders
	const memoizedMetadata = useMemo( () => metadata, [ metadata ] );

	useEffect( () => {
		// Only register if data is valid
		if ( isDataValid ) {
			registerChart( chartId, {
				legendItems: stableLegendItems,
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
		stableLegendItems,
		chartType,
		memoizedMetadata,
		isDataValid,
		// Removed registerChart and unregisterChart from dependencies
		// They are stable functions created with useCallback and empty deps
	] );
};
