/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import GridiconHeart from 'gridicons/dist/heart-outline';
import { getIconColor } from '../../shared/block-icons';

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
};
