/**
 * External dependencies
 */

import { __ } from '@wordpress/i18n';

export const SOURCE_WORDPRESS = 'wordpress';
export const SOURCE_GOOGLE_PHOTOS = 'google_photos';
export const SOURCE_PEXELS = 'pexels';
export const PATH_RECENT = 'recent';
export const PATH_ROOT = '/';
export const PATH_OPTIONS = [
	{
		value: PATH_RECENT,
		label: __( 'Recent Photos', 'jetpack' ),
	},
	{
		value: PATH_ROOT,
		label: __( 'Albums', 'jetpack' ),
	},
];
export const GOOGLE_PHOTOS_CATEGORIES = [
	{
		value: '',
		/* translators: category of images */
		label: __( 'All categories', 'jetpack' ),
	},
	{
		value: 'animals',
		/* translators: category of images */
		label: __( 'Animals', 'jetpack' ),
	},
	{
		value: 'arts',
		/* translators: category of images */
		label: __( 'Arts', 'jetpack' ),
	},
	{
		value: 'birthdays',
		/* translators: category of images */
		label: __( 'Birthdays', 'jetpack' ),
	},
	{
		value: 'cityscapes',
		/* translators: category of images */
		label: __( 'Cityscapes', 'jetpack' ),
	},
	{
		value: 'crafts',
		/* translators: category of images */
		label: __( 'Crafts', 'jetpack' ),
	},
	{
		value: 'fashion',
		/* translators: category of images */
		label: __( 'Fashion', 'jetpack' ),
	},
	{
		value: 'food',
		/* translators: category of images */
		label: __( 'Food', 'jetpack' ),
	},
	{
		value: 'flowers',
		/* translators: category of images */
		label: __( 'Flowers', 'jetpack' ),
	},
	{
		value: 'gardens',
		/* translators: category of images */
		label: __( 'Gardens', 'jetpack' ),
	},
	{
		value: 'holidays',
		/* translators: category of images */
		label: __( 'Holidays', 'jetpack' ),
	},
	{
		value: 'houses',
		/* translators: category of images */
		label: __( 'Houses', 'jetpack' ),
	},
	{
		value: 'landmarks',
		/* translators: category of images */
		label: __( 'Landmarks', 'jetpack' ),
	},
	{
		value: 'landscapes',
		/* translators: category of images */
		label: __( 'Landscapes', 'jetpack' ),
	},
	{
		value: 'night',
		/* translators: category of images */
		label: __( 'Night', 'jetpack' ),
	},
	{
		value: 'people',
		/* translators: category of images */
		label: __( 'People', 'jetpack' ),
	},
	{
		value: 'pets',
		/* translators: category of images */
		label: __( 'Pets', 'jetpack' ),
	},
	{
		value: 'selfies',
		/* translators: category of images */
		label: __( 'Selfies', 'jetpack' ),
	},
	{
		value: 'sport',
		/* translators: category of images */
		label: __( 'Sport', 'jetpack' ),
	},
	{
		value: 'travel',
		/* translators: category of images */
		label: __( 'Travel', 'jetpack' ),
	},
	{
		value: 'weddings',
		/* translators: category of images */
		label: __( 'Weddings', 'jetpack' ),
	},
];
export const PEXELS_EXAMPLE_QUERIES = [
	'mountain',
	'ocean',
	'river',
	'clouds',
	'pattern',
	'abstract',
	'sky',
];
