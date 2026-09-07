import { siteHasFeature } from '@automattic/jetpack-script-data';
import { parseHyperlinks, type Hyperlink } from '@automattic/social-previews';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useMemo, useRef } from 'react';
import { store as socialStore } from '../../social-store';
import { features, hasSocialPaidFeatures } from '../../utils';
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
	/**
	 * Source-aware editor hyperlinks for this connection's rendered message.
	 * Paid previews use the server result; legacy Bluesky previews mirror the
	 * default title + excerpt assembly locally.
	 */
	hyperlinks: Hyperlink[];
	isLoading: boolean;
};

/**
 * Shared empty array so the `useSelect` map keeps returning shallow-equal
 * output when a connection has no hyperlinks — a fresh `[]` would re-render
 * every preview on each social-store dispatch.
 */
const EMPTY_HYPERLINKS: Hyperlink[] = [];

const WORD_CHARACTER = /[\p{L}\p{M}\p{N}_]/u;

/**
 * Count text occurrences, including overlapping matches.
 *
 * @param message - Text to search.
 * @param text    - Phrase to find.
 * @return Number of occurrences.
 */
function countTextOccurrences( message: string, text: string ): number {
	let count = 0;
	let offset = 0;

	while ( text && ( offset = message.indexOf( text, offset ) ) >= 0 ) {
		count++;
		offset++;
	}

	return count;
}

/**
 * Whether text appears as a standalone phrase, rather than inside a larger word.
 *
 * @param message - Text to search.
 * @param text    - Phrase to find.
 * @return Whether the phrase has a standalone occurrence.
 */
function containsStandaloneText( message: string, text: string ): boolean {
	const first = text.match( /^./u )?.[ 0 ] ?? '';
	const last = text.match( /.$/u )?.[ 0 ] ?? '';
	let offset = 0;

	while ( offset < message.length ) {
		const index = message.indexOf( text, offset );
		if ( index < 0 ) {
			return false;
		}

		const before = message.slice( 0, index ).match( /.$/u )?.[ 0 ] ?? '';
		const after = message.slice( index + text.length ).match( /^./u )?.[ 0 ] ?? '';
		if (
			( ! WORD_CHARACTER.test( first ) || ! WORD_CHARACTER.test( before ) ) &&
			( ! WORD_CHARACTER.test( last ) || ! WORD_CHARACTER.test( after ) )
		) {
			return true;
		}

		offset = index + 1;
	}

	return false;
}

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

	const isPerNetworkMode = hasSocialPaidFeatures() && usingPerNetworkCustomization;

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

	const templatesEnabled = hasSocialPaidFeatures();
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
	const legacyHyperlinkSource = useSelect(
		select => {
			if ( templatesEnabled || connection.service_name !== 'bluesky' ) {
				return '';
			}

			const { getEditedPostAttribute } = select( editorStore );
			const content = ( getEditedPostAttribute( 'content' ) || '' ).split( '<!--more' )[ 0 ];

			return getEditedPostAttribute( 'excerpt' ) || content;
		},
		[ templatesEnabled, connection.service_name ]
	);
	const legacyHyperlinks = useMemo(
		() =>
			baseMessage || ! legacyHyperlinkSource
				? EMPTY_HYPERLINKS
				: parseHyperlinks( legacyHyperlinkSource )
						.filter( ( { text } ) => ! containsStandaloneText( postData.title, text ) )
						.map( hyperlink => ( {
							...hyperlink,
							occurrence:
								( hyperlink.occurrence ?? 0 ) +
								countTextOccurrences( postData.title, hyperlink.text ),
						} ) ),
		[ baseMessage, legacyHyperlinkSource, postData.title ]
	);
	const currentRenderItem = items.find( item => item.connection_id === connection.connection_id );

	const { rendered, renderedHyperlinks, isLoadingRendered } = useSelect(
		select => {
			if ( ! templatesEnabled || ! postId ) {
				return { rendered: null, renderedHyperlinks: EMPTY_HYPERLINKS, isLoadingRendered: false };
			}
			// Read from the cache-only selector so this hook does not trigger requests.
			// Fetches are driven centrally by `useDriveRenderedMessagesFetch`.
			const social = select( socialStore );
			const batch = social.getCachedRenderedMessages( postId, items, postIntent );

			return {
				rendered: batch?.[ connection.connection_id ]?.rendered_message ?? null,
				renderedHyperlinks: batch?.[ connection.connection_id ]?.hyperlinks ?? EMPTY_HYPERLINKS,
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

	// Last rendered message for this connection, kept across cache-key changes
	// (e.g. title/excerpt edits) so a pending re-render keeps showing rendered
	// text instead of flashing the raw template or a skeleton.
	const lastRenderedRef = useRef< {
		connectionId: string;
		message: string;
		hyperlinks: Hyperlink[];
	} | null >( null );
	if ( templatesEnabled && typeof rendered === 'string' ) {
		lastRenderedRef.current = {
			connectionId: connection.connection_id,
			message: rendered,
			hyperlinks: renderedHyperlinks,
		};
	}
	const lastRendered =
		lastRenderedRef.current?.connectionId === connection.connection_id
			? lastRenderedRef.current
			: null;

	return useMemo( () => {
		const isPending = templatesEnabled && ( isDebouncingRenderedMessage || isLoadingRendered );

		// The raw template (with `{title}`-style placeholders) may only show once
		// rendering has settled without ever producing a result — e.g. templates
		// disabled, or the request failed. While pending, fall back to the last
		// rendered message, or to the skeleton (`isLoading`) when there is none.
		let message = baseMessage;
		let hyperlinks: Hyperlink[] = legacyHyperlinks;
		if ( templatesEnabled && typeof rendered === 'string' ) {
			message = rendered;
			hyperlinks = renderedHyperlinks;
		} else if ( lastRendered !== null ) {
			message = lastRendered.message;
			hyperlinks = lastRendered.hyperlinks;
		} else if ( isPending ) {
			message = '';
		}

		return {
			...postData,
			message,
			hyperlinks,
			media,
			isLoading: isPending && message === '',
		};
	}, [
		baseMessage,
		isDebouncingRenderedMessage,
		isLoadingRendered,
		lastRendered,
		legacyHyperlinks,
		media,
		postData,
		rendered,
		renderedHyperlinks,
		templatesEnabled,
	] );
}
