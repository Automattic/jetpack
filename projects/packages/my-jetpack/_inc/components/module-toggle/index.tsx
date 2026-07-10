import { useGlobalNotices } from '@automattic/jetpack-components';
import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { FormToggle } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import { MyJetpackModule } from '../../types';
import { getModuleActivationMessage } from '../../utils/module-benefit-messages';
import { getSharingBlockEditorUrl } from '../../utils/sharing-block';
import SecondaryButton from '../action-button/secondary-button';
import { useProductFiltersContext } from '../my-jetpack-tab-panel/products/products-tracking-context';
import type { ChangeEvent } from 'react';

export type ModuleToggleProps = {
	module: MyJetpackModule;
	describedby?: string;
};

/**
 * Renders a toggle for a Jetpack module.
 *
 * @param {ModuleToggleProps} props - The component props.
 *
 * @return The rendered component.
 */
export function ModuleToggle( { module: $module, describedby }: ModuleToggleProps ) {
	const { updateJetpackModuleStatus: toggleModule } = useDispatch( modulesStore );
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();
	const { trackProductAction } = useProductFiltersContext() || {};
	const sharingBlockEditorUrl = getSharingBlockEditorUrl( $module );

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
						? getModuleActivationMessage( $module.module, $module.name )
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
		[ $module.module, $module.name, createErrorNotice, createSuccessNotice ]
	);

	const setModuleActive = useCallback(
		async ( active: boolean ) => {
			// Track module activation/deactivation if we're in the Products tab context
			if ( trackProductAction ) {
				trackProductAction( {
					action: active ? 'activate' : 'deactivate',
					productSlug: $module.module,
					productType: 'module',
					productStatus: $module.activated ? 'active' : 'inactive',
					productData: $module,
				} );
			}

			const success = await toggleModule( {
				name: $module.module,
				active,
			} );

			await showToggleNotice( {
				noticeType: success ? 'success' : 'error',
				action: active ? 'activation' : 'deactivation',
			} );
		},
		[ toggleModule, $module, showToggleNotice, trackProductAction ]
	);

	const onChange = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => setModuleActive( event.target.checked ),
		[ setModuleActive ]
	);
	const deactivateModule = useCallback( () => setModuleActive( false ), [ setModuleActive ] );

	if ( sharingBlockEditorUrl ) {
		if ( $module.activated ) {
			return (
				<SecondaryButton
					label={ __( 'Switch to Sharing Buttons block', 'jetpack-my-jetpack' ) }
					onClick={ deactivateModule }
					isLoading={ isUpdating }
					loadingAnnouncement={ __( 'Deactivating legacy sharing…', 'jetpack-my-jetpack' ) }
				/>
			);
		}

		return (
			<SecondaryButton
				href={ sharingBlockEditorUrl }
				label={ __( 'Open Site Editor', 'jetpack-my-jetpack' ) }
			/>
		);
	}

	return (
		<FormToggle
			disabled={ isUpdating || !! $module.override }
			checked={ $module.activated }
			onChange={ onChange }
			aria-label={ sprintf(
				/* translators: %s is the module name */
				__( 'Toggle %s module', 'jetpack-my-jetpack' ),
				$module.name
			) }
			aria-describedby={ describedby }
		/>
	);
}
