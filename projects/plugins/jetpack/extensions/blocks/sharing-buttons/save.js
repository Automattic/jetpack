/**
 * External dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

/**
 * WordPress dependencies
 */

export default function save() {
	const className = 'jetpack-sharing-buttons__sharing-services-list';
	const blockProps = useBlockProps.save( { className } );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <ul { ...innerBlocksProps } />;
}
