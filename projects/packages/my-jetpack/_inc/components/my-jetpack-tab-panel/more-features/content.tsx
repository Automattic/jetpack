import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { useMemo } from 'react';
import { ModuleItem } from './module-item';
import styles from './styles.module.scss';
import type { ModuleGroup } from './use-other-modules';

type MoreFeaturesContentProps = {
	groups: ModuleGroup[];
	visible: Set< string >;
	selected: string[];
	onSelect: ( slug: string, checked: boolean ) => void;
};

/**
 * Everything the Features list does not cover, under group headings.
 *
 * Selection, filtering and search all live in the toolbar above, which spans both
 * lists, so this renders what it is given rather than owning any of it.
 *
 * @param {MoreFeaturesContentProps} props          - The component props.
 * @param {ModuleGroup[]}            props.groups   - The grouped modules.
 * @param {Set}                      props.visible  - Slugs passing the current filter.
 * @param {string[]}                 props.selected - Slugs selected for a bulk action.
 * @param {Function}                 props.onSelect - Called when a row's checkbox changes.
 * @return The rendered component.
 */
export function MoreFeaturesContent( {
	groups,
	visible,
	selected,
	onSelect,
}: MoreFeaturesContentProps ) {
	// A group with nothing left after filtering drops out rather than leaving a heading.
	const visibleGroups = useMemo(
		() =>
			groups
				.map( group => ( {
					...group,
					modules: group.modules.filter( item => visible.has( item.module ) ),
				} ) )
				.filter( group => group.modules.length > 0 ),
		[ groups, visible ]
	);

	if ( ! visibleGroups.length ) {
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

			{ visibleGroups.map( group => (
				<section key={ group.label } className={ styles.group }>
					<h3 className={ styles.group__label }>{ group.label }</h3>
					<Stack direction="column" className={ styles[ 'module-list' ] }>
						{ group.modules.map( item => (
							<ModuleItem
								key={ item.module }
								module={ item }
								selected={ selected.includes( item.module ) }
								onSelect={ onSelect }
							/>
						) ) }
					</Stack>
				</section>
			) ) }
		</section>
	);
}
