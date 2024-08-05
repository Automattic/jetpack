import { Notice, getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';

/**
 * Instagram media notice component.
 *
 * @returns {import('react').ReactNode} - Instagram media notice component.
 */
export function InstagramMediaNotice() {
	const { isEnhancedPublishingEnabled } = usePublicizeConfig();

	return (
		<Notice
			hideCloseButton
			actions={ [
				<ExternalLink href={ getRedirectUrl( 'jetpack-social-share-to-instagram' ) }>
					{ __( 'Learn more', 'jetpack' ) }
				</ExternalLink>,
			] }
		>
			{ isEnhancedPublishingEnabled
				? __(
						'To share to Instagram, add an image/video, or enable Social Image Generator.',
						'jetpack'
				  )
				: _x(
						'You need a featured image to share to Instagram.',
						'The message shown in the Instagram social preview',
						'jetpack'
				  ) }
		</Notice>
	);
}
