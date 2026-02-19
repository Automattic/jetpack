/**
 * Header Actions Plugin
 *
 * Adds "View Responses" button and "More Actions" dropdown to the form editor header.
 * Uses a portal to inject into the editor header slot.
 */

import { Button, Fill } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Get the responses URL for the current form.
 *
 * @param postId - The post ID of the form.
 * @return The URL to view form responses.
 */
const getResponsesUrl = ( postId: number ): string => {
	const baseUrl =
		window.jpFormsBlocks?.defaults?.formsResponsesUrl ||
		'/wp-admin/admin.php?page=jetpack-forms-responses-wp-admin';
	// Navigate to the specific form's responses
	return `${ baseUrl }&p=%2Fresponses%2Finbox%3FsourceId%3D${ postId }`;
};

export const HeaderActions = () => {
	const { postId, isNewPost } = useSelect( select => {
		const editor = select( 'core/editor' ) as {
			getCurrentPostId: () => number;
			isEditedPostNew: () => boolean;
		};
		return {
			postId: editor.getCurrentPostId(),
			isNewPost: editor.isEditedPostNew(),
		};
	} );

	const handleViewResponses = useCallback( () => {
		if ( postId ) {
			window.location.href = getResponsesUrl( postId );
		}
	}, [ postId ] );

	if ( ! postId || isNewPost ) {
		return null;
	}

	return (
		<Fill name="PinnedItems/core">
			<Button
				variant="secondary"
				size="compact"
				onClick={ handleViewResponses }
				className="jetpack-forms-header-actions__view-responses"
			>
				{ __( 'View Responses', 'jetpack-forms' ) }
			</Button>
		</Fill>
	);
};
