import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';

export default function Save() {
	const blockProps = useBlockProps.save();

	return (
		<div
			{ ...blockProps }
			className={ clsx( blockProps.className, 'wp-block-premium-content-container' ) }
		>
			<InnerBlocks.Content />
		</div>
	);
}
