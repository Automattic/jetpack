import { Path } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import './editor.scss';
import './style.scss';
import { getIconColor } from '../../shared/block-icons';
import renderMaterialIcon from '../../shared/render-material-icon';
import BusinessHours from './edit';

/**
 * Block Registrations:
 */

const defaultDays = [
	{
		name: 'Sun',
		hours: [], // Closed by default
	},
	{
		name: 'Mon',
		hours: [
			{
				opening: '09:00',
				closing: '17:00',
			},
		],
	},
	{
		name: 'Tue',
		hours: [
			{
				opening: '09:00',
				closing: '17:00',
			},
		],
	},
	{
		name: 'Wed',
		hours: [
			{
				opening: '09:00',
				closing: '17:00',
			},
		],
	},
	{
		name: 'Thu',
		hours: [
			{
				opening: '09:00',
				closing: '17:00',
			},
		],
	},
	{
		name: 'Fri',
		hours: [
			{
				opening: '09:00',
				closing: '17:00',
			},
		],
	},
	{
		name: 'Sat',
		hours: [], // Closed by default
	},
];

export const name = 'business-hours';

export const icon = renderMaterialIcon(
	<Path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
);

export const settings = {
	title: __( 'Business Hours', 'jetpack' ),
	description: __( 'Display opening hours for your business.', 'jetpack' ),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'grow',
	supports: {
		html: true,
		color: {
			gradients: true,
		},
		spacing: {
			margin: true,
			padding: true,
		},
		typography: {
			fontSize: true,
			lineHeight: true,
		},
		align: [ 'wide', 'full' ],
	},
	keywords: [
		_x( 'opening hours', 'block search term', 'jetpack' ),
		_x( 'closing time', 'block search term', 'jetpack' ),
		_x( 'schedule', 'block search term', 'jetpack' ),
		_x( 'working day', 'block search term', 'jetpack' ),
	],
	attributes: {
		days: {
			type: 'array',
			default: defaultDays,
		},
	},

	edit: props => <BusinessHours { ...props } />,

	save: () => null,

	example: {
		attributes: {
			days: defaultDays,
		},
	},
};
