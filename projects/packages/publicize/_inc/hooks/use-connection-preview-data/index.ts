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
	const baseMessage = (
		isPerNetworkMode ? connection.message ?? globalMessage : globalMessage
	).trim();
	const currentRenderItem = items.find( item => item.id === connection.connection_id );

	const { rendered, isResolvingRenderedMessages, hasFinishedRenderingMessages } = useSelect(
		select => {
			if ( ! templatesEnabled || ! postId ) {
				return {
					rendered: null,
					isResolvingRenderedMessages: false,
					hasFinishedRenderingMessages: true,
				};
			}
			// Read from the cache-only selector so this hook does not trigger requests.
			// Fetches are driven centrally by `useDriveRenderedMessagesFetch`, which keeps
			// request timing debounced while still exposing loading state here.
			const social = select( socialStore );
			const batch = social.getCachedRenderedMessages( postId, items );

			return {
				rendered: batch?.[ connection.connection_id ]?.rendered_message ?? null,
				isResolvingRenderedMessages: social.isResolving( 'getRenderedMessages', [ postId, items ] ),
				hasFinishedRenderingMessages: social.hasFinishedResolution( 'getRenderedMessages', [
					postId,
					items,
				] ),
			};
		},
		[ templatesEnabled, postId, items, connection.connection_id ]
	);

	return useMemo( () => {
		const useRendered = templatesEnabled && typeof rendered === 'string';
		const hasCurrentRenderItem = currentRenderItem?.message !== undefined;
		const isDebouncingRenderedMessage =
			templatesEnabled &&
			baseMessage.length > 0 &&
			hasCurrentRenderItem &&
			currentRenderItem.message !== baseMessage;
		const isWaitingForRenderedMessage =
			templatesEnabled &&
			baseMessage.length > 0 &&
			hasCurrentRenderItem &&
			currentRenderItem.message === baseMessage &&
			! useRendered &&
			! hasFinishedRenderingMessages;
		const isLoading =
			templatesEnabled &&
			!! postId &&
			baseMessage.length > 0 &&
			items.length > 0 &&
			( isResolvingRenderedMessages || isDebouncingRenderedMessage || isWaitingForRenderedMessage );

		return {
			...postData,
			message: useRendered ? rendered : baseMessage,
			media,
			isLoading,
		};
	}, [
		baseMessage,
		currentRenderItem?.message,
		hasFinishedRenderingMessages,
		isResolvingRenderedMessages,
		items.length,
		media,
		postId,
		postData,
		rendered,
		templatesEnabled,
	] );
}
