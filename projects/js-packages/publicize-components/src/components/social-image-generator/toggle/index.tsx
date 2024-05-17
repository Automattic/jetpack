import { ToggleControl } from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import React from 'react';
import { SOCIAL_STORE_ID } from '../../../social-store';
import { SocialStoreSelectors } from '../../../types/types';

type SocialImageGeneratorToggleProps = {
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
 * @param {SocialImageGeneratorToggleProps} props - Component props.
 * @returns {React.ReactElement} - JSX.Element
 */
const SocialImageGeneratorToggle: React.FC< SocialImageGeneratorToggleProps > = ( {
	toggleClass,
	children,
} ) => {
	const { isEnabled, isUpdating } = useSelect( select => {
		const store = select( SOCIAL_STORE_ID ) as SocialStoreSelectors;
		return {
			isEnabled: store.isSocialImageGeneratorEnabled(),
			isUpdating: store.isUpdatingSocialImageGeneratorSettings(),
		};
	}, [] );

	const updateOptions = useDispatch( SOCIAL_STORE_ID ).updateSocialImageGeneratorSettings;

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

export default SocialImageGeneratorToggle;
