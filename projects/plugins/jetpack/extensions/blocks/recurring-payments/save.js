import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save( { attributes: { width } } ) {
	const innerBlocksProps = useInnerBlocksProps.save( {
		...useBlockProps.save(),
		style: { width },
	} );
	return <div { ...innerBlocksProps } />;
}
