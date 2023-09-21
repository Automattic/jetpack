import { MastodonPreviews } from '@automattic/social-previews';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { shouldUploadAttachedMedia } from '../../store/selectors';

const MastodonPreview = props => {
	const { connections } = useSocialMediaConnections();
	const { message } = useSocialMediaMessage();
	const { content, siteName } = useSelect( select => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		const { getSite } = select( 'core' );

		return {
			content: getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ],
			siteName: decodeEntities( getSite().title ),
		};
	} );
	const isSocialPost = shouldUploadAttachedMedia();
	const connection = connections?.find( conn => conn.service_name === 'mastodon' );

	let user;

	if ( connection ) {
		user = {
			displayName: connection.display_name,
			avatarUrl: connection.profile_picture,
			address: connection.username,
		};
	}

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
