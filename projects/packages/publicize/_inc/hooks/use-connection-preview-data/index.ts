import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useMemo } from 'react';
import { Connection } from '../../social-store/types';
import { features } from '../../utils';
import useMediaDetails from '../use-media-details';
import { usePerNetworkCustomization } from '../use-per-network-customization';
import useSigPreview from '../use-sig-preview';
import useSocialMediaMessage from '../use-social-media-message';
import { useSocialPreviewPostData } from '../use-social-preview-post-data';
import { PostData } from '../use-social-preview-post-data/types';

/**
 * Returns the post data needed for the preview of a specific connection.
 *
 * @param {Connection} connection - The connection.
 * @return The post data.
 */
export function useConnectionPreviewData( connection: Connection ) {
	const { isEnabled: usingPerNetworkCustomization } = usePerNetworkCustomization();

	const postData = useSocialPreviewPostData();
	const { message: globalMessage } = useSocialMediaMessage();
	const featuredImageId = useSelect( select =>
		select( editorStore ).getEditedPostAttribute( 'featured_media' )
	);
	const [ featuredImageDetails ] = useMediaDetails( featuredImageId );

	// Generate SIG preview only if site has the feature and connection is set to use SIG.
	const generateSigPreview =
		siteHasFeature( features.IMAGE_GENERATOR ) && connection.media_source === 'sig';

	const sig = useSigPreview( generateSigPreview );

	return useMemo( () => {
		if ( ! siteHasFeature( features.ENHANCED_PUBLISHING ) || ! usingPerNetworkCustomization ) {
			return {
				...postData,
				message: globalMessage.trim(),
			};
		}

		let media: PostData[ 'media' ] = connection.attached_media || [];

		switch ( connection.media_source ) {
			case 'featured-image':
				media = featuredImageDetails?.mediaData?.sourceUrl
					? [
							{
								url: featuredImageDetails.mediaData.sourceUrl,
								type: featuredImageDetails.metaData.mime ?? 'image/jpeg',
							},
					  ]
					: [];
				break;
			case 'sig':
				media = sig.url
					? [
							{
								url: sig.url,
								type: 'image/png',
							},
					  ]
					: [];
				break;

			case 'none':
				media = [];
				break;
		}

		return {
			...postData,
			message: ( connection.message ?? globalMessage ).trim(),
			media,
		};
	}, [
		connection,
		featuredImageDetails,
		globalMessage,
		postData,
		sig.url,
		usingPerNetworkCustomization,
	] );
}
