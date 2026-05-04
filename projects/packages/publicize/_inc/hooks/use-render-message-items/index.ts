import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useSelect } from '@wordpress/data';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import { features } from '../../utils';
import useFeaturedImage from '../use-featured-image';
import useMediaDetails from '../use-media-details';
import { usePerNetworkCustomization } from '../use-per-network-customization';
import { usePostMeta } from '../use-post-meta';
import useSigPreview from '../use-sig-preview';
import useSocialMediaMessage from '../use-social-media-message';
import { useSocialPreviewPostData } from '../use-social-preview-post-data';
import type { RenderItem } from '../../utils/render-messages';

const MESSAGE_DEBOUNCE_MS = 1500;

/**
 * Whether a connection's preview will include media. Mirrors the media-presence
 * decision in `useConnectionPreviewData` but skips full media resolution since
 * we only need a boolean for `is_social_post`.
 *
 * @param connection            - The connection.
 * @param ctx                   - Context: see {@link useRenderMessageItems}.
 * @param ctx.isPerNetworkMode  - Whether per-network customization is on.
 * @param ctx.globalMediaSource - The global media source.
 * @param ctx.hasGlobalMedia    - Whether the global media list is non-empty.
 * @param ctx.hasFeaturedImage  - Whether the post has a featured image.
 * @param ctx.hasSigUrl         - Whether SIG produced a URL.
 * @return Whether this connection has media attached.
 */
function connectionHasMedia(
	connection: Connection,
	ctx: {
		isPerNetworkMode: boolean;
		globalMediaSource: string;
		hasGlobalMedia: boolean;
		hasFeaturedImage: boolean;
		hasSigUrl: boolean;
	}
): boolean {
	if ( ! ctx.isPerNetworkMode ) {
		if ( ctx.globalMediaSource === 'sig' ) {
			return ctx.hasSigUrl && ctx.hasGlobalMedia;
		}
		return ctx.hasGlobalMedia;
	}

	switch ( connection.media_source ) {
		case 'featured-image':
			return ctx.hasFeaturedImage;
		case 'sig':
			return ctx.hasSigUrl;
		case 'none':
			return false;
		default:
			return ( connection.attached_media?.length ?? 0 ) > 0;
	}
}

/**
 * Build the render-items array for every enabled connection, debounced so message
 * keystrokes don't fire a fresh batch per character.
 *
 * Item ordering is stable (matches the connection list ordering) so cache keys
 * stay stable across re-renders and across `useConnectionPreviewData` instances.
 *
 * Debounce semantics — preserved from the previous per-network hook: 1500ms when any
 * item's `message` string changes; 0ms (next tick) when only non-message inputs change
 * (network membership, `is_social_post`).
 *
 * @return The debounced items array, ready to feed to `getRenderedMessages`.
 */
export function useRenderMessageItems(): RenderItem[] {
	const templatesEnabled = siteHasFeature( features.MESSAGE_TEMPLATES );

	// All connections (not just enabled ones) — the per-connection customization
	// editor is visible for the focused tab regardless of toggle state, so editing
	// a disabled connection's message must still update the items array. Including
	// disabled connections also keeps their preview cached for instant display when
	// the user re-enables them.
	const connections = useSelect(
		select => ( templatesEnabled ? select( socialStore ).getConnections() : [] ),
		[ templatesEnabled ]
	);

	const { isEnabled: isPerNetworkMode } = usePerNetworkCustomization();
	const { mediaSource: globalMediaSource } = usePostMeta();
	const postData = useSocialPreviewPostData();
	const { message: globalMessage } = useSocialMediaMessage();

	const featuredImageId = useFeaturedImage();
	const [ featuredImageDetails ] = useMediaDetails( featuredImageId );

	const generateSigPreview =
		siteHasFeature( features.IMAGE_GENERATOR ) &&
		( globalMediaSource === 'sig' || connections.some( c => c.media_source === 'sig' ) );

	const sig = useSigPreview( generateSigPreview );

	const ctx = useMemo(
		() => ( {
			isPerNetworkMode,
			globalMediaSource: globalMediaSource ?? '',
			hasGlobalMedia: postData.media.length > 0,
			hasFeaturedImage: Boolean( featuredImageDetails?.mediaData?.sourceUrl ),
			hasSigUrl: Boolean( sig.url ),
		} ),
		[
			isPerNetworkMode,
			globalMediaSource,
			postData.media.length,
			featuredImageDetails?.mediaData?.sourceUrl,
			sig.url,
		]
	);

	const items = useMemo< RenderItem[] >( () => {
		return connections.map( connection => {
			const message = ( connection.message ?? globalMessage ?? '' ).trim();
			return {
				id: connection.connection_id,
				network: connection.service_name ?? '',
				message,
				is_social_post: connectionHasMedia( connection, ctx ),
			};
		} );
	}, [ connections, globalMessage, ctx ] );

	return useDebouncedItems( items );
}

/**
 * Fingerprint just the messages so the debounce decision only fires for actual text edits.
 * Using JSON.stringify on the array form (rather than join) makes ["a","b"] and ["ab"]
 * fingerprint distinctly, regardless of what characters appear inside messages.
 *
 * @param items - Items whose messages we want to fingerprint.
 * @return Stable string fingerprint of the messages.
 */
function hashMessages( items: RenderItem[] ): string {
	return JSON.stringify( items.map( i => i.message ?? '' ) );
}

/**
 * Hold back updates to `items` while messages are mid-edit; pass through immediately
 * for non-message changes so tab toggles, media changes, etc. update without delay.
 *
 * @param items - The latest items array.
 * @return The debounced items array.
 */
function useDebouncedItems( items: RenderItem[] ): RenderItem[] {
	const [ debounced, setDebounced ] = useState( items );
	const prevMessagesRef = useRef( hashMessages( items ) );

	useEffect( () => {
		const currentMessages = hashMessages( items );
		const hasMessageChange = currentMessages !== prevMessagesRef.current;
		prevMessagesRef.current = currentMessages;

		if ( ! hasMessageChange ) {
			setDebounced( items );
			return;
		}

		const handle = setTimeout( () => setDebounced( items ), MESSAGE_DEBOUNCE_MS );
		return () => clearTimeout( handle );
	}, [ items ] );

	return debounced;
}
