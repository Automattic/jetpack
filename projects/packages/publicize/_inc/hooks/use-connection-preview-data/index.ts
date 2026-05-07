import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useMemo } from 'react';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import { features } from '../../utils';
import useMediaDetails from '../use-media-details';
import { usePerNetworkCustomization } from '../use-per-network-customization';
import { usePostMeta } from '../use-post-meta';
import { useRenderMessageItems } from '../use-render-message-items';
import useSigPreview from '../use-sig-preview';
import useSocialMediaMessage from '../use-social-media-message';
import { useSocialPreviewPostData } from '../use-social-preview-post-data';
import { PostPreviewData } from '../use-social-preview-post-data/types';

/**
 * Returns the post data needed for the preview of a specific connection.
 *
 * @param {Connection} connection - The connection.
 * @return The post data.
 */
export function useConnectionPreviewData( connection: Connection ) {
	const { isEnabled: usingPerNetworkCustomization } = usePerNetworkCustomization();
	const { mediaSource: globalMediaSource } = usePostMeta();

	const postData = useSocialPreviewPostData();
	const { message: globalMessage } = useSocialMediaMessage();
	const postId = useSelect(
		select => select( editorStore ).getCurrentPostId() as number | undefined,
		[]
	);
	const featuredImageId = useSelect( select =>
		select( editorStore ).getEditedPostAttribute( 'featured_media' )
	);
	const [ featuredImageDetails ] = useMediaDetails( featuredImageId );

	// Generate SIG preview if site has the feature and either:
	// - Connection is set to use SIG (per-network customization)
	// - Global media source is SIG (same for all mode)
	const generateSigPreview =
		siteHasFeature( features.IMAGE_GENERATOR ) &&
		( connection.media_source === 'sig' || globalMediaSource === 'sig' );

	const sig = useSigPreview( generateSigPreview );

	const isPerNetworkMode =
		siteHasFeature( features.ENHANCED_PUBLISHING ) && usingPerNetworkCustomization;

	const media = useMemo< PostPreviewData[ 'media' ] >( () => {
		if ( ! isPerNetworkMode ) {
			// In global mode, resolve SIG URL dynamically when attachment mode is on
			// so preview updates when template is edited.
			if ( globalMediaSource === 'sig' && sig.url && postData.media.length > 0 ) {
				return [ { url: sig.url, type: 'image/png' } ];
			}
			return postData.media;
		}

		switch ( connection.media_source ) {
			case 'featured-image':
				return featuredImageDetails?.mediaData?.sourceUrl
					? [
							{
								url: featuredImageDetails.mediaData.sourceUrl,
								type: featuredImageDetails.metaData.mime ?? 'image/jpeg',
							},
					  ]
					: [];
			case 'sig':
				return sig.url ? [ { url: sig.url, type: 'image/png' } ] : [];
			case 'none':
				return [];
			default:
				return connection.attached_media || [];
		}
	}, [
		connection.attached_media,
		connection.media_source,
		featuredImageDetails,
		globalMediaSource,
		isPerNetworkMode,
		postData.media,
		sig.url,
	] );

	const templatesEnabled = siteHasFeature( features.MESSAGE_TEMPLATES );
	const items = useRenderMessageItems();

	const rendered = useSelect(
		select => {
			if ( ! templatesEnabled || ! postId ) {
				return null;
			}
			// Calling getRenderedMessages via select() is what triggers the resolver
			// (and the POST). Picking the per-connection slice off the returned batch
			// keeps the call explicit instead of routing through a derived selector.
			const batch = select( socialStore ).getRenderedMessages( postId, items );
			return batch?.[ connection.connection_id ]?.rendered_message ?? null;
		},
		[ templatesEnabled, postId, items, connection.connection_id ]
	);

	return useMemo( () => {
		const useRendered = templatesEnabled && typeof rendered === 'string';
		const hasConnectionMessage = connection.message !== undefined && connection.message !== '';
		let baseMessage: string;
		if ( isPerNetworkMode ) {
			if ( hasConnectionMessage ) {
				baseMessage = connection.message ?? '';
			} else if ( templatesEnabled && connection.template ) {
				baseMessage = connection.template;
			} else {
				baseMessage = globalMessage;
			}
		} else {
			baseMessage = globalMessage;
		}

		return {
			...postData,
			message: useRendered ? rendered : baseMessage.trim(),
			media,
		};
	}, [
		connection.message,
		connection.template,
		globalMessage,
		isPerNetworkMode,
		media,
		postData,
		rendered,
		templatesEnabled,
	] );
}
