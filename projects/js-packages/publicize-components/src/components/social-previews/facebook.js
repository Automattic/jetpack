import { FacebookPreviews as Previews } from '@automattic/social-previews';
import { useSelect, withSelect } from '@wordpress/data';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { SOCIAL_STORE_ID } from '../../social-store';

const FacebookPreview = props => {
	const { message } = useSocialMediaMessage();

	const { title, excerpt, content } = props;

	const user = useSelect( select => {
		const { displayName, profileImage: avatarUrl } =
			select( SOCIAL_STORE_ID ).getConnectionProfileDetails( 'facebook' );

		return { displayName, avatarUrl };
	} );

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
