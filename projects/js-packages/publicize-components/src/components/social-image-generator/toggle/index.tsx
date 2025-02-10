import { ToggleControl } from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import React from 'react';
import { store as socialStore } from '../../../social-store';

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
 * @return {React.ReactElement} - JSX.Element
 */
const SocialImageGeneratorToggle: React.FC< SocialImageGeneratorToggleProps > = ( {
	toggleClass,
	children,
} ) => {
	const { isEnabled, isUpdating } = useSelect( select => {
		const store = select( socialStore );

		return {
			isEnabled: store.getSocialSettings().socialImageGenerator.enabled,
			isUpdating: store.isSavingSiteSettings(),
		};
	}, [] );

	const { updateSocialImageGeneratorConfig } = useDispatch( socialStore );

	const toggleStatus = useCallback( () => {
		const newOption = {
			enabled: ! isEnabled,
		};
		updateSocialImageGeneratorConfig( newOption );
	}, [ isEnabled, updateSocialImageGeneratorConfig ] );

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
