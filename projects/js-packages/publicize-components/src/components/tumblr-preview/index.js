import { TumblrFullPreview } from '@automattic/social-previews';
import { useSelect } from '@wordpress/data';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import useSocialMediaMessage from '../../hooks/use-social-media-message';

const TumblrPreview = props => {
	const { content } = useSelect( select => {
		const { getEditedPostAttribute } = select( 'core/editor' );

		return {
			content: getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ],
		};
	} );
	const { connections } = useSocialMediaConnections();
	const { message } = useSocialMediaMessage();

	const connection = connections?.find( conn => conn.service_name === 'tumblr' );

	let user;

	if ( connection ) {
		user = {
			displayName: props.author,
			avatarUrl: connection.profile_picture,
		};
	}

	return (
		<TumblrFullPreview { ...props } user={ user } description={ content } customText={ message } />
	);
};

export default TumblrPreview;
