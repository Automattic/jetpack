// Token model for the title-structure editors. A title format is an ordered
// list of tokens — either a canonical placeholder (`site_name`) or a literal
// string fragment (a separator like " | "). Each page type (front page, posts,
// pages, tags, archives) accepts its own subset of placeholders, mirroring the
// back-end whitelist in `Jetpack_SEO_Titles::get_allowed_tokens()`. The UI shows
// placeholders as bracketed pretty labels (`[Site name]`) so they're visually
// distinct from literal fragments; these helpers convert between the canonical
// model and that display form. Kept free of React/UI imports so the round-trip
// and preview are unit-testable.

import { __ } from '@wordpress/i18n';
import type { TitleFormatToken } from './settings-types';

/**
 * Friendly labels for every canonical token, across all page types. Internal
 * ids stay snake_case for the REST payload; the UI shows the bracketed label.
 * Mirrors the token names in `Jetpack_SEO_Titles`.
 */
export const TOKEN_LABELS: Record< string, string > = {
	site_name: __( 'Site name', 'jetpack-seo' ),
	tagline: __( 'Tagline', 'jetpack-seo' ),
	post_title: __( 'Post title', 'jetpack-seo' ),
	page_title: __( 'Page title', 'jetpack-seo' ),
	group_title: __( 'Tag or category name', 'jetpack-seo' ),
	date: __( 'Date', 'jetpack-seo' ),
	archive_title: __( 'Archive title', 'jetpack-seo' ),
};

export const TOKEN_IDS = Object.keys( TOKEN_LABELS );

/**
 * The page types the SEO title structure can be customized for, in display
 * order. Matches the legacy SEO Tools UI and the back-end option keys.
 */
export const PAGE_TYPES: Array< { id: string; label: string } > = [
	{ id: 'front_page', label: __( 'Front page', 'jetpack-seo' ) },
	{ id: 'posts', label: __( 'Posts', 'jetpack-seo' ) },
	{ id: 'pages', label: __( 'Pages', 'jetpack-seo' ) },
	{ id: 'groups', label: __( 'Tags', 'jetpack-seo' ) },
	{ id: 'archives', label: __( 'Archives', 'jetpack-seo' ) },
];

/**
 * Tokens allowed per page type — the canonical source for what the back-end
 * will accept (`are_valid_title_formats()` rejects a save containing a token
 * outside this set for its page type). Keep in sync with
 * `Jetpack_SEO_Titles::get_allowed_tokens()`.
 */
export const PAGE_TYPE_TOKENS: Record< string, string[] > = {
	front_page: [ 'site_name', 'tagline' ],
	posts: [ 'site_name', 'tagline', 'post_title' ],
	pages: [ 'site_name', 'tagline', 'page_title' ],
	groups: [ 'site_name', 'tagline', 'group_title' ],
	archives: [ 'site_name', 'tagline', 'date', 'archive_title' ],
};

/**
 * Tokens surfaced as insertable suggestions per page type. Same as the allowed
 * set, except `archives` hides `date` in favor of the more general
 * `archive_title` (which also covers non-date archives) — matching the legacy
 * UI, which tokenizes `[date]` but no longer offers a button to insert it.
 */
export const PAGE_TYPE_SUGGESTIONS: Record< string, string[] > = {
	...PAGE_TYPE_TOKENS,
	archives: [ 'site_name', 'tagline', 'archive_title' ],
};

/**
 * Sample values used to render a live preview of a title format. Literal string
 * fragments pass through; placeholders are swapped for representative text.
 */
export const TOKEN_PREVIEW_SAMPLES: Record< string, string > = {
	site_name: __( 'Your site', 'jetpack-seo' ),
	tagline: __( 'Your tagline', 'jetpack-seo' ),
	post_title: __( 'Hello World', 'jetpack-seo' ),
	page_title: __( 'Sample Page', 'jetpack-seo' ),
	group_title: __( 'News', 'jetpack-seo' ),
	date: __( 'January 2025', 'jetpack-seo' ),
	archive_title: __( 'Sample Archive', 'jetpack-seo' ),
};

// Reverse map — "Site name" → "site_name" — to parse `[Site name]` back into
// the canonical id when the user picks a suggestion or pastes a label.
const LABEL_TO_TOKEN_ID: Record< string, string > = Object.fromEntries(
	TOKEN_IDS.map( id => [ TOKEN_LABELS[ id ], id ] )
);

// Escape a label for safe use inside a RegExp (labels are translated, so a
// locale could introduce regex-special characters).
const escapeRegExp = ( value: string ): string => value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );

// Matches a bracketed known label, e.g. `[Site name]`, as a *capturing* group so
// `String.prototype.split` keeps the delimiters — letting us tokenize a format
// string into an alternating sequence of literal fragments and placeholders.
const LABEL_PATTERN = new RegExp(
	`(\\[(?:${ Object.values( TOKEN_LABELS ).map( escapeRegExp ).join( '|' ) })\\])`
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
 * the matching placeholder; anything else (including a placeholder that isn't
 * valid for this page type) is kept as a literal string fragment, so the save
 * never carries a token the back-end would reject for that page type.
 *
 * @param display         - The display string from the token field.
 * @param allowedTokenIds - Optional whitelist of token ids valid for this page
 *                        type; when omitted, any known placeholder is allowed.
 * @return The canonical token.
 */
export const fromDisplay = ( display: string, allowedTokenIds?: string[] ): TitleFormatToken => {
	const match = display.match( /^\[(.+)\]$/ );
	const inner = match?.[ 1 ];
	if ( inner ) {
		const id = LABEL_TO_TOKEN_ID[ inner ];
		if ( id && ( ! allowedTokenIds || allowedTokenIds.includes( id ) ) ) {
			return { type: 'token', value: id };
		}
	}
	return { type: 'string', value: display };
};

/**
 * Render an ordered token list into a human-readable preview string, swapping
 * placeholders for representative sample text and passing literal fragments
 * through unchanged.
 *
 * @param tokens - The ordered token list.
 * @return The preview string.
 */
export const buildPreview = ( tokens: TitleFormatToken[] ): string =>
	tokens
		.map( token =>
			token.type === 'string' ? token.value : TOKEN_PREVIEW_SAMPLES[ token.value ] ?? token.value
		)
		.join( '' );

/**
 * Render an ordered token list into the single editable string shown in the
 * title-structure text input: bracketed labels for placeholders, literal text
 * (including separators like ` | `) passed through. Inverse of `stringToTokens`.
 *
 * @param tokens - The ordered token list.
 * @return The editable format string.
 */
export const tokensToString = ( tokens: TitleFormatToken[] ): string =>
	tokens.map( toDisplay ).join( '' );

/**
 * Parse the editable format string back into the canonical token list: each
 * `[Known label]` becomes a placeholder (when valid for the page type), and
 * everything between/around them — separators, spaces, arbitrary text — is kept
 * verbatim as literal `string` fragments. Unlike a token/chip field this
 * preserves whitespace and repeated separators. Inverse of `tokensToString`.
 *
 * @param input           - The format string from the text input.
 * @param allowedTokenIds - Token ids valid for this page type; a bracketed label
 *                        outside the set is kept literal so the save isn't
 *                        rejected by the back-end.
 * @return The canonical token list.
 */
export const stringToTokens = ( input: string, allowedTokenIds?: string[] ): TitleFormatToken[] =>
	input
		.split( LABEL_PATTERN )
		.filter( segment => segment !== '' )
		.map( segment => fromDisplay( segment, allowedTokenIds ) );
