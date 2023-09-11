import { MastodonPreviews } from '@automattic/social-previews';
import { useSelect } from '@wordpress/data';
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
			siteName: getSite().title,
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

	return (
		<MastodonPreviews
			{ ...props }
			siteName={ siteName }
			user={ user }
			description={ content }
			customText={ message }
			customImage={ props.media?.[ 0 ]?.url }
			isSocialPost={ isSocialPost }
		/>
	);
};

export default MastodonPreview;
