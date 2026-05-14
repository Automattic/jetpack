import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useMemo } from 'react';
import { store as socialStore } from '../../social-store';
import { features } from '../../utils';
import useMediaDetails from '../use-media-details';
import { usePerNetworkCustomization } from '../use-per-network-customization';
import { usePostMeta } from '../use-post-meta';
import { useRenderMessageInputs } from '../use-render-message-items';
import useSigPreview from '../use-sig-preview';
import useSocialMediaMessage from '../use-social-media-message';
import { useSocialPreviewPostData } from '../use-social-preview-post-data';
import type { Connection } from '../../social-store/types';
import type { PostPreviewData } from '../use-social-preview-post-data/types';

export type ConnectionPreviewData = PostPreviewData & {
	message: string;
	isLoading: boolean;
};

/**
 * Returns the post data needed for the preview of a specific connection.
 *
 * @param {Connection} connection - The connection.
 * @return The post data.
 */
export function useConnectionPreviewData( connection: Connection ): ConnectionPreviewData {
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
	const { items, postIntent } = useRenderMessageInputs();
	const siteMessageTemplate = useSelect(
		select =>
			templatesEnabled ? select( socialStore ).getSocialSettings().messageTemplate ?? '' : '',
		[ templatesEnabled ]
	);
	/*
	 * Mirror `useRenderMessageItems` exactly: in per-network mode fall back to
	 * the saved site template (not `globalMessage`) when the connection has no
	 * per-post override; in global mode use `globalMessage`. Keeping this
	 * identical to the items array's rule ensures `currentRenderItem.message`
	 * matches `baseMessage` and `isDebouncingRenderedMessage` doesn't stay
	 * stuck true.
	 */
	const baseMessage = (
		isPerNetworkMode ? connection.message ?? siteMessageTemplate : globalMessage
	).trim();
	const currentRenderItem = items.find( item => item.connection_id === connection.connection_id );

	const { rendered, isLoadingRendered } = useSelect(
		select => {
			if ( ! templatesEnabled || ! postId ) {
				return { rendered: null, isLoadingRendered: false };
			}
			// Read from the cache-only selector so this hook does not trigger requests.
			// Fetches are driven centrally by `useDriveRenderedMessagesFetch`.
			const social = select( socialStore );
			const batch = social.getCachedRenderedMessages( postId, items, postIntent );

			return {
				rendered: batch?.[ connection.connection_id ]?.rendered_message ?? null,
				isLoadingRendered: social.isLoadingRenderedMessages( postId, items, postIntent ),
			};
		},
		[ templatesEnabled, postId, items, postIntent, connection.connection_id ]
	);

	// True while the user has typed but the debounced items array hasn't caught
	// up yet — the store doesn't see edits until items are committed, so the
	// consumer has to compute this itself.
	const isDebouncingRenderedMessage =
		templatesEnabled &&
		baseMessage.length > 0 &&
		currentRenderItem?.message !== undefined &&
		currentRenderItem.message !== baseMessage;

	return useMemo( () => {
		const useRendered = templatesEnabled && typeof rendered === 'string';
		const isLoading = templatesEnabled && ( isDebouncingRenderedMessage || isLoadingRendered );

		return {
			...postData,
			message: useRendered ? rendered : baseMessage,
			media,
			isLoading,
		};
	}, [
		baseMessage,
		isDebouncingRenderedMessage,
		isLoadingRendered,
		media,
		postData,
		rendered,
		templatesEnabled,
	] );
}
