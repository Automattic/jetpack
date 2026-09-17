import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { FeatureItem } from './feature-item';
import { useFeatureStates } from './feature-state';
import styles from './styles.module.scss';
import { Toolbar } from './toolbar';
import { getFeatureFilters, isFeatureFilter, matchesFilter } from './use-feature-filter';
import { useFeatureSearch } from './use-feature-search';
import type { FeatureFilter } from './use-feature-filter';

/**
 * The Features content component.
 *
 * Owns the filter and the search term for the grid, both kept in the URL so a narrowed
 * list survives a reload and travels in a shared link.
 *
 * @return The rendered component.
 */
export function FeaturesContent() {
	const features = useMemo(
		() => getMyJetpackWindowInitialState( 'mainFeatures' ) || [],
		[]
	) as MainFeature[];
	const states = useFeatureStates( features );

	const [ searchParams, setSearchParams ] = useSearchParams();

	const search = searchParams.get( 'search' ) || '';
	const filterParam = searchParams.get( 'filter' ) || 'all';
	const filter: FeatureFilter = isFeatureFilter( filterParam ) ? filterParam : 'all';

	const updateParams = useCallback(
		( changes: Record< string, string | null > ) => {
			const next = new URLSearchParams( searchParams );

			Object.entries( changes ).forEach( ( [ key, value ] ) => {
				if ( value ) {
					next.set( key, value );
				} else {
					next.delete( key );
				}
			} );

			setSearchParams( next, { replace: true } );
		},
		[ searchParams, setSearchParams ]
	);

	// Searching replaces the grid outright, the way it does on the Products tab, so a
	// term in play takes the filter's place rather than narrowing alongside it.
	const results = useFeatureSearch( states, search );
	const visible = useMemo(
		() => results ?? states.filter( state => matchesFilter( state, filter ) ),
		[ filter, results, states ]
	);

	// Counted against every feature, not the visible ones, so a pill says how many it
	// would show rather than how many survived the filter already in play.
	const counts = useMemo(
		() =>
			Object.fromEntries(
				getFeatureFilters().map( ( { value } ) => [
					value,
					states.filter( state => matchesFilter( state, value ) ).length,
				] )
			) as Record< FeatureFilter, number >,
		[ states ]
	);

	const onSearchChange = useCallback(
		( term: string ) => updateParams( { search: term || null } ),
		[ updateParams ]
	);

	const onFilterChange = useCallback(
		( next: FeatureFilter ) => updateParams( { filter: next === 'all' ? null : next } ),
		[ updateParams ]
	);

	return (
		<section className={ styles.content }>
			<Toolbar
				filter={ filter }
				onFilterChange={ onFilterChange }
				counts={ counts }
				search={ search }
				onSearchChange={ onSearchChange }
			/>

			{ visible.length > 0 ? (
				<div className={ styles[ 'feature-grid' ] }>
					{ visible.map( state => (
						<FeatureItem key={ state.feature.slug } state={ state } />
					) ) }
				</div>
			) : (
				<h3 className={ styles[ 'empty-heading' ] } role="status">
					{ __( 'No features found.', 'jetpack-my-jetpack' ) }
				</h3>
			) }
		</section>
	);
}
