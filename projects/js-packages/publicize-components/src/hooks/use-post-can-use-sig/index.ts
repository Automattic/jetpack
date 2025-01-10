import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { features } from '../../utils/constants';

/**
 * When a post can use the Social Image Generator (SIG).
 *
 * @return {boolean} Whether the post can use the Social Image Generator.
 */
export function usePostCanUseSig() {
	const isJetpackSocialNote = useSelect( select => {
		const currentPostType = select( editorStore ).getCurrentPostType();

		return 'jetpack-social-note' === currentPostType;
	}, [] );

	return ! isJetpackSocialNote && siteHasFeature( features.IMAGE_GENERATOR );
}
