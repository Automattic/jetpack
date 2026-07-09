import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { useManualShareMessage } from '../../hooks/use-manual-share-message';
import { usePostMeta } from '../../hooks/use-post-meta';
import { features } from '../../utils';

/**
 * Prepares the text to share.
 *
 * @return {(textWithPlaceholders: string, isUrl: boolean) => string} A function that accepts the text with placeholders and returns the text with the placeholders replaced.
 */
export function useShareButtonText() {
	const templatesEnabled = siteHasFeature( features.MESSAGE_TEMPLATES );
	const { shareMessage } = usePostMeta();
	const manual = useManualShareMessage();

	const { link, titleFallback } = useSelect( select => {
		const { getEditedPostAttribute } = select( editorStore );

		return {
			link: getEditedPostAttribute( 'link' ),
			// Token-free fallback shared by both branches: SEO title, else post title.
			titleFallback:
				getEditedPostAttribute( 'meta' )?.jetpack_seo_html_title ||
				getEditedPostAttribute( 'title' ),
		};
	}, [] );

	// With templates on, use the WPCOM-rendered message when available, else fall
	// back to the token-free title while it loads or if it's unavailable — never
	// the raw `shareMessage` template, which would leak `{title}`/`{url}`/etc.
	// tokens into the compose window. With templates off, behaviour is unchanged.
	const message = templatesEnabled
		? manual.message ?? titleFallback
		: shareMessage || titleFallback;

	return useCallback(
		( textWithPlaceholders: string, isUrl = true ) => {
			let text = message;
			let url = link;

			const hasTextSlot = textWithPlaceholders.includes( '{{text}}' );
			const hasUrlSlot = textWithPlaceholders.includes( '{{url}}' );

			if ( hasTextSlot && link && text.includes( link ) ) {
				// The message is placed into the text and already carries the post URL
				// (from the `{url}` token), so leave the url slot empty to avoid
				// duplicating the link.
				url = '';
			} else if ( ! hasUrlSlot ) {
				// No url slot to fill (e.g. WhatsApp/clipboard-text) — fold the URL
				// into the text instead.
				text = text + '\n\n' + url;
				url = '';
			}
			// Otherwise keep the url slot (e.g. Facebook, which has no text slot, or
			// the title fallback where the text doesn't contain the link).

			if ( isUrl ) {
				text = encodeURIComponent( text );
				url = encodeURIComponent( url );
			}

			return textWithPlaceholders.replaceAll( '{{text}}', text ).replaceAll( '{{url}}', url );
		},
		[ link, message ]
	);
}
