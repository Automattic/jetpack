import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { getBlockStyles } from './util';

export default function save( { attributes: { width } } ) {
	const innerBlocksProps = useInnerBlocksProps.save( {
		...useBlockProps.save(),
		style: getBlockStyles( { width } ),
	} );
	return <div { ...innerBlocksProps } />;
}
