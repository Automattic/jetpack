import { Text } from '@automattic/jetpack-components';
import { SOCIAL_STORE_ID } from '@automattic/jetpack-publicize-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import ToggleSection from '../toggle-section';
import { SocialStoreSelectors } from '../types/types';
import styles from './styles.module.scss';

type ShareTitleOnlyToggleProps = {
	/**
	 * If the toggle is disabled.
	 */
	disabled?: boolean;
};

const ShareTitleOnlyToggle: React.FC< ShareTitleOnlyToggleProps > = ( { disabled } ) => {
	const { isEnabled, isUpdating } = useSelect( select => {
		const store = select( SOCIAL_STORE_ID ) as SocialStoreSelectors;
		return {
			isEnabled: store.isShareTitleOnlyEnabled(),
			isUpdating: store.isUpdatingShareTitleOnly(),
		};
	}, [] );

	const updateOptions = useDispatch( SOCIAL_STORE_ID ).updateShareTitleOnly;

	const toggleStatus = useCallback( () => {
		updateOptions( ! isEnabled );
	}, [ isEnabled, updateOptions ] );

	return (
		<ToggleSection
			title={ __( 'Share the post title only', 'jetpack-social' ) }
			disabled={ isUpdating || disabled }
			checked={ isEnabled }
			onChange={ toggleStatus }
		>
			<Text className={ styles.text }>
				{ __(
					'When enabled, Jetpack Social will only share the title and the link to the post by default on new posts.',
					'jetpack-social'
				) }
			</Text>
		</ToggleSection>
	);
};

export default ShareTitleOnlyToggle;
