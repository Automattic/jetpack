import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as socialStore } from '../../social-store';
import { useIsSharingPossible } from '../use-is-sharing-possible';
import usePublicizeConfig from '../use-publicize-config';

/**
 * Returns whether re-sharing is possible currently.
 *
 * False when
 * - sharing is disabled
 * - no enabled connections
 * - post is not published
 * - is sharing post
 *
 * @return {boolean} Whether re-sharing is possible.
 */
export function useIsReSharingPossible() {
	const { isPublicizeEnabled, needsUserConnection } = usePublicizeConfig();
	const isSharingPossible = useIsSharingPossible();
	const isSharingCurrentPost = useSelect( select => select( socialStore ).isSharingCurrentPost() );

	const { isCurrentPostPublished: isPostPublished, isSavingPost } = useSelect( editorStore, [] );

	return (
		isPublicizeEnabled &&
		isSharingPossible &&
		! isSharingCurrentPost &&
		isPostPublished() &&
		! isSavingPost() &&
		! needsUserConnection
	);
}
