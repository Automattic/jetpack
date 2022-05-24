/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import React, { useCallback } from 'react';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../store';

const ModuleToggle = () => {
	const updateOptions = useDispatch( STORE_ID ).updateJetpackSettings;
	const { isModuleEnabled, isUpdating } = useSelect( select => {
		const store = select( STORE_ID );
		return {
			isModuleEnabled: store.isModuleEnabled(),
			isUpdating: store.isUpdatingJetpackSettings(),
		};
	} );

	const toggleModule = useCallback( () => {
		const newOption = {
			publicize_active: ! isModuleEnabled,
		};
		updateOptions( newOption );
	}, [ isModuleEnabled, updateOptions ] );

	const label = isModuleEnabled
		? __( 'Jetpack Social is active', 'jetpack-social' )
		: __(
				'Jetpack Social is inactive',
				'jetpack-social',
				/* dummy arg to avoid bad minification */ 0
		  );

	return (
		<ToggleControl
			label={ __( 'Activate Jetpack Social', 'jetpack-social' ) }
			help={ isUpdating ? __( 'Updating…', 'jetpack-social' ) : label }
			disabled={ isUpdating }
			checked={ isModuleEnabled }
			onChange={ toggleModule }
		/>
	);
};

export default ModuleToggle;
