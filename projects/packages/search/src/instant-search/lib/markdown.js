/**
 * Minimal markdown-to-HTML converter for AI answer text.
 * Handles: headings, bold, italic, inline links, bullet lists, paragraphs.
 * All text content is HTML-escaped before insertion — safe for dangerouslySetInnerHTML.
 */

/**
 * Escape special HTML characters in a plain-text string.
 *
 * @param {string} text - Plain text to escape.
 * @return {string} HTML-safe string.
 */
function escapeHtml( text ) {
	return text
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' );
}

/**
 * Format inline markdown within a single line: bold, italic, links.
 *
 * @param {string} text - Raw text that may contain inline markdown.
 * @return {string} HTML string with inline elements applied.
 */
function inlineFormat( text ) {
	const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s<>"')\]]+))/g;
	const result = [];
	let lastIndex = 0;
	let match;

	while ( ( match = pattern.exec( text ) ) !== null ) {
		if ( match.index > lastIndex ) {
			result.push( escapeHtml( text.slice( lastIndex, match.index ) ) );
		}
		if ( match[ 2 ] !== undefined ) {
			result.push( `<strong>${ inlineFormat( match[ 2 ] ) }</strong>` );
		} else if ( match[ 3 ] !== undefined ) {
			result.push( `<em>${ inlineFormat( match[ 3 ] ) }</em>` );
		} else if ( match[ 4 ] !== undefined && match[ 5 ] !== undefined ) {
			const url = /^https?:\/\//.test( match[ 5 ] ) ? escapeHtml( match[ 5 ] ) : '#';
			result.push(
				`<a href="${ url }" target="_blank" rel="noopener noreferrer">${ escapeHtml(
					match[ 4 ]
				) }</a>`
			);
		} else if ( match[ 6 ] !== undefined ) {
			const url = escapeHtml( match[ 6 ] );
			result.push( `<a href="${ url }" target="_blank" rel="noopener noreferrer">${ url }</a>` );
		}
		lastIndex = match.index + match[ 0 ].length;
	}

	if ( lastIndex < text.length ) {
		result.push( escapeHtml( text.slice( lastIndex ) ) );
	}

	return result.join( '' );
}

/**
 * Convert a markdown string to an HTML string.
 *
 * @param {string} markdown - Markdown text from the AI answer stream.
 * @return {string} Safe HTML string.
 */
export function markdownToHtml( markdown ) {
	if ( ! markdown ) {
		return '';
	}

	let html = '';
	const lines = markdown.split( '\n' );
	let inList = false;
	const pendingParagraph = [];

	const flushParagraph = () => {
		if ( pendingParagraph.length > 0 ) {
			const content = pendingParagraph.join( ' ' ).trim();
			if ( content ) {
				html += `<p>${ inlineFormat( content ) }</p>`;
			}
			pendingParagraph.length = 0;
		}
	};

	const closeList = () => {
		if ( inList ) {
			html += '</ul>';
			inList = false;
		}
	};

	for ( const line of lines ) {
		const headingMatch = line.match( /^(#{1,6})\s+(.+)$/ );
		const listMatch = line.match( /^[-*]\s+(.+)$/ );

		if ( headingMatch ) {
			flushParagraph();
			closeList();
			const level = Math.min( headingMatch[ 1 ].length + 1, 6 );
			html += `<h${ level }>${ inlineFormat( headingMatch[ 2 ] ) }</h${ level }>`;
		} else if ( listMatch ) {
			flushParagraph();
			if ( ! inList ) {
				html += '<ul>';
				inList = true;
			}
			html += `<li>${ inlineFormat( listMatch[ 1 ] ) }</li>`;
		} else if ( line.trim() === '' ) {
			flushParagraph();
			closeList();
		} else {
			if ( inList ) {
				closeList();
			}
			pendingParagraph.push( line );
		}
	}

	flushParagraph();
	closeList();

	return html;
}
