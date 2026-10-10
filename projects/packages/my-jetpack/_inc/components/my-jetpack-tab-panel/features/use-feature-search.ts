import { useMemo } from 'react';
import { hasSearch, rankBy, searchTerms } from './search';
import type { FeatureState } from './feature-state';

/**
 * Rank the feature list against one search term.
 *
 * Shares its scoring with the More Features search so the two rank the same way.
 *
 * @param states - Live state for every feature.
 * @param search - The search term.
 * @return The ranked features, or null when nothing is being searched for.
 */
export function useFeatureSearch( states: FeatureState[], search: string ): FeatureState[] | null {
	return useMemo( () => {
		if ( ! hasSearch( search ) ) {
			return null;
		}

		const terms = searchTerms( search );

		return rankBy( states, terms, state => [
			{ value: state.feature.name, weight: 3 },
			{ value: state.feature.description, weight: 1 },
		] ).map( ( { item } ) => item );
	}, [ search, states ] );
}
