import { getScriptData } from '@automattic/jetpack-script-data';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Whether the current user can mark a connection as shared
 *
 * @return Whether the current user can mark a connection as shared
 */
export function useUserCanShareConnection() {
	return useSelect( select => {
		const { current_user } = getScriptData().user;

		const isEditorOrAbove = current_user.capabilities?.edit_others_posts;

		if ( undefined !== isEditorOrAbove ) {
			return isEditorOrAbove;
		}

		const { getUser } = select( coreStore );

		// Only the editors and above can mark a connection as shared
		return Boolean( getUser( current_user.id )?.capabilities?.edit_others_posts );
	}, [] );
}
