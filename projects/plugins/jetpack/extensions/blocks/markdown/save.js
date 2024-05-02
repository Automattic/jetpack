import { useBlockProps } from '@wordpress/block-editor';
import MarkdownRenderer from './renderer';

export default ( { attributes } ) => {
	const blockProps = useBlockProps.save();

	return (
		<MarkdownRenderer { ...blockProps } source={ attributes.source } attributes={ attributes } />
	);
};
