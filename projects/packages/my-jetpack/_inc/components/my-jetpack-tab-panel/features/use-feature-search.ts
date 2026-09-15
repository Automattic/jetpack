import { useMemo } from 'react';
import { hasSearch, moduleFields, rankBy, searchTerms } from '../products/utils';
import type { FeatureState } from './feature-state';
import type { MyJetpackModule } from '../../../types';

export type SearchResult =
	| { kind: 'feature'; state: FeatureState }
	| { kind: 'module'; module: MyJetpackModule };

/**
 * Rank features and modules together against one search term.
 *
 * Uses the Products tab's own scoring so the two searches rank the same way, and mixes
 * both kinds into one list: the best match should lead whether it is a main feature or
 * a smaller module.
 *
 * @param states  - Live state for every feature.
 * @param modules - The modules shown below the feature list.
 * @param search  - The search term.
 * @return The ranked results, or null when nothing is being searched for.
 */
export function useFeatureSearch(
	states: FeatureState[],
	modules: MyJetpackModule[],
	search: string
): SearchResult[] | null {
	return useMemo( () => {
		if ( ! hasSearch( search ) ) {
			return null;
		}

		const terms = searchTerms( search );

		const items: SearchResult[] = [
			...states.map( state => ( { kind: 'feature' as const, state } ) ),
			...modules.map( module => ( { kind: 'module' as const, module } ) ),
		];

		return rankBy( items, terms, item =>
			item.kind === 'feature'
				? [
						{ value: item.state.feature.name, weight: 3 },
						{ value: item.state.feature.description, weight: 1 },
				  ]
				: moduleFields( item.module )
		).map( ( { item } ) => item );
	}, [ modules, search, states ] );
}
