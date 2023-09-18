import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import classNames from 'classnames';

export function BlogRollSave( {
	attributes: { show_avatar, show_description, show_subscribe_button },
	className,
} ) {
	const blockProps = useBlockProps.save( {
		className: classNames( className, {
			'hide-avatar': ! show_avatar,
			'hide-description': ! show_description,
			'hide-subscribe-button': ! show_subscribe_button,
		} ),
	} );

	return (
		<div { ...blockProps }>
			<InnerBlocks.Content />
		</div>
	);
}

export default BlogRollSave;
