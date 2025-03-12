import { Text } from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { store as socialStore } from '../../../../social-store';
import ToggleSection from '../toggle-section';
import styles from './styles.module.scss';

type UtmToggleProps = {
	/**
	 * If the toggle is disabled.
	 */
	disabled?: boolean;
};

const UtmToggle: React.FC< UtmToggleProps > = ( { disabled } ) => {
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
		<ToggleSection
			title={ __( 'Append UTM parameters to shared URLs', 'jetpack-publicize-components' ) }
			disabled={ isUpdating || disabled }
			checked={ isEnabled }
			onChange={ toggleStatus }
		>
			<Text className={ styles.text }>
				{ __(
					"UTM parameters are tags added to links to help track where website visitors come from, improving our understanding of how content is shared. Don't worry, it doesn't change the experience or the link destination!",
					'jetpack-publicize-components'
				) }
			</Text>
		</ToggleSection>
	);
};

export default UtmToggle;
