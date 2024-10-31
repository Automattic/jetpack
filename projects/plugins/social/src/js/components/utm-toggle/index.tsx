import { Text } from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
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
		// const store = select( SOCIAL_STORE_ID ) as SocialStoreSelectors;
		return {
			isEnabled: false, //store...(),
			isUpdating: false, //store...(),
		};
	}, [] );

	// const updateOptions = useDispatch( SOCIAL_STORE_ID )...;

	const toggleStatus = useCallback( () => {
		// updateOptions( ! isEnabled );
	}, [ isEnabled ] );

	return (
		<ToggleSection
			title={ __( 'Append UTM parameters to shared URLs', 'jetpack-social' ) }
			disabled={ isUpdating || disabled }
			checked={ isEnabled }
			onChange={ toggleStatus }
		>
			<Text className={ styles.text }>
				{ __(
					"UTM parameters are tags added to links to help track where website visitors come from, improving our understanding of how content is shared. Don't worry—it doesn't change your experience or the link destination!",
					'jetpack-social'
				) }
			</Text>
		</ToggleSection>
	);
};

export default UtmToggle;
