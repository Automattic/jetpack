/**
 * External dependencies
 */
import GridiconHeart from 'gridicons/dist/heart-outline';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import { getIconColor } from '../../shared/block-icons';
import deprecatedV1 from './deprecated/v1';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'donations';
export const title = __( 'Donations', 'jetpack' );
export const icon = <GridiconHeart />;
export const settings = {
	title,
	description: __( 'Collect one-time, monthly, or annually recurring donations.', 'jetpack' ),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'earn',
	keywords: [ __( 'Donations', 'jetpack' ) ],
	supports: {
		html: false,
	},
	edit,
	save,
	example: {},
	deprecated: [ deprecatedV1 ],
};
