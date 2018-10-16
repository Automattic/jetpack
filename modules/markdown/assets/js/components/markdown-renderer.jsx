/* global React:true */

/**
 * Internal dependencies
 */
import markdownConverter from '../utils/markdown-converter';

const {
	RawHTML
} = window.wp.element;

const MarkdownRenderer = function( props ) {
	const { source } = props;

	let content = '';

	if ( source ) {
		// converts the markdown source to HTML
		content = markdownConverter.render( source );
	}
	return <RawHTML>{ content }</RawHTML>;
};

export default MarkdownRenderer;
