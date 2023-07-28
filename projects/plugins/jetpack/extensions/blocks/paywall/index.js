import { __ } from '@wordpress/i18n';
import { pageBreak as icon } from '@wordpress/icons';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';

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
	category: 'earn',
	keywords: [ 'subscribe' ],
	supports: {
		customClassName: false,
		html: false,
		multiple: false,
	},
	parent: [ 'core/post-content' ],
	edit,
	save: () => null,
	attributes,
	example: {
		attributes: {},
	},
};
