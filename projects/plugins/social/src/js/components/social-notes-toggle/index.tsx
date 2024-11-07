import { Text, Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { store as socialStore } from '@automattic/jetpack-publicize-components';
import { getAdminUrl } from '@automattic/jetpack-script-data';
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

const handleStateUpdating = async (
	updateFunction: () => Promise< void >,
	updatingStateSetter?: React.Dispatch< React.SetStateAction< boolean > >
) => {
	// Set the updating state to true
	updatingStateSetter?.( true );
	document.body.style.cursor = 'wait';
	// Call the updateFunction
	await updateFunction();
	// When the promise resolves (update is completed), set the updating state to false
	updatingStateSetter?.( false );
	document.body.style.cursor = 'auto';
};

const SocialNotesToggle: React.FC< SocialNotesToggleProps > = ( { disabled } ) => {
	const { isEnabled, notesConfig, isUpdating } = useSelect( select => {
		const store = select( socialStore );
		const settings = store.getSocialPluginSettings();

		return {
			isEnabled: settings.social_notes_enabled,
			notesConfig: settings.social_notes_config,
			isUpdating: store.isSavingSocialPluginSettings(),
		};
	}, [] );

	const newNoteUrl = getAdminUrl( 'post-new.php?post_type=jetpack-social-note' );

	const [ isAppendLinkToggleUpdating, setIsAppendLinkToggleUpdating ] = useState( false );
	const [ isLinkFormatUpdating, setIsLinkFormatUpdating ] = useState( false );

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const { updateSocialPluginSettings } = useDispatch( socialStore );

	const toggleStatus = useCallback( async () => {
		handleStateUpdating( () =>
			updateSocialPluginSettings( {
				social_notes_enabled: ! isEnabled,
			} )
		);
	}, [ isEnabled, updateSocialPluginSettings ] );

	const onToggleAppendLink = useCallback(
		( append_link: boolean ) => {
			handleStateUpdating(
				() =>
					updateSocialPluginSettings( {
						social_notes_config: {
							...notesConfig,
							append_link,
						},
					} ),
				setIsAppendLinkToggleUpdating
			);
		},
		[ notesConfig, updateSocialPluginSettings ]
	);

	const onChangeLinkFormat = useCallback(
		( link_format: string ) => {
			handleStateUpdating(
				() =>
					updateSocialPluginSettings( {
						social_notes_config: {
							...notesConfig,
							link_format: link_format as ( typeof notesConfig )[ 'link_format' ],
						},
					} ),
				setIsLinkFormatUpdating
			);
		},
		[ notesConfig, updateSocialPluginSettings ]
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
			{ ! isEnabled && (
				// If social notes is disabled, hide the admin menu item, to avoid reloading the page
				<style>{ `#adminmenu #menu-posts-jetpack-social-note { display: none; }` }</style>
			) }
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
						__nextHasNoMarginBottom={ true }
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
							__nextHasNoMarginBottom={ true }
						/>
					) : null }
				</div>
			) : null }
		</ToggleSection>
	);
};

export default SocialNotesToggle;
