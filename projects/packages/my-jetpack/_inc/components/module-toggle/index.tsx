import { useGlobalNotices } from '@automattic/jetpack-components';
import { useQueryClient } from '@tanstack/react-query';
import { FormToggle } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import {
	REST_API_SITE_MODULES_ENDPOINT,
	QUERY_SITE_MODULES_KEY,
	QUERY_UPDATE_MODULE_KEY,
} from '../../data/constants';
import useSimpleMutation from '../../data/use-simple-mutation';
import { MyJetpackModule } from '../../types';
import { isProductsOnlyMode } from '../../utils/is-products-only-mode';
import { getModuleActivationMessage } from '../../utils/module-benefit-messages';
import { getSharingBlockEditorUrl } from '../../utils/sharing-block';
import SecondaryButton from '../action-button/secondary-button';
import { setPendingSuccessNotice } from '../my-jetpack-tab-panel/products/pending-notice';
import { useProductFiltersContext } from '../my-jetpack-tab-panel/products/products-tracking-context';
import { reloadPage } from '../my-jetpack-tab-panel/products/reload-page';
import type { ChangeEvent } from 'react';

export type ModuleToggleProps = {
	module: MyJetpackModule;
	describedby?: string;
};

// Modules that register a server-rendered wp-admin sidebar item. Toggling them
// needs a full page reload for the sidebar to reflect the change; the success
// notice is persisted so it survives the reload.
const MODULES_REQUIRING_RELOAD = [ 'podcast', 'subscriptions', 'wpcom-reader' ];

/**
 * Renders a toggle for a Jetpack module.
 *
 * @param {ModuleToggleProps} props - The component props.
 *
 * @return The rendered component.
 */
export function ModuleToggle( { module: $module, describedby }: ModuleToggleProps ) {
	const { createSuccessNotice } = useGlobalNotices();
	const { trackProductAction } = useProductFiltersContext() || {};
	const queryClient = useQueryClient();

	const { mutate: toggleModule, isPending: isUpdating } = useSimpleMutation( {
		name: QUERY_UPDATE_MODULE_KEY,
		query: {
			path: `${ REST_API_SITE_MODULES_ENDPOINT }/${ $module.module }`,
			method: 'POST',
		},
		errorMessage: sprintf(
			/* translators: %s is the module name */
			__( 'There was a problem updating the %s module.', 'jetpack-my-jetpack' ),
			$module.name
		),
	} );

	const setModuleActive = useCallback(
		( active: boolean ) => {
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

			toggleModule(
				{ data: { active } },
				{
					onSuccess: () => {
						const message = active
							? getModuleActivationMessage( $module.module, $module.name )
							: sprintf(
									/* translators: %s is the module name */
									__( '%s has been deactivated.', 'jetpack-my-jetpack' ),
									$module.name
							  );

						if ( MODULES_REQUIRING_RELOAD.includes( $module.module ) ) {
							setPendingSuccessNotice( message );
							reloadPage();
							return;
						}

						// Refresh the module list so the new state is reflected.
						queryClient.invalidateQueries( { queryKey: [ QUERY_SITE_MODULES_KEY ] } );
						createSuccessNotice( message );
					},
				}
			);
		},
		[ toggleModule, $module, trackProductAction, queryClient, createSuccessNotice ]
	);

	const onChange = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => setModuleActive( event.target.checked ),
		[ setModuleActive ]
	);
	const deactivateModule = useCallback( () => setModuleActive( false ), [ setModuleActive ] );

	// In products-only mode the site can't manage modules, so render no toggle at all.
	// Placed after all hooks to respect the rules of hooks.
	if ( isProductsOnlyMode() ) {
		return null;
	}

	const sharingBlockEditorUrl = getSharingBlockEditorUrl( $module );

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
