/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

export function useSelectSocialMediaConnections( deps = [] ) {
	return useSelect(
		select => select( editorStore ).getEditedPostAttribute( 'jetpack_publicize_connections' ),
		deps
	);
}

export function useSelectSocialMediaMessage( deps = [] ) {
	return useSelect( select => select( 'jetpack/publicize' ).getShareMessage(), deps );
}

export function useSelectSocialMediaMessageMaxLength( deps = [] ) {
	return useSelect( select => select( 'jetpack/publicize' ).getShareMessageMaxLength(), deps );
}
