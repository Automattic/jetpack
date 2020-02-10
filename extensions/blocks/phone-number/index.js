/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink, Path } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import renderMaterialIcon from '../../shared/render-material-icon';
import edit from './edit';
import save from './save';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'phone-number';
export const title = __( 'Phone number', 'jetpack' );
export const settings = {
	title,
	description: __(
		'Add a hyperlinked phone number that will dial when clicked on mobile',
		'jetpack'
	),
	icon: renderMaterialIcon(
		<Path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
	),
	category: 'jetpack',
	keywords: [],
	attributes: {
		phoneNumber: {
			type: 'string',
			source: 'text',
			selector: 'a',
		},
		label: {
			type: 'string',
			default: __( 'Phone', 'jetpack' ),
		},
	},
	supports: {
		align: true,
		alignWide: false,
		anchor: false,
		customClassName: true,
		className: true,
		html: false,
		multiple: true,
		reusable: true,
	},
	edit,
	save,
	example: {
		attributes: {
			phoneNumber: '+0014568980',
		},
	},
};
