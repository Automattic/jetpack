/* global React:true */

/**
 * External dependencies
 */
import commonmark from 'commonmark';

const {
	Component,
	RawHTML
} = window.wp.element;

const markdownReader = new commonmark.Parser();
const markdownWritter = new commonmark.HtmlRenderer();

class MarkdownPreview extends Component {

	render() {
		const { source } = this.props;
		let content = '';

		if ( source ) {
			// Creates a tree of nodes from the Markdown source
			const parsedMarkdown = markdownReader.parse( source );

			// Converts the tree of nodes to HTML
			content = markdownWritter.render( parsedMarkdown );
		}
		return <RawHTML>{ content }</RawHTML>;
	}
}
export default MarkdownPreview;
