import { MastodonPreviews } from '@automattic/social-previews';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { usePostMeta } from '../../hooks/use-post-meta';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { SOCIAL_STORE_ID, CONNECTION_SERVICE_MASTODON } from '../../social-store';

const MastodonPreview = props => {
	const { message } = useSocialMediaMessage();
	const { content, siteName } = useSelect( select => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		const { getUnstableBase } = select( 'core' );

		return {
			content: getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ],
			siteName: decodeEntities( getUnstableBase().name ),
		};
	} );
	const { shouldUploadAttachedMedia: isSocialPost } = usePostMeta();

	const user = useSelect( select => {
		const {
			displayName,
			profileImage: avatarUrl,
			username: address,
		} = select( SOCIAL_STORE_ID ).getConnectionProfileDetails( CONNECTION_SERVICE_MASTODON );

		return { displayName, avatarUrl, address };
	} );

	const firstMediaItem = props.media?.[ 0 ];

	const customImage = firstMediaItem?.type.startsWith( 'image/' ) ? firstMediaItem.url : null;

	return (
		<MastodonPreviews
			{ ...props }
			siteName={ siteName }
			user={ user }
			description={ content }
			customText={ message }
			customImage={ customImage }
			isSocialPost={ isSocialPost }
		/>
	);
};

export default MastodonPreview;
