import { __ } from '@wordpress/i18n';
import { Checkbox, Stack, Text } from '@wordpress/ui';
import { useCallback, useMemo, useState } from 'react';
import { ModuleBulkActions } from './module-bulk-actions';
import { ModuleItem } from './module-item';
import styles from './styles.module.scss';
import { useOtherModules } from './use-other-modules';

/**
 * The More features content component.
 *
 * Everything the legacy Modules screen lists that the Features tab does not already
 * cover. Shown as its own tab while the shape is being explored; the intent is for it
 * to sit under the feature list behind a "More features" control, and for each of
 * these to eventually move inside the feature that owns it.
 *
 * @return The rendered component.
 */
export function MoreFeaturesContent() {
	const { modules, isLoading } = useOtherModules();
	const [ selected, setSelected ] = useState< string[] >( [] );

	// A module pinned on or off by a filter cannot take part in a bulk action.
	const selectableSlugs = useMemo(
		() => modules.filter( item => item.available && ! item.override ).map( item => item.module ),
		[ modules ]
	);

	const toggleModule = useCallback( ( slug: string, checked: boolean ) => {
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

	if ( isLoading ) {
		return null;
	}

	return (
		<section className={ styles.content }>
			<Text variant="body-sm" className={ styles.intro }>
				{ __(
					'Smaller features that do not yet belong to one of the main features above.',
					'jetpack-my-jetpack'
				) }
			</Text>

			<Stack direction="row" align="center" gap="md" className={ styles[ 'list-header' ] }>
				<Checkbox
					checked={ allSelected }
					indeterminate={ selected.length > 0 && ! allSelected }
					onCheckedChange={ toggleAll }
					aria-label={ __( 'Select all features', 'jetpack-my-jetpack' ) }
				/>
				<ModuleBulkActions modules={ modules } selected={ selected } onClear={ clearSelection } />
			</Stack>

			<Stack direction="column" className={ styles[ 'module-list' ] }>
				{ modules.map( item => (
					<ModuleItem
						key={ item.module }
						module={ item }
						selected={ selected.includes( item.module ) }
						onSelect={ toggleModule }
					/>
				) ) }
			</Stack>
		</section>
	);
}
