import { getRedirectUrl } from '@automattic/jetpack-components';
import { siteHasFeature } from '@automattic/jetpack-script-data';
import { Notice } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { features } from '../../utils/constants';

/**
 * Notice displayed when trying to share to Instagram without media.
 *
 * @return - React element
 */
export function InstagramNoMediaNotice() {
	return (
		<Notice
			isDismissible={ false }
			status="warning"
			actions={ [
				{
					label: __( 'Learn more', 'jetpack-publicize-pkg' ),
					url: getRedirectUrl( 'jetpack-social-share-to-instagram' ),
				},
			] }
		>
			{ siteHasFeature( features.ENHANCED_PUBLISHING )
				? __(
						'To share to Instagram, add an image/video, or enable Social Image Generator.',
						'jetpack-publicize-pkg'
				  )
				: _x(
						'You need a featured image to share to Instagram.',
						'Notice shown when there is no featured image set for the post.',
						'jetpack-publicize-pkg'
				  ) }
		</Notice>
	);
}
