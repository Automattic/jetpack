/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import save from './save';
import icon from './icon';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'donations';
export const title = __( 'Donations', 'jetpack' );
export const settings = {
	title,
	description: __( 'Collect one-time, monthly, or annually recurring donations.', 'jetpack' ),
	icon,
	category: 'earn',
	keywords: [ __( 'Donations', 'jetpack' ) ],
	supports: {
		html: false,
	},
	edit,
	save,
	attributes,
	example: {},
};

export const childBlocks = [
	{
		name: 'donations-amounts',
		settings: {
			category: 'earn',
			parent: [ 'jetpack/donations' ],
			attributes: {
				amounts: {
					type: 'array',
					items: {
						type: 'number',
					},
					default: [ 5, 15, 100 ],
				},
				currency: {
					type: 'string',
					default: 'USD',
				},
				defaultCustomAmount: {
					type: 'number',
				},
				interval: {
					type: 'string',
					enum: [ 'one-time', '1 month', '1 year' ],
				},
			},
			example: {},
			title: __( 'Amounts', 'jetpack' ),
			icon,
		},
	},
];
