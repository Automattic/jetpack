import { Text } from '@automattic/jetpack-components';
import { getAdminUrl } from '@automattic/jetpack-script-data';
import { SelectControl, ToggleControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Link } from '@wordpress/ui';
import { useState } from 'react';
import { store as socialStore } from '../../../../social-store';
import ToggleSection from '../toggle-section';
import styles from './styles.module.scss';
import type { SocialNotesConfig } from '../../../../social-store/types';
import type { Dispatch, FC, SetStateAction } from 'react';

type SocialNotesToggleProps = {
	/**
	 * If the toggle is disabled.
	 */
	disabled?: boolean;
};

const handleStateUpdating = async (
	updateFunction: () => Promise< void >,
	updatingStateSetter?: Dispatch< SetStateAction< boolean > >
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

const SocialNotesToggle: FC< SocialNotesToggleProps > = ( { disabled } ) => {
	const { isEnabled, isUpdating, appendLink, linkFormat } = useSelect( select => {
		const store = select( socialStore );

		const { socialNotes } = store.getSocialSettings();

		return {
			isEnabled: socialNotes.enabled,
			appendLink: socialNotes.config.append_link ?? true,
			linkFormat: socialNotes.config.link_format,
			isUpdating: store.isSavingSiteSettings(),
		};
	}, [] );

	const newNoteUrl = getAdminUrl( 'post-new.php?post_type=jetpack-social-note' );

	const [ isAppendLinkToggleUpdating, setIsAppendLinkToggleUpdating ] = useState( false );
	const [ isLinkFormatUpdating, setIsLinkFormatUpdating ] = useState( false );

	const { toggleSocialNotes, updateSocialNotesConfig } = useDispatch( socialStore );

	const toggleStatus = useCallback( async () => {
		handleStateUpdating( () => toggleSocialNotes( ! isEnabled ) );
	}, [ isEnabled, toggleSocialNotes ] );

	const onCreateNoteClick = useCallback( () => {
		window.location.href = newNoteUrl;
	}, [ newNoteUrl ] );

	const onToggleAppendLink = useCallback(
		( append_link: boolean ) => {
			handleStateUpdating(
				() =>
					updateSocialNotesConfig( {
						append_link,
					} ),
				setIsAppendLinkToggleUpdating
			);
		},
		[ updateSocialNotesConfig ]
	);

	const onChangeLinkFormat = useCallback(
		( link_format: string ) => {
			handleStateUpdating(
				() =>
					updateSocialNotesConfig( {
						link_format: link_format as SocialNotesConfig[ 'link_format' ],
					} ),
				setIsLinkFormatUpdating
			);
		},
		[ updateSocialNotesConfig ]
	);

	return (
		<ToggleSection
			title={ __( 'Enable Social Notes', 'jetpack-publicize-pkg' ) }
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
					'jetpack-publicize-pkg'
				) }
			</Text>
			<Button
				className={ styles.button }
				variant="outline"
				disabled={ isUpdating || ! isEnabled }
				onClick={ onCreateNoteClick }
			>
				{ __( 'Create a note', 'jetpack-publicize-pkg' ) }
			</Button>
			{ isEnabled ? (
				<div className={ styles[ 'notes-options-wrapper' ] }>
					<ToggleControl
						label={ __( 'Append post link', 'jetpack-publicize-pkg' ) }
						checked={ appendLink }
						disabled={ isAppendLinkToggleUpdating || isLinkFormatUpdating || isUpdating }
						className={ styles.toggle }
						onChange={ onToggleAppendLink }
						help={ __(
							'Whether to append the post link when sharing a note.',
							'jetpack-publicize-pkg'
						) }
						__nextHasNoMarginBottom={ true }
					/>
					{ appendLink ? (
						<SelectControl
							label={ __( 'Link format', 'jetpack-publicize-pkg' ) }
							value={ linkFormat ?? 'full_url' }
							onChange={ onChangeLinkFormat }
							disabled={ isLinkFormatUpdating || isUpdating || isAppendLinkToggleUpdating }
							options={ [
								{ label: __( 'Full URL', 'jetpack-publicize-pkg' ), value: 'full_url' },
								{ label: __( 'Shortlink', 'jetpack-publicize-pkg' ), value: 'shortlink' },
								{
									label: __( 'Permashortcitation', 'jetpack-publicize-pkg' ),
									value: 'permashortcitation',
								},
							] }
							help={
								<span>
									{ __(
										'Format of the link to use when sharing a note.',
										'jetpack-publicize-pkg'
									) }
									&nbsp;
									<Link
										openInNewTab
										href="https://jetpack.com/redirect/?source=jetpack-social-notes-link-format"
									>
										{ __( 'Learn more', 'jetpack-publicize-pkg' ) }
									</Link>
								</span>
							}
							__nextHasNoMarginBottom={ true }
							__next40pxDefaultSize={ true }
						/>
					) : null }
				</div>
			) : null }
		</ToggleSection>
	);
};

export default SocialNotesToggle;
