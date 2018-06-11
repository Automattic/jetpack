/* global React:true */
/**
 * External dependencies
 */
import commonmark from 'commonmark';

/**
 * Internal dependencies
 */
const {
	RawHTML,
} = window.wp.element;

const markdownReader = new commonmark.Parser();
const markdownWritter = new commonmark.HtmlRenderer();

function JetpackMarkdownBlockSave( { attributes } ) {
	const source = attributes.source;
	let content = '';

	if ( source ) {
		// Creates a tree of nodes from the Markdown source
		const parsedMarkdown = markdownReader.parse( attributes.source );

		// Converts the tree of nodes to HTML
		content = markdownWritter.render( parsedMarkdown );
	}

	return <RawHTML>{ content }</RawHTML>;
}

export default JetpackMarkdownBlockSave;
