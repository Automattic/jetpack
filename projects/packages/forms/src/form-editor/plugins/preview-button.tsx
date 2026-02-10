/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginPreviewMenuItem } from '@wordpress/editor';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { registerPlugin } from '@wordpress/plugins';
/**
 * Internal dependencies
 */
import { FORM_POST_TYPE } from '../../blocks/shared/util/constants.js';

const savingAndOpeningMessage = __( 'Saving & opening', 'jetpack-forms' );
const previewFormMessage = __( 'Preview form', 'jetpack-forms' );

/**
 * Form Preview Menu Item component.
 *
 * Adds a "Preview form" item to the editor's preview dropdown menu.
 * Uses the PluginPreviewMenuItem slot introduced in WordPress 6.7.
 * Only renders when editing a jetpack_form post type.
 *
 * @see https://make.wordpress.org/core/2024/10/18/extending-the-preview-dropdown-menu-in-wordpress-6-7/
 * @return {JSX.Element|null} The preview menu item or null.
 */
const FormPreviewMenuItem = () => {
	const [ isLoading, setIsLoading ] = useState( false );

	const { postId, postType, isDirty, isAutosaveable } = useSelect( select => {
		const editor = select( 'core/editor' ) as {
			getCurrentPostId: () => number;
			getCurrentPostType: () => string;
			isEditedPostDirty: () => boolean;
			isEditedPostAutosaveable: () => boolean;
		};
		return {
			postId: editor.getCurrentPostId(),
			postType: editor.getCurrentPostType(),
			isDirty: editor.isEditedPostDirty(),
			isAutosaveable: editor.isEditedPostAutosaveable(),
		};
	} );

	const { autosave } = useDispatch( 'core/editor' );
	const { createErrorNotice } = useDispatch( noticesStore );

	const handlePreview = useCallback( async () => {
		if ( isLoading ) {
			return;
		}

		setIsLoading( true );
		try {
			// Autosave if there are unsaved changes.
			if ( isDirty && isAutosaveable ) {
				await autosave();
			}

			const response = await apiFetch< { preview_url: string } >( {
				path: `/wp/v2/jetpack-forms/${ postId }/preview-url`,
			} );
			window.open( response.preview_url, '_blank' );
		} catch ( error ) {
			createErrorNotice(
				__( 'Failed to generate preview URL. Please try again.', 'jetpack-forms' ),
				{
					type: 'snackbar',
				}
			);
			// eslint-disable-next-line no-console
			console.error( 'Failed to get preview URL:', error );
		} finally {
			setIsLoading( false );
		}
	}, [ postId, isLoading, isDirty, isAutosaveable, autosave, createErrorNotice ] );

	// Only show for jetpack_form post type.
	if ( postType !== FORM_POST_TYPE ) {
		return null;
	}

	// PluginPreviewMenuItem may not be available in older WordPress versions (pre-6.7).
	if ( ! PluginPreviewMenuItem ) {
		return null;
	}

	return (
		<PluginPreviewMenuItem icon={ external } onClick={ handlePreview }>
			{ isLoading ? savingAndOpeningMessage : previewFormMessage }
		</PluginPreviewMenuItem>
	);
};

// Register the preview menu item plugin.
registerPlugin( 'jetpack-form-preview', {
	render: FormPreviewMenuItem,
} );
