import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';
import { JETPACK_MODULES_STORE_ID } from '../../modules-state';

/**
 * Manage a Jetpack module's status (get and set).
 *
 * @param {string} name - The module's name.
 * @returns {boolean} Whether the module is active.
 */
const useModuleStatus = name => {
	const { isModuleActive, isChangingStatus, isLoadingModules } = useSelect(
		selectData => {
			const data = selectData( JETPACK_MODULES_STORE_ID );
			return {
				isModuleActive: data.isModuleActive( name ),
				isChangingStatus: data.isModuleUpdating( name ),
				isLoadingModules: data.areModulesLoading( name ),
			};
		},
		[ JETPACK_MODULES_STORE_ID ]
	);

	const { updateJetpackModuleStatus } = useDispatch( JETPACK_MODULES_STORE_ID );

	const changeStatus = useCallback(
		value =>
			updateJetpackModuleStatus( {
				name,
				active: value,
			} ),
		[ name, updateJetpackModuleStatus ]
	);

	return useMemo(
		() => ( { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } ),
		[ isLoadingModules, isChangingStatus, isModuleActive, changeStatus ]
	);
};

export default useModuleStatus;
