import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';
import icon from './icon';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'paywall';
export const title = __( 'Paywall', 'jetpack' );
export const settings = {
	title,
	description: __( 'Paywall', 'jetpack' ),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'grow',
	keywords: [],
	supports: {
		customClassName: false,
		html: false,
		multiple: false,
	},
	edit,
	/* @TODO Write the block editor output */
	save: () => null,
	attributes,
	example: {
		attributes: {
			// @TODO: Add default values for block attributes, for generating the block preview.
		},
	},
};
