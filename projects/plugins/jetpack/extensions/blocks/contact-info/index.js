/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';
import { Path } from '@wordpress/components';

/**
 * Internal dependencies
 */
import edit from './edit';
import renderMaterialIcon from '../../shared/render-material-icon';
import './editor.scss';
import './style.scss';
import { name as addressName, settings as addressSettings } from './address/';
import { name as emailName, settings as emailSettings } from './email/';
import { name as phoneName, settings as phoneSettings } from './phone/';
import { getIconColor } from '../../shared/block-icons';

const attributes = {};

const save = ( { className } ) => (
	<div className={ className }>
		<InnerBlocks.Content />
	</div>
);

export const name = 'contact-info';

const icon = renderMaterialIcon(
	<Path d="M19 5v14H5V5h14m0-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zm0-4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm6 10H6v-1.53c0-2.5 3.97-3.58 6-3.58s6 1.08 6 3.58V18zm-9.69-2h7.38c-.69-.56-2.38-1.12-3.69-1.12s-3.01.56-3.69 1.12z" />
);

export const settings = {
	title: __( 'Contact Info', 'jetpack' ),
	description: __(
		'Lets you add an email address, phone number, and physical address with improved markup for better SEO results.',
		'jetpack'
	),
	keywords: [
		_x( 'email', 'block search term', 'jetpack' ),
		_x( 'phone', 'block search term', 'jetpack' ),
		_x( 'address', 'block search term', 'jetpack' ),
	],
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'grow',
	supports: {
		align: [ 'wide', 'full' ],
		html: false,
	},
	attributes,
	edit,
	save,
	example: {
		attributes: {},
		innerBlocks: [
			{
				name: 'jetpack/email',
				attributes: {
					email: 'hello@yourjetpack.blog',
				},
			},
			{
				name: 'jetpack/phone',
				attributes: {
					phone: '123-456-7890',
				},
			},
			{
				name: 'jetpack/address',
				attributes: {
					address: '987 Photon Drive',
					city: 'Speedyville',
					region: 'CA',
					postal: '12345',
					country: 'USA',
				},
			},
		],
	},
};

export const childBlocks = [
	{ name: addressName, settings: addressSettings },
	{ name: emailName, settings: emailSettings },
	{ name: phoneName, settings: phoneSettings },
];
