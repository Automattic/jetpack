import { Text } from '@automattic/jetpack-components';
import { SOCIAL_STORE_ID } from '@automattic/jetpack-publicize-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { useState } from 'react';
import ToggleSection from '../toggle-section';
import { SocialStoreSelectors } from '../types/types';
import styles from './styles.module.scss';

type SocialNotesToggleProps = {
	/**
	 * If the toggle is disabled.
	 */
	disabled?: boolean;
};

const SocialNotesToggle: React.FC< SocialNotesToggleProps > = ( { disabled } ) => {
	const { isEnabled } = useSelect( select => {
		const store = select( SOCIAL_STORE_ID ) as SocialStoreSelectors;
		return {
			isEnabled: store.isSocialNotesEnabled(),
			// Temporarily we disable forever after action to wait for the page to reload.
			// isUpdating: store.isSocialNotesSettingsUpdating(),
		};
	}, [] );

	const [ isUpdating, setIsUpdating ] = useState( false );

	const updateOptions = useDispatch( SOCIAL_STORE_ID ).updateSocialNotesSettings;

	const toggleStatus = useCallback( () => {
		const newOption = {
			social_notes_enabled: ! isEnabled,
		};
		const updatePromise = updateOptions( newOption );

		// This is a temporary solution to refresh the page after the toggle is clicked,
		// until we can reload the sidebar only.
		setIsUpdating( true );
		document.body.style.cursor = 'wait';
		updatePromise.then( () => {
			window.location.reload();
		} );
	}, [ isEnabled, updateOptions ] );

	return (
		<ToggleSection
			title={ __( 'Enable Social Notes', 'jetpack-social' ) }
			beta
			disabled={ isUpdating || disabled }
			checked={ isEnabled }
			onChange={ toggleStatus }
		>
			<Text className={ styles.text }>
				{ __(
					'Do you want to quickly share whats on your mind? Turn on Social Notes to effortlessly jot down and share quick notes without the need for titles or formatting, enabling swift and spontaneous communication to your followers.',
					'jetpack-social'
				) }
			</Text>
		</ToggleSection>
	);
};

export default SocialNotesToggle;
