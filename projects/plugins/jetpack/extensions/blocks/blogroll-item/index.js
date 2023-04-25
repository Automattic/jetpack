import { __ } from '@wordpress/i18n';
import edit from './edit';
/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'blogroll-item';
export const title = __( 'Blogroll Item', 'jetpack' );
export const settings = {
	title,
	description: __( 'The blogroll item.', 'jetpack' ),
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
	attributes: {},
	example: {
		attributes: {},
	},
};
