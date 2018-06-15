/* global React:true */

/**
 * External dependencies
 */
import MarkdownIt from 'markdown-it';

const {
	Component,
	RawHTML
} = window.wp.element;

const markdownIt = new MarkdownIt();

class MarkdownPreview extends Component {

	render() {
		const { source } = this.props;
		let content = '';

		if ( source ) {
			// converts the markdown source to HTML
			content = markdownIt.render( source );
		}
		return <RawHTML>{ content }</RawHTML>;
	}
}
export default MarkdownPreview;
