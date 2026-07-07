import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useRegistry, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { store as socialStore } from '../../social-store';
import { features } from '../../utils';
import { MANUAL_SHARE_SENTINEL, type RenderItem } from '../../utils/render-messages';
import { useRenderMessageInputs } from '../use-render-message-items';
import useSocialMediaMessage from '../use-social-media-message';

// Keep in step with `useRenderMessageInputs`'s debounce so a template edit and a
// post-intent edit settle on the same cadence.
const MESSAGE_DEBOUNCE_MS = 1500;

export type ManualShareMessage = {
	message: string | null;
	isLoading: boolean;
};

/**
 * Debounce a string value, mirroring the message debounce used by
 * `useRenderMessageInputs`, so typing in the global message field doesn't fire a
 * render request per keystroke. Initialises to the current value so the first
 * render (and tests) see the settled value immediately.
 *
 * @param value - The value to debounce.
 * @param delay - Debounce delay in milliseconds.
 * @return The debounced value.
 */
function useDebouncedValue( value: string, delay: number = MESSAGE_DEBOUNCE_MS ): string {
	const [ debounced, setDebounced ] = useState( value );

	useEffect( () => {
		const handle = setTimeout( () => setDebounced( value ), delay );
		return () => clearTimeout( handle );
	}, [ value, delay ] );

	return debounced;
}

/**
 * Resolve the WPCOM-rendered global message for the manual-sharing buttons.
 *
 * The manual-share buttons are the one sharing path that historically dropped the
 * raw single-brace template (`{title}` …) straight into the compose window instead
 * of the server-rendered text. This hook renders the global template through the
 * same `wpcom/v2/publicize/render-messages` endpoint the preview panel and
 * auto-share use, so the buttons can show finished text.
 *
 * Because manual sharing can exist with zero connections, we render a dedicated
 * single item under the {@link MANUAL_SHARE_SENTINEL} `connection_id` rather than
 * piggy-backing on a connection's render item.
 *
 * @return `{ message, isLoading }`. `message` is the rendered text when available,
 * otherwise `null` (never the raw template) so the consumer can fall back to a
 * token-free post title. When the templates feature is off, or there is no
 * template, returns `{ message: null, isLoading: false }`.
 */
export function useManualShareMessage(): ManualShareMessage {
	const templatesEnabled = siteHasFeature( features.MESSAGE_TEMPLATES );
	const registry = useRegistry();

	const { message: globalMessage } = useSocialMediaMessage();

	const { siteMessageTemplate, postId } = useSelect(
		select => ( {
			siteMessageTemplate: templatesEnabled
				? select( socialStore ).getSocialSettings().messageTemplate ?? ''
				: '',
			postId: select( editorStore ).getCurrentPostId() as number | undefined,
		} ),
		[ templatesEnabled ]
	);

	// Prefer the per-post global message (`_wpas_mess`), else the saved site
	// template — matching what the preview panel renders for the global message.
	const template = ( globalMessage || siteMessageTemplate || '' ).trim();
	const debouncedTemplate = useDebouncedValue( template );

	// Reuse the already-debounced post intent (title/excerpt/content) so the cache
	// key matches the shape the render endpoint receives, rather than re-deriving it.
	const { postIntent } = useRenderMessageInputs();

	const items = useMemo< RenderItem[] >(
		() => [
			{
				connection_id: MANUAL_SHARE_SENTINEL,
				message: debouncedTemplate,
				// Manual sharing is a link share, not a media/social post.
				is_social_post: false,
			},
		],
		[ debouncedTemplate ]
	);

	const canRender = templatesEnabled && Boolean( postId ) && debouncedTemplate.length > 0;

	// The sidebar / post-publish panels don't mount `useDriveRenderedMessagesFetch`,
	// so drive the fetch ourselves. Errors are swallowed to preserve the fallback.
	useEffect( () => {
		if ( ! canRender || ! postId ) {
			return;
		}

		void registry
			.resolveSelect( socialStore )
			.getRenderedMessages( postId, items, postIntent )
			.catch( () => {} );
	}, [ canRender, postId, items, postIntent, registry ] );

	const { rendered, isLoadingRendered } = useSelect(
		select => {
			if ( ! canRender || ! postId ) {
				return { rendered: null, isLoadingRendered: false };
			}
			// Cache-only read; the effect above owns fetching.
			const social = select( socialStore );
			const batch = social.getCachedRenderedMessages( postId, items, postIntent );

			return {
				rendered: batch?.[ MANUAL_SHARE_SENTINEL ]?.rendered_message ?? null,
				isLoadingRendered: social.isLoadingRenderedMessages( postId, items, postIntent ),
			};
		},
		[ canRender, postId, items, postIntent ]
	);

	// True while the user has typed but the debounce hasn't committed the new
	// template yet — the store can't see the edit until then. Mirrors the
	// `isDebouncingRenderedMessage` flag in `useConnectionPreviewData`.
	const isDebouncing = templatesEnabled && template.length > 0 && debouncedTemplate !== template;

	return useMemo( () => {
		if ( ! templatesEnabled || template.length === 0 ) {
			return { message: null, isLoading: false };
		}

		return {
			message: typeof rendered === 'string' ? rendered : null,
			isLoading: isDebouncing || isLoadingRendered,
		};
	}, [ templatesEnabled, template, rendered, isDebouncing, isLoadingRendered ] );
}
