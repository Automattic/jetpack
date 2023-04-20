import { FacebookPreview as Preview } from '@automattic/social-previews';
import { withSelect } from '@wordpress/data';
import useAttachedMedia from '../../hooks/use-attached-media';
import useMediaDetails from '../../hooks/use-media-details';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import useSocialMediaMessage from '../../hooks/use-social-media-message';

const FacebookPreview = props => {
	const { connections } = useSocialMediaConnections();
	const { message } = useSocialMediaMessage();
	const { attachedMedia } = useAttachedMedia();
	const [ attachedMediaDetails ] = useMediaDetails( attachedMedia[ 0 ]?.id );

	const { title, excerpt, content, mediaDetails } = props;
	const connection = connections?.find( conn => conn.service_name === 'facebook' );
	const attachedMediaData = attachedMediaDetails?.mediaData;
	const { sourceUrl, width, height } = attachedMediaData || mediaDetails || {};

	let user;
	let imageMode;

	if ( connection ) {
		user = {
			displayName: connection.display_name,
			avatarUrl: connection.profile_picture,
		};
	}

	if ( width && height && typeof width === 'number' && typeof height === 'number' ) {
		imageMode = width > height ? 'landscape' : 'portrait';
	}

	return (
		<Preview
			{ ...props }
			type="article"
			user={ user }
			customText={ message || excerpt || content || title }
			customImage={ sourceUrl }
			imageMode={ imageMode }
		/>
	);
};
export default withSelect( select => {
	const { getMedia } = select( 'core' );
	const { getEditedPostAttribute } = select( 'core/editor' );
	const featuredImageId = getEditedPostAttribute( 'featured_media' );
	const media = featuredImageId ? getMedia( featuredImageId ) : null;

	return {
		excerpt: getEditedPostAttribute( 'excerpt' ),
		content: getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ],
		mediaDetails: media?.media_details,
	};
} )( FacebookPreview );
