import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useRegistry, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
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
import type { RenderItem, RenderPostIntent } from '../../utils/render-messages';

const MESSAGE_DEBOUNCE_MS = 1500;
const EMPTY_POST_INTENT: RenderPostIntent = {};

/**
 * Normalize editor values before sending them to the render endpoint.
 *
 * @param value - Edited post field value.
 * @return Normalized string value.
 */
function normalizePostIntentValue( value: unknown ): string {
	if ( typeof value === 'string' ) {
		return value;
	}

	return value === undefined || value === null ? '' : String( value );
}

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
 * Debounce semantics: 1500ms when any template text input changes (`message` or
 * edited post intent); 0ms (next tick) when only non-text inputs change
 * (network membership, `is_social_post`).
 *
 * @return The debounced items array, ready to feed to `getRenderedMessages`.
 */
export function useRenderMessageItems(): RenderItem[] {
	return useRenderMessageInputs().items;
}

/**
 * Read the edited post fields (title/excerpt/content) sent to the render
 * endpoint, un-debounced. Feature-gated so consumers get a stable empty object
 * when message templates are off.
 *
 * Deliberately free of the connection/media/SIG plumbing in
 * `useRenderMessageInputs`, so lightweight consumers (e.g. the manual-share
 * buttons) can read the post intent without mounting any of that machinery.
 *
 * @return The current post intent.
 */
export function usePostIntent(): RenderPostIntent {
	const templatesEnabled = siteHasFeature( features.MESSAGE_TEMPLATES );

	return useSelect(
		select => {
			if ( ! templatesEnabled ) {
				return EMPTY_POST_INTENT;
			}

			const { getEditedPostAttribute } = select( editorStore );

			return {
				title: normalizePostIntentValue( getEditedPostAttribute( 'title' ) ),
				excerpt: normalizePostIntentValue( getEditedPostAttribute( 'excerpt' ) ),
				content: normalizePostIntentValue( getEditedPostAttribute( 'content' ) ),
			};
		},
		[ templatesEnabled ]
	) as RenderPostIntent;
}

/**
 * Build the debounced render request inputs for rendered-message preview.
 *
 * @return The debounced render inputs.
 */
export function useRenderMessageInputs(): {
	items: RenderItem[];
	postIntent: RenderPostIntent;
} {
	const templatesEnabled = siteHasFeature( features.MESSAGE_TEMPLATES );

	// All connections (not just enabled ones) — the per-connection customization
	// editor is visible for the focused tab regardless of toggle state, so editing
	// a disabled connection's message must still update the items array. Including
	// disabled connections also keeps their preview cached for instant display when
	// the user re-enables them.
	const { connections, siteMessageTemplate } = useSelect(
		select => {
			if ( ! templatesEnabled ) {
				return { connections: [], siteMessageTemplate: '' };
			}
			const store = select( socialStore );
			return {
				connections: store.getConnections(),
				siteMessageTemplate: store.getSocialSettings().messageTemplate ?? '',
			};
		},
		[ templatesEnabled ]
	);

	const { isEnabled: isPerNetworkMode } = usePerNetworkCustomization();
	const { mediaSource: globalMediaSource } = usePostMeta();
	const postData = useSocialPreviewPostData();
	const { message: globalMessage } = useSocialMediaMessage();
	const postIntent = usePostIntent();

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
			/*
			 * Mirror the form's rule in `per-network.tsx`: in per-network mode,
			 * fall back to the saved site template (not `globalMessage` /
			 * `_wpas_mess`) when the connection has no per-post override and
			 * no connection-template default.
			 */
			const raw = ctx.isPerNetworkMode ? connection.message ?? siteMessageTemplate : globalMessage;
			return {
				connection_id: connection.connection_id,
				message: raw.trim(),
				is_social_post: connectionHasMedia( connection, ctx ),
			};
		} );
	}, [ connections, globalMessage, siteMessageTemplate, ctx ] );

	const inputs = useMemo( () => ( { items, postIntent } ), [ items, postIntent ] );

	return useDebouncedRenderInputs( inputs );
}

/**
 * Drive the rendered-messages fetch from a layer that's mounted regardless of
 * which (if any) tab is currently focused. Without this, switching to a
 * disabled-connection tab — where `<PostPreview>` doesn't mount and therefore
 * doesn't read the selector — would leave the resolver untriggered, so editing
 * the message there wouldn't fire a request.
 *
 * Mount in a parent that's always present while the customize-and-preview UI
 * is open (e.g. `<TabPanelWrapper>`).
 */
export function useDriveRenderedMessagesFetch(): void {
	const { items, postIntent } = useRenderMessageInputs();
	const registry = useRegistry();
	const postId = useSelect(
		select => select( editorStore ).getCurrentPostId() as number | undefined,
		[]
	);

	useEffect( () => {
		if ( ! postId || items.length === 0 ) {
			return;
		}

		void registry
			.resolveSelect( socialStore )
			.getRenderedMessages( postId, items, postIntent )
			// Errors are intentionally swallowed to preserve existing UI behavior.
			.catch( () => {} );
	}, [ items, postId, postIntent, registry ] );
}

/**
 * Fingerprint just the rendered text inputs so the debounce decision only fires
 * for edits that affect template output.
 * Using JSON.stringify on the array form (rather than join) makes ["a","b"] and ["ab"]
 * fingerprint distinctly, regardless of what characters appear inside values.
 *
 * @param items      - Items whose rendered text inputs we want to fingerprint.
 * @param postIntent - Edited post fields included in rendering.
 * @return Stable string fingerprint of the rendered text inputs.
 */
function hashMessages( items: RenderItem[], postIntent: RenderPostIntent ): string {
	return JSON.stringify( [
		items.map( i => i.message ?? '' ),
		postIntent.title ?? '',
		postIntent.excerpt ?? '',
		postIntent.content ?? '',
	] );
}

/**
 * Hold back updates to `items` while messages are mid-edit; pass through immediately
 * for non-message changes so tab toggles, media changes, etc. update without delay.
 *
 * `items` and `postIntent` are committed together as one snapshot, so consumers'
 * cache keys never mix a fresh items array with a stale post intent (or vice
 * versa). Exported for consumers that build their own items array (e.g. the
 * manual-share sentinel item) and need the same debounce semantics.
 *
 * @param inputs            - The latest render inputs.
 * @param inputs.items      - The latest item batch.
 * @param inputs.postIntent - The latest edited post fields.
 * @return The debounced render inputs.
 */
export function useDebouncedRenderInputs( inputs: {
	items: RenderItem[];
	postIntent: RenderPostIntent;
} ): {
	items: RenderItem[];
	postIntent: RenderPostIntent;
} {
	const [ debounced, setDebounced ] = useState( inputs );
	const committedMessagesRef = useRef( hashMessages( inputs.items, inputs.postIntent ) );

	useEffect( () => {
		// Track the last committed (emitted) message fingerprint, not the latest input.
		// This avoids flushing pending message edits early on unrelated re-renders.
		committedMessagesRef.current = hashMessages( debounced.items, debounced.postIntent );
	}, [ debounced ] );

	useEffect( () => {
		const currentMessages = hashMessages( inputs.items, inputs.postIntent );
		const hasMessageChange = currentMessages !== committedMessagesRef.current;

		if ( ! hasMessageChange ) {
			setDebounced( inputs );
			return;
		}

		const handle = setTimeout( () => setDebounced( inputs ), MESSAGE_DEBOUNCE_MS );
		return () => clearTimeout( handle );
	}, [ inputs ] );

	return debounced;
}
