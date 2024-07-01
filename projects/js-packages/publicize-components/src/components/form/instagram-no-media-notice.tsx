import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { usePublicizeConfig } from '../../..';
import Notice from '../notice';

export const InstagramNoMediaNotice: React.FC = () => {
	const { isEnhancedPublishingEnabled } = usePublicizeConfig();

	return isEnhancedPublishingEnabled ? (
		<Notice type={ 'warning' }>
			{ __(
				'To share to Instagram, add an image/video, or enable Social Image Generator.',
				'jetpack'
			) }
			<br />
			<ExternalLink href={ getRedirectUrl( 'jetpack-social-share-to-instagram' ) }>
				{ __( 'Learn more', 'jetpack' ) }
			</ExternalLink>
		</Notice>
	) : (
		<Notice type={ 'warning' }>
			{ __( 'You need a featured image to share to Instagram.', 'jetpack' ) }
			<br />
			<ExternalLink href={ getRedirectUrl( 'jetpack-social-share-to-instagram' ) }>
				{ __( 'Learn more', 'jetpack' ) }
			</ExternalLink>
		</Notice>
	);
};
