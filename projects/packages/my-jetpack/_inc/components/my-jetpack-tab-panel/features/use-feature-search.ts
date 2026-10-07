import { useMemo } from 'react';
import { getFeatureModuleSlug } from './feature-state';
import { getProductModules } from './mappings';
import { hasSearch, moduleFields, rankBy, searchTerms } from './search';
import type { FeatureState } from './feature-state';
import type { MyJetpackModule } from '../../../types';

/**
 * Rank the feature list against one search term.
 *
 * Shares its scoring with the More Features search so the two rank the same way.
 *
 * @param states  - Live state for every feature.
 * @param search  - The search term.
 * @param modules - Module metadata for migrated searches only.
 * @return The ranked features, or null when nothing is being searched for.
 */
export function useFeatureSearch(
	states: FeatureState[],
	search: string,
	modules?: Record< string, MyJetpackModule >
): FeatureState[] | null {
	return useMemo( () => {
		if ( ! hasSearch( search ) ) {
			return null;
		}

		const terms = searchTerms( search );

		return rankBy( states, terms, state => {
			const module = modules?.[ getFeatureModuleSlug( state.feature, getProductModules() ) ];
			return [
				{ value: state.feature.name, weight: 3 },
				{ value: state.feature.description, weight: 1 },
				...( module ? moduleFields( module, true ) : [] ),
			];
		} ).map( ( { item } ) => item );
	}, [ search, states, modules ] );
}
