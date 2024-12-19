import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

/**
 * Block Save function
 *
 * @return {string} HTML markup.
 */
export default function Save() {
	const blockProps = useBlockProps.save( {
		className: 'wp-block-premium-content-subscriber-view entry-content',
	} );

	return (
		<div { ...blockProps }>
			<InnerBlocks.Content />
		</div>
	);
}
