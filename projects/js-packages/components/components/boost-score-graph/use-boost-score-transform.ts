import { useMemo } from 'react';
import { Period } from './index';

type ScoreGraphAlignedData = [
	number[], // timestamps
	number[], // desktop_overall_score
	number[], // mobile_overall_score
];

// Extract the value of a dimension from an array of periods
const getPeriodDimension = function ( key: string, periods: Period[] ) {
	return periods.map( ( { dimensions } ) => {
		return dimensions[ key ];
	} );
};

/**
 * Transforms an array of periods into an array of arrays, where the first array is the timestamps, and the rest are the values for each key
 *
 * @param {Period[]} periods - Array of periods to transform
 * @returns {ScoreGraphAlignedData | []} - Array of arrays, where the first array is the timestamps, and the rest are the values for each key
 */
export function useBoostScoreTransform( periods: Period[] ): ScoreGraphAlignedData | [] {
	return useMemo( () => {
		if ( ! periods?.length || ! periods[ 0 ].dimensions ) {
			return [];
		}
		const timestamps = periods.map( ( { timestamp } ) => timestamp / 1000 );

		return [
			timestamps,
			getPeriodDimension( 'desktop_overall_score', periods ),
			getPeriodDimension( 'mobile_overall_score', periods ),
		];
	}, [ periods ] );
}
