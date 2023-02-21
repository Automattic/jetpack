import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { isSimpleSite } from '../site-type-utils';

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
		return Promise.reject( error.message );
	}
}

/**
 * Update a Jetpack module's status.
 *
 * @param {*} name - The module's name.
 * @param {*} toggle - New module status.
 * @returns {Promise<boolean>} Promise that resolves to the new module status.
 */
async function changeStatus( name, toggle ) {
	try {
		const result = await apiFetch( {
			path: `/jetpack/v4/module/${ name }/active`,
			method: 'POST',
			data: {
				active: toggle,
			},
		} );
		return result;
	} catch ( error ) {
		return Promise.reject( error.message );
	}
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
	const modulesInfo = await fetchModules();
	if ( ! modulesInfo || ! modulesInfo.hasOwnProperty( name ) ) {
		return false;
	}

	// Check if module is active.
	return !! modulesInfo[ name ].activated;
}

/**
 * Manage a Jetpack module's status (get and set).
 *
 * @param {string} name - The module's name.
 * @returns {boolean} Whether the module is active.
 */
const useModuleStatus = name => {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ isModuleActive, setModuleStatus ] = useState( false );

	// Get module status.
	useEffect( () => {
		if ( ! name ) {
			return;
		}

		setIsLoading( true );

		isJetpackModuleActive( name ).then( moduleStatus => {
			setModuleStatus( moduleStatus );
		} );

		setIsLoading( false );
	}, [ name ] );

	// Update module status.
	useEffect( () => {
		if ( ! name || ! changeStatus ) {
			return;
		}

		setIsLoading( true );
		const newModuleStatus = changeStatus( name, ! isModuleActive );
		setModuleStatus( newModuleStatus );

		setIsLoading( false );
	}, [ isModuleActive, name ] );

	return { isLoading, isModuleActive, changeStatus };
};

export default useModuleStatus;
