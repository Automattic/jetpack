import { ToggleControl } from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import React from 'react';
import { store as socialStore } from '@automattic/jetpack-publicize-components';

type ToggleProps = {
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
 * A button toggle wrapper for enabling/disabling the UTM parameters feature.
 *
 * @param {ToggleProps} props - Component props.
 * @return {React.ReactElement} - JSX.Element
 */
const UtmToggle: React.FC< ToggleProps > = ( { toggleClass, children } ) => {
	const { isEnabled, isUpdating } = useSelect( select => {
		return {
			isEnabled: select( socialStore ).getSocialSettings().utmSettings.enabled,
			isUpdating: select( socialStore ).isSavingSiteSettings(),
		};
	}, [] );

	const { updateUtmSettings } = useDispatch( socialStore );

	const toggleStatus = useCallback( () => {
		updateUtmSettings( { enabled: ! isEnabled } );
	}, [ isEnabled, updateUtmSettings ] );

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

export default UtmToggle;
