import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';

export default function save( { attributes } ) {
	const { size } = attributes;
	const className = clsx( size, 'jetpack-sharing-buttons__services-list' );
	const id = 'jetpack-sharing-serivces-list';
	const blockProps = useBlockProps.save( { className } );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <ul { ...innerBlocksProps } id={ id } />;
}
