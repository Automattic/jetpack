/**
 * Header Actions Plugin
 *
 * Adds "View Responses" button and "More Actions" dropdown to the form editor header.
 * Uses a portal to inject into the editor header slot.
 */

import { Button, Fill } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getResponsesUrl } from './utils';

export const HEADER_ACTIONS_PLUGIN = 'jetpack-form-header-actions';

export const HeaderActions = () => {
	const { postId, isNewPost } = useSelect( select => {
		const editor = select( editorStore ) as {
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
