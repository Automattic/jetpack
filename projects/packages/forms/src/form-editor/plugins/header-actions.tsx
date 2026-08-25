/**
 * Header Actions Plugin
 *
 * Adds "View responses" button to the form editor header.
 */

import { Fill } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { LinkButton } from '@wordpress/ui';
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

	if ( ! postId || isNewPost ) {
		return null;
	}

	return (
		<Fill name="PinnedItems/core">
			<LinkButton variant="outline" size="compact" href={ getResponsesUrl( postId ) }>
				{ __( 'View responses', 'jetpack-forms' ) }
			</LinkButton>
		</Fill>
	);
};
