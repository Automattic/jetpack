import { TumblrPreviews } from '@automattic/social-previews';
import { useSelect } from '@wordpress/data';
import useSocialMediaMessage from '../../hooks/use-social-media-message';

const TumblrPreview = props => {
	const { content } = useSelect( select => {
		const { getEditedPostAttribute } = select( 'core/editor' );

		return {
			content: getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ],
		};
	} );
	const { message } = useSocialMediaMessage();

	return (
		<TumblrPreviews { ...props } description={ content } customText={ message } hidePostPreview />
	);
};

export default TumblrPreview;
