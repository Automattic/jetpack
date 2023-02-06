import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';
import icon from './icon';

import './editor.scss';

export const name = 'amazon';
export const title = __( 'Amazon', 'jetpack' );
export const settings = {
	attributes,
	title,
	description: __( 'Promote Amazon products and earn a commission from sales.', 'jetpack' ),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'earn',
	keywords: [ __( 'amazon', 'jetpack' ), __( 'affiliate', 'jetpack' ) ],
	supports: {
		align: true,
		alignWide: false,
		html: false,
	},
	edit,
	save: () => null, // TODO - add Amazon links
	example: {
		attributes: {
			// @TODO: Add default values for block attributes, for generating the block preview.
		},
	},
};
