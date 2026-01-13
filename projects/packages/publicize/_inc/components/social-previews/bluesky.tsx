import { BlueskyPreviews } from '@automattic/social-previews';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';
import useSocialMediaMessage from '../../hooks/use-social-media-message';

const BlueskyPreview = props => {
	const { message } = useSocialMediaMessage();
	const { content, siteName } = useSelect( select => {
		const { getEditedPostAttribute } = select( editorStore );
		const { getUnstableBase } = select( coreStore );

		return {
			content: getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ],
			siteName: decodeEntities( getUnstableBase( undefined ).name ),
		};
	}, [] );

	const firstMediaItem = props.media?.[ 0 ];

	const customImage = firstMediaItem?.type.startsWith( 'image/' ) ? firstMediaItem.url : null;

	return (
		<BlueskyPreviews
			{ ...props }
			siteName={ siteName }
			description={ decodeEntities( content ) }
			customText={ decodeEntities(
				message || `${ props.title }\n\n${ content.replaceAll( /[\s\n]/g, ' ' ) }`
			) }
			customImage={ customImage }
			hidePostPreview
		/>
	);
};

export default BlueskyPreview;
