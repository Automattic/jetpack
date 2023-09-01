import { useMemo } from 'react';
import uPlot from 'uplot';
import { Period, ScoreGraphAlignedData } from './index';

/**
 * Transforms an array of periods into an array of arrays, where the first array is the timestamps, and the rest are the values for each key
 *
 * @param {Period[]} periods - Array of periods to transform
 * @param {string[]} [keysToExtract = [ 'desktop_overall_score', 'mobile_overall_score' ]] - Array of keys to extract from each period
 * @returns {uPlot.AlignedData} - Array of arrays, where the first array is the timestamps, and the rest are the values for each key
 */
export function useBoostScoreTransform(
	periods,
	keysToExtract = [ 'desktop_overall_score', 'mobile_overall_score' ]
): ScoreGraphAlignedData | [] {
	return useMemo( () => {
		if ( ! periods?.length || ! periods[ 0 ].dimensions ) {
			return [];
		}
		const timestamps = periods.map( ( { timestamp } ) => timestamp / 1000 );

		const valueArray = [];
		for ( const key of keysToExtract ) {
			valueArray.push(
				periods.map( ( { dimensions } ) => {
					return dimensions[ key ];
				} )
			);
		}

		return [ timestamps, ...valueArray ] as ScoreGraphAlignedData;
	}, [ keysToExtract, periods ] );
}
