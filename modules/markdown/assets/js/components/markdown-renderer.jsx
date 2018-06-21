/* global React:true */

/**
 * External dependencies
 */
import MarkdownIt from 'markdown-it';

const {
	RawHTML
} = window.wp.element;

const markdownIt = new MarkdownIt();

const MarkdownRenderer = function( props ) {
	const { source } = props;

	let content = '';

	if ( source ) {
		// converts the markdown source to HTML
		content = markdownIt.render( source );
	}
	return <RawHTML>{ content }</RawHTML>;
};

export default MarkdownRenderer;
