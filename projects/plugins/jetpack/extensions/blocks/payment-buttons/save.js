import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import clsx from 'clsx';

export default function save( { attributes } ) {
	const className = clsx( {
		'has-custom-font-size': !! attributes?.fontSize || attributes?.style?.typography?.fontSize,
	} );
	const blockProps = useBlockProps.save( { className: className } );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );
	return <div { ...innerBlocksProps } />;
}
