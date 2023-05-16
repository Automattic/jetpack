import { TumblrPreviews } from '@automattic/social-previews';
import { useSelect } from '@wordpress/data';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import useSocialMediaMessage from '../../hooks/use-social-media-message';

const TumblrPreview = props => {
	const { content, author } = useSelect( select => {
		const { getUser } = select( 'core' );
		const { getEditedPostAttribute } = select( 'core/editor' );
		const authorId = getEditedPostAttribute( 'author' );
		const user = authorId && getUser( authorId );

		return {
			content: getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ],
			author: user?.name,
		};
	} );
	const { connections } = useSocialMediaConnections();
	const { message } = useSocialMediaMessage();

	const connection = connections?.find( conn => conn.service_name === 'tumblr' );

	let user;

	if ( connection ) {
		user = {
			displayName: author,
			avatarUrl: connection.profile_picture,
		};
	}

	return (
		<TumblrPreviews { ...props } user={ user } description={ content } customText={ message } />
	);
};

export default TumblrPreview;
