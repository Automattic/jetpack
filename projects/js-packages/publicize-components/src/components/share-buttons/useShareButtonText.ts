import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Prepares the text to share.
 *
 * @returns {(textWithPlaceholders: string, isUrl: boolean) => string} A function that accepts the text with placeholders and returns the text with the placeholders replaced.
 */
export function useShareButtonText() {
	const { message, link } = useSelect( select => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const getEditedPostAttribute = ( select( 'core/editor' ) as any )
			.getEditedPostAttribute satisfies ( attribute: string ) => unknown;

		return {
			link: getEditedPostAttribute( 'link' ),
			message:
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				( select( 'jetpack/publicize' ) as any ).getShareMessage() ||
				getEditedPostAttribute( 'meta' )?.jetpack_seo_html_title ||
				getEditedPostAttribute( 'title' ),
		};
	}, [] );

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
