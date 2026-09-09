import { SearchControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Checkbox, Stack } from '@wordpress/ui';
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { MoreFeaturesContent } from '../more-features/content';
import { useOtherModules } from '../more-features/use-other-modules';
import { BulkActions } from './bulk-actions';
import { FeatureItem } from './feature-item';
import { FeatureModal } from './feature-modal';
import { useFeatureStates } from './feature-state';
import { SearchResults } from './search-results';
import styles from './styles.module.scss';
import { useFeatureSearch } from './use-feature-search';

/**
 * The Features content component.
 *
 * Renders the main Jetpack features as a single alphabetical list. The list arrives
 * pre-sorted from `Main_Features::get_features()`.
 *
 * @return The rendered component.
 */
export function FeaturesContent() {
	const features = useMemo(
		() => getMyJetpackWindowInitialState( 'mainFeatures' ) || [],
		[]
	) as MainFeature[];
	const states = useFeatureStates( features );

	const [ selected, setSelected ] = useState< string[] >( [] );
	const [ searchParams, setSearchParams ] = useSearchParams();
	const search = searchParams.get( 'search' ) || '';

	const setSearch = useCallback(
		( term: string ) => {
			setSelected( [] );

			const next = new URLSearchParams( searchParams );

			if ( term ) {
				next.set( 'search', term );
			} else {
				next.delete( 'search' );
			}

			setSearchParams( next, { replace: true } );
		},
		[ searchParams, setSearchParams ]
	);
	const [ openSlug, setOpenSlug ] = useState< string | null >( null );

	const { modules: otherModules } = useOtherModules();
	const results = useFeatureSearch( states, otherModules, search );

	const selectableSlugs = useMemo(
		() => states.filter( state => state.selectable ).map( state => state.feature.slug ),
		[ states ]
	);

	const toggleFeature = useCallback( ( slug: string, checked: boolean ) => {
		setSelected( current =>
			checked ? [ ...current, slug ] : current.filter( item => item !== slug )
		);
	}, [] );

	const clearSelection = useCallback( () => setSelected( [] ), [] );

	const openFeature = useCallback( ( slug: string ) => setOpenSlug( slug ), [] );
	const closeFeature = useCallback( () => setOpenSlug( null ), [] );

	const openIndex = states.findIndex( item => item.feature.slug === openSlug );

	const allSelected = selectableSlugs.length > 0 && selected.length === selectableSlugs.length;

	const toggleAll = useCallback(
		( checked: boolean ) => setSelected( checked ? selectableSlugs : [] ),
		[ selectableSlugs ]
	);

	return (
		<section className={ styles.content }>
			<h2>{ __( 'Features', 'jetpack-my-jetpack' ) }</h2>
			<p className={ styles.description }>
				{ __(
					'Manage and explore Jetpack features that boost growth, performance, and security.',
					'jetpack-my-jetpack'
				) }
			</p>

			<SearchControl
				__nextHasNoMarginBottom
				value={ search }
				onChange={ setSearch }
				aria-label={ __( 'Search features', 'jetpack-my-jetpack' ) }
				placeholder={ __( 'Search features', 'jetpack-my-jetpack' ) }
				className={ styles.search }
			/>

			{ results === null && (
				<Stack direction="row" align="center" gap="md" className={ styles[ 'list-header' ] }>
					<Checkbox
						checked={ allSelected }
						indeterminate={ selected.length > 0 && ! allSelected }
						onCheckedChange={ toggleAll }
						aria-label={ __( 'Select all features', 'jetpack-my-jetpack' ) }
					/>
					<BulkActions states={ states } selected={ selected } onClear={ clearSelection } />
				</Stack>
			) }

			{ results !== null ? <SearchResults results={ results } onOpen={ openFeature } /> : null }

			{ results === null && (
				<Stack direction="column" className={ styles[ 'feature-list' ] }>
					{ states.map( state => (
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

			{ results === null ? <MoreFeaturesContent /> : null }

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
