/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';
import save from './save';

/**
 * Style dependencies
 */
import './style.scss';

export const name = 'changelog';
export const title = __( 'Changelog block', 'jetpack' );
export const settings = {
	title,
	description: __( 'Changelog', 'jetpack' ),
	icon: {
		src: 'list-view',
		foreground: getIconColor(),
	},
	category: 'layout',
	supports: {
		'align': true,
	},
	edit,
	save,
	attributes,
	usesContext: [
		'changelog/labels',
		'changelog/showTimeStamp',
	],
};
