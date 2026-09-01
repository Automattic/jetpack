import { isSimpleSite, isWoASite } from '@automattic/jetpack-script-data';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { send } from '@wordpress/icons';
import { useIsReSharingPossible } from '../../hooks/use-is-resharing-possible';
import { useSharePost } from '../../hooks/use-share-post';
import { store as socialStore } from '../../social-store';

/**
 * Get the site type from environment
 *
 * @return Site type
 */
function getSiteType() {
	if ( isWoASite() ) {
		return 'atomic';
	}

	if ( isSimpleSite() ) {
		return 'simple';
	}

	return 'jetpack';
}

type SharePostButtonProps = {
	/**
	 * The callback to be called when the share is completed.
	 */
	onShareCompleted: VoidFunction;
};

/**
 * Component to trigger the resharing of the post.
 *
 * @param {SharePostButtonProps} props - The component props.
 * @return A button component that will share the current post when clicked.
 */
export function SharePostButton( { onShareCompleted }: SharePostButtonProps ) {
	const isSharingCurrentPost = useSelect( select => select( socialStore ).isSharingCurrentPost() );
	const { recordEvent } = useAnalytics();
	const isSchedulingShares = useSelect( select => select( socialStore ).isSchedulingShares(), [] );
	const shareThePost = useSharePost();

	const isReSharingPossible = useIsReSharingPossible();

	const sharePost = useCallback( async () => {
		recordEvent( 'jetpack_social_reshare_clicked', {
			location: 'editor',
			environment: getSiteType(),
		} );

		const success = await shareThePost();

		if ( success ) {
			onShareCompleted();
		}
	}, [ recordEvent, shareThePost, onShareCompleted ] );

	return (
		<Button
			variant="primary"
			onClick={ sharePost }
			disabled={ ! isReSharingPossible || isSchedulingShares }
			isBusy={ isSharingCurrentPost }
			icon={ send }
		>
			{ __( 'Share', 'jetpack-publicize-pkg' ) }
		</Button>
	);
}
