import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import classNames from 'classnames';

export default function save( { attributes } ) {
	const className = classNames( {
		'has-custom-font-size': !! attributes?.fontSize || attributes?.style?.typography?.fontSize,
	} );
	const blockProps = useBlockProps.save( { className: className } );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );
	return <div { ...innerBlocksProps } />;
}
