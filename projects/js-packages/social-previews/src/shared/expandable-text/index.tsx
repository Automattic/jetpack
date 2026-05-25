import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useReducer } from 'react';
import { stripHtmlTags } from '../../helpers';

import './style.scss';

export const EXPAND_THRESHOLD_CHARS = 400;

/**
 * Counts Unicode codepoints rather than UTF-16 code units, so an emoji like 🚀 is one character (matching PHP `mb_strlen`).
 *
 * @param text - The string to measure.
 * @return The codepoint count.
 */
function codepointLength( text: string ): number {
	return Array.from( text ).length;
}

/**
 * Truncates `text` to at most `limit` codepoints, preferring the last space
 * within the final 80 codepoints so we don't slice mid-word.
 *
 * @param text  - The string to truncate.
 * @param limit - Maximum codepoint length of the returned string.
 * @return The truncated string (without an ellipsis).
 */
function truncateAtWordBoundary( text: string, limit: number ): string {
	const codepoints = Array.from( text );

	if ( codepoints.length <= limit ) {
		return text;
	}

	const slice = codepoints.slice( 0, limit ).join( '' );
	const lastSpace = slice.lastIndexOf( ' ' );
	// Only honor the word boundary if it's reasonably close to the limit;
	// otherwise hard-cut to avoid stranding most of the text on a long token.
	const cut = lastSpace > limit - 80 ? lastSpace : slice.length;

	return slice.slice( 0, cut );
}

type ExpandableTextProps = {
	/**
	 * The full body text to potentially truncate. May contain HTML; visible
	 * length is measured against the HTML-stripped form.
	 */
	text: string;
	/**
	 * Render-prop that receives the slice of text to display — either the
	 * full `text` or a word-boundary-truncated version — and returns the
	 * formatted node (typically the result of `preparePreviewText`).
	 */
	children: ( visibleText: string ) => React.ReactNode;
};

/**
 * Wraps a body-text formatter with a "See more" / "See less" toggle when the
 * input exceeds {@link EXPAND_THRESHOLD_CHARS} visible (HTML-stripped)
 * characters.
 *
 * @param props - {@link ExpandableTextProps}.
 * @return The body text node, optionally followed by a See more/See less toggle.
 */
export function ExpandableText( props: ExpandableTextProps ) {
	const { text, children } = props;
	const [ expanded, toggle ] = useReducer( state => ! state, false );

	const stripped = stripHtmlTags( text );

	if ( codepointLength( stripped ) <= EXPAND_THRESHOLD_CHARS ) {
		return <>{ children( text ) }</>;
	}

	if ( expanded ) {
		return (
			<>
				{ children( text ) }{ ' ' }
				<Button variant="link" className="social-previews__expand-toggle" onClick={ toggle }>
					{ __( 'See less', 'social-previews' ) }
				</Button>
			</>
		);
	}

	const truncated = truncateAtWordBoundary( stripped, EXPAND_THRESHOLD_CHARS );

	return (
		<>
			{ children( truncated ) }
			{ '… ' }
			<Button variant="link" className="social-previews__expand-toggle" onClick={ toggle }>
				{ __( 'See more', 'social-previews' ) }
			</Button>
		</>
	);
}

export default ExpandableText;
