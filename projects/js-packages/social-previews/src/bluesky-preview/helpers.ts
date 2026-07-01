import {
	firstValid,
	hardTruncation,
	shortEnough,
	stripHtmlTags,
	preparePreviewText,
	Formatter,
	Hyperlink,
} from '../helpers';

const TITLE_LENGTH = 200;
const BODY_LENGTH = 300;
const URL_LENGTH = 40;

/**
 * Visible body-text cap used by the preview component, leaving room for the
 * URL that gets rendered separately below the body. Mirrors the `maxChars`
 * passed to `preparePreviewText` in {@link blueskyBody}.
 */
export const BODY_CHAR_LIMIT = BODY_LENGTH - URL_LENGTH;

export const blueskyTitle: Formatter = text =>
	firstValid(
		shortEnough( TITLE_LENGTH ),
		hardTruncation( TITLE_LENGTH )
	)( stripHtmlTags( text ) ) || '';

export const blueskyBody = (
	text: string,
	options: { offset?: number; reserveUrlSpace?: boolean; hyperlinks?: Hyperlink[] } = {}
) => {
	const { offset = 0, reserveUrlSpace = true, hyperlinks } = options;

	return preparePreviewText( text, {
		platform: 'bluesky',
		maxChars: BODY_LENGTH - ( reserveUrlSpace ? URL_LENGTH : 0 ) - offset,
		hyperlinks,
	} );
};

export const blueskyUrl: Formatter = text =>
	firstValid( shortEnough( URL_LENGTH ), hardTruncation( URL_LENGTH ) )( stripHtmlTags( text ) ) ||
	'';
