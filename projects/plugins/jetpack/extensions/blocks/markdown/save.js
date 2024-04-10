import { useBlockProps } from '@wordpress/block-editor';
import MarkdownRenderer from './renderer';

export default ( { attributes } ) => {
	const blockProps = useBlockProps.save();

	return (
		<div { ...blockProps }>
			<MarkdownRenderer
				className={ blockProps.className }
				source={ attributes.source }
				attributes={ attributes }
			/>
		</div>
	);
};
