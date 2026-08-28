import { store as jetpackModulesStore } from '@automattic/jetpack-shared-stores';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';

/**
 * @typedef {object} ModuleStatus
 * @property {boolean}  isModuleActive   - Whether the module is active.
 * @property {boolean}  isChangingStatus - Whether the module's status is currently being changed.
 * @property {boolean}  isLoadingModules - Whether the modules are currently being loaded.
 * @property {Function} changeStatus     - Function to change the module's status.
 */

/**
 * Manage a Jetpack module's status (get and set).
 *
 * @param {string} name - The module's name.
 * @return {ModuleStatus} Module status/control object.
 */
const useModuleStatus = name => {
	const { isModuleActive, isChangingStatus, isLoadingModules } = useSelect(
		selectData => {
			const data = selectData( jetpackModulesStore );
			return {
				isModuleActive: data.isModuleActive( name ),
				isChangingStatus: data.isModuleUpdating( name ),
				isLoadingModules: data.areModulesLoading( name ),
			};
		},
		[ name ]
	);

	const { updateJetpackModuleStatus } = useDispatch( jetpackModulesStore );

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
