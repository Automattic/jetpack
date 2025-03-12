import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useIsSharingPossible } from '../use-is-sharing-possible';
import usePublicizeConfig from '../use-publicize-config';
import useSharePost from '../use-share-post';

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
	const { isPublicizeEnabled } = usePublicizeConfig();
	const isSharingPossible = useIsSharingPossible();
	const { isFetching } = useSharePost();

	const { isCurrentPostPublished: isPostPublished, isSavingPost } = useSelect( editorStore, [] );

	return (
		isPublicizeEnabled && isSharingPossible && ! isFetching && isPostPublished() && ! isSavingPost()
	);
}
