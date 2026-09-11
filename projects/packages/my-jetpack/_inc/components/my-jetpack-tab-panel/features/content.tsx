import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { FeatureItem } from './feature-item';
import { FeatureModal } from './feature-modal';
import { useFeatureStates } from './feature-state';
import styles from './styles.module.scss';
import { Toolbar } from './toolbar';
import { isFeatureFilter, matchesFilter } from './use-feature-filter';
import { useFeatureSearch } from './use-feature-search';
import type { FeatureFilter } from './use-feature-filter';

/**
 * The Features content component.
 *
 * Owns the filter and search for the grid, and which feature's modal is open.
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
	const openSlug = searchParams.get( 'feature' );

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
		( next: FeatureFilter ) => updateParams( { filter: next === 'all' ? null : next } ),
		[ updateParams ]
	);

	// A plan badge answers "what else is in this?", so it filters and steps out of the modal.
	const onFilterByPlan = useCallback(
		( plan: FeatureFilter ) => updateParams( { filter: plan, feature: null, search: null } ),
		[ updateParams ]
	);

	const openIndex = states.findIndex( item => item.feature.slug === openSlug );

	return (
		<section className={ styles.content }>
			<h2>{ __( 'Features', 'jetpack-my-jetpack' ) }</h2>
			<p className={ styles.description }>
				{ __(
					'Manage and explore Jetpack features that boost growth, performance, and security.',
					'jetpack-my-jetpack'
				) }
			</p>

			<Toolbar
				filter={ filter }
				onFilterChange={ onFilterChange }
				search={ search }
				onSearchChange={ onSearchChange }
			/>

			{ visible.length > 0 ? (
				<div className={ styles[ 'feature-grid' ] }>
					{ visible.map( state => (
						<FeatureItem key={ state.feature.slug } state={ state } onOpen={ openFeature } />
					) ) }
				</div>
			) : (
				<h3 className={ styles[ 'empty-heading' ] } role="status">
					{ __( 'No features found.', 'jetpack-my-jetpack' ) }
				</h3>
			) }

			{ openIndex !== -1 && (
				<FeatureModal
					state={ states[ openIndex ] }
					previous={ states[ openIndex - 1 ] }
					next={ states[ openIndex + 1 ] }
					onClose={ closeFeature }
					onStep={ openFeature }
					onFilterByPlan={ onFilterByPlan }
				/>
			) }
		</section>
	);
}
