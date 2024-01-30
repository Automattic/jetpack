import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';
import classNames from 'classnames';

export default function save( { attributes } ) {
	const { size } = attributes;
	const className = classNames( size, 'jetpack-sharing-buttons__services-list' );
	const id = 'jetpack-sharing-serivces-list';
	const blockProps = useBlockProps.save( { className } );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <ul { ...innerBlocksProps } id={ id } />;
}
