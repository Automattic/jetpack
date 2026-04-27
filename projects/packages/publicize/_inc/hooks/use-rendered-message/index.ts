import apiFetch from '@wordpress/api-fetch';
import { useEffect, useRef, useState } from '@wordpress/element';

interface UseRenderedMessageOptions {
	/**
	 * Whether template rendering is enabled. When false, the hook short-circuits
	 * and never fires a request.
	 */
	enabled: boolean;
	/**
	 * The ID of the post being previewed.
	 */
	postId: number;
	/**
	 * The social network slug (e.g. `x`, `facebook`). Passed through to the
	 * backend so it can pick the right default template and resolve `{network}`.
	 */
	network: string;
	/**
	 * The message template to render. Empty string tells the backend to use the
	 * per-network default template.
	 */
	message: string;
	/**
	 * Whether the post will be shared as a social post (media attached) rather
	 * than a link share. The backend uses this to pick the right rendering path
	 * — most notably, whether to inline the URL in the rendered template.
	 */
	isSocialPost: boolean;
	/**
	 * Optional character limit override. When provided, sent as `char_limit` so
	 * the backend's priority-based stripping renders within this cap. When
	 * omitted, the backend uses each network's default CHAR_LIMIT.
	 */
	charLimit?: number;
}

interface UseRenderedMessageResult {
	rendered: string | null;
	isLoading: boolean;
}

/**
 * Debounced hook that renders a Publicize message template via the
 * `wpcom/v2/publicize/render-message` endpoint so the preview matches what will
 * actually be published when the `social-message-templates` feature is on.
 *
 * On error or abort the previously-rendered value is kept so the preview does
 * not flash between keystrokes.
 *
 * @param options              - Input options.
 * @param options.enabled      - Whether template rendering is enabled.
 * @param options.postId       - Post ID to render the template against.
 * @param options.network      - Social network slug (e.g. `x`, `facebook`).
 * @param options.message      - Message template to render; empty uses the per-network default.
 * @param options.isSocialPost - Whether the post is shared as a social post (media attached) vs. a link share.
 * @param options.charLimit    - Optional character limit override; sent as `char_limit` when provided.
 * @return The rendered message and loading state.
 */
export default function useRenderedMessage( {
	enabled,
	postId,
	network,
	message,
	isSocialPost,
	charLimit,
}: UseRenderedMessageOptions ): UseRenderedMessageResult {
	const [ rendered, setRendered ] = useState< string | null >( null );
	const [ isLoading, setIsLoading ] = useState( false );

	const previousMessageRef = useRef( message );
	const enabledRef = useRef( enabled );
	enabledRef.current = enabled;

	useEffect( () => {
		if ( ! enabled || ! postId || ! network ) {
			return;
		}

		const controller = new AbortController();
		const isStringChange = message !== previousMessageRef.current;

		const handler = setTimeout(
			async () => {
				setIsLoading( true );

				try {
					const response = await apiFetch< { rendered_message: string } >( {
						path: 'wpcom/v2/publicize/render-message',
						method: 'POST',
						data: {
							post_id: postId,
							network,
							message,
							is_social_post: isSocialPost,
							...( charLimit ? { char_limit: charLimit } : {} ),
						},
						signal: controller.signal,
					} );

					if ( ! enabledRef.current ) {
						return;
					}

					setRendered( response?.rendered_message ?? '' );
				} catch {
					// Keep the previous rendered value on error/abort to avoid
					// flashing the preview between keystrokes.
				} finally {
					if ( ! controller.signal.aborted ) {
						setIsLoading( false );
					}
				}
			},
			isStringChange ? 1500 : 0
		);

		return () => {
			clearTimeout( handler );
			controller.abort();
			previousMessageRef.current = message;
		};
	}, [ enabled, postId, network, message, isSocialPost, charLimit ] );

	return {
		rendered: enabled ? rendered : null,
		isLoading: enabled && isLoading,
	};
}
