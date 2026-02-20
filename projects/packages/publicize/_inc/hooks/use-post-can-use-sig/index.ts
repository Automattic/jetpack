import { siteHasFeature } from '@automattic/jetpack-script-data';
import { features } from '../../utils/constants';
import { useIsSocialNote } from '../../utils/use-is-social-note';

/**
 * When a post can use the Social Image Generator (SIG).
 *
 * @return {boolean} Whether the post can use the Social Image Generator.
 */
export function usePostCanUseSig() {
	const isJetpackSocialNote = useIsSocialNote();

	return ! isJetpackSocialNote && siteHasFeature( features.IMAGE_GENERATOR );
}
