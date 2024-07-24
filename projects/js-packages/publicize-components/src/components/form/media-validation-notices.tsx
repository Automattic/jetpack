import useAttachedMedia from '../../hooks/use-attached-media';
import useFeaturedImage from '../../hooks/use-featured-image';
import useImageGeneratorConfig from '../../hooks/use-image-generator-config';
import useMediaDetails from '../../hooks/use-media-details';
import useMediaRestrictions from '../../hooks/use-media-restrictions';
import { NO_MEDIA_ERROR } from '../../hooks/use-media-restrictions/constants';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { InstagramNoMediaNotice } from './instagram-no-media-notice';
import { MediaRequirementsNotice } from './media-requirements-notice';

export const MediaValidationNotices: React.FC = () => {
	const { connections } = useSocialMediaConnections();
	const { isEnabled: isSocialImageGeneratorEnabledForPost } = useImageGeneratorConfig();
	const { attachedMedia } = useAttachedMedia();
	const featuredImageId = useFeaturedImage();

	const mediaId = attachedMedia[ 0 ]?.id || featuredImageId;
	const { validationErrors, isConvertible } = useMediaRestrictions(
		connections,
		useMediaDetails( mediaId )[ 0 ],
		{
			isSocialImageGeneratorEnabledForPost,
		}
	);

	const invalidIds = Object.keys( validationErrors );

	if ( ! invalidIds.length ) {
		return null;
	}

	if ( Object.values( validationErrors ).includes( NO_MEDIA_ERROR ) ) {
		return <InstagramNoMediaNotice />;
	}

	if ( ! isConvertible ) {
		return <MediaRequirementsNotice validationErrors={ validationErrors } />;
	}

	return null;
};
