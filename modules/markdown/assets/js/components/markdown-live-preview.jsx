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

const { __ } = window.wp.i18n;

const markdownIt = new MarkdownIt( 'zero' ).enable( [
	'heading',
	'emphasis',
	'backticks',
] );

// Redefines the rules applied by the parser to render each token.  This adds
// to each token's content, the delimiter the user used (which the parser
// obviously removes in the resulting HTML)
const setupMarkdownParser = function() {
	// Adds `_` or `*` to the beginning of the em tag
	markdownIt.renderer.rules.em_open = function( tokens, idx ) {
		const token = tokens[ idx ];
		return `<em>${ token.markup }`;
	};
	// Adds `_` or `*` to the end of the em tag
	markdownIt.renderer.rules.em_close = function( tokens, idx ) {
		const token = tokens[ idx ];
		return `${ token.markup }</em>`;
	};
	// Adds `__` or `**` to the beginning of the strong tag
	markdownIt.renderer.rules.strong_open = function( tokens, idx ) {
		const token = tokens[ idx ];
		return `<strong>${ token.markup }`;
	};
	// Adds `__` or `**` to the end of the strong tag
	markdownIt.renderer.rules.strong_close = function( tokens, idx ) {
		const token = tokens[ idx ];
		return `${ token.markup }</strong>`;
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
		return `<${ token.tag }>${ token.markup }`;
	};
};

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

const sourceIsEmpty = function( source ) {
	return ! source || '' === source.trim();
};

const ignoreLastInput = function( source ) {
	return endsWith( source, ' ' ) || endsWith( source, ' ' );
};

const emitChange = function( evt ) {
	if ( ! this.htmlEl ) {
		return;
	}

	// We need to delete the last two new lines added by the browser for the
	// last node in the component's content. This behaviour interferes with
	// headings parsing.
	const source = stripTrailingNewLines( this.htmlEl.innerText );

	// if there's no source, we don't need to parse anything
	if ( sourceIsEmpty( source ) ) {
		return;
	}

	// commonmark doesn't allow trailing spaces in paragraphs, so if we've
	// added a space, calling markdownIt now will remove it
	if ( ignoreLastInput( source ) ) {
		return;
	}

	this.setState( { restoreCaretPosition: null } );

	if ( source ) {
		const html = renderHTML( source );

		this.setState( {
			html
		} );
	}

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

const placeholderSource = __( 'Write your _Markdown_ **here**...' );

export default class MarkdownLivePreview extends React.Component {

	constructor( props ) {
		super();

		const { source } = props;

		setupMarkdownParser();

		this.state = {
			html: renderHTML( source || placeholderSource ),
		};
	}

	render() {
		const { ...props } = this.props;

		return createElement(
			'div',
			{
				...props,
				ref: ( e ) => this.htmlEl = e,
				onInput: emitChange.bind( this ),
				onBlur: emitChange.bind( this ),
				contentEditable: ! this.props.disabled,
				dangerouslySetInnerHTML: { __html: this.state.html }
			},
			this.props.children
		);
	}

	shouldComponentUpdate( nextProps, nextState ) {
		if ( this.state.html !== nextState.html ) {
			nextState.restoreCaretPosition = saveCaretPosition( this.htmlEl );
			return true;
		}
	}

	componentDidUpdate() {
		// once the component has be rendered, we can restore the caret position
		if ( this.state.restoreCaretPosition ) {
			this.state.restoreCaretPosition();
		}
	}
}
