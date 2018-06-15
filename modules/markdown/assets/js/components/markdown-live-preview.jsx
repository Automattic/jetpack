/* global React:true */

/**
 * External dependencies
 */
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
};

const renderHTML = function( source ) {
	if ( source ) {
		return markdownIt.render( source );
	}
};

const emitChange = function( evt ) {
	if ( ! this.htmlEl ) {
		return;
	}

	const source = this.htmlEl.innerText;

	this.setState( { restoreCaretPosition: null } );

	if ( source ) {
		const html = renderHTML( source );
		this.setState( {
			html,
			restoreCaretPosition: saveCaretPosition( this.htmlEl )
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

export default class MarkdownLivePreview extends React.Component {

	constructor() {
		super();

		setupMarkdownParser();

		this.state = {
			html: __( 'Write your _Markdown_ **here**...' ),
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

	componentDidUpdate() {
		if ( this.state.restoreCaretPosition ) {
			this.state.restoreCaretPosition();
		}
	}

}
