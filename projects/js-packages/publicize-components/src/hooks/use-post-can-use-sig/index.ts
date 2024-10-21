import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * When a post can use the Social Image Generator (SIG).
 *
 * @return {boolean} Whether the post can use the Social Image Generator.
 */
export function usePostCanUseSig() {
	const isJetpackSocialNote = useSelect( select => {
		const currentPostType = select( editorStore )
			// @ts-expect-error -- `@wordpress/editor` is a nightmare to work with TypeScript - getCurrentPostType exists on the editor store
			.getCurrentPostType();

		return 'jetpack-social-note' === currentPostType;
	}, [] );

	return ! isJetpackSocialNote && siteHasFeature( 'social-image-generator' );
}
