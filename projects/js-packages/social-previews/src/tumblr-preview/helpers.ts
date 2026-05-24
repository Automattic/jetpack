import { firstValid, hardTruncation, shortEnough, stripHtmlTags, Formatter } from '../helpers';

const TITLE_LENGTH = 1000;
const DESCRIPTION_LENGTH = 4096;

/**
 * Visible body-text cap used by the preview component. Mirrors the
 * `DESCRIPTION_LENGTH` hard-truncation applied inside {@link tumblrDescription}.
 */
export const BODY_CHAR_LIMIT = DESCRIPTION_LENGTH;

export const tumblrTitle: Formatter = text =>
	firstValid(
		shortEnough( TITLE_LENGTH ),
		hardTruncation( TITLE_LENGTH )
	)( stripHtmlTags( text ) ) || '';

export const tumblrDescription: Formatter = text => {
	// Remove Gutenberg block comments using a safer approach to avoid ReDoS
	let processedText = text;
	let startIndex = processedText.indexOf( '<!--' );
	while ( startIndex !== -1 ) {
		const endIndex = processedText.indexOf( '-->', startIndex );
		if ( endIndex === -1 ) {
			// Incomplete comment, remove from startIndex to end
			processedText = processedText.substring( 0, startIndex );
			break;
		}
		// Remove the comment
		processedText =
			processedText.substring( 0, startIndex ) + processedText.substring( endIndex + 3 );
		startIndex = processedText.indexOf( '<!--' );
	}

	// Convert closing paragraph tags to line breaks to preserve paragraph structure
	processedText = processedText.replace( /<\/p>/g, '</p>\n\n' );

	return (
		firstValid(
			shortEnough( DESCRIPTION_LENGTH ),
			hardTruncation( DESCRIPTION_LENGTH )
		)( stripHtmlTags( processedText ) ) || ''
	);
};
