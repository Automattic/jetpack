import { TumblrPreviews } from '@automattic/social-previews';
import { useSelect } from '@wordpress/data';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { SOCIAL_STORE_ID, CONNECTION_SERVICE_TUMBLR } from '../../social-store';

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
	const { message } = useSocialMediaMessage();

	const user = useSelect(
		select => {
			const { displayName, profileImage: avatarUrl } =
				select( SOCIAL_STORE_ID ).getConnectionProfileDetails( CONNECTION_SERVICE_TUMBLR );

			return { displayName: displayName || author, avatarUrl };
		},
		[ author ]
	);

	return (
		<TumblrPreviews { ...props } user={ user } description={ content } customText={ message } />
	);
};

export default TumblrPreview;
