import { FacebookPreviews as Previews } from '@automattic/social-previews';
import { withSelect } from '@wordpress/data';
import useSocialMediaMessage from '../../hooks/use-social-media-message';

const FacebookPreview = props => {
	const { message } = useSocialMediaMessage();

	const { title, excerpt, content } = props;

	return (
		<Previews
			{ ...props }
			type="article"
			customText={ message || excerpt || content || title }
			hidePostPreview
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
