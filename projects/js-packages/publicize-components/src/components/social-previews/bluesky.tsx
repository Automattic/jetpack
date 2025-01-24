import { BlueskyPreviews } from '@automattic/social-previews';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { store, CONNECTION_SERVICE_BLUESKY } from '../../social-store';

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

	const user = useSelect( select => {
		const {
			displayName,
			profileImage: avatarUrl,
			username: address,
		} = select( store ).getConnectionProfileDetails( CONNECTION_SERVICE_BLUESKY );

		return { displayName, avatarUrl, address };
	}, [] );

	const firstMediaItem = props.media?.[ 0 ];

	const customImage = firstMediaItem?.type.startsWith( 'image/' ) ? firstMediaItem.url : null;

	const blueskyConnections = useSelect(
		select => select( store ).getConnectionsByService( CONNECTION_SERVICE_BLUESKY ),
		[]
	);

	return (
		<BlueskyPreviews
			{ ...props }
			siteName={ siteName }
			user={ user }
			description={ decodeEntities( content ) }
			customText={ decodeEntities(
				message || `${ props.title }\n\n${ content.replaceAll( /[\s\n]/g, ' ' ) }`
			) }
			customImage={ customImage }
			hidePostPreview={ ! blueskyConnections.length }
		/>
	);
};

export default BlueskyPreview;
