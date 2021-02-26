/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import deprecatedV1 from './deprecated/v1';
import { DonationsIcon } from '../../shared/icons';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'donations';
export const title = __( 'Donations', 'jetpack' );

export const settings = {
	title,
	description: __( 'Collect one-time, monthly, or annually recurring donations.', 'jetpack' ),
	icon: DonationsIcon,
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
