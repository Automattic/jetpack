import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import classNames from 'classnames';

export default function Save() {
	const blockProps = useBlockProps.save();

	return (
		<div
			{ ...blockProps }
			className={ classNames( blockProps.className, 'wp-block-premium-content-container' ) }
		>
			<InnerBlocks.Content />
		</div>
	);
}
