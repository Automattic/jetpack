import { useBlockProps } from '@wordpress/block-editor';
import MarkdownRenderer from './renderer';

export default ( { attributes, className } ) => {
	const blockProps = useBlockProps.save();

	return (
		<div { ...blockProps }>
			<MarkdownRenderer
				className={ className }
				source={ attributes.source }
				attributes={ attributes }
			/>
		</div>
	);
};
