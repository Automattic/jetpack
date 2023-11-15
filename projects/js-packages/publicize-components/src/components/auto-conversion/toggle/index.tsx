import { ToggleControl } from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import React from 'react';
import { SOCIAL_STORE_ID } from '../../../social-store';
import { SocialStoreSelectors } from '../../../types/types';

type AutoConversionToggleProps = {
	/**
	 * The label or content after the toggle.
	 */
	children: React.ReactNode;

	/**
	 * The class name to add to the toggle.
	 */
	toggleClass?: string;
};

/**
 * A button toggle wrapper for enabling/disabling the Social Image Generator feature.
 *
 * @param {AutoConversionToggleProps} props - Component props.
 * @returns {React.ReactElement} - JSX.Element
 */
const AutoConversionToggle: React.FC< AutoConversionToggleProps > = ( {
	toggleClass,
	children,
} ) => {
	const { isEnabled, isUpdating } = useSelect( select => {
		const store = select( SOCIAL_STORE_ID ) as SocialStoreSelectors;
		return {
			isEnabled: store.isAutoConversionEnabled(),
			isUpdating: store.isAutoConversionSettingsUpdating(),
		};
	}, [] );

	const updateOptions = useDispatch( SOCIAL_STORE_ID ).updateAutoConversionSettings;

	const toggleStatus = useCallback( () => {
		const newOption = {
			enabled: ! isEnabled,
		};
		updateOptions( newOption );
	}, [ isEnabled, updateOptions ] );

	return (
		<ToggleControl
			className={ toggleClass }
			disabled={ isUpdating }
			checked={ isEnabled }
			onChange={ toggleStatus }
			label={ children }
		/>
	);
};

export default AutoConversionToggle;
