import { getFormEditUrl } from '../../../dashboard/utils.ts';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';
import type { EditorContext } from './get-editor-context.ts';

/**
 * Navigate to edit a form post.
 * - Widget/Site editor: redirects in same page (no in-editor navigation available)
 * - Post editor: uses in-editor navigation if available
 *
 * @param formId                   - The form post ID to edit.
 * @param editorContext            - The current editor context.
 * @param onNavigateToEntityRecord - Optional callback for in-editor navigation.
 */
export const navigateToForm = (
	formId: number,
	editorContext: EditorContext,
	onNavigateToEntityRecord?: ( params: { postId: number; postType: string } ) => void
) => {
	if ( editorContext === 'widget' || editorContext === 'site' ) {
		window.location.href = getFormEditUrl( formId );
	} else if ( onNavigateToEntityRecord ) {
		onNavigateToEntityRecord( { postId: formId, postType: FORM_POST_TYPE } );
	}
};
