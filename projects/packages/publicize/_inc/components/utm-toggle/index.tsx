import { ToggleControl } from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as socialStore } from '../../social-store';
import type { FC, ReactElement, ReactNode } from 'react';

type ToggleProps = {
	/**
	 * The label or content after the toggle.
	 */
	children: ReactNode;

	/**
	 * The class name to add to the toggle.
	 */
	toggleClass?: string;
};

/**
 * A button toggle wrapper for enabling/disabling the UTM parameters feature.
 *
 * @param {ToggleProps} props - Component props.
 * @return {ReactElement} - JSX.Element
 */
const UtmToggle: FC< ToggleProps > = ( { toggleClass, children } ) => {
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
