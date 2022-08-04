import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save( { attributes: { width } } ) {
	const innerBlocksProps = useInnerBlocksProps.save( useBlockProps.save() );
	return <div { ...innerBlocksProps } style={ { width } } />;
}
