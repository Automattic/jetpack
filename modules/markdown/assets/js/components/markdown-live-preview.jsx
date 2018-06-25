/* global React:true */

/**
 * External dependencies
 */
import endsWith from 'lodash/endsWith';
import escape from 'lodash/escape';
import MarkdownIt from 'markdown-it';

/**
 * Internal dependencies
 */
import { saveCaretPosition } from '../utils/caret-management';

const {
	createElement
} = window.wp.element;

const markdownIt = new MarkdownIt( 'zero' )
	.set( { breaks: true } )
	.enable( [
		'heading',
		'emphasis',
		'backticks',
		'newline',
	] );

/*
 * Redefines the rules applied by the parser to render each token. This adds
 * to each token's content, the delimiter the user used (which the parser
 * obviously removes in the resulting HTML)
 */
const LIVE_PREVIEW_TOKEN_CSS_CLASS = 'wp-block-jetpack-markdown-block__live-preview__token';

// Adds `_` or `*` to the beginning of the em tag
markdownIt.renderer.rules.em_open = function( tokens, idx ) {
	const token = tokens[ idx ];
	return `<em><span class="${ LIVE_PREVIEW_TOKEN_CSS_CLASS }">${ token.markup }</span>`;
};
// Adds `_` or `*` to the end of the em tag
markdownIt.renderer.rules.em_close = function( tokens, idx ) {
	const token = tokens[ idx ];
	return `<span class="${ LIVE_PREVIEW_TOKEN_CSS_CLASS }">${ token.markup }</span></em>`;
};
// Adds `__` or `**` to the beginning of the strong tag
markdownIt.renderer.rules.strong_open = function( tokens, idx ) {
	const token = tokens[ idx ];
	return `<strong><span class="${ LIVE_PREVIEW_TOKEN_CSS_CLASS }">${ token.markup }</span>`;
};
// Adds `__` or `**` to the end of the strong tag
markdownIt.renderer.rules.strong_close = function( tokens, idx ) {
	const token = tokens[ idx ];
	return `<span class="${ LIVE_PREVIEW_TOKEN_CSS_CLASS }">${ token.markup }</span></strong>`;
};
// Wraps inline code tokens with ```
markdownIt.renderer.rules.code_inline = function( tokens, idx ) {
	const token = tokens[ idx ];
	return `<code>${ token.markup }${ escape( token.content ) }${ token.markup }</code>`;
};
// Adds `#`s to the beginning of the heading content
markdownIt.renderer.rules.heading_open = function( tokens, idx ) {
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
markdownIt.inline.ruler.at( 'newline', function replace( state, silent ) {
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

const renderHTML = function( source ) {
	if ( source ) {
		return markdownIt.render( source )
		// The MarkdownIt renderer adds new lines after each paragraph/heading
		// tag. This affects the restoration of the caret position, so we need
		// to remove them
			.split( /\n/ ).join( '' )
			.trim();
	}
};

const stripTrailingNewLines = function( text ) {
	if ( text ) {
		return text.replace( /\n{1,2}$/, '' );
	}
};

const triggerOnChange = function( evt, source ) {
	if ( this.props.onChange ) {
		// Clone event with Object.assign to avoid
		// "Cannot assign to read only property 'target' of object"
		evt = Object.assign( {}, evt, {
			target: {
				value: source
			}
		} );
		this.props.onChange( evt );
	}
};

const sourceIsEmpty = function( source ) {
	return ! source;
};

const ignoreLastInput = function( source ) {
	const SPACE = String.fromCharCode( 32 );
	const NO_BREAK_SPACE = String.fromCharCode( 160 );

	return endsWith( source, SPACE ) || endsWith( source, NO_BREAK_SPACE );
};

const emptyState = '<p></p>';

const renderMarkdownPreview = function( evt ) {
	if ( ! this.htmlEl ) {
		return true;
	}

	// We need to delete the last two new lines added by the browser for the
	// last node in the component's content. This behaviour interferes with
	// headings parsing.
	const source = stripTrailingNewLines( this.htmlEl.innerText );

	triggerOnChange.call( this, evt, source );

	// if there's no source, we don't need to parse anything
	if ( sourceIsEmpty( source ) ) {
		this.htmlEl.innerHTML = emptyState;
		return true;
	}

	// commonmark doesn't allow trailing spaces in paragraphs, so if we've
	// added a space, calling markdownIt now will remove it
	if ( ignoreLastInput( source ) ) {
		return true;
	}

	this.setState( { restoreCaretPosition: null } );

	if ( source ) {
		const html = renderHTML( source );

		this.setState( {
			html
		} );
	}

	return true;
};

const OBSERVER_CONFIG = { subtree: true, characterData: true };

export default class MarkdownLivePreview extends React.Component {

	constructor( props ) {
		super();

		const { source } = props;

		this.state = {
			html: source ? renderHTML( source ) : emptyState,
		};
	}

	shouldComponentUpdate( nextProps, nextState ) {
		if ( this.state.html !== nextState.html ) {
			return true;
		}
	}

	getSnapshotBeforeUpdate( prevProps, prevState ) {
		if ( this.state.html !== prevState.html ) {
			this.state.restoreCaretPosition = saveCaretPosition( this.htmlEl );
		}
	}

	componentDidUpdate() {
		// once the component has be rendered, we can restore the caret position
		if ( this.state.restoreCaretPosition ) {
			this.state.restoreCaretPosition();
		}
	}

	componentDidMount() {
		if ( this.props.isSelected ) {
			this.htmlEl.focus();
		}
		// onInput doesn't work for content editable elements in Internet Explorer 11,
		// but we can use a MutationObserver instead
		this.observer = new MutationObserver( ( mutations ) => {
			mutations.forEach( renderMarkdownPreview.bind( this ) );
		} );
		this.observer.observe( this.htmlEl, OBSERVER_CONFIG );
	}

	render() {
		const { ...props } = this.props;

		return createElement(
			'div',
			{
				...props,
				ref: ( e ) => this.htmlEl = e,
				onBlur: renderMarkdownPreview.bind( this ),
				contentEditable: ! this.props.disabled,
				dangerouslySetInnerHTML: { __html: this.state.html }
			},
			this.props.children
		);
	}

}
