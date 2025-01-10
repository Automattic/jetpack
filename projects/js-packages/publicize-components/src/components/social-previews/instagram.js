import { Notice, getRedirectUrl } from '@automattic/jetpack-components';
import { siteHasFeature } from '@automattic/jetpack-script-data';
import { InstagramPreviews } from '@automattic/social-previews';
import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import React from 'react';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { SOCIAL_STORE_ID, CONNECTION_SERVICE_INSTAGRAM_BUSINESS } from '../../social-store';
import { features } from '../../utils/constants';

/**
 * The Instagram tab component.
 *
 * @param {object} props - The props.
 * @return {React.ReactNode} The Instagram tab component.
 */
export function Instagram( props ) {
	const { title, image, media, description } = props;
	const { username: name, profileImage } = useSelect( select =>
		select( SOCIAL_STORE_ID ).getConnectionProfileDetails( CONNECTION_SERVICE_INSTAGRAM_BUSINESS )
	);

	const { message: text } = useSocialMediaMessage();

	const hasMedia = media?.some(
		( { type } ) => type.startsWith( 'image/' ) || type.startsWith( 'video/' )
	);

	const hasImage = Boolean( image );

	if ( ! hasMedia && ! hasImage ) {
		return (
			<Notice
				hideCloseButton
				actions={ [
					<ExternalLink
						key="learn-more"
						href={ getRedirectUrl( 'jetpack-social-share-to-instagram' ) }
					>
						{ __( 'Learn more', 'jetpack-publicize-components' ) }
					</ExternalLink>,
				] }
			>
				{ siteHasFeature( features.ENHANCED_PUBLISHING )
					? __(
							'To share to Instagram, add an image/video, or enable Social Image Generator.',
							'jetpack-publicize-components'
					  )
					: _x(
							'You need a featured image to share to Instagram.',
							'The message shown in the Instagram social preview',
							'jetpack-publicize-components'
					  ) }
			</Notice>
		);
	}

	const caption = text || title || description;

	return (
		<InstagramPreviews
			image={ media?.[ 0 ]?.url || image }
			media={ media }
			name={ name }
			profileImage={ profileImage }
			caption={ caption }
		/>
	);
}
