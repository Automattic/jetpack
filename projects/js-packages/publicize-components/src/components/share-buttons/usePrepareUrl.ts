import { useSelect } from '@wordpress/data';
import { useCallback } from 'react';

/**
 * Prepares the URL to share.
 *
 * @returns {(urlWithPlaceholders: string) => string} A function that accepts a URL with placeholders and returns a URL with the placeholders replaced.
 */
export function usePrepareUrl() {
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
		( urlWithPlaceholders: string ) => {
			let text = message;
			let url = link;
			// If the URL placeholder is missing, add the URL to the text.
			if ( ! urlWithPlaceholders.includes( '{{url}}' ) ) {
				text = text + '\n\n' + url;
				url = '';
			}

			return urlWithPlaceholders
				.replace( '{{text}}', encodeURIComponent( text ) )
				.replace( '{{url}}', encodeURIComponent( url ) );
		},
		[ link, message ]
	);
}
