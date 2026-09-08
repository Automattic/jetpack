import { __ } from '@wordpress/i18n';
import { Checkbox, Stack } from '@wordpress/ui';
import { useCallback, useMemo, useState } from 'react';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { BulkActions } from './bulk-actions';
import { FeatureItem } from './feature-item';
import { useFeatureStates } from './feature-state';
import styles from './styles.module.scss';

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

	const allSelected = selectableSlugs.length > 0 && selected.length === selectableSlugs.length;

	const toggleAll = useCallback(
		( checked: boolean ) => setSelected( checked ? selectableSlugs : [] ),
		[ selectableSlugs ]
	);

	return (
		<section className={ styles.content }>
			<Stack direction="row" align="center" gap="md" className={ styles[ 'list-header' ] }>
				<Checkbox
					checked={ allSelected }
					indeterminate={ selected.length > 0 && ! allSelected }
					onCheckedChange={ toggleAll }
					aria-label={ __( 'Select all features', 'jetpack-my-jetpack' ) }
				/>
				<BulkActions states={ states } selected={ selected } onClear={ clearSelection } />
			</Stack>

			<Stack direction="column" className={ styles[ 'feature-list' ] }>
				{ states.map( state => (
					<FeatureItem
						key={ state.feature.slug }
						state={ state }
						selected={ selected.includes( state.feature.slug ) }
						onSelect={ toggleFeature }
					/>
				) ) }
			</Stack>
		</section>
	);
}
