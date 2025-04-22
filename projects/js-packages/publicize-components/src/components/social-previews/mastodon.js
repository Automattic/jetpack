import { MastodonPreviews } from '@automattic/social-previews';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import useSocialMediaMessage from '../../hooks/use-social-media-message';

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

	const firstMediaItem = props.media?.[ 0 ];

	const customImage = firstMediaItem?.type.startsWith( 'image/' ) ? firstMediaItem.url : null;

	return (
		<MastodonPreviews
			{ ...props }
			siteName={ siteName }
			description={ content }
			customText={ message }
			customImage={ customImage }
			hidePostPreview
		/>
	);
};

export default MastodonPreview;
