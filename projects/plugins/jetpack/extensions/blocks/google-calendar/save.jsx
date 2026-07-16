import { useBlockProps } from '@wordpress/block-editor';

export default ( { attributes: { url } } ) => {
	const blockProps = useBlockProps.save();

	return (
		<a { ...blockProps } href={ url }>
			{ url }
		</a>
	);
};
