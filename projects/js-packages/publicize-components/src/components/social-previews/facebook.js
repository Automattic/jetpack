import { FacebookPreviews as Previews } from '@automattic/social-previews';
import { withSelect } from '@wordpress/data';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import useSocialMediaMessage from '../../hooks/use-social-media-message';

const FacebookPreview = props => {
	const { connections } = useSocialMediaConnections();
	const { message } = useSocialMediaMessage();

	const { title, excerpt, content } = props;
	const connection = connections?.find( conn => conn.service_name === 'facebook' );

	let user;

	if ( connection ) {
		user = {
			displayName: connection.display_name,
			avatarUrl: connection.profile_picture,
		};
	}

	return (
		<Previews
			{ ...props }
			type="article"
			user={ user }
			customText={ message || excerpt || content || title }
		/>
	);
};

export default withSelect( select => {
	const { getEditedPostAttribute } = select( 'core/editor' );

	return {
		excerpt: getEditedPostAttribute( 'excerpt' ),
		content: getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ],
	};
} )( FacebookPreview );
