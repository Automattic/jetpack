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

export const name = 'dialogue';
export const title = __( 'Dialogue block', 'jetpack' );
export const settings = {
	title,
	description: __( 'Dialogue', 'jetpack' ),
	icon: {
		src: 'admin-comments',
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
		'dialogue/speakers',
		'dialogue/showTimeStamp',
	],

	styles: [
		{ name: 'row', label: __( 'Row', 'jetpack' ), isDefault: true },
		{ name: 'column', label: __( 'Column', 'jetpack' ) },
	],
};
