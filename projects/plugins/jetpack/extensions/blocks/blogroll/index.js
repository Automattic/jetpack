import { __ } from '@wordpress/i18n';
import edit from './edit';

export const name = 'blogroll';
export const title = __( 'Blogroll', 'jetpack' );
export const settings = {
	title,
	description: __( 'The blogroll.', 'jetpack' ),
	supports: {
		align: [ 'left', 'right', 'wide', 'full' ],
		color: {
			gradients: true,
			link: true,
		},
		spacing: {
			padding: true,
			margin: true,
		},
		typography: {
			fontSize: true,
			lineHeight: true,
		},
		customClassName: true,
		className: true,
	},
	edit,
};
