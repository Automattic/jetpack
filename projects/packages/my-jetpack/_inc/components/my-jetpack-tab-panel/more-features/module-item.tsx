import { useGlobalNotices } from '@automattic/jetpack-components';
import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { FormToggle } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Checkbox, Stack, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import styles from './styles.module.scss';
import type { MyJetpackModule } from '../../../types';

type ModuleItemProps = {
	module: MyJetpackModule;
	selected: boolean;
	onSelect: ( slug: string, checked: boolean ) => void;
	showCheckbox?: boolean;
};

/**
 * One row in the More features list.
 *
 * @param {ModuleItemProps} props              - The component props.
 * @param {MyJetpackModule} props.module       - The module to render.
 * @param {boolean}         props.selected     - Whether the row is selected for a bulk action.
 * @param {Function}        props.onSelect     - Called when the row's checkbox changes.
 * @param {boolean}         props.showCheckbox - Whether the row offers bulk selection.
 * @return The rendered component.
 */
export function ModuleItem( {
	module: $module,
	selected,
	onSelect,
	showCheckbox = true,
}: ModuleItemProps ) {
	const { updateJetpackModuleStatus } = useDispatch( modulesStore );
	const { createErrorNotice } = useGlobalNotices();

	const isUpdating = useSelect(
		select => select( modulesStore ).isModuleUpdating( $module.module ),
		[ $module.module ]
	);

	// A module pinned on or off by a filter cannot be changed from here.
	const isLocked = !! $module.override || ! $module.available;

	const onChange = useCallback( async () => {
		const success = await updateJetpackModuleStatus( {
			name: $module.module,
			active: ! $module.activated,
		} );

		if ( ! success ) {
			createErrorNotice(
				sprintf(
					/* translators: %s is the module name. */
					__( 'Failed to update %s.', 'jetpack-my-jetpack' ),
					$module.name
				)
			);
		}
	}, [
		$module.activated,
		$module.module,
		$module.name,
		createErrorNotice,
		updateJetpackModuleStatus,
	] );

	const onCheckedChange = useCallback(
		( checked: boolean ) => onSelect( $module.module, checked ),
		[ $module.module, onSelect ]
	);

	return (
		<Stack
			direction="row"
			align="center"
			gap="md"
			className={ styles[ 'module-item' ] }
			data-module={ $module.module }
		>
			{ showCheckbox && (
				<Checkbox
					checked={ selected }
					disabled={ isLocked }
					onCheckedChange={ onCheckedChange }
					aria-label={ $module.name }
				/>
			) }

			<Stack direction="column" gap="xs" className={ styles[ 'module-item__details' ] }>
				<Stack direction="row" align="center" gap="sm" wrap="wrap">
					<Text variant="heading-md">{ $module.name }</Text>
					<Badge intent={ $module.activated ? 'stable' : 'none' }>
						{ $module.activated
							? __( 'Active', 'jetpack-my-jetpack' )
							: __( 'Inactive', 'jetpack-my-jetpack' ) }
					</Badge>
				</Stack>
				<Text variant="body-sm">{ $module.description }</Text>
			</Stack>

			<FormToggle
				checked={ $module.activated }
				disabled={ isUpdating || isLocked }
				onChange={ onChange }
				aria-label={ sprintf(
					/* translators: %s is the module name. */
					__( 'Toggle %s', 'jetpack-my-jetpack' ),
					$module.name
				) }
			/>
		</Stack>
	);
}
