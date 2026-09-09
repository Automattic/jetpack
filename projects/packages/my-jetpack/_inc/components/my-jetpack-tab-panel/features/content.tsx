import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { MoreFeaturesContent } from '../more-features/content';
import { useOtherModules } from '../more-features/use-other-modules';
import { FeatureItem } from './feature-item';
import { FeatureModal } from './feature-modal';
import { useFeatureStates } from './feature-state';
import { isSelectable } from './partition-selection';
import { SearchResults } from './search-results';
import styles from './styles.module.scss';
import { Toolbar } from './toolbar';
import { isFeatureFilter, matchesFilter } from './use-feature-filter';
import { useFeatureSearch } from './use-feature-search';
import type { BulkTarget } from './partition-selection';
import type { FeatureFilter } from './use-feature-filter';

/**
 * The Features content component.
 *
 * Owns the selection, filter and search for the whole page: the main feature list and
 * the grouped modules below it share one toolbar, so they must share one state.
 *
 * @return The rendered component.
 */
export function FeaturesContent() {
	const features = useMemo(
		() => getMyJetpackWindowInitialState( 'mainFeatures' ) || [],
		[]
	) as MainFeature[];
	const states = useFeatureStates( features );
	const { groups, modules: otherModules } = useOtherModules();

	const [ searchParams, setSearchParams ] = useSearchParams();
	const [ selected, setSelected ] = useState< string[] >( [] );

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

	// Every feature and module on the page, in the order they are rendered.
	const targets: BulkTarget[] = useMemo(
		() => [
			...states.map( state => ( {
				kind: 'feature' as const,
				slug: state.feature.slug,
				state,
			} ) ),
			...otherModules.map( module => ( {
				kind: 'module' as const,
				slug: module.module,
				module,
			} ) ),
		],
		[ otherModules, states ]
	);

	const visible = useMemo(
		() => new Set( targets.filter( t => matchesFilter( t, filter ) ).map( t => t.slug ) ),
		[ filter, targets ]
	);

	const selectableSlugs = useMemo(
		() => targets.filter( t => isSelectable( t ) && visible.has( t.slug ) ).map( t => t.slug ),
		[ targets, visible ]
	);

	const visibleStates = useMemo(
		() => states.filter( state => visible.has( state.feature.slug ) ),
		[ states, visible ]
	);

	const results = useFeatureSearch( states, otherModules, search );

	const toggleFeature = useCallback( ( slug: string, checked: boolean ) => {
		setSelected( current =>
			checked ? [ ...current, slug ] : current.filter( item => item !== slug )
		);
	}, [] );

	const openFeature = useCallback(
		( slug: string ) => updateParams( { feature: slug } ),
		[ updateParams ]
	);
	const closeFeature = useCallback( () => updateParams( { feature: null } ), [ updateParams ] );

	// Searching replaces the lists the selection belongs to, so it starts clean.
	const onSearchChange = useCallback(
		( term: string ) => {
			setSelected( [] );
			updateParams( { search: term || null, feature: null } );
		},
		[ updateParams ]
	);

	const onFilterChange = useCallback(
		( next: FeatureFilter ) => {
			setSelected( [] );
			updateParams( { filter: next === 'all' ? null : next } );
		},
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
				targets={ targets }
				selectableSlugs={ selectableSlugs }
				selected={ selected }
				onSelectedChange={ setSelected }
				filter={ filter }
				onFilterChange={ onFilterChange }
				search={ search }
				onSearchChange={ onSearchChange }
			/>

			{ results !== null ? (
				<SearchResults results={ results } onOpen={ openFeature } />
			) : (
				<>
					{ visibleStates.length > 0 && (
						<Stack direction="column" className={ styles[ 'feature-list' ] }>
							{ visibleStates.map( state => (
								<FeatureItem
									key={ state.feature.slug }
									state={ state }
									selected={ selected.includes( state.feature.slug ) }
									onSelect={ toggleFeature }
									onOpen={ openFeature }
								/>
							) ) }
						</Stack>
					) }

					<MoreFeaturesContent
						groups={ groups }
						visible={ visible }
						selected={ selected }
						onSelect={ toggleFeature }
					/>
				</>
			) }

			{ openIndex !== -1 && (
				<FeatureModal
					state={ states[ openIndex ] }
					previous={ states[ openIndex - 1 ] }
					next={ states[ openIndex + 1 ] }
					onClose={ closeFeature }
					onStep={ openFeature }
				/>
			) }
		</section>
	);
}
