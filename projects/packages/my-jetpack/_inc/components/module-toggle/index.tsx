import { store as modulesStore } from '@automattic/jetpack-shared-extension-utils';
import { FormToggle } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import { MyJetpackModule } from '../types';

export type ModuleToggleProps = {
	module: MyJetpackModule;
};

/**
 * Renders a toggle for a Jetpack module.
 *
 * @param {ModuleToggleProps} props - The component props.
 *
 * @return The rendered component.
 */
export function ModuleToggle( { module: $module }: ModuleToggleProps ) {
	const { updateJetpackModuleStatus: toggleModule } = useDispatch( modulesStore );

	const isUpdating = useSelect(
		select => select( modulesStore ).isModuleUpdating( $module.module ),
		[ $module.module ]
	);

	const onChange = useCallback(
		( event: React.ChangeEvent< HTMLInputElement > ) => {
			toggleModule( {
				name: $module.module,
				active: event.target.checked,
			} );
		},
		[ toggleModule, $module.module ]
	);

	return (
		<FormToggle
			disabled={ isUpdating }
			checked={ $module.activated }
			onChange={ onChange }
			aria-label={ sprintf(
				/* translators: %s is the module name */
				__( 'Toggle %s module', 'jetpack-my-jetpack' ),
				$module.name
			) }
		/>
	);
}
