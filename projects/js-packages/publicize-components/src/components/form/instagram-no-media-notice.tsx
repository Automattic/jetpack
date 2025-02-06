import { getRedirectUrl } from '@automattic/jetpack-components';
import { siteHasFeature } from '@automattic/jetpack-script-data';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { features } from '../../utils/constants';
import Notice from '../notice';

export const InstagramNoMediaNotice: React.FC = () => {
	return siteHasFeature( features.ENHANCED_PUBLISHING ) ? (
		<Notice type={ 'warning' }>
			{ __(
				'To share to Instagram, add an image/video, or enable Social Image Generator.',
				'jetpack-publicize-components'
			) }
			<br />
			<ExternalLink href={ getRedirectUrl( 'jetpack-social-share-to-instagram' ) }>
				{ __( 'Learn more', 'jetpack-publicize-components' ) }
			</ExternalLink>
		</Notice>
	) : (
		<Notice type={ 'warning' }>
			{ __( 'You need a featured image to share to Instagram.', 'jetpack-publicize-components' ) }
			<br />
			<ExternalLink href={ getRedirectUrl( 'jetpack-social-share-to-instagram' ) }>
				{ __( 'Learn more', 'jetpack-publicize-components' ) }
			</ExternalLink>
		</Notice>
	);
};
