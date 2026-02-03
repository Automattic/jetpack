/**
 * External dependencies
 */
import { registerJetpackPlugin } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import { PluginPreviewMenuItem } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { FORM_POST_TYPE } from '../../blocks/shared/util/constants.js';

/**
 * Form Preview Menu Item component.
 *
 * Adds a "Preview form" item to the editor's Preview dropdown menu.
 * Only renders when editing a jetpack_form post type.
 *
 * @return {JSX.Element|null} The preview menu item or null.
 */
const FormPreviewMenuItem = () => {
	const { postId, postType } = useSelect( select => ( {
		postId: ( select( 'core/editor' ) as { getCurrentPostId: () => number } ).getCurrentPostId(),
		postType: (
			select( 'core/editor' ) as { getCurrentPostType: () => string }
		 ).getCurrentPostType(),
	} ) );

	const handlePreview = useCallback( async () => {
		try {
			const response = await apiFetch< { preview_url: string } >( {
				path: `/wp/v2/jetpack-forms/${ postId }/preview-url`,
			} );
			window.open( response.preview_url, '_blank' );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to get preview URL:', error );
		}
	}, [ postId ] );

	// Only show for jetpack_form post type.
	if ( postType !== FORM_POST_TYPE ) {
		return null;
	}

	// PluginPreviewMenuItem adds item to the Preview dropdown in editor header.
	// Check if PluginPreviewMenuItem exists (it may not be available in all WP versions).
	if ( ! PluginPreviewMenuItem ) {
		return null;
	}

	return (
		<PluginPreviewMenuItem onClick={ handlePreview } icon={ external }>
			{ __( 'Preview form', 'jetpack-forms' ) }
		</PluginPreviewMenuItem>
	);
};

// Register as a Jetpack plugin.
registerJetpackPlugin( 'jetpack-form-preview', {
	render: FormPreviewMenuItem,
} );
