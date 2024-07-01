import { useBlockProps } from '@wordpress/block-editor';

export default function Save( { attributes } ) {
	const blockProps = useBlockProps.save();
	const { url } = attributes;

	return (
		<a { ...blockProps } href={ url }>
			{ url }
		</a>
	);
}
