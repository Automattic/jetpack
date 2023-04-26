import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import edit from './edit';
/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'blogroll';
export const title = __( 'Blogroll', 'jetpack' );
export const settings = {
	title,
	description: __( 'The blogroll.', 'jetpack' ),
	supports: {
		align: [ 'left', 'right', 'wide', 'full' ],
		alignWide: true,
		color: {
			gradients: true,
			link: true,
		},
		spacing: {
			padding: true,
		},
		customClassName: true,
		className: true,
	},
	edit,
	save: () => {
		const blockProps = useBlockProps.save();

		return (
			<div { ...blockProps }>
				<InnerBlocks.Content />
			</div>
		);
	},
};
