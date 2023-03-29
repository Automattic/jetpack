import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState, useMemo, useCallback } from '@wordpress/element';
import { isSimpleSite } from '../../site-type-utils';

/**
 * Fetch information about all Jetpack modules.
 *
 * @returns {Promise<object>} Details about all available modules on the site.
 */
async function fetchModules() {
	try {
		const result = await apiFetch( {
			path: `/jetpack/v4/module/all`,
			method: 'GET',
		} );
		return result;
	} catch ( error ) {
		return error.message;
	}
}

/**
 * Update a Jetpack module's status.
 *
 * @param {*} name - The module's name.
 * @param {*} toggle - New module status.
 * @returns {Promise<boolean>} Promise that resolves to the new module status.
 */
async function changeModuleStatus( name, toggle ) {
	const result = await apiFetch( {
		path: `/jetpack/v4/module/${ name }/active`,
		method: 'POST',
		data: {
			active: toggle,
		},
	} );
	return result;
}

/**
 * Determine whethher a Jetpack module is active.
 *
 * @param {string} name - The module's name
 * @returns {Promise<boolean>} Whether the module is active.
 */
async function isJetpackModuleActive( name ) {
	// On WordPress.com Simple sites, all modules are always active.
	if ( isSimpleSite() ) {
		return true;
	}

	// Fetch module info.
	try {
		// Check if module is active.
		const modulesInfo = await fetchModules();
		if ( ! modulesInfo || ! modulesInfo.hasOwnProperty( name ) ) {
			return false;
		}
		return !! modulesInfo[ name ].activated;
	} catch ( e ) {
		return false;
	}
}

/**
 * Manage a Jetpack module's status (get and set).
 *
 * @param {string} name - The module's name.
 * @returns {boolean} Whether the module is active.
 */
const useModuleStatus = name => {
	const [ isLoadingModules, setIsLoadingModules ] = useState( Boolean( name ) );
	const [ isChangingStatus, setIsChangingStatus ] = useState( false );
	const [ isModuleActive, setModuleStatus ] = useState( false );

	// Get module status.
	useEffect( () => {
		if ( ! name ) {
			return;
		}

		setIsLoadingModules( true );

		isJetpackModuleActive( name ).then( moduleStatus => {
			setModuleStatus( moduleStatus );
			setIsLoadingModules( false );
		} );
	}, [ name ] );

	const changeStatus = useCallback(
		newModuleStatus => {
			if ( ! name || isModuleActive === newModuleStatus ) {
				return;
			}
			setIsChangingStatus( true );
			changeModuleStatus( name, newModuleStatus )
				.then( () => {
					setModuleStatus( newModuleStatus );
					setIsChangingStatus( false );
				} )
				.catch( () => {
					setIsChangingStatus( false );
				} );
		},
		[ name, isModuleActive ]
	);

	return useMemo(
		() => ( { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } ),
		[ isLoadingModules, isChangingStatus, isModuleActive, changeStatus ]
	);
};

export default useModuleStatus;
