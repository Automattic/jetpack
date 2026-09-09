import { __ } from '@wordpress/i18n';
import { Checkbox, Stack, Text } from '@wordpress/ui';
import { useCallback, useMemo, useState } from 'react';
import { ModuleBulkActions } from './module-bulk-actions';
import { ModuleItem } from './module-item';
import styles from './styles.module.scss';
import { useOtherModules } from './use-other-modules';

/**
 * Everything the Features list does not cover, under group headings.
 *
 * Sits below the feature list rather than on a tab of its own: these are the modules
 * that have not yet found a home inside the feature that owns them, and seeing them
 * beneath the features makes the overlap obvious.
 *
 * @return The rendered component.
 */
export function MoreFeaturesContent() {
	const { groups, modules, isLoading } = useOtherModules();

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

	if ( isLoading || ! modules.length ) {
		return null;
	}

	return (
		<section className={ styles.content }>
			<h2>{ __( 'More features', 'jetpack-my-jetpack' ) }</h2>
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
					aria-label={ __( 'Select all additional features', 'jetpack-my-jetpack' ) }
				/>
				<ModuleBulkActions modules={ modules } selected={ selected } onClear={ clearSelection } />
			</Stack>

			{ groups.map( group => (
				<section key={ group.label } className={ styles.group }>
					<h3 className={ styles.group__label }>{ group.label }</h3>
					<Stack direction="column" className={ styles[ 'module-list' ] }>
						{ group.modules.map( item => (
							<ModuleItem
								key={ item.module }
								module={ item }
								selected={ selected.includes( item.module ) }
								onSelect={ toggleModule }
							/>
						) ) }
					</Stack>
				</section>
			) ) }
		</section>
	);
}
