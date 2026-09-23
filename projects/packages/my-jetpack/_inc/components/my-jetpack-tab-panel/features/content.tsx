import { _n, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { FeaturesEmptyState } from './empty-state';
import { FeatureItem } from './feature-item';
import { FeatureList } from './feature-list';
import { FeatureModal } from './feature-modal';
import { useFeatureStates } from './feature-state';
import { MenuPointer } from './menu-pointer';
import styles from './styles.module.scss';
import { Toolbar } from './toolbar';
import { getFeatureFilters, isFeatureFilter, matchesFilter } from './use-feature-filter';
import { useFeatureSearch } from './use-feature-search';
import { useMainFeatures } from './use-main-features';
import { useSidebarSync } from './use-sidebar-sync';
import type { FeaturesView } from './toolbar';
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
	const mainFeatures = useMainFeatures();
	const { states, isLoading } = useFeatureStates( mainFeatures );
	const { pointer, dismissPointer } = useSidebarSync( mainFeatures.features );

	const [ searchParams, setSearchParams ] = useSearchParams();

	const search = searchParams.get( 'search' ) || '';
	const filterParam = searchParams.get( 'filter' ) || 'all';
	const filter: FeatureFilter = isFeatureFilter( filterParam ) ? filterParam : 'all';
	const openSlug = searchParams.get( 'feature' );
	const view: FeaturesView = searchParams.get( 'view' ) === 'list' ? 'list' : 'grid';

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
		() =>
			results ??
			// A feature being switched stays put: its status has moved to what the click
			// asked for, and dropping the card out of the list mid-request takes away the
			// control and the place any error notice refers to.
			states.filter( state => matchesFilter( state, filter ) || state.isSwitching ),
		[ filter, results, states ]
	);

	// Counted against every feature, not the visible ones, so a pill says how many it
	// would show rather than how many survived the filter already in play.
	const counts = useMemo(
		() =>
			Object.fromEntries(
				getFeatureFilters( filter ).map( ( { value } ) => [
					value,
					states.filter( state => matchesFilter( state, value ) ).length,
				] )
			) as Record< FeatureFilter, number >,
		[ states, filter ]
	);

	const openFeature = useCallback(
		( slug: string ) => updateParams( { feature: slug } ),
		[ updateParams ]
	);
	const closeFeature = useCallback( () => updateParams( { feature: null } ), [ updateParams ] );

	const onSearchChange = useCallback(
		( term: string ) => updateParams( { search: term || null, feature: null } ),
		[ updateParams ]
	);

	const onFilterChange = useCallback(
		// Clears the search: a term in play replaces the grid outright, so a pill picked
		// while searching would otherwise light up and change nothing.
		( next: FeatureFilter ) =>
			updateParams( { filter: next === 'all' ? null : next, search: null } ),
		[ updateParams ]
	);

	// A plan badge answers "what else is in this?", so it filters and steps out of the modal.
	const onFilterByPlan = useCallback(
		( plan: FeatureFilter ) => updateParams( { filter: plan, feature: null, search: null } ),
		[ updateParams ]
	);

	const onViewChange = useCallback(
		( next: FeaturesView ) => updateParams( { view: next === 'grid' ? null : next } ),
		[ updateParams ]
	);

	const open = states.find( item => item.feature.slug === openSlug );

	// Neither read has anything to say yet: a seed-only catalog is not a failure to load
	// one, and features whose modules are still in flight all read inactive, which would
	// otherwise announce "nothing is active" on a site with plenty on.
	const settling =
		( mainFeatures.isPlaceholderData && mainFeatures.features.length === 0 ) ||
		states.some( state => state.pending );

	return (
		<section className={ styles.content }>
			<Toolbar
				view={ view }
				onViewChange={ onViewChange }
				filter={ filter }
				onFilterChange={ onFilterChange }
				counts={ counts }
				countsPending={ isLoading }
				search={ search }
				onSearchChange={ onSearchChange }
			/>

			{ /* Always rendered, so a screen reader is listening before the count changes. */ }
			<p className="screen-reader-text" role="status">
				{ sprintf(
					/* translators: %d is how many features the filter or search matched. */
					_n( '%d feature shown', '%d features shown', visible.length, 'jetpack-my-jetpack' ),
					visible.length
				) }
			</p>

			{ visible.length === 0 && ! settling && (
				<FeaturesEmptyState
					search={ search }
					filter={ filter }
					hasCatalog={ mainFeatures.features.length > 0 }
					onFilterChange={ onFilterChange }
				/>
			) }
			{ visible.length > 0 &&
				( view === 'list' ? (
					<FeatureList
						states={ visible }
						onOpen={ openFeature }
						canDeactivatePlugins={ mainFeatures.jetpack === 'active' }
					/>
				) : (
					<div className={ styles[ 'feature-grid' ] }>
						{ visible.map( state => (
							<FeatureItem key={ state.feature.slug } state={ state } onOpen={ openFeature } />
						) ) }
					</div>
				) ) }

			{ pointer && <MenuPointer target={ pointer } onDismiss={ dismissPointer } /> }

			{ open && (
				<FeatureModal state={ open } onClose={ closeFeature } onFilterByPlan={ onFilterByPlan } />
			) }
		</section>
	);
}
