import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import clsx from 'clsx';

export function BlogRollSave( { attributes: { show_avatar, show_description }, className } ) {
	const blockProps = useBlockProps.save( {
		className: clsx( className, {
			'hide-avatar': ! show_avatar,
			'hide-description': ! show_description,
		} ),
	} );

	return (
		<div { ...blockProps }>
			<InnerBlocks.Content />
		</div>
	);
}

export default BlogRollSave;
