/* global React:true */

/**
 * Internal dependencies
 */
import MarkdownPreview from './components/markdown-renderer';

function JetpackMarkdownBlockSave( { attributes } ) {
	return <MarkdownPreview source={ attributes.source } />;
}

export default JetpackMarkdownBlockSave;
