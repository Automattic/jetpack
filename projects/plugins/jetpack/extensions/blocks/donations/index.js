/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DonationsIcon } from '../../shared/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import { ANNUAL_DONATION, MONTHLY_DONATION, ONE_TIME_DONATION } from './common/constants';
import { deprecated } from './deprecated';

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
	keywords: [ __( 'donations', 'jetpack' ) ],
	attributes: {
		[ ONE_TIME_DONATION ]: {
			type: 'boolean',
			default: true,
		},
		[ MONTHLY_DONATION ]: {
			type: 'boolean',
			default: true,
		},
		[ ANNUAL_DONATION ]: {
			type: 'boolean',
			default: true,
		},
		showCustomAmount: {
			type: 'boolean',
			default: true,
		},
		currency: {
			type: 'string',
			default: 'USD',
		},
		fallbackLinkUrl: {
			type: 'string',
		},
		borderColor: {
			type: 'string',
			default: 'foreground',
		},
		style: {
			type: 'object',
			default: {
				border: {
					width: '1px',
					style: 'solid',
				},
			},
		},
	},
	supports: {
		align: true,
		alignWide: false,
		color: {
			link: true,
			gradients: true,
		},
		__experimentalBorder: {
			color: true,
			width: true,
			style: true,
		},
		typography: {
			fontSize: true,
			lineHeight: true,
		},
		html: false,
	},
	edit,
	save,
	deprecated,
};
