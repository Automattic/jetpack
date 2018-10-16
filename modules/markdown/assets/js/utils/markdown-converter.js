/**
 * External dependencies
 */
import escape from 'lodash/escape';
import MarkdownIt from 'markdown-it';

const markdownItLight = new MarkdownIt( 'zero' )
	.set( { breaks: true } )
	.enable( [
		'heading',
		'emphasis',
		'backticks',
		'newline',
		'paragraph',
	] );

/*
 * Redefines the rules applied by the parser to render each token. This adds
 * to each token's content, the delimiter the user used (which the parser
 * obviously removes in the resulting HTML)
 */
const LIVE_PREVIEW_TOKEN_CSS_CLASS = 'wp-block-jetpack-markdown-block__live-preview__token';

// Adds `_` or `*` to the beginning of the em tag
markdownItLight.renderer.rules.em_open = function( tokens, idx ) {
	const token = tokens[ idx ];
	return `<em><span class="${ LIVE_PREVIEW_TOKEN_CSS_CLASS }">${ token.markup }</span>`;
};
// Adds `_` or `*` to the end of the em tag
markdownItLight.renderer.rules.em_close = function( tokens, idx ) {
	const token = tokens[ idx ];
	return `<span class="${ LIVE_PREVIEW_TOKEN_CSS_CLASS }">${ token.markup }</span></em>`;
};
// Adds `__` or `**` to the beginning of the strong tag
markdownItLight.renderer.rules.strong_open = function( tokens, idx ) {
	const token = tokens[ idx ];
	return `<strong><span class="${ LIVE_PREVIEW_TOKEN_CSS_CLASS }">${ token.markup }</span>`;
};
// Adds `__` or `**` to the end of the strong tag
markdownItLight.renderer.rules.strong_close = function( tokens, idx ) {
	const token = tokens[ idx ];
	return `<span class="${ LIVE_PREVIEW_TOKEN_CSS_CLASS }">${ token.markup }</span></strong>`;
};
// Wraps inline code tokens with ```
markdownItLight.renderer.rules.code_inline = function( tokens, idx ) {
	const token = tokens[ idx ];
	return `<code>${ token.markup }${ escape( token.content ) }${ token.markup }</code>`;
};
// Adds `#`s to the beginning of the heading content
markdownItLight.renderer.rules.heading_open = function( tokens, idx ) {
	const token = tokens[ idx ];
	const inline_token = tokens[ idx + 1 ];
	const text_token = inline_token.children[ 0 ];
	if ( text_token ) {
		text_token.content = ` ${ text_token.content }`;
	}
	return `<${ token.tag }><span class="${ LIVE_PREVIEW_TOKEN_CSS_CLASS }">${ token.markup }</span>`;
};
// Overrides the newline rule to keep whitespace at the beginning of new lines
// Original source from `markdown-it/lib/rules_inline/newline.js`
markdownItLight.inline.ruler.at( 'newline', function replace( state, silent ) {
	let position = state.pos;

	if ( state.src.charCodeAt( position ) !== 0x0A/* \n */ ) {
		return false;
	}

	const lastCharPosition = state.pending.length - 1;

	// '	\n' -> hardbreak
	// Lookup in pending chars is bad practice! Don't copy to other rules!
	// Pending string is stored in concat mode, indexed lookups will cause
	// convertion to flat mode.
	if ( ! silent ) {
		if ( lastCharPosition >= 0 && state.pending.charCodeAt( lastCharPosition ) === 0x20 ) {
			if ( lastCharPosition >= 1 && state.pending.charCodeAt( lastCharPosition - 1 ) === 0x20 ) {
				state.pending = state.pending.replace( / +$/, '' );
				state.push( 'hardbreak', 'br', 0 );
			} else {
				state.pending = state.pending.slice( 0, -1 );
				state.push( 'softbreak', 'br', 0 );
			}
		} else {
			state.push( 'softbreak', 'br', 0 );
		}
	}

	position++;

	state.pos = position;
	return true;
} );
// Overrides the paragraph rule to keep white space at the beginning and end of
// every paragraph. Original source from `markdown-it/lib/rules_block/paragraph.js`
markdownItLight.block.ruler.at( 'paragraph', function replace( state, startLine ) {
	let terminate, i, l, token,
		nextLine = startLine + 1;
	const terminatorRules = state.md.block.ruler.getRules( 'paragraph' );
	const endLine = state.lineMax;
	const oldParentType = state.parentType;
	state.parentType = 'paragraph';

	// jump line-by-line until empty one or EOF
	for ( ; nextLine < endLine && ! state.isEmpty( nextLine ); nextLine++ ) {
		// this would be a code block normally, but after paragraph
		// it's considered a lazy continuation regardless of what's there
		if ( state.sCount[ nextLine ] - state.blkIndent > 3 ) {
			continue;
		}

		// quirk for blockquotes, this line should already be checked by that rule
		if ( state.sCount[ nextLine ] < 0 ) {
			continue;
		}

		// Some tags can terminate paragraph without empty line.
		terminate = false;
		for ( i = 0, l = terminatorRules.length; i < l; i++ ) {
			if ( terminatorRules[ i ]( state, nextLine, endLine, true ) ) {
				terminate = true;
				break;
			}
		}
		if ( terminate ) {
			break;
		}
	}

	const content = state.getLines( startLine, nextLine, state.blkIndent, false );

	state.line = nextLine;

	token = state.push( 'paragraph_open', 'p', 1 );
	token.map = [ startLine, state.line ];

	token = state.push( 'inline', '', 0 );
	token.content = content;
	token.map = [ startLine, state.line ];
	token.children = [];

	token = state.push( 'paragraph_close', 'p', -1 );

	state.parentType = oldParentType;

	return true;
} );

const markdownItFull = new MarkdownIt();

const MarkdownConverter = {

	renderPreview( source ) {
		return markdownItLight.render( source );
	},

	render( source ) {
		return markdownItFull.render( source );
	}

};

export default MarkdownConverter;
