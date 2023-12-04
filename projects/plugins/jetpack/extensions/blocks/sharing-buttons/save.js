import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

export default function save() {
	const className = 'jetpack-sharing-buttons__services-list';
	const blockProps = useBlockProps.save( { className } );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <ul { ...innerBlocksProps } />;
}
