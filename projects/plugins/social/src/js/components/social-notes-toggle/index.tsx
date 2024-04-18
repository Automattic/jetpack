import { Text, Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { store as socialStore } from '@automattic/jetpack-publicize-components';
import { ExternalLink, SelectControl, ToggleControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { useState } from 'react';
import ToggleSection from '../toggle-section';
import styles from './styles.module.scss';

type SocialNotesToggleProps = {
	/**
	 * If the toggle is disabled.
	 */
	disabled?: boolean;
};

const handleStateUpdating = ( updateFunction, updatingStateSetter, ...args ) => {
	// Set the updating state to true
	updatingStateSetter( true );
	document.body.style.cursor = 'wait';
	// Call the updateFunction with provided arguments
	const promise = updateFunction( ...args );
	// When the promise resolves (update is completed), set the updating state to false
	promise.finally( () => {
		updatingStateSetter( false );
		document.body.style.cursor = 'auto';
	} );
};

const SocialNotesToggle: React.FC< SocialNotesToggleProps > = ( { disabled } ) => {
	const { isEnabled, notesConfig, newNoteUrl } = useSelect( select => {
		const store = select( socialStore );
		return {
			isEnabled: store.isSocialNotesEnabled(),
			notesConfig: store.getSocialNotesConfig(),
			newNoteUrl: `${ store.getAdminUrl() }post-new.php?post_type=jetpack-social-note`,
			// Temporarily we disable forever after action to wait for the page to reload.
			// isUpdating: store.isSocialNotesSettingsUpdating(),
		};
	}, [] );

	const [ isUpdating, setIsUpdating ] = useState( false );
	const [ isAppendLinkToggleUpdating, setIsAppendLinkToggleUpdating ] = useState( false );
	const [ isLinkFormatUpdating, setIsLinkFormatUpdating ] = useState( false );

	const [ isSmall ] = useBreakpointMatch( 'sm' );

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
			// If the toggle is turned on we don't need to reload the page,
			// as they will have the CTA to create a note.
			if ( newOption.social_notes_enabled ) {
				setIsUpdating( false );
				document.body.style.cursor = 'auto';
			} else {
				window.location.reload();
			}
		} );
	}, [ isEnabled, updateOptions ] );

	const onToggleAppendLink = useCallback(
		( append_link: boolean ) => {
			handleStateUpdating( updateSocialNotesConfig, setIsAppendLinkToggleUpdating, {
				append_link,
			} );
		},
		[ updateSocialNotesConfig ]
	);

	const onChangeLinkFormat = useCallback(
		( link_format: string ) => {
			handleStateUpdating( updateSocialNotesConfig, setIsLinkFormatUpdating, { link_format } );
		},
		[ updateSocialNotesConfig ]
	);

	const appendLink = notesConfig.append_link ?? true;

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

			<Button
				className={ styles.button }
				fullWidth={ isSmall }
				variant="secondary"
				disabled={ isUpdating || ! isEnabled }
				href={ newNoteUrl }
			>
				{ __( 'Create a note', 'jetpack-social' ) }
			</Button>

			{ isEnabled && ! isUpdating ? (
				<div className={ styles[ 'notes-options-wrapper' ] }>
					<ToggleControl
						label={ __( 'Append post link', 'jetpack-social' ) }
						checked={ appendLink }
						disabled={ isAppendLinkToggleUpdating || isLinkFormatUpdating }
						className={ styles.toggle }
						onChange={ onToggleAppendLink }
						help={ __( 'Whether to append the post link when sharing a note.', 'jetpack-social' ) }
					/>
					{ appendLink && ! isAppendLinkToggleUpdating ? (
						<SelectControl
							label={ __( 'Link format', 'jetpack-social' ) }
							value={ notesConfig.link_format ?? 'full_url' }
							onChange={ onChangeLinkFormat }
							disabled={ isLinkFormatUpdating }
							options={ [
								{ label: __( 'Full URL', 'jetpack-social' ), value: 'full_url' },
								{ label: __( 'Shortlink', 'jetpack-social' ), value: 'shortlink' },
								{
									label: __( 'Permashortcitation', 'jetpack-social' ),
									value: 'permashortcitation',
								},
							] }
							help={
								<span>
									{ __( 'Format of the link to use when sharing a note.', 'jetpack-social' ) }
									&nbsp;
									<ExternalLink href="https://jetpack.com/redirect/?source=jetpack-social-notes-link-format">
										{ __( 'Learn more', 'jetpack-social' ) }
									</ExternalLink>
								</span>
							}
						/>
					) : null }
				</div>
			) : null }
		</ToggleSection>
	);
};

export default SocialNotesToggle;
