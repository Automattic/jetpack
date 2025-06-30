import { useGlobalNotices } from '@automattic/jetpack-components';
import { store as modulesStore } from '@automattic/jetpack-shared-extension-utils';
import { FormToggle } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import { MyJetpackModule } from '../types';
import type { ChangeEvent } from 'react';

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
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();

	const isUpdating = useSelect(
		select => select( modulesStore ).isModuleUpdating( $module.module ),
		[ $module.module ]
	);

	const showToggleNotice = useCallback(
		async ( {
			noticeType,
			action,
		}: {
			noticeType: 'success' | 'error';
			action: 'activation' | 'deactivation';
		} ) => {
			if ( noticeType === 'success' ) {
				const message =
					action === 'activation'
						? sprintf(
								/* translators: %s is the module name */
								__( '%s has been activated.', 'jetpack-my-jetpack' ),
								$module.name
						  )
						: sprintf(
								/* translators: %s is the module name */
								__( '%s has been deactivated.', 'jetpack-my-jetpack' ),
								$module.name
						  );
				createSuccessNotice( message );
			} else {
				const message =
					action === 'activation'
						? sprintf(
								/* translators: %s is the module name */
								__( 'Failed to activate %s.', 'jetpack-my-jetpack' ),
								$module.name
						  )
						: sprintf(
								/* translators: %s is the module name */
								__( 'Failed to deactivate %s.', 'jetpack-my-jetpack' ),
								$module.name
						  );

				createErrorNotice( message );
			}
		},
		[ $module.name, createErrorNotice, createSuccessNotice ]
	);

	const onChange = useCallback(
		async ( event: ChangeEvent< HTMLInputElement > ) => {
			const active = event.target.checked;

			const success = await toggleModule( {
				name: $module.module,
				active,
			} );

			await showToggleNotice( {
				noticeType: success ? 'success' : 'error',
				action: active ? 'activation' : 'deactivation',
			} );
		},
		[ toggleModule, $module.module, showToggleNotice ]
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
