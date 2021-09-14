/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

export default function useSelectSocialMedia( deps = [] ) {
	return useSelect(
		select => ( {
			connections: select( editorStore ).getEditedPostAttribute( 'jetpack_publicize_connections' ),
			message: select( 'jetpack/publicize' ).getShareMessage(),
			maxLength: select( 'jetpack/publicize' ).getShareMessageMaxLength(),
		} ),
		deps
	);
}
