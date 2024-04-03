import { Text } from '@automattic/jetpack-components';
import { store as socialStore } from '@automattic/jetpack-publicize-components';
import { ExternalLink, ToggleControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import React, { useState } from 'react';
import ToggleSection from '../toggle-section';
import styles from './styles.module.scss';

type SocialNotesToggleProps = {
	/**
	 * If the toggle is disabled.
	 */
	disabled?: boolean;
};

const SocialNotesToggle: React.FC< SocialNotesToggleProps > = ( { disabled } ) => {
	const { isEnabled, notesConfig } = useSelect( select => {
		const store = select( socialStore );
		return {
			isEnabled: store.isSocialNotesEnabled(),
			notesConfig: store.getSocialNotesConfig(),
			// Temporarily we disable forever after action to wait for the page to reload.
			// isUpdating: store.isSocialNotesSettingsUpdating(),
		};
	}, [] );

	const [ isUpdating, setIsUpdating ] = useState( false );

	const { updateSocialNotesSettings: updateOptions, updateSocialNotesConfig } =
		useDispatch( socialStore );

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

	const onToggleNotesConfig = useCallback(
		( option: 'append_link' | 'use_shortlink' | 'use_parenthical_link' ) => () => {
			updateSocialNotesConfig( {
				[ option ]: ! notesConfig[ option ],
			} );
		},
		[ notesConfig, updateSocialNotesConfig ]
	);

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
					"Do you want to quickly share what's on your mind? Turn on Social Notes to effortlessly jot down and share quick notes without the need for titles or formatting, enabling swift and spontaneous communication with your followers.",
					'jetpack-social'
				) }
			</Text>
			{ isEnabled && ! isUpdating ? (
				<div className={ styles[ 'notes-options-wrapper' ] }>
					<ToggleControl
						label={ __( 'Append post link', 'jetpack-social' ) }
						checked={ notesConfig.append_link ?? true }
						className={ styles.toggle }
						onChange={ onToggleNotesConfig( 'append_link' ) }
						help={ __(
							'Whether to append the post link when sharing the note.',
							'jetpack-social'
						) }
					/>
					{ notesConfig.append_link ? (
						<>
							<ToggleControl
								label={ __( 'Use shortlink', 'jetpack-social' ) }
								checked={ notesConfig.use_shortlink ?? false }
								className={ styles.toggle }
								onChange={ onToggleNotesConfig( 'use_shortlink' ) }
								help={ __(
									'Whether to use the shortlink instead of the full URL.',
									'jetpack-social'
								) }
							/>
							<ToggleControl
								label={ __( 'Use permashortcitation', 'jetpack-social' ) }
								checked={ notesConfig.use_parenthical_link ?? false }
								className={ styles.toggle }
								onChange={ onToggleNotesConfig( 'use_parenthical_link' ) }
								help={
									<span>
										{ sprintf(
											/* translators: 1 is the link format */
											__(
												'Whether to use the permashortcitation like %1$s, instead of the standard link.',
												'jetpack-social'
											),
											'(jetpack.com sn/12345)'
										) }
										&nbsp;
										<ExternalLink href="https://jetpack.com/redirect/?source=jetpack-social-notes-permashortcitation">
											{ __( 'Learn more', 'jetpack-social' ) }
										</ExternalLink>
									</span>
								}
							/>
						</>
					) : null }
				</div>
			) : null }
		</ToggleSection>
	);
};

export default SocialNotesToggle;
