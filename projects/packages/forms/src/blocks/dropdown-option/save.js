import { useBlockProps, RichText } from '@wordpress/block-editor';

export default ( { attributes } ) => {
	const blockProps = useBlockProps.save();

	return <RichText.Content { ...blockProps } tagName="p" value={ attributes.content } />;
};
