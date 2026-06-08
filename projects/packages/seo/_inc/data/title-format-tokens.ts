// Token model for the post-title-structure editor. A title format is an ordered
// list of tokens — either a canonical placeholder (`site_name`) or a literal
// string fragment (a separator like " | "). The UI shows placeholders as
// bracketed pretty labels (`[Site name]`) so they're visually distinct from
// literal fragments; these helpers convert between the canonical model and that
// display form. Kept free of React/UI imports so the round-trip is unit-testable.

import { __ } from '@wordpress/i18n';
import type { TitleFormatToken } from './settings-types';

/**
 * Canonical tokens supported for the `posts` page type. Mirrors the back-end
 * list in Jetpack_SEO_Titles. Internal id stays snake_case for the REST
 * payload; the UI shows a friendly bracketed label.
 */
export const TOKEN_LABELS: Record< string, string > = {
	site_name: __( 'Site name', 'jetpack-seo' ),
	tagline: __( 'Tagline', 'jetpack-seo' ),
	post_title: __( 'Post title', 'jetpack-seo' ),
};

export const TOKEN_IDS = Object.keys( TOKEN_LABELS );

// Reverse map — "Site name" → "site_name" — to parse `[Site name]` back into
// the canonical id when the user picks a suggestion or pastes a label.
const LABEL_TO_TOKEN_ID: Record< string, string > = Object.fromEntries(
	TOKEN_IDS.map( id => [ TOKEN_LABELS[ id ], id ] )
);

/**
 * Render a token as its display string: bracketed pretty label for a known
 * placeholder, raw value for a literal string fragment.
 *
 * @param token - The canonical token.
 * @return The display string.
 */
export const toDisplay = ( token: TitleFormatToken ): string =>
	token.type === 'token' && TOKEN_LABELS[ token.value ]
		? `[${ TOKEN_LABELS[ token.value ] }]`
		: token.value;

/**
 * Parse a display string back into a canonical token. `[Known label]` becomes
 * the matching placeholder; anything else is a literal string fragment.
 *
 * @param display - The display string from the token field.
 * @return The canonical token.
 */
export const fromDisplay = ( display: string ): TitleFormatToken => {
	const match = display.match( /^\[(.+)\]$/ );
	const inner = match?.[ 1 ];
	if ( inner && LABEL_TO_TOKEN_ID[ inner ] ) {
		return { type: 'token', value: LABEL_TO_TOKEN_ID[ inner ] };
	}
	return { type: 'string', value: display };
};
