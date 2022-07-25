import { ToggleControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import classnames from 'classnames';
import React, { useCallback } from 'react';
import { STORE_ID } from '../../store';
import styles from './styles.module.scss';

const ModuleToggle = ( { className } ) => {
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

	const toggleClassName = classnames( className, styles.toggle );

	return (
		<ToggleControl
			className={ toggleClassName }
			disabled={ isUpdating }
			checked={ isModuleEnabled }
			onChange={ toggleModule }
		/>
	);
};

export default ModuleToggle;
