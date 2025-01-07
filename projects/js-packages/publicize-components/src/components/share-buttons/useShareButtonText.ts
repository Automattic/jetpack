import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { usePostMeta } from '../../hooks/use-post-meta';

/**
 * Prepares the text to share.
 *
 * @return {(textWithPlaceholders: string, isUrl: boolean) => string} A function that accepts the text with placeholders and returns the text with the placeholders replaced.
 */
export function useShareButtonText() {
	const { shareMessage } = usePostMeta();
	const { message, link } = useSelect(
		select => {
			const { getEditedPostAttribute } = select( editorStore );

			return {
				link: getEditedPostAttribute( 'link' ),
				message:
					shareMessage ||
					getEditedPostAttribute( 'meta' )?.jetpack_seo_html_title ||
					getEditedPostAttribute( 'title' ),
			};
		},
		[ shareMessage ]
	);

	return useCallback(
		( textWithPlaceholders: string, isUrl = true ) => {
			let text = message;
			let url = link;
			// If the URL placeholder is missing, add the URL to the text.
			if ( ! textWithPlaceholders.includes( '{{url}}' ) ) {
				text = text + '\n\n' + url;
				url = '';
			}

			if ( isUrl ) {
				text = encodeURIComponent( text );
				url = encodeURIComponent( url );
			}

			return textWithPlaceholders.replace( '{{text}}', text ).replace( '{{url}}', url );
		},
		[ link, message ]
	);
}
